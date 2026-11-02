import type { MachineNode } from '../domain/types';
import { isWorldObstacle } from '../content/nodeCapabilities';
import { getNodeSize } from '../domain/nodeGeometry';

export const NODE_CLEARANCE = 12;

export function nodesOverlap(first: MachineNode, second: MachineNode, clearance = NODE_CLEARANCE) {
  const a = getNodeSize(first); const b = getNodeSize(second);
  const firstOrganic = isWorldObstacle(first.kind);
  const secondOrganic = isWorldObstacle(second.kind);
  if (firstOrganic && secondOrganic) {
    if (first.kind === 'big-hole' && second.kind === 'big-hole') {
      const radius = ((first.obstructionRadius ?? a.w / 2) + (second.obstructionRadius ?? b.w / 2)) * .85 + clearance;
      return Math.hypot(first.x - second.x, first.y - second.y) < radius;
    }
    const rx = (a.w + b.w) / 2 + clearance;
    const ry = (a.h + b.h) / 2 + clearance;
    return ((first.x - second.x) / rx) ** 2 + ((first.y - second.y) / ry) ** 2 < 1;
  }
  if (firstOrganic || secondOrganic) {
    const organic = firstOrganic ? first : second;
    const rectangle = firstOrganic ? second : first;
    const ellipse = firstOrganic ? a : b;
    const box = firstOrganic ? b : a;
    const dx = Math.max(0, Math.abs(organic.x - rectangle.x) - box.w / 2);
    const dy = Math.max(0, Math.abs(organic.y - rectangle.y) - box.h / 2);
    return (dx / (ellipse.w / 2 + clearance)) ** 2 + (dy / (ellipse.h / 2 + clearance)) ** 2 <= 1;
  }
  return Math.abs(first.x - second.x) < (a.w + b.w) / 2 + clearance && Math.abs(first.y - second.y) < (a.h + b.h) / 2 + clearance;
}

export function nodeInsideField(node: MachineNode, field: { width: number; height: number }, margin = NODE_CLEARANCE) {
  const size = getNodeSize(node);
  if (node.kind === 'road' || node.kind === 'fluidRoad') margin = 0;
  return node.x - size.w / 2 >= margin && node.x + size.w / 2 <= field.width - margin && node.y - size.h / 2 >= margin && node.y + size.h / 2 <= field.height - margin;
}

export function canPlaceNode(node: MachineNode, others: readonly MachineNode[], field: { width: number; height: number }, ignoredIds: ReadonlySet<string> = new Set()) {
  return nodeInsideField(node, field) && !others.some((other) => !ignoredIds.has(other.id) && other.id !== node.id && nodesOverlap(node, other));
}
