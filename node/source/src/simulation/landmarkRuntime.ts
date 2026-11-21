import type { GameState, ItemId, MachineNode } from '../domain/types';
import { CORE_ITEMS } from '../content/landmarks';
import { queueOutputs, reconcileQueue } from './mixedOutput';

const total = (bag: MachineNode['input']) => Object.values(bag).reduce<number>((a,b)=>a+(b??0),0);
/** The consumed item itself is the paid batch and reserves two output spaces. */
export function simulateUnknownDevice(state: GameState, node: MachineNode, dt: number) {
  if (!node.activeCore) {
    node.inputQueue = reconcileQueue(node.inputQueue, node.input);
    if (total(node.output) > 3 || !node.inputQueue.length) return;
    const core = node.inputQueue[0];
    if (!CORE_ITEMS.includes(core)) return;
    node.inputQueue.shift();
    node.input[core]!--;
    node.activeCore = core;
    node.progressMs = 0;
  }
  node.progressMs += dt;
  if (node.progressMs >= 5000) {
    const core: ItemId = node.activeCore;
    queueOutputs(node, {[core]:2});
    (state.produced ??= {})[core] = (state.produced?.[core] ?? 0) + 2;
    delete node.activeCore;
    node.progressMs = 0;
  }
}
