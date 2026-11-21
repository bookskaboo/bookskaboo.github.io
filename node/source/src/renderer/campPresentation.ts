import type { MachineNode } from '../domain/types';
import { getNodeSize } from '../domain/nodeGeometry';

/** Use the space beside the reserve while keeping the centered socket clear. */
export function campArtworkLayout(node: MachineNode) {
  const { w, h } = getNodeSize(node);
  if (!node.guardedDepositId) return { x: 0, y: -h * .19, size: Math.min(w, h) * .4, titleY: -h / 2 - 30 };
  const size = 256;
  const y = -20 - size / 2;
  return { x: 0, y, size, titleY: Math.min(-h / 2 - 30, y - size / 2 - 28) };
}

/** Camp backgrounds must never cover a reserve when a view is rebuilt. */
export function nodeStackOrder(node: Pick<MachineNode, 'kind'>) {
  return node.kind === 'monster-camp' ? 0 : 1;
}

export const guardedResourceLocked = (node: MachineNode) => Boolean(node.guardedCampId && node.guardedLocked !== false);
