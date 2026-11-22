import type { MachineNode } from '../domain/types';

/** Retain configuration, not paid or transient work. Callers deep-clone the layout. */
export function freshLayoutNode(node: MachineNode): MachineNode {
  return {
    ...node,
    input: {}, output: {}, batch: undefined, growthCredit: 0,
    outputQueue: [], inputQueue: [], filterBlocked: undefined, progressMs: 0,
    miningProgress: undefined, transferProgressMs: undefined, researchConsumption: undefined,
  };
}
