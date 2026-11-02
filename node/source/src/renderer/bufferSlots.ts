import { getNodeCapabilities } from '../content/nodeCapabilities';
import { NODE_DEFINITIONS } from '../content/nodes';
import type { NodeKind } from '../domain/types';

export const isStorageNode = (kind: NodeKind) => NODE_DEFINITIONS[kind].category === 'Storage' || getNodeCapabilities(kind).behavior === 'inventory';

/** One square per slot for small buffers; larger stores use proportional squares. */
export function bufferSlots(amount: number, capacity: number, maximumSquares = 40): number[] {
  if (!Number.isFinite(capacity) || capacity <= 0) return [];
  const count = Math.min(Math.ceil(capacity), maximumSquares);
  const perSquare = capacity / count;
  const used = Math.max(0, Number.isFinite(amount) ? amount : 0);
  return Array.from({ length: count }, (_, index) => Math.max(0, Math.min(1, (used - index * perSquare) / perSquare)));
}
