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
const researchCoreMinimum = (item: ItemId, amount: number) => CORE_ITEMS.has(item) && amount > 0 ? Math.max(MIN_RESEARCH_CORE_COST, amount) : amount;

const trigger = (id: NonNullable<ResearchProject['trigger']>['id'], pending: string, complete: string): NonNullable<ResearchProject['trigger']> => ({ id, pending, complete });

const EFFICIENCY_CORES: ItemId[] = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const EFFICIENCY_CORE_ACCESS = [undefined, undefined, 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
const MACHINE_EFFICIENCY_RESEARCH: ResearchProject[] = [
  ['extractor', 'Extractor'], ['kiln', 'Kiln'], ['smelter', 'Smelter'],
  ['refiner', 'Refiner'], ['assembler', 'Assembler'], ['researchCenter', 'Research Center'],
  ['hydroProcessor', 'Hydro Plant'], ['advancedAssembler', 'Assembler II'], ['separationFurnace', 'Separator'],
].flatMap(([family, name]) => Array.from({ length: 6 }, (_, index): ResearchProject => {
  const rank = index + 1;
  const machineAccess: Record<string, string> = { hydroProcessor: 'lakeTools', advancedAssembler: 'fabricatorTools', separationFurnace: 'mithrilTools' };
  const prerequisite = rank > 1 ? `${family}${rank - 1}` : family === 'extractor' ? undefined : machineAccess[family] ?? family;
  const access = EFFICIENCY_CORE_ACCESS[index];
  const effect = `All ${name} cycles use ${100 - rank * 10}% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged.`;
  return {
    id: `${family}${rank}`, name: `${name} ${rank}`, category: 'Efficiency',
    description: effect, unlock: effect,
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
      description: 'Tree Planter cycles use 90% of base time.',
      unlock: 'Tree Planter cycles use 90% of base time.',
    } : {}),
  })),
  ...MACHINE_EFFICIENCY_RESEARCH,
  {
    id: CONNECTOR_MIRRORING_RESEARCH, name: 'Connector Mirroring', category: 'Efficiency',
    description: 'Right-click a production node to swap its input and output banks between the left and right sides. Cables and materials stay attached.',
    unlock: 'Unlocks right-click connector mirroring on production nodes. Recipe selection stays on left-click where available; the connector-order button keeps its input and output row controls.',
    flavorText: 'Because I knew you would want this.',
    costs: { 'simple-core': 10, 'basic-core': 10, 'automata-core': 10, 'hydro-core': 10 },
    prerequisite: 'hydraulicAssembly',
  },
  { id: 'joint', name: 'Joint', category: 'Milestone', description: 'Make a connection between two nodes to unlock a flexible routing point.', unlock: 'Unlocks the Joint node', flavorText: 'This way, no that way!', costs: {}, trigger: trigger('connection', 'Connect two nodes', 'First connection created') },
  { id: 'kiln', name: 'Kiln', category: 'Milestone', description: 'Fires Wood into Charcoal for metal processing.', unlock: 'Unlocks the Kiln node', flavorText: 'Burn, baby, burn!', costs: {}, trigger: trigger('wood-extracted', 'Extract 1 Wood with an Extractor', 'Wood extracted') },
  { id: 'smelter', name: 'Smelter', category: 'Milestone', description: 'Smelts metal ore with Charcoal into matching Plates.', unlock: 'Unlocks the Smelter node', flavorText: "I'm melting, I'm melting!", costs: {}, trigger: trigger('metal-extracted', 'Extract 1 metal with an Extractor', 'Metal extracted') },
  { id: 'refiner', name: 'Refiner', category: 'Milestone', description: 'Changes one input item into another product.', unlock: 'Unlocks the Refiner, its Simple Core recipe, and the Research Center', flavorText: "Nothing a hammer can't fix.", costs: {}, trigger: trigger('plate-produced', 'Produce at least 1 metal Plate', 'Metal Plate produced') },
  { id: 'researchCenter', name: 'Research Center', category: 'Milestone', description: 'Analyzes Simple, Basic, and Automata Cores to advance research projects.', unlock: 'Unlocks the Research Center node', flavorText: "It's not a failure if we survive.", costs: {}, trigger: trigger('refiner-unlocked', 'Unlock the Refiner', 'Refiner unlocked') },
  { id: 'assembler', name: 'Assembler', category: 'Fabrication', description: 'Combines two input items into another product.', unlock: 'Unlocks the Assembler node', flavorText: "If it doesn't fit, make it fit.", costs: simple(5) },
  { id: 'splitter', name: 'Splitter', category: 'Milestone', description: 'Build an Assembler to unlock divided item routing.', unlock: 'Unlocks the Splitter node', costs: {}, trigger: trigger('assembler-built', 'Build an Assembler', 'First Assembler built') },
  { id: 'merger', name: 'Merger', category: 'Milestone', description: 'Produce a Basic Core to unlock combined item routing.', unlock: 'Unlocks the Merger node', costs: {}, trigger: trigger('basic-core-produced', 'Produce a Basic Core', 'First Basic Core produced') },
  { id: 'suppressionBot', name: 'Suppression Bot', category: 'Defense', description: 'Study a Monster Camp to develop machines that can keep its expansion under control.', unlock: 'Unlocks the Bot Frame, Bot Gun, and Small Bot recipes', costs: {}, trigger: trigger('monster-camp', 'Encounter a Monster Camp', 'Monster Camp encountered') },
  { id: 'exploration', name: 'Exploration', category: 'World', description: 'Chart the territory around the Home factory and establish a navigable sector map.', unlock: 'Unlocks the Map and awards 1 Map Point', flavorText: 'The world is flat.', costs: { 'simple-core': 5, 'basic-core': 5 } },
  { id: 'mapNode', name: 'Map Node', category: 'Repeatable', description: 'Charts another adjacent map. Each new Core tier starts at 5 of each required Core, then the price rises as you buy more Map Points.', unlock: 'Awards 1 Map Point. The first 9 purchases cost 5 Simple. Further Core tiers can enter at purchases 10, 20, 30, 40 and 50 as you unlock them. Each new tier starts at 5 of each Core and ramps up over 10 purchases. Prices then rise by 1 of each Core every five purchases until another tier enters.', costs: simple(5), prerequisite: 'exploration', repeatable: true },
  { id: 'road', name: 'Road', category: 'World', description: 'Unlocks Carts and paired Roads for shipping between adjacent maps. Connect sending Cart → Road pair → receiving Cart. Starts with one Road per map face.', unlock: 'Unlocks Road and Cart nodes; one Road per map face.', costs: basic(5) },
  { id: 'trucks', name: 'Trucks', category: 'Logistics', description: 'Upgrades every Cart to a Truck with capacity for 40 solid items of any tier. Existing stock and connections stay attached.', unlock: 'All existing and future Carts become 40-item Trucks. Fluids are excluded.', flavorText: 'The box has received a promotion.', costs: mixed(15), prerequisites: ['road', 'automataCore'] },
  { id: 'trains', name: 'Trains', category: 'Logistics', description: 'Upgrades every Truck to a Train with capacity for 80 solid items of any tier. Existing stock and connections stay attached.', unlock: 'All existing and future vehicles become 80-item Trains. Fluids are excluded.', flavorText: 'A larger commitment to putting things somewhere else.', costs: { 'simple-core': 40, 'basic-core': 40, 'automata-core': 40, 'hydro-core': 40 }, prerequisites: ['trucks', 'hydraulicAssembly'] },
  { id: 'automataCore', name: 'Automata Core', category: 'Fabrication', description: 'Develops an advanced core by combining Circuit A with Brick.', unlock: 'Unlocks the Automata Core recipe in the Assembler', costs: basic(5), prerequisite: 'exploration' },
  { id: 'areaExpansion1', name: 'Area Expansion 1', category: 'World', description: 'Extends the usable factory grounds in every map node.', unlock: 'Increases every map node field by 25% in both dimensions', flavorText: 'YOU MUST CONSTRUCT ADDITIONAL.... nodes.', costs: mixed(10) },
  { id: 'treePlanter', name: 'Tree Planter', category: 'Ecology', description: 'Automate reforestation by restoring depleted Forest capacity.', unlock: 'Unlocks the Tree Planter node', flavorText: 'Only you can prevent forest fires.', costs: mixed(10) },
  { id: 'miningDrill', name: 'Mining Drill', category: 'Extraction', description: 'Develop motor-driven deep-bore surveying that creates a fresh ore deposit.', unlock: 'Unlocks the Mining Drill node', flavorText: "I'm a miner, not a major.", costs: mixed(10) },
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
    return Object.fromEntries(Object.entries(project.costs).map(([item, amount]) => [item, researchCoreMinimum(item as ItemId, Math.ceil((amount ?? 0) * growth))])) as Partial<Record<ItemId, number>>;
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

/** Active Map Node purchases retain their quote across core unlocks and saves. */
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

const mythrilDiscovery = RESEARCH_PROJECTS.find(project => project.id === 'mithrilTools')!;
mythrilDiscovery.description = 'Produce the first Mythril Tribute at a Dwarven settlement to discover its production recipes.';
mythrilDiscovery.unlock = 'Unlocks Mythril Gear and Mythril Wire in the Refiner, Mythril Plate in the Smelter, and the Separator.';
for (const id of ['autonomousLogistics','storagePlacementCapacity','inventoryPlacementCapacity','storageConnectionCapacity','inventoryConnectionCapacity']) {
  const p=RESEARCH_PROJECTS.find(p=>p.id===id)!; p.costs=Object.fromEntries(SEVEN_CORES.map(i=>[i,1]));
}
for (const project of RESEARCH_PROJECTS) {
  // Repeatables apply the minimum after growth, keeping existing higher prices.
  if (!project.costGrowth) for (const core of SEVEN_CORES) {
    const amount = project.costs[core];
    if (amount !== undefined) project.costs[core] = researchCoreMinimum(core, amount);
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
