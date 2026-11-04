import type { ItemId, MachineNode } from '../domain/types';

/** Reconcile legacy bags once, preserving saved order and every actual unit. */
export function reconcileQueue(queue: readonly ItemId[] | undefined, bag: MachineNode['output']): ItemId[] {
  const left = { ...bag };
  const result: ItemId[] = [];
  for (const item of queue ?? []) if ((left[item] ?? 0) > 0) { result.push(item); left[item]!--; }
  for (const [item, count] of Object.entries(left) as [ItemId, number][]) {
    for (let i = 0; i < count; i++) result.push(item);
  }
  return result;
}

export function queueOutputs(node: MachineNode, outputs: MachineNode['output']) {
  node.outputQueue = reconcileQueue(node.outputQueue, node.output);
  for (const [item, count] of Object.entries(outputs) as [ItemId, number][]) {
    node.output[item] = (node.output[item] ?? 0) + count;
    for (let i = 0; i < count; i++) node.outputQueue.push(item);
  }
}

export function outputHead(node: MachineNode): ItemId | undefined {
  if (!node.outputQueue) return;
  node.outputQueue = reconcileQueue(node.outputQueue, node.output);
  return node.outputQueue[0];
}

export function takeOutput(node: MachineNode, item: ItemId, amount = 1) {
  node.output[item] = (node.output[item] ?? 0) - amount;
  if (node.outputQueue) {
    for (let i = 0; i < amount; i++) {
      const index = node.outputQueue.indexOf(item);
      if (index >= 0) node.outputQueue.splice(index, 1);
    }
  }
}

export function returnOutput(node: MachineNode, item: ItemId, amount = 1) {
  node.output[item] = (node.output[item] ?? 0) + amount;
  if (node.outputQueue) node.outputQueue.unshift(...Array<ItemId>(amount).fill(item));
}

export const filterOutlet = (node: MachineNode, item: ItemId) => item === node.filterItem ? 0 : 1;
