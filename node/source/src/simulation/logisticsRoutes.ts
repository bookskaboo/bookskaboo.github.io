import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import type { Connection, ItemId, MachineNode, SectorState } from '../domain/types';
import { inputPortAcceptsItem, portFamiliesCompatible, portFamilyAcceptsItem } from './connectionRules';

export interface LogisticsRoute { connections: Connection[]; target: MachineNode; routers: Array<{ node: MachineNode; outputIndex: number }>; }

/** Logistics is routing geometry, not an extra timed delivery at every hop. */
export function logisticsRoute(first: Connection, item: ItemId, sector: SectorState, completed: readonly string[],
  canReceive: (node: MachineNode, port: number) => boolean,
  index?: { nodes: Map<string, MachineNode>; outgoing: Map<string, Connection[]> }): LogisticsRoute | undefined {
  const nodes = index?.nodes ?? new Map(sector.nodes.map(node => [node.id, node]));
  const outgoing = index?.outgoing ?? new Map<string, Connection[]>();
  if (!index) for (const cable of sector.connections) outgoing.set(cable.from, [...(outgoing.get(cable.from) ?? []), cable]);
  const visit = (cable: Connection, seen: Set<string>): LogisticsRoute | undefined => {
    const from = nodes.get(cable.from), target = nodes.get(cable.to);
    if (!from || !target || target.disabled || seen.has(target.id) || !portFamiliesCompatible(from, cable.fromPort ?? 0, target, cable.toPort ?? 0, completed) || !inputPortAcceptsItem(target, cable.toPort ?? 0, item, completed)) return;
    const capabilities = getNodeCapabilities(target.kind), outputs = outgoing.get(target.id) ?? [];
    if (!capabilities.passThrough || (target.processingPaused && NODE_DEFINITIONS[target.kind].category !== 'Logistics') || !outputs.length) {
      return canReceive(target, cable.toPort ?? 0) ? { connections: [cable], target, routers: [] } : undefined;
    }
    if (target.kind === 'filter' && target.filterItem && target.filterItem !== item) return;
    if (target.kind === 'merger' && !canReceive(target, cable.toPort ?? 0)) return;
    const path = new Set(seen).add(target.id);
    for (let offset = 0; offset < outputs.length; offset++) {
      const outputIndex = ((capabilities.alternatingOutputs ? target.alternator ?? 0 : 0) + offset) % outputs.length;
      const next = outputs[outputIndex];
      if (!portFamilyAcceptsItem(getEffectiveNodeOutputFamilies(target)[next.fromPort ?? 0] ?? 'ANY', item)) continue;
      const route = visit(next, path);
      if (route) return { ...route, connections: [cable, ...route.connections], routers: [{ node: target, outputIndex }, ...route.routers] };
    }
    return undefined;
  };
  return visit(first, new Set([first.from]));
}
