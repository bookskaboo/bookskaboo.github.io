import type { GameState, ItemId, ResearchProject, ResearchState } from '../domain/types';
import { LATE_RESEARCH } from './progression';
import { EFFICIENCY_FLAVOR, RESEARCH_FLAVOR } from './flavor';
import { CONNECTOR_MIRRORING_RESEARCH } from './productionNodes';

const simple = (amount: number): Partial<Record<ItemId, number>> => ({ 'simple-core': amount });
const basic = (amount: number): Partial<Record<ItemId, number>> => ({ 'simple-core': amount, 'basic-core': amount });
const mixed = (amount: number): Partial<Record<ItemId, number>> => ({ 'simple-core': amount, 'basic-core': amount, 'automata-core': amount });
export const MAP_NODE_TOTAL_MAPS = 121;
export const MAP_NODE_BASELINE_COMPLETIONS = 59;

const trigger = (id: NonNullable<ResearchProject['trigger']>['id'], pending: string, complete: string): NonNullable<ResearchProject['trigger']> => ({ id, pending, complete });

const EFFICIENCY_CORES: ItemId[] = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const EFFICIENCY_CORE_ACCESS = [undefined, undefined, 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
const MACHINE_EFFICIENCY_RESEARCH: ResearchProject[] = [
  ['extractor', 'Extractor'], ['kiln', 'Kiln'], ['smelter', 'Smelter'],
  ['refiner', 'Refiner'], ['assembler', 'Assembler'], ['researchCenter', 'Research Center'],
  ['hydroProcessor', 'Hydro Processor'], ['advancedAssembler', 'Advanced Assembler'], ['separationFurnace', 'Separation Furnace'],
].flatMap(([family, name]) => Array.from({ length: 6 }, (_, index): ResearchProject => {
  const rank = index + 1;
  const machineAccess: Record<string, string> = { hydroProcessor: 'lakeTools', advancedAssembler: 'fabricatorTools', separationFurnace: 'mithrilTools' };
  const prerequisite = rank > 1 ? `${family}${rank - 1}` : family === 'extractor' ? undefined : machineAccess[family] ?? family;
  const access = EFFICIENCY_CORE_ACCESS[index];
  const effect = `All ${name} cycles use ${100 - rank * 10}% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged.`;
  return {
    id: `${family}${rank}`, name: `${name} ${rank}`, category: 'Efficiency',
    description: effect, unlock: effect,
    costs: Object.fromEntries(EFFICIENCY_CORES.slice(0, rank).map(core => [core, rank * 10])),
    ...(prerequisite ? { prerequisite } : {}),
    ...(access ? { prerequisites: [access] } : {}),
  };
}));

/** Complete research catalog and player-facing copy from the source game. */
export const RESEARCH_PROJECTS: ResearchProject[] = [
  ...LATE_RESEARCH.filter(project => !MACHINE_EFFICIENCY_RESEARCH.some(upgrade => upgrade.id === project.id)),
  ...MACHINE_EFFICIENCY_RESEARCH,
  {
    id: CONNECTOR_MIRRORING_RESEARCH, name: 'Connector Mirroring', category: 'Efficiency',
    description: 'Right-click a production node to swap its input and output banks between the left and right sides. Cables and materials stay attached.',
    unlock: 'Unlocks right-click connector mirroring on production nodes. Recipe selection stays on left-click where available; the connector-order button keeps its input and output row controls.',
    flavorText: 'Because I knew you would want this.',
    costs: { 'simple-core': 100, 'basic-core': 100, 'automata-core': 100, 'hydro-core': 100 },
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
  { id: 'suppressionBot', name: 'Suppression Bot', category: 'Defense', description: 'Study a Monster Camp to develop machines that can keep its expansion under control.', unlock: 'Unlocks the Simple Robot Frame, Simple Robot Gun, and Small Suppression Bot recipes', costs: {}, trigger: trigger('monster-camp', 'Encounter a Monster Camp', 'Monster Camp encountered') },
  { id: 'exploration', name: 'Exploration', category: 'World', description: 'Chart the territory around the Home factory and establish a navigable sector map.', unlock: 'Unlocks the Map and awards 1 Map Point', flavorText: 'The world is flat.', costs: { 'simple-core': 5, 'basic-core': 5 } },
  { id: 'mapNode', name: 'Map Node', category: 'Repeatable', description: 'Charts another adjacent map. Early exploration rewards scaling Simple Core production; later core tiers introduce gradually rising prices.', unlock: 'Awards 1 Map Point. First 9 purchases cost 5 Simple. Each later ten-purchase phase adds a core tier and raises the price by 1 every two purchases: 6–10 each through Basic, then 11–15, 16–20, 21–25 and 26–30. After purchase 59, prices rise by 1 every five purchases to 42 each. Locked cores are not required.', costs: simple(5), prerequisite: 'exploration', repeatable: true },
  { id: 'road', name: 'Road', category: 'World', description: 'Establishes paired edge links that carry items between adjacent map nodes.', unlock: 'Unlocks the Road node', costs: basic(10) },
  { id: 'automataCore', name: 'Automata Core', category: 'Fabrication', description: 'Develops an advanced core by combining Circuit A with Brick.', unlock: 'Unlocks the Automata Core recipe in the Assembler', costs: basic(10), prerequisite: 'exploration' },
  { id: 'areaExpansion1', name: 'Area Expansion 1', category: 'World', description: 'Extends the usable factory grounds in every map node.', unlock: 'Increases every map node field by 25% in both dimensions', flavorText: 'YOU MUST CONSTRUCT ADDITIONAL.... nodes.', costs: mixed(10) },
  { id: 'basicElectricity', name: 'Basic Electricity', category: 'Power', description: 'Generates and distributes power for advanced machines.', unlock: 'Unlocks the Charcoal Generator and Power Splitter nodes', flavorText: 'Just connect these two wires right?', costs: {}, trigger: trigger('motor-produced', 'Produce at least 1 Motor', 'Motor produced') },
  { id: 'treePlanter', name: 'Tree Planter', category: 'Ecology', description: 'Automate reforestation by converting Power into renewable Forest capacity.', unlock: 'Unlocks the Tree Planter node', flavorText: 'Only you can prevent forest fires.', costs: mixed(10) },
  { id: 'miningDrill', name: 'Mining Drill', category: 'Extraction', description: 'Develop motor-driven deep-bore surveying that creates a fresh ore deposit.', unlock: 'Unlocks the Mining Drill node', flavorText: "I'm a miner, not a major.", costs: mixed(10) },
];

export function getResearchCosts(project: ResearchProject, completions = 0, completedResearch?: readonly string[]) {
  if (project.costGrowth) return Object.fromEntries(Object.entries(project.costs).map(([i,n])=>[i,Math.ceil((n ?? 0)*project.costGrowth!**Math.max(0,completions))])) as Partial<Record<ItemId,number>>;
  if (project.id !== 'mapNode') return project.costs;
  const completed = Math.min(118, Math.max(0, Number.isFinite(completions) ? Math.floor(completions) : 0));
  const scheduledTier = Math.min(6, 1 + Math.floor((completed + 1) / 10));
  const access = ['refiner', 'assembler', 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
  // Without a state, analytical callers receive the scheduled full core bill.
  const availableTier = completedResearch === undefined ? 6 : Math.max(1, ...access.map((id, i) => completedResearch.includes(id) ? i + 1 : 0));
  // Simple establishes the first production line. Later ten-purchase phases
  // introduce their next core at the preceding price + 1, rising every two maps.
  const phasePurchase = (completed - 9) % 10;
  const amount = completed < 9 ? 5
    : completed < MAP_NODE_BASELINE_COMPLETIONS ? (scheduledTier - 1) * 5 + 1 + Math.floor(phasePurchase / 2)
    : 30 + Math.ceil((completed - 58) / 5);
  return Object.fromEntries(EFFICIENCY_CORES.slice(0, Math.min(scheduledTier, availableTier)).map(core => [core, amount])) as Partial<Record<ItemId, number>>;
}

/** Active Map Node purchases retain their quote across core unlocks and saves. */
export function getResearchCostsForState(project: ResearchProject, research: ResearchState) {
  const completions = research.repeatableCompletions?.[project.id] ?? 0;
  if (project.id === 'mapNode' && research.selected === project.id && research.mapNodeQuote?.completion === completions) return research.mapNodeQuote.costs;
  return getResearchCosts(project, completions, research.completed);
}

export function remainingMapNodePurchases(state: Pick<GameState, 'research' | 'sectors'>) {
  return Math.max(0, MAP_NODE_TOTAL_MAPS - Object.values(state.sectors).filter(sector => sector.unlocked).length - Math.max(0, state.research.mapPoints));
}

/** A project can only use another project as a prerequisite after that project completed. */
export function isResearchAvailable(project: ResearchProject, completedResearch: readonly string[]) {
  return (!project.prerequisite || completedResearch.includes(project.prerequisite)) && (project.prerequisites ?? []).every(id=>completedResearch.includes(id));
}

// General low-wait balance. The separate one-hour speedrun cost multiplier is not live.
const mythrilDiscovery = RESEARCH_PROJECTS.find(project => project.id === 'mithrilTools')!;
mythrilDiscovery.description = 'Encounter Mythril in a visited map to discover its production recipes.';
mythrilDiscovery.unlock = 'Unlocks Mythril Gear and Mythril Wire in the Refiner, Mythril Plate in the Smelter, and the Separation Furnace.';
for (const [id, amount] of Object.entries({assembler:1,exploration:1,road:2,automataCore:2})) {
  const project=RESEARCH_PROJECTS.find(p=>p.id===id)!;
  project.costs=Object.fromEntries(Object.keys(project.costs).map(item=>[item,amount]));
}

for (const project of RESEARCH_PROJECTS) {
  const family = project.id.replace(/\d+$/, '');
  project.flavorText = RESEARCH_FLAVOR[project.id] ?? EFFICIENCY_FLAVOR[family] ?? project.flavorText;
}

const researchById = new Map(RESEARCH_PROJECTS.map(project => [project.id, project]));

/** Stable catalog lookup shared by simulation, persistence, and the interface. */
export function getResearchProject(id: string | undefined) {
  return id === undefined ? undefined : researchById.get(id);
}
