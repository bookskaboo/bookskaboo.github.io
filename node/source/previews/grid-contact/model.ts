import { getNodeSize } from '../../src/domain/nodeGeometry';
import { snapNodePosition } from '../../src/domain/nodeGrid';
import type { MachineNode, NodeKind } from '../../src/domain/types';
import { isWorldObstacle } from '../../src/content/nodeCapabilities';
import { NODE_DEFINITIONS } from '../../src/content/nodes';
import { nodeInsideField, nodesOverlap, NODE_CLEARANCE } from '../../src/simulation/collisions';

export type Mode = 'current' | 'contact' | 'half' | 'fine';
export type Layout = 'horizontal' | 'vertical' | 'mixed';
export const FIELD = { width: 1152, height: 768 };
export const stepFor = (mode: Mode) => mode === 'fine' ? 16 : mode === 'half' ? 32 : 64;
export const allowsContact = (mode: Mode) => mode === 'contact' || mode === 'half';

export function specimen(kind: NodeKind, id: string, left: number, top: number): MachineNode {
  const size = getNodeSize({ kind });
  return { id, kind, name: NODE_DEFINITIONS[kind].name, x: left + size.w / 2, y: top + size.h / 2,
    rotation: 0, progressMs: 0, input: {}, output: {}, cycleMs: 1000, constructedAt: 0, constructionMs: 0 };
}

export function snap(node: MachineNode, point: { x: number; y: number }, mode: Mode) {
  const size = getNodeSize(node);
  const step = stepFor(mode);
  if (mode === 'half') return { ...node, ...snapNodePosition(point, true, size) };
  return { ...node, x: Math.round((point.x - size.w / 2) / step) * step + size.w / 2,
    y: Math.round((point.y - size.h / 2) / step) * step + size.h / 2 };
}

export function valid(node: MachineNode, others: MachineNode[], mode: Mode) {
  return nodeInsideField(node, FIELD) && !others.some(other => other.id !== node.id &&
    nodesOverlap(node, other, allowsContact(mode) && NODE_DEFINITIONS[node.kind].category !== 'World' && NODE_DEFINITIONS[other.kind].category !== 'World'
      && !isWorldObstacle(node.kind) && !isWorldObstacle(other.kind) ? 0 : NODE_CLEARANCE));
}

export function fixture(mode: Mode, layout: Layout): MachineNode[] {
  const gap = mode === 'current' ? 64 : mode === 'fine' ? 16 : 0;
  const a = specimen('smelter', 'fixed', 256, 128);
  const size = getNodeSize(a);
  const b = layout === 'vertical' ? specimen('assembler', 'moving', 256, 128 + size.h + gap)
    : specimen(layout === 'mixed' ? 'woodenChest' : 'assembler', 'moving', 256 + size.w + gap, 128);
  return [a, b];
}

export function edgeTarget(nodes: MachineNode[], layout: Layout) {
  const [a, b] = nodes;
  const sa = getNodeSize(a), sb = getNodeSize(b);
  return layout === 'vertical' ? { ...b, x: a.x - sa.w / 2 + sb.w / 2, y: a.y + sa.h / 2 + sb.h / 2 }
    : { ...b, x: a.x + sa.w / 2 + sb.w / 2, y: a.y - sa.h / 2 + sb.h / 2 };
}

export function gapBetween(nodes: MachineNode[], layout: Layout) {
  const [a, b] = nodes, sa = getNodeSize(a), sb = getNodeSize(b);
  return Math.round(layout === 'vertical' ? b.y - sb.h / 2 - a.y - sa.h / 2 : b.x - sb.w / 2 - a.x - sa.w / 2);
}
