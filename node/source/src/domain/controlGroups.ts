import { isPlayerMovableNode } from '../content/nodeModules';
import type { ControlGroup, MachineNode } from './types';

/** Original game's ten identifiers. Color is an identifier, not a unique group slot. */
export const CONTROL_GROUP_COLORS = [
  { name: 'Blue', value: '#4E79A7' }, { name: 'Orange', value: '#F28E2B' },
  { name: 'Red', value: '#E15759' }, { name: 'Teal', value: '#76B7B2' },
  { name: 'Green', value: '#59A14F' }, { name: 'Yellow', value: '#EDC948' },
  { name: 'Purple', value: '#B07AA1' }, { name: 'Pink', value: '#FF9DA7' },
  { name: 'Brown', value: '#9C755F' }, { name: 'Gray', value: '#BAB0AC' },
] as const;

/** Discard missing members, duplicate membership, and groups with fewer than two nodes. */
export function normalizeControlGroups(value: unknown, nodes: readonly MachineNode[]): ControlGroup[] {
  const available = new Set(nodes.filter(node => isPlayerMovableNode(node.kind)).map(node => node.id));
  const assigned = new Set<string>(); const groupIds = new Set<string>(); const result: ControlGroup[] = [];
  if (!Array.isArray(value)) return result;
  for (const group of value) {
    if (!group || typeof group.id !== 'string' || groupIds.has(group.id) || !Array.isArray(group.nodeIds)) continue;
    const nodeIds = [...new Set<string>(group.nodeIds.filter((id: unknown): id is string => typeof id === 'string' && available.has(id) && !assigned.has(id)))];
    if (nodeIds.length < 2) continue;
    const color = CONTROL_GROUP_COLORS.find(color => color.value.toLowerCase() === String(group.color).toLowerCase()) ?? CONTROL_GROUP_COLORS[0];
    result.push({ id: group.id, nodeIds, color: color.value, colorName: color.name });
    groupIds.add(group.id); nodeIds.forEach(id => assigned.add(id));
  }
  return result;
}

export function regroupControlNodes(groups: readonly ControlGroup[], group: ControlGroup): ControlGroup[] {
  const members = new Set(group.nodeIds);
  return [...groups.map(current => ({ ...current, nodeIds: current.nodeIds.filter(id => !members.has(id)) })).filter(current => current.nodeIds.length >= 2), group];
}

export function copyControlGroups(groups: readonly ControlGroup[], copiedIds: ReadonlyMap<string, string>, makeId: () => string): ControlGroup[] {
  return groups.filter(group => group.nodeIds.every(id => copiedIds.has(id))).map(group => ({ ...group, id: makeId(), nodeIds: group.nodeIds.map(id => copiedIds.get(id)!) }));
}

export function boxControlSelection(hits: readonly string[], groups: readonly ControlGroup[], start: { x: number; y: number }, end: { x: number; y: number }, base: readonly string[] = []) {
  const forward = end.x >= start.x && end.y >= start.y;
  const priority = end.x < start.x && end.y < start.y;
  const touched = new Set(hits);
  const expanded = forward ? groups.filter(group => group.nodeIds.some(id => touched.has(id))).flatMap(group => group.nodeIds) : [];
  return { ids: [...new Set([...base, ...hits, ...expanded])], priority };
}

/** Selection modes persist until cleared, just as in the original game's node press handler. */
export class ControlGroupSelection {
  priorityIds: string[] = [];
  individualId?: string;
  private lastPress?: { id: string; x: number; y: number; at: number };
  clear() { this.priorityIds = []; this.individualId = undefined; this.lastPress = undefined; }
  box(ids: string[], priority: boolean) { this.priorityIds = priority ? [...ids] : []; this.individualId = undefined; this.lastPress = undefined; }
  press(id: string, selected: readonly string[], groups: readonly ControlGroup[], point: { x: number; y: number }, at: number, shift = false, detail = 1) {
    const group = groups.find(group => group.nodeIds.includes(id));
    const previous = this.lastPress;
    const double = Boolean(group && previous?.id === id && at - previous.at <= 500 && Math.hypot(point.x - previous.x, point.y - previous.y) <= 10);
    this.lastPress = double ? undefined : { id, ...point, at };
    const individual = Boolean(group && (this.individualId === id || double || detail >= 2));
    const priority = selected.includes(id) && selected.length === this.priorityIds.length && selected.every(id => this.priorityIds.includes(id));
    const broader = group && selected.includes(id) && selected.some(id => !group.nodeIds.includes(id));
    this.individualId = individual ? id : undefined;
    if (!priority) this.priorityIds = [];
    if (individual) return [id];
    if (group && !priority && !broader) return [...new Set([...(shift ? selected : []), ...group.nodeIds])];
    return selected.includes(id) ? [...selected] : shift ? [...selected, id] : [id];
  }
}
