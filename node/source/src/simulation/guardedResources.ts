import type { GameState, MachineNode, SectorState } from '../domain/types';
import { endgameRank } from '../content/endgame';
import { tributeAmount } from './goblinTribute';
import { guardedResourceAccessible } from './worldRules';

/** Transient refill evidence for animation; never saved or replayed on load. */
export interface GuardedRefillReceipt { amount: number; atMs: number }
const refillReceipts = new WeakMap<MachineNode, GuardedRefillReceipt>();
export const guardedRefillReceipt = (deposit: MachineNode) => refillReceipts.get(deposit);

export function regenerateGuardedResources(state: GameState, sector: SectorState, dt: number) {
  const multiplier = (state.research.completed.includes('mineralRegeneration2') ? 2 : 1)
    * (1 + .2 * (state.research.repeatableCompletions?.mineralRegenerationRate ?? 0))
    * (1 + endgameRank(state, 'resourceRegeneration'));
  for (const deposit of sector.nodes) {
    if (!deposit.guardedCampId || !guardedResourceAccessible(deposit, sector.nodes)) continue;
    const camp = sector.nodes.find(node => node.id === deposit.guardedCampId)!;
    const room = Math.max(0, (deposit.resourceCapacity ?? 0) - (deposit.resourceRemaining ?? 0));
    if (!room) { deposit.regenMs = 0; deposit.guardedRegenCarry = 0; continue; }
    deposit.regenMs = (deposit.regenMs ?? 0) + dt;
    const cycles = Math.floor(deposit.regenMs / 5000);
    deposit.regenMs %= 5000;
    const credit = (deposit.guardedRegenCarry ?? 0) + cycles * tributeAmount(camp) * multiplier;
    const restored = Math.min(room, Math.floor(credit + 1e-9));
    deposit.resourceRemaining = (deposit.resourceRemaining ?? 0) + restored;
    if (restored > 0) refillReceipts.set(deposit, { amount: restored, atMs: state.playTimeMs });
    deposit.guardedRegenCarry = restored === room ? 0 : credit - restored;
    if (restored === room) deposit.regenMs = 0;
  }
}

export function isDwarvenGuardedDeposit(node: MachineNode, sector: SectorState) {
  return Boolean(node.guardedCampId && node.resourceItem === 'mythril'
    && sector.nodes.some(camp => camp.id === node.guardedCampId && camp.lizardSettlement));
}
