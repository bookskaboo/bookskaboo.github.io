// Isolated proposal model. It never reads or writes game state or browser storage.
export const rates = { goblin: [6, 18, 36], dwarven: [1, 5, 12] };
export const ap = { goblin: [3, 9, 16], dwarven: [6, 16, 32] };
export const cornerRewards = [
  { name: 'Ancient Dragon', item: 'α Piece', icon: 'alpha' },
  { name: 'Ancient Foundry', item: 'β Piece', icon: 'foundry-component' },
  { name: 'Elder Grove', item: 'γ Piece', icon: 'grove-component' },
  { name: 'Ancient Reclamation', item: 'δ Piece', icon: 'reclamation-component' },
];
export const maximum = tier => 1000 + Math.min(10, Math.max(0, tier)) * 500;
// Agreed proposal rule: use the same multipliers as ordinary mineral regeneration.
export const upgradeMultiplier = ({ mineralRegeneration2 = false, mineralRanks = 0, endgameRanks = 0 } = {}) =>
  (mineralRegeneration2 ? 2 : 1) * (1 + 0.2 * mineralRanks) * (1 + endgameRanks);
export function material(family, goblinMaterial) { return family === 'dwarven' ? 'mythril' : goblinMaterial; }
export function fullySuppressed(state) { return state.lastPassed && state.strength <= 10; }
export function createState(tier = 4) {
  return { strength: 25, lastPassed: false, reserve: maximum(tier), elapsed: 0, collected: 0, connected: false, regenFraction: 0 };
}
export function check(state, passed) {
  state.lastPassed = passed;
  state.strength = passed ? Math.max(10, state.strength - 10) : Math.min(100, state.strength + 10);
}
export function advance(state, family, rank, tier, multiplier = 1) {
  state.elapsed += 5;
  if (!fullySuppressed(state)) return 0;
  if (state.reserve >= maximum(tier)) { state.regenFraction = 0; return 0; }
  const before = state.reserve;
  const credit = (state.regenFraction ?? 0) + rates[family][rank] * multiplier;
  const whole = Math.floor(credit + 1e-9);
  state.regenFraction = Math.max(0, credit - whole);
  state.reserve = Math.min(maximum(tier), state.reserve + whole);
  if (state.reserve >= maximum(tier)) state.regenFraction = 0;
  return state.reserve - before;
}
export function extract(state, quantity = 1) {
  if (!fullySuppressed(state) || !state.connected) return 0;
  const moved = Math.min(quantity, state.reserve);
  state.reserve -= moved;
  state.collected += moved;
  return moved;
}
