import { ITEM_NAMES } from '../content/items';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import type { Connection, ItemId, MachineNode } from '../domain/types';
import { expandPortFamily, inputPortAcceptsItem } from './connectionRules';
import { filterOutlet } from '../domain/filterRouting';
import { RECIPES } from '../content/recipes';

/** Validate actual upstream materials even when a logistics socket is generic. */
export function routedConnectionFailure(candidate: Pick<Connection, 'from' | 'to' | 'fromPort' | 'toPort'>, nodes: readonly MachineNode[], connections: readonly Connection[], completed: readonly string[], removed: ReadonlySet<string>) {
  const cable: Connection = { ...candidate, id: '__material-check__', createdAt: 0 };
  const proposed = [...connections.filter(connection => !removed.has(connection.id)), cable];
  const byId = new Map(nodes.map(node => [node.id, node]));
  const incoming = new Map<string, Connection[]>(), outgoing = new Map<string, Connection[]>();
  for (const edge of proposed) {
    incoming.set(edge.to, [...incoming.get(edge.to) ?? [], edge]);
    outgoing.set(edge.from, [...outgoing.get(edge.from) ?? [], edge]);
  }
  const outputItems = (node: MachineNode, port: number, seen = new Set<string>()): Set<ItemId> | undefined => {
    const key = `${node.id}:${port}`;
    if (seen.has(key)) return;
    const family = getEffectiveNodeOutputFamilies(node)[port];
    if (!family) return;
    const recipe = node.recipeId && RECIPES[node.recipeId];
    if (recipe && family === 'ANY') return new Set([...Object.keys(recipe.outputs), ...(recipe.chanceOutputs ?? []).map(output => output.item)] as ItemId[]);
    const capabilities = getNodeCapabilities(node.kind);
    const feeds = incoming.get(node.id) ?? [];
    if ((capabilities.behavior === 'resource' || node.infiniteResource) && node.resourceItem) return new Set([node.resourceItem]);
    // Rewiring an Extractor changes its material before its next simulation tick.
    if (!(capabilities.behavior === 'extractor' && feeds.length)) {
      if (family in ITEM_NAMES) return new Set([family as ItemId]);
      if (family === 'POWER') return new Set(['power']);
      if (family === 'ATTACK_POWER') return new Set(expandPortFamily(family));
    }
    if (!capabilities.passThrough && capabilities.behavior !== 'buffer' && capabilities.behavior !== 'extractor') return;
    const result = new Set<ItemId>();
    for (const bag of capabilities.behavior === 'extractor' && feeds.length ? [] : [node.input, node.output]) {
      for (const item of Object.keys(bag) as ItemId[]) if ((bag[item] ?? 0) > 0) result.add(item);
    }
    const path = new Set(seen).add(key);
    for (const edge of feeds) {
      const source = byId.get(edge.from);
      const items = source && outputItems(source, edge.fromPort ?? 0, path);
      // An unknown feed can acquire a compatible material later.
      if (!items) return;
      items.forEach(item => result.add(item));
    }
    if (node.kind === 'filter') for (const item of result) if (filterOutlet(node, item) !== port) result.delete(item);
    return result.size ? result : undefined;
  };
  const unextractedResource = (node: MachineNode, seen = new Set<string>()): boolean => {
    if (seen.has(node.id)) return false;
    const capabilities = getNodeCapabilities(node.kind);
    if (capabilities.behavior === 'resource' || node.infiniteResource) return true;
    if (!capabilities.passThrough) return false;
    const path = new Set(seen).add(node.id);
    return (incoming.get(node.id) ?? []).some(edge => {
      const source = byId.get(edge.from);
      return source ? unextractedResource(source, path) : false;
    });
  };
  const checked = new Set<string>();
  const visit = (edge: Connection): { title: string; detail: string } | undefined => {
    if (checked.has(edge.id)) return;
    checked.add(edge.id);
    const source = byId.get(edge.from), target = byId.get(edge.to);
    if (!source || !target) return;
    if (source.kind === 'devSource') return;
    const targetCapabilities = getNodeCapabilities(target.kind);
    if (unextractedResource(source) && targetCapabilities.behavior !== 'extractor' && !targetCapabilities.passThrough) return { title: 'Extractor required', detail: 'Resource nodes supply an Extractor. Connect the Extractor output to this machine; logistics nodes can route the resource connection but do not extract it.' };
    const items = outputItems(source, edge.fromPort ?? 0);
    if (items && ![...items].some(item => inputPortAcceptsItem(target, edge.toPort ?? 0, item, completed) || (item === 'power' && getNodeCapabilities(target.kind).acceptsPowerRelay))) {
      const family = getEffectiveNodeInputFamilies(target, completed)[edge.toPort ?? 0];
      const required = family && family in ITEM_NAMES ? ITEM_NAMES[family as ItemId] : family ?? 'a compatible material';
      return { title: 'Incompatible socket', detail: `This route supplies ${[...items].map(item => ITEM_NAMES[item]).join(' or ')}, but ${target.name} needs ${required} at this socket. Choose the matching input or use a Filter.` };
    }
    const capabilities = getNodeCapabilities(target.kind);
    if (capabilities.passThrough || capabilities.behavior === 'buffer' || capabilities.behavior === 'extractor') {
      for (const next of outgoing.get(target.id) ?? []) {
        const failure = visit(next);
        if (failure) return failure;
      }
    }
  };
  return visit(cable);
}
