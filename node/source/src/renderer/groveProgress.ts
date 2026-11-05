import { GROVE_GROWTH } from '../content/endgame';
import type { MachineNode } from '../domain/types';

/** Grove work is cumulative, not a production cycle. Show even the first unit. */
export function groveProgress(node: MachineNode) {
  if (node.cornerType !== 'grove') return undefined;
  if (node.kind === 'cornerChallenge') {
    const growth = Math.max(0, node.cornerProgress ?? 0);
    return { fraction: Math.min(1, growth / GROVE_GROWTH), label: `${growth.toLocaleString('en-US')} / ${GROVE_GROWTH.toLocaleString('en-US')}` };
  }
  if (node.kind === 'cornerTribute') {
    const stored = node.output['grove-component'] ?? 0;
    const capacity = node.capacity ?? 10;
    return { fraction: capacity > 0 ? Math.min(1, stored / capacity) : 0, label: `${stored} / ${capacity}` };
  }
  return undefined;
}
