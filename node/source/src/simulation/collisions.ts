import type { MachineNode } from '../domain/types';
import { isWorldObstacle } from '../content/nodeCapabilities';
import { getNodeSize } from '../domain/nodeGeometry';
import { footprintInsideField, footprintsOverlap } from '../domain/obstructionGeometry';

export const NODE_CLEARANCE = 12;

export function nodesOverlap(first: MachineNode, second: MachineNode, clearance = NODE_CLEARANCE) {
  const a = getNodeSize(first); const b = getNodeSize(second);
  const firstOrganic = isWorldObstacle(first.kind);
  const secondOrganic = isWorldObstacle(second.kind);
  if (firstOrganic || secondOrganic) return footprintsOverlap(first, second, clearance);
  return Math.abs(first.x - second.x) < (a.w + b.w) / 2 + clearance && Math.abs(first.y - second.y) < (a.h + b.h) / 2 + clearance;
}

export function nodeInsideField(node: MachineNode, field: { width: number; height: number }, margin = NODE_CLEARANCE) {
  const size = getNodeSize(node);
  if (node.kind === 'road' || node.kind === 'fluidRoad') margin = 0;
  if (isWorldObstacle(node.kind)) return footprintInsideField(node, field, margin);
  return node.x - size.w / 2 >= margin && node.x + size.w / 2 <= field.width - margin && node.y - size.h / 2 >= margin && node.y + size.h / 2 <= field.height - margin;
}

export function canPlaceNode(node: MachineNode, others: readonly MachineNode[], field: { width: number; height: number }, ignoredIds: ReadonlySet<string> = new Set()) {
  return nodeInsideField(node, field) && !others.some((other) => !ignoredIds.has(other.id) && other.id !== node.id && nodesOverlap(node, other));
}
