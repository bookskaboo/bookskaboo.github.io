import { ENDGAME_RESEARCH, SEVEN_CORES } from './endgame';
import type { GameState, ItemId, MapNodePricingPhase, ResearchProject, ResearchState } from '../domain/types';
import { LATE_RESEARCH } from './progression';
import { EFFICIENCY_FLAVOR, RESEARCH_FLAVOR } from './flavor';
import { CONNECTOR_MIRRORING_RESEARCH } from './productionNodes';
import { DEFERRED_POWER_RESEARCH } from './deferredPower';
import { RETIRED_RESEARCH } from './retiredResearch';
import { modResearch } from '../mods/modRules';
import { DEFAULT_WORLD_GRID_SIZE, worldGridSize } from '../domain/worldGrid';

const simple = (amount: number): Partial<Record<ItemId, number>> => ({ 'simple-core': amount });
const basic = (amount: number): Partial<Record<ItemId, number>> => ({ 'simple-core': amount, 'basic-core': amount });
const mixed = (amount: number): Partial<Record<ItemId, number>> => ({ 'simple-core': amount, 'basic-core': amount, 'automata-core': amount });
const MIN_RESEARCH_CORE_COST = 5;
const CORE_ITEMS = new Set<ItemId>(SEVEN_CORES);
const researchCoreMinimum = (project: ResearchProject, item: ItemId, amount: number) =>
  !project.costs['final-core'] && CORE_ITEMS.has(item) && amount > 0 ? Math.max(MIN_RESEARCH_CORE_COST, amount) : amount;

const trigger = (id: NonNullable<ResearchProject['trigger']>['id'], pending: string, complete: string): NonNullable<ResearchProject['trigger']> => ({ id, pending, complete });

const EFFICIENCY_CORES: ItemId[] = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const EFFICIENCY_CORE_ACCESS = [undefined, undefined, 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
export const MACHINE_EFFICIENCY_FAMILIES = [
  ['extractor', 'Extractor'], ['kiln', 'Kiln'], ['smelter', 'Smelter'],
  ['refiner', 'Refiner'], ['assembler', 'Assembler'], ['researchCenter', 'Research Center'],
  ['hydroProcessor', 'Hydro Plant'], ['advancedAssembler', 'Fabricator'], ['separationFurnace', 'Synthesizer'],
] as const;
const MACHINE_EFFICIENCY_RESEARCH = MACHINE_EFFICIENCY_FAMILIES.flatMap(([family, name]) => Array.from({ length: EFFICIENCY_CORES.length }, (_, index): ResearchProject => {
  const rank = index + 1;
  const machineAccess: Record<string, string> = { hydroProcessor: 'lakeTools', advancedAssembler: 'fabricatorTools', separationFurnace: 'mithrilTools' };
  const prerequisite = rank > 1 ? `${family}${rank - 1}` : family === 'extractor' ? undefined : machineAccess[family] ?? family;
  const access = EFFICIENCY_CORE_ACCESS[index];
  const effect = family === 'separationFurnace'
    ? `Pure Mythril and Crust Recovery cycles take ${rank * 10}% less time than the base cycle.`
    : `${name} cycles take ${rank * 10}% less time than the base cycle.`;
  const movedRecipeNote = family === 'assembler' ? ' Also applies to composite Mythril gears and wire in the Synthesizer.'
    : family === 'advancedAssembler' ? ' Also applies to both Mythril Mesh recipes in the Synthesizer.'
    : family === 'separationFurnace' ? ' Crust Recovery runs in the Recycler.' : '';
  return {
    id: `${family}${rank}`, name: `${name} ${rank}`, category: 'Efficiency',
    description: effect + movedRecipeNote, unlock: effect,
    costs: Object.fromEntries(EFFICIENCY_CORES.slice(0, rank).map(core => [core, 5 + rank * 5])),
    ...(prerequisite ? { prerequisite } : {}),
    ...(access ? { prerequisites: [access] } : {}),
  };
}));

/** Complete research catalog and player-facing copy from the source game. */
export const RESEARCH_PROJECTS: ResearchProject[] = [
  ...ENDGAME_RESEARCH,
  ...LATE_RESEARCH.filter(project => !DEFERRED_POWER_RESEARCH.has(project.id) && !RETIRED_RESEARCH.has(project.id) && !MACHINE_EFFICIENCY_RESEARCH.some(upgrade => upgrade.id === project.id)).map(project => ({
    ...project,
    prerequisites: project.prerequisites?.filter(id => !DEFERRED_POWER_RESEARCH.has(id)),
    ...(project.id === 'treePlanter1' ? {
      description: 'Tree Planter cycles take 10% less time than the base cycle.',
      unlock: 'Tree Planter cycles take 10% less time than the base cycle.',
    } : {}),
  })),
  ...MACHINE_EFFICIENCY_RESEARCH,
  {
    id: CONNECTOR_MIRRORING_RESEARCH, name: 'Connector Mirroring', category: 'Efficiency',
    description: 'Right-click a production node to swap its input and output banks between the left and right sides. Cables and materials stay attached.',
    unlock: 'Right-click a production node to mirror its connectors.',
    flavorText: 'Because I knew you would want this.',
    costs: { 'simple-core': 10, 'basic-core': 10, 'automata-core': 10, 'hydro-core': 10 },
    prerequisite: 'hydraulicAssembly',
  },
  { id: 'joint', name: 'Joint', category: 'Milestone', description: 'Add a pass-through to bend or organize a cable route.', unlock: 'Unlocks the Joint node', flavorText: 'This way, no that way!', costs: {}, trigger: trigger('connection', 'Connect two nodes', 'First connection created') },
  { id: 'kiln', name: 'Kiln', category: 'Milestone', description: 'Fires Wood into Charcoal for metal processing.', unlock: 'Unlocks the Kiln node', flavorText: 'Burn, baby, burn!', costs: {}, trigger: trigger('wood-extracted', 'Extract 1 Wood with an Extractor', 'Wood extracted') },
  { id: 'smelter', name: 'Smelter', category: 'Milestone', description: 'Smelts metal ore with Charcoal into matching Plates.', unlock: 'Unlocks the Smelter node', flavorText: "I'm melting, I'm melting!", costs: {}, trigger: trigger('metal-extracted', 'Extract 1 metal with an Extractor', 'Metal extracted') },
  { id: 'refiner', name: 'Refiner', category: 'Milestone', description: 'Make parts such as Gears and Wire, or turn Copper Gears into Simple Cores.', unlock: 'Unlocks the Refiner, its Simple Core recipe, and the Research Center', flavorText: "Nothing a hammer can't fix.", costs: {}, trigger: trigger('plate-produced', 'Produce at least 1 metal Plate', 'Metal Plate produced') },
  { id: 'researchCenter', name: 'Research Center', category: 'Milestone', description: 'Choose a project, then deliver its required Cores to a Research Center.', unlock: 'Unlocks the Research Center node', flavorText: "It's not a failure if we survive.", costs: {}, trigger: trigger('refiner-unlocked', 'Unlock the Refiner', 'Refiner unlocked') },
  { id: 'assembler', name: 'Assembler', category: 'Fabrication', description: 'Combine parts to make Basic Cores, Motors, and other components.', unlock: 'Unlocks the Assembler node', flavorText: "If it doesn't fit, make it fit.", costs: simple(5) },
  { id: 'splitter', name: 'Splitter', category: 'Milestone', description: 'Alternate incoming items between two outputs.', unlock: 'Unlocks the Splitter node', costs: {}, trigger: trigger('assembler-built', 'Build an Assembler', 'First Assembler built') },
  { id: 'merger', name: 'Merger', category: 'Milestone', description: 'Combine two matching item streams into one output.', unlock: 'Unlocks the Merger node', costs: {}, trigger: trigger('basic-core-produced', 'Produce a Basic Core', 'First Basic Core produced') },
  { id: 'suppressionBot', name: 'Suppression Bot', category: 'Defense', description: 'Feed a Bot Frame and Bot Gun into a Bot Plant to make a Suppression Bot for Monster Camps.', unlock: 'Unlocks the Bot Plant and the Assembler recipes for Bot Frame and Bot Gun.', costs: {}, trigger: trigger('monster-camp', 'Encounter a Monster Camp', 'Monster Camp encountered') },
  { id: 'exploration', name: 'Exploration', category: 'World', description: 'Open the world map and gain 1 Map Point to unlock a neighboring map.', unlock: 'Unlocks the Map and awards 1 Map Point', flavorText: 'The world is flat.', costs: { 'simple-core': 5, 'basic-core': 5 } },
  { id: 'mapNode', name: 'Extra Map Point', category: 'Repeatable', description: 'Subsequent Map Points cost more Cores.', unlock: 'Awards 1 Map Point.', costs: simple(5), prerequisite: 'exploration', repeatable: true },
  { id: 'road', name: 'Road', category: 'World', description: 'Ship items between adjacent maps. Connect a freight vehicle directly to each end of the Road. Each map starts with one Road slot per side.', unlock: 'Unlocks Roads and Carts.', costs: basic(5) },
  { id: 'trucks', name: 'Trucks', category: 'Logistics', description: 'Upgrade Carts to Trucks that hold 40 solid items and ship up to 2 items at a time.', unlock: 'Carts are now Trucks.', flavorText: 'The box has received a promotion.', costs: mixed(15), prerequisites: ['road', 'automataCore'] },
  { id: 'trains', name: 'Trains', category: 'Logistics', description: 'Upgrade Trucks to Trains that hold 80 solid items and ship up to 4 items at a time.', unlock: 'Trucks are now Trains.', flavorText: 'A larger commitment to putting things somewhere else.', costs: { 'simple-core': 40, 'basic-core': 40, 'automata-core': 40, 'hydro-core': 40 }, prerequisites: ['trucks', 'hydraulicAssembly'] },
  { id: 'automataCore', name: 'Automata Core', category: 'Fabrication', description: 'Combine Circuit A and Brick in an Assembler to make an Automata Core.', unlock: 'Unlocks the Automata Core recipe in the Assembler', costs: basic(5), prerequisite: 'exploration' },
  { id: 'areaExpansion1', name: 'Area Expansion 1', category: 'World', description: 'Make every play area 25% wider and 25% taller than its original size.', unlock: 'Expands every play area.', flavorText: 'YOU MUST CONSTRUCT ADDITIONAL.... nodes.', costs: mixed(10) },
  { id: 'treePlanter', name: 'Tree Planter', category: 'Ecology', description: 'Restore Wood to depleted Forests with a Tree Planter.', unlock: 'Unlocks the Tree Planter node', flavorText: 'Only you can prevent forest fires.', costs: mixed(10) },
  { id: 'miningDrill', name: 'Mining Drill', category: 'Extraction', description: 'Feed a Mining Drill 20 Motors to create a 1,000-unit deposit of the selected material.', unlock: 'Unlocks the Mining Drill node', flavorText: "I'm a miner, not a major.", costs: mixed(10) },
];

const MAP_NODE_CORE_ACCESS = ['refiner', 'assembler', 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
const mapNodePhaseStart = (tier: number) => tier === 1 ? 0 : (tier - 1) * 10 - 1;
const mapNodeCompletion = (completions: number) =>
  Math.max(0, Number.isFinite(completions) ? Math.floor(completions) : 0);
const STANDARD_FINAL_MAP_PURCHASE = DEFAULT_WORLD_GRID_SIZE ** 2 - 3;

function getMapNodePricingPhase(completed: number, completedResearch?: readonly string[], previous?: MapNodePricingPhase): MapNodePricingPhase {
  const scheduledTier = Math.min(6, 1 + Math.floor((completed + 1) / 10));
  const availableTier = completedResearch === undefined ? 6
    : Math.max(1, ...MAP_NODE_CORE_ACCESS.map((id, index) => completedResearch.includes(id) ? index + 1 : 0));
  const tier = Math.min(scheduledTier, availableTier);
  const nominalStart = mapNodePhaseStart(tier);
  if (previous && previous.tier < tier) return { tier, startedAt: completed };
  if (previous?.tier === tier && Number.isInteger(previous.startedAt)
      && previous.startedAt >= nominalStart && previous.startedAt <= completed) return previous;
  return { tier, startedAt: nominalStart };
}

/** Seed older saves from the active vanilla quote when it predates a tier unlock. */
export function mapNodePricingPhaseForState(research: ResearchState) {
  const override = modResearch('mapNode');
  if (override?.costs !== undefined || override?.costGrowth) return undefined;
  const completed = mapNodeCompletion(research.repeatableCompletions?.mapNode ?? 0);
  const phase = getMapNodePricingPhase(completed, research.completed, research.mapNodePricingPhase);
  const quote = research.mapNodeQuote;
  if (!research.mapNodePricingPhase && research.selected === 'mapNode' && quote?.completion === completed) {
    const quotedTier = Object.keys(quote.costs).length;
    if (quotedTier > 0 && quotedTier < phase.tier
        && EFFICIENCY_CORES.slice(0, quotedTier).every(core => (quote.costs[core] ?? 0) > 0)) {
      return { tier: quotedTier, startedAt: mapNodePhaseStart(quotedTier) };
    }
  }
  return phase;
}

export function getResearchCosts(project: ResearchProject, completions = 0, completedResearch?: readonly string[], mapNodePhase?: MapNodePricingPhase) {
  if (modResearch(project.id)?.costs !== undefined) {
    const growth = project.costGrowth ?? 1;
    return Object.fromEntries(Object.entries(project.costs).map(([id, amount]) => [id, Math.ceil((amount ?? 0) * growth ** Math.max(0, completions))])) as Partial<Record<ItemId, number>>;
  }
  if (project.costGrowth) {
    const growth = project.costGrowth ** Math.max(0, completions);
    return Object.fromEntries(Object.entries(project.costs).map(([item, amount]) => [item, researchCoreMinimum(project, item as ItemId, Math.ceil((amount ?? 0) * growth))])) as Partial<Record<ItemId, number>>;
  }
  if (project.id !== 'mapNode') return project.costs;
  const completed = mapNodeCompletion(completions);
  const { tier, startedAt } = getMapNodePricingPhase(completed, completedResearch, mapNodePhase);
  // Bigger worlds keep the standard price ceiling, even if a new core tier unlocks late.
  const phasePurchase = Math.min(completed - startedAt, STANDARD_FINAL_MAP_PURCHASE - mapNodePhaseStart(tier));
  const lastRampPurchase = tier === 1 ? 8 : 9;
  const ceiling = tier * 5;
  const amount = phasePurchase > lastRampPurchase
    ? ceiling + Math.ceil((phasePurchase - lastRampPurchase) / 5)
    : Math.round(5 + (ceiling - 5) * phasePurchase / lastRampPurchase);
  return Object.fromEntries(EFFICIENCY_CORES.slice(0, tier).map(core => [core, amount])) as Partial<Record<ItemId, number>>;
}

/** Active Extra Map Point purchases retain their quote across core unlocks and saves. */
export function getResearchCostsForState(project: ResearchProject, research: ResearchState) {
  const completions = research.repeatableCompletions?.[project.id] ?? 0;
  if (project.id === 'mapNode' && research.selected === project.id && research.mapNodeQuote?.completion === completions) return research.mapNodeQuote.costs;
  return getResearchCosts(project, completions, research.completed, research.mapNodePricingPhase);
}

export function remainingMapNodePurchases(state: Pick<GameState, 'research' | 'sectors' | 'worldGridSize'>) {
  return Math.max(0, worldGridSize(state) ** 2 - Object.values(state.sectors).filter(sector => sector.unlocked).length - Math.max(0, state.research.mapPoints));
}

/** A project can only use another project as a prerequisite after that project completed. */
export function isResearchAvailable(project: ResearchProject, completedResearch: readonly string[]) {
  return (!project.prerequisite || completedResearch.includes(project.prerequisite)) && (project.prerequisites ?? []).every(id=>completedResearch.includes(id));
}

for (const id of ['autonomousLogistics','storagePlacementCapacity','inventoryPlacementCapacity','storageConnectionCapacity','inventoryConnectionCapacity']) {
  const p=RESEARCH_PROJECTS.find(p=>p.id===id)!; p.costs=Object.fromEntries(SEVEN_CORES.map(i=>[i,1]));
}
for (const project of RESEARCH_PROJECTS) {
  // Repeatables apply the minimum after growth, keeping existing higher prices.
  if (!project.costGrowth) for (const core of SEVEN_CORES) {
    const amount = project.costs[core];
    if (amount !== undefined) project.costs[core] = researchCoreMinimum(project, core, amount);
  }
  const family = project.id.replace(/\d+$/, '');
  project.flavorText = RESEARCH_FLAVOR[project.id] ?? EFFICIENCY_FLAVOR[family] ?? project.flavorText;
}

const researchById = new Map(RESEARCH_PROJECTS.map(project => [project.id, project]));

export function refreshResearchLookup() {
  researchById.clear();
  for (const project of RESEARCH_PROJECTS) researchById.set(project.id, project);
}

/** Stable catalog lookup shared by simulation, persistence, and the interface. */
export function getResearchProject(id: string | undefined) {
  return id === undefined ? undefined : researchById.get(id);
}

export const BASE_RESEARCH_PROJECTS = structuredClone(RESEARCH_PROJECTS);
