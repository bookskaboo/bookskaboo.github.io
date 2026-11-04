import { ITEM_NAMES, isFluidItem } from '../content/items';
import { getNodeCapabilities, hasNodeBehavior } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { WASTE_ITEMS } from '../content/progression';
import type { Connection, GameState, ItemId, MachineNode, PortFamily, SectorState } from '../domain/types';
import { portFamilyAcceptsItem } from './connectionRules';

const itemsIn = (bag: MachineNode['input']) => (Object.keys(bag) as ItemId[]).filter(item => (bag[item] ?? 0) > 0);
const concrete = (family?: PortFamily): ItemId | undefined => family && family in ITEM_NAMES ? family as ItemId : family === 'POWER' ? 'power' : undefined;
const shared = (node: MachineNode) => hasNodeBehavior(node.kind, 'buffer') || getNodeCapabilities(node.kind).passThrough;
export const isRoadFluid = isFluidItem;
const key = (sector: SectorState, node: MachineNode) => `${sector.id}/${node.id}`;

/** Infer material from wiring as well as stock, so empty buffers cannot hide a mixed feed. */
export function roadMaterialState(state: GameState, sector: SectorState, road: MachineNode) {
  const materials = new Set<ItemId>();
  const members = new Set<string>();
  const visiting = new Set<string>();
  const indexes = new Map<string, Map<string, MachineNode>>();
  const find = (s: SectorState, id: string) => {
    if (!indexes.has(s.id)) indexes.set(s.id, new Map(s.nodes.map(n => [n.id, n])));
    return indexes.get(s.id)!.get(id);
  };
  const add = (item: ItemId, family?: PortFamily) => { if (!family || portFamilyAcceptsItem(family, item)) materials.add(item); };
  const contents = (s: SectorState, node: MachineNode, family?: PortFamily, inputs = true) => {
    members.add(key(s, node));
    for (const bag of inputs ? [node.input, node.output] : [node.output]) for (const item of itemsIn(bag)) add(item, family);
    if (inputs) for (const transfer of state.inFlightTransfers ?? []) if (!transfer.cosmeticOnly && transfer.sectorId === s.id && transfer.to === node.id) add(transfer.item, family);
  };
  const output = (s: SectorState, node: MachineNode, port: number) => {
    const signature = `${key(s, node)}/${port}`; if (visiting.has(signature)) return;
    visiting.add(signature); members.add(key(s, node));
    const family = getEffectiveNodeOutputFamilies(node)[port];
    if (!family) return;
    contents(s, node, family, Boolean(shared(node)) || hasNodeBehavior(node.kind, 'road'));
    const item = concrete(family); if (item) materials.add(item);
    if (family === 'WASTE' && node.recipeId) {
      const recipe = RECIPES[node.recipeId];
      for (const waste of Object.keys(recipe?.outputs ?? {}) as ItemId[]) if (WASTE_ITEMS.includes(waste)) materials.add(waste);
      for (const waste of recipe?.chanceOutputs ?? []) materials.add(waste.item);
    }
    if (hasNodeBehavior(node.kind, 'road')) inspectRoad(s, node);
    else if (shared(node) && !item) for (const cable of s.connections.filter(c => c.to === node.id)) {
      const source = find(s, cable.from); if (source) output(s, source, cable.fromPort ?? 0);
    }
  };
  const inspectedRoads = new Set<string>();
  const inspectRoad = (s: SectorState, node: MachineNode) => {
    if (inspectedRoads.has(key(s, node))) return; inspectedRoads.add(key(s, node));
    contents(s, node);
    for (const cable of s.connections) {
      if (cable.to === node.id && node.roadMode === 'export') {
        const source = find(s, cable.from); if (source) output(s, source, cable.fromPort ?? 0);
      }
      if (cable.from === node.id && node.roadMode === 'import') {
        const target = find(s, cable.to); if (!target) continue;
        members.add(key(s, target));
        const family = getEffectiveNodeInputFamilies(target, state.research.completed)[cable.toPort ?? 0];
        const item = target.kind === 'filter' ? target.filterItem : concrete(family); if (item) materials.add(item);
        if (shared(target)) {
          contents(s, target);
          for (const incoming of s.connections.filter(c => c.to === target.id)) {
            const source = find(s, incoming.from); if (source) output(s, source, incoming.fromPort ?? 0);
          }
        } else for (const stored of itemsIn(target.input)) if (family && portFamilyAcceptsItem(family, stored)) materials.add(stored);
        if (hasNodeBehavior(target.kind, 'road')) inspectRoad(s, target);
      }
    }
    const pairedSector = node.pairedSectorId ? state.sectors[node.pairedSectorId] : undefined;
    const pair = pairedSector && node.pairedRoadId ? find(pairedSector, node.pairedRoadId) : undefined;
    if (pair && pairedSector) inspectRoad(pairedSector, pair);
  };
  inspectRoad(sector, road);
  return { materials: [...materials], mixed: materials.size > 1, fluid: road.kind === 'fluidRoad' || [...materials].some(isRoadFluid), members };
}

export function roadConnectionError(state: GameState, sector: SectorState, cable: Connection, removed: ReadonlySet<string>) {
  const connections = [...sector.connections.filter(c => !removed.has(c.id)), cable];
  const candidateSector = { ...sector, connections };
  const candidate = { ...state, sectors: { ...state.sectors, [sector.id]: candidateSector } };
  const source = sector.nodes.find(n => n.id === cable.from);
  const target = sector.nodes.find(n => n.id === cable.to);
  if (source?.kind === 'fluidRoad' || target?.kind === 'fluidRoad') return 'Fluids cannot use roads. Produce and use them on the same map.';
  for (const s of Object.values(candidate.sectors)) for (const road of s.nodes.filter(n => hasNodeBehavior(n.kind, 'road'))) {
    const status = roadMaterialState(candidate, s, road);
    if (!(status.members.has(`${sector.id}/${cable.from}`) || status.members.has(`${sector.id}/${cable.to}`))) continue;
    if (status.fluid) return 'Fluids cannot use roads. Produce and use them on the same map.';
    if (!status.mixed) continue;
    // Legacy mixed receivers can be emptied through a selected Filter. Never
    // delete stock or send new batches while the road is in this recovery state.
    if (source && hasNodeBehavior(source.kind, 'road') && source.roadMode === 'import' && target?.kind === 'filter' && target.filterItem && itemsIn(source.output).includes(target.filterItem) && [...itemsIn(target.input), ...itemsIn(target.output)].every(i => i === target.filterItem)) continue;
    return `Roads carry one material. This connection would combine ${status.materials.map(i => ITEM_NAMES[i]).join(' and ')}. Use separate road feeds or Filters.`;
  }
}

export function roadInputAccepts(state: GameState, sector: SectorState, node: MachineNode, port: number, item: ItemId) {
  for (const road of sector.nodes.filter(n => hasNodeBehavior(n.kind, 'road'))) {
    const directlyConnected = road.id === node.id || sector.connections.some(c =>
      (c.from === node.id && c.to === road.id && Boolean(shared(node))) || (c.from === road.id && c.to === node.id && (Boolean(shared(node)) || (c.toPort ?? 0) === port)));
    if (!directlyConnected) continue;
    if (node.kind === 'fluidRoad' || isRoadFluid(item)) return false;
    const status = roadMaterialState(state, sector, road);
    if (status.mixed) {
      // Permit a Filter to drain pre-existing mixed stock without accepting a
      // second material into that Filter or dispatching another mixed batch.
      if (road.roadMode === 'import' && node.kind === 'filter' && node.filterItem === item && [...itemsIn(node.input), ...itemsIn(node.output)].every(i => i === item)) continue;
      return false;
    }
    if (status.materials.length && status.materials[0] !== item) return false;
  }
  return true;
}
