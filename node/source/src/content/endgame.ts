import type { GameState, ItemId, MachineNode, Recipe, ResearchProject } from '../domain/types';
import { DEFAULT_WORLD_GRID_SIZE, worldCornerIds } from '../domain/worldGrid';

export type CornerType = 'alpha' | 'foundry' | 'reclamation' | 'grove';
export const CORNERS: CornerType[] = ['alpha', 'foundry', 'reclamation', 'grove'];
export const CORNER_MAPS = worldCornerIds(DEFAULT_WORLD_GRID_SIZE);
export const CORNER_ITEMS: Record<CornerType, ItemId> = { alpha: 'alpha', foundry: 'foundry-component', reclamation: 'reclamation-component', grove: 'grove-component' };
export const CORNER_NAMES: Record<CornerType, string> = { alpha: 'Ancient Dragon', foundry: 'Ancient Foundry', reclamation: 'Ancient Reclamation', grove: 'Elder Grove' };
export const FINAL_ITEMS = {
  alpha: 'α Piece',
  'foundry-component': 'β Piece',
  'reclamation-component': 'δ Piece',
  'grove-component': 'γ Piece',
  'core-half-a': 'Yin',
  'core-half-b': 'Yang',
  'final-core': 'Final Core',
};
export const SEVEN_CORES: ItemId[] = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core', 'final-core'];
/** Explicit November 5 quotas supersede the earlier five-minute sizing for these corners.
 * Upgrades/parallel producers shorten the work; setup and delivery latency are separate. */
export const FOUNDRY_INPUTS: Partial<Record<ItemId, number>> = { 'ceramic-electrode': 50, 'sealed-frame': 25, 'mythril-gear': 100 };
export const ALPHA_AP = 500;
export const FINAL_BOT_AP = 72;
export const FINAL_BOT_RECIPE: Recipe = {
  id: 'final-suppression-bot', name: 'Final Bot',
  inputs: { 'command-suppression-bot': 2, 'command-core': 1, 'servo-frame': 1 },
  outputs: { 'final-suppression-bot': 1 },
  cycleMs: 210000,
  unlockResearch: 'finalRobotics',
};
export const GROVE_GROWTH = 1000;
export const RECLAMATION_PRODUCTION_TARGET_MS = 600000;
/** Twice the former five-minute quotas, preserving the relative value of every waste type.
 * Standard Controller waste is the Fines baseline. Other Fines sources can finish sooner.
 * Saved normalized Reclamation progress is retained; these credits apply to new intake. */
export const RECLAMATION_QUOTAS: Partial<Record<ItemId, number>> = {
  'metallic-fines': 20, 'spent-flux': 132, 'glassy-crust': 72, slag: 44,
};
export const RECLAMATION_VALUE = Object.fromEntries(Object.entries(RECLAMATION_QUOTAS).map(([item, count]) => [item, 1 / count!])) as Partial<Record<ItemId, number>>;

function hash(seed: number, salt: number) { let n = (seed ^ salt) >>> 0; n = Math.imul(n ^ n >>> 16, 0x45d9f3b); n = Math.imul(n ^ n >>> 16, 0x45d9f3b); return (n ^ n >>> 16) >>> 0; }
export function seededCornerOrder(seed: number): CornerType[] {
  const order = [...CORNERS];
  for (let i = 3; i > 0; i--) { const j = hash(seed, 0x6e6f6400 + i) % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}
export const seededPairIndex = (seed: number) => hash(seed, 0x70616972) % 3;
export const PAIRS: Array<[[CornerType, CornerType], [CornerType, CornerType]]> = [
  [['alpha', 'foundry'], ['reclamation', 'grove']], [['alpha', 'reclamation'], ['foundry', 'grove']], [['alpha', 'grove'], ['foundry', 'reclamation']],
];
export const ENDGAME_RECIPES: Record<string, Recipe> = Object.fromEntries(PAIRS.flatMap((pairs, p) => pairs.map((pair, half) => {
  const output = half === 0 ? 'core-half-a' : 'core-half-b';
  const id = `${output}-${p}`;
  return [id, {
    id,
    name: FINAL_ITEMS[output],
    inputs: Object.fromEntries(pair.map(c => [CORNER_ITEMS[c], 1])),
    outputs: { [output]: 1 },
    cycleMs: 10000,
    unlockResearch: 'cornerComponents',
  }];
})));
ENDGAME_RECIPES['final-core'] = { id: 'final-core', name: 'Final Core', inputs: { 'core-half-a': 1, 'core-half-b': 1 }, outputs: { 'final-core': 1 }, cycleMs: 30000, unlockResearch: 'cornerComponents' };
export function worldRecipeAllowed(id: string, state: GameState) { return !id.match(/^core-half-[ab]-\d$/) || Number(id.at(-1)) === (state.endgame?.pairIndex ?? seededPairIndex(state.seed)); }
export const endgameRank = (state: Pick<GameState, 'research'>, id: string) => state.research.repeatableCompletions?.[id] ?? 0;
export const ENDGAME_CAPS: Record<string, number> = { efficientLandfill: 45, advancedRoadChannels: 2 };
export function atResearchCap(project: ResearchProject, research: GameState['research']) { return ENDGAME_CAPS[project.id] !== undefined && (research.repeatableCompletions?.[project.id] ?? 0) >= ENDGAME_CAPS[project.id]; }
const bill = () => Object.fromEntries(SEVEN_CORES.map(i => [i, 1]));
const project = (id: string, name: string, unlock: string, prerequisites: string[], repeatable = false): ResearchProject => ({ id, name, category: 'Endgame', description: unlock, unlock, costs: bill(), prerequisites, ...(repeatable ? { repeatable: true, costGrowth: 1.5 } : {}) });
export const ENDGAME_RESEARCH: ResearchProject[] = [
  { id: 'cornerComponents', name: 'End of the World', category: 'Milestone', description: 'Acquire a piece from any corner to reveal this world’s paired assembly recipes.', unlock: 'Unlocks Yin, Yang and Final Core assembly.', costs: {}, trigger: { id: 'corner-component-obtained', pending: 'Obtain any corner piece', complete: 'Corner piece acquired' } },
  {
    id: 'finalRobotics', name: 'Final Robotics', category: 'Endgame',
    description: 'Use Final Core research to build a heavier Bot. Management has approved another layer of management.',
    unlock: `Unlocks the Final Bot recipe in Assembler II. Each Final Bot supplies ${FINAL_BOT_AP} AP.`,
    costs: bill(),
    prerequisites: ['finalCoreProduction', 'commandRobotics'],
  },
  { id: 'victory', name: 'A Remarkably Indirect Conclusion', category: 'Endgame', description: 'Select this project at the Research Center and deliver five of every Core, Simple through Final. The factory may continue after its point has been made.', unlock: 'Complete this research to achieve victory and continue playing in this world.', costs: bill(), prerequisites: ['finalCoreProduction'] },
  project('resourceRelocation', 'Resource Relocation', 'Move Forests, deposits and cleared-Golem reserves within their original map, preserving all stock and history.', ['victory']),
  project('lakeRelocation', 'Lake Relocation', 'Move Lakes within their original map. Intakes stay connected and move only when explicitly selected.', ['victory']),
  project('campRelocation', 'Monster Camp Relocation', 'Move ordinary settlements and their linked Tribute boxes together within their map.', ['victory']),
  project('efficientLandfill', 'Efficient Landfill', 'Reduce original Deep Hole Stone bills by 20% per rank, compounded, crediting Stone already used. Minimum one; maximum rank 45.', ['victory'], true),
  project('advancedRoadChannels', 'Advanced Road Channels', 'Add a fourth, then fifth Road slot per map face. Two levels.', ['victory', 'roadChannels2'], true),
  project('trainFreightCapacity', 'Train Freight Capacity', 'Each rank adds 20 Train storage and one item per local transfer and Road shipment.', ['victory', 'trains'], true),
  project('resourceRegeneration', 'Resource Regeneration', 'Each rank adds 100% of ordinary-researched passive regeneration, including Forests.', ['victory', 'mineralRegeneration2'], true),
  { id: 'recycler', name: 'Intermediate Recycling', category: 'Ecology', description: 'Destroy basic resources or recover at most one of each constituent solid resource from an intermediate. Fluids are never recovered.', unlock: 'Unlocks the Recycler. Its mixed output needs filtering.', costs: { 'simple-core': 10, 'basic-core': 10, 'automata-core': 10, 'hydro-core': 10 }, prerequisites: ['hydraulicAssembly'] },
];

export function landfillTotal(base: number, rank: number) {
  const b = BigInt(Math.max(1, Math.ceil(base))), r = BigInt(Math.max(0, Math.min(45, rank)));
  const d = 5n ** r; return Math.max(1, Number((b * 4n ** r + d - 1n) / d));
}
export function reconcileHole(node: MachineNode, state: GameState) {
  node.holeBaseStone ??= Math.max(1, node.resourceRemaining ?? 250);
  node.holeStoneConsumed ??= 0;
  node.resourceRemaining = Math.max(0, landfillTotal(node.holeBaseStone, endgameRank(state, 'efficientLandfill')) - node.holeStoneConsumed);
}
