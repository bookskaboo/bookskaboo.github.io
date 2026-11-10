import { ITEM_NAMES, isFluidItem, materialTypeName } from '../content/items';
import { cargoMaterial, SUPPRESSION_BOT } from '../content/botAssembly';
import { isCartKind } from '../content/cartUpgrades';
import { getNodeCapabilities, hasNodeBehavior } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { WASTE_ITEMS } from '../content/progression';
import type { Connection, GameState, ItemId, MachineNode, PortFamily, SectorState } from '../domain/types';
import { filterOutlet } from '../domain/filterRouting';
import { portFamilyAcceptsItem, roadVehicleError } from './connectionRules';

const itemsIn = (bag: MachineNode['input']) => (Object.keys(bag) as ItemId[]).filter(item => (bag[item] ?? 0) > 0);
const concrete = (family?: PortFamily): ItemId | undefined => family && family in ITEM_NAMES ? family as ItemId : family === 'POWER' ? 'power' : family === 'ATTACK_POWER' ? SUPPRESSION_BOT : undefined;
const shared = (node: MachineNode) => hasNodeBehavior(node.kind, 'buffer') || getNodeCapabilities(node.kind).passThrough;
export const isRoadFluid = isFluidItem;
const key = (sector: SectorState, node: MachineNode) => `${sector.id}/${node.id}`;

/** Infer material from wiring as well as stock, so empty buffers cannot hide a mixed feed. */
export function roadMaterialState(state: GameState, sector: SectorState, road: MachineNode) {
  const materials = new Set<ItemId>();
  const members = new Set<string>();
  const indexes = new Map<string, Map<string, MachineNode>>();
  const find = (s: SectorState, id: string) => {
    if (!indexes.has(s.id)) indexes.set(s.id, new Map(s.nodes.map(n => [n.id, n])));
    return indexes.get(s.id)!.get(id);
  };
  const contents = (s: SectorState, node: MachineNode, accepts = (_item: ItemId) => true, inputs = true) => {
    members.add(key(s, node));
    for (const bag of inputs ? [node.input, node.output] : [node.output]) for (const item of itemsIn(bag)) if (accepts(item)) materials.add(item);
    if (inputs) for (const transfer of state.inFlightTransfers ?? []) if (!transfer.cosmeticOnly && transfer.sectorId === s.id && transfer.to === node.id && accepts(transfer.item)) materials.add(transfer.item);
  };
  const output = (s: SectorState, node: MachineNode, port: number, accepts = (_item: ItemId) => true, visiting = new Set<string>()) => {
    const signature = `${key(s, node)}/${port}`; if (visiting.has(signature)) return;
    members.add(key(s, node));
    const family = getEffectiveNodeOutputFamilies(node)[port];
    if (!family) return;
    const throughOutlet = (item: ItemId) => accepts(item) && portFamilyAcceptsItem(family, item) && (node.kind !== 'filter' || filterOutlet(node, item) === port);
    contents(s, node, throughOutlet, Boolean(shared(node)) || hasNodeBehavior(node.kind, 'road'));
    const item = concrete(family); if (item && throughOutlet(item)) materials.add(item);
    if ((family === 'ANY' || family === 'WASTE') && node.recipeId) {
      const recipe = RECIPES[node.recipeId];
      for (const product of Object.keys(recipe?.outputs ?? {}) as ItemId[]) if (throughOutlet(product) && (family !== 'WASTE' || WASTE_ITEMS.includes(product))) materials.add(product);
      for (const product of recipe?.chanceOutputs ?? []) if (throughOutlet(product.item)) materials.add(product.item);
    }
    if (hasNodeBehavior(node.kind, 'road')) inspectRoad(s, node);
    else if (shared(node) && !item) for (const cable of s.connections.filter(c => c.to === node.id)) {
      const source = find(s, cable.from); if (source && !roadVehicleError(source, node)) output(s, source, cable.fromPort ?? 0, throughOutlet, new Set(visiting).add(signature));
    }
  };
  const inspectedRoads = new Set<string>();
  const inspectRoad = (s: SectorState, node: MachineNode) => {
    if (inspectedRoads.has(key(s, node))) return; inspectedRoads.add(key(s, node));
    contents(s, node);
    for (const cable of s.connections) {
      if (cable.to === node.id && node.roadMode === 'export') {
        const source = find(s, cable.from); if (source && isCartKind(source.kind)) output(s, source, cable.fromPort ?? 0);
      }
      if (cable.from === node.id && node.roadMode === 'import') {
        const target = find(s, cable.to); if (!target || !isCartKind(target.kind)) continue;
        const family = getEffectiveNodeInputFamilies(target, state.research.completed)[cable.toPort ?? 0];
        const item = concrete(family); if (item) materials.add(item);
        contents(s, target);
        for (const incoming of s.connections.filter(c => c.to === target.id)) {
          const source = find(s, incoming.from); if (source) output(s, source, incoming.fromPort ?? 0);
        }
      }
    }
    const pairedSector = node.pairedSectorId ? state.sectors[node.pairedSectorId] : undefined;
    const pair = pairedSector && node.pairedRoadId ? find(pairedSector, node.pairedRoadId) : undefined;
    if (pair && pairedSector) inspectRoad(pairedSector, pair);
  };
  inspectRoad(sector, road);
  const cargo = [...new Set([...materials].map(cargoMaterial))];
  return { materials: cargo, mixed: cargo.length > 1, fluid: road.kind === 'fluidRoad' || cargo.some(isRoadFluid), members };
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
    return `Roads carry one material. This connection would combine ${status.materials.map(materialTypeName).join(' and ')}. Use separate road feeds or Filters.`;
  }
}

export function roadInputAccepts(state: GameState, sector: SectorState, node: MachineNode, item: ItemId) {
  if (!isCartKind(node.kind)) return true;
  for (const road of sector.nodes.filter(n => n.kind === 'road')) {
    const directlyConnected = sector.connections.some(c =>
      (road.roadMode === 'export' && c.from === node.id && c.to === road.id) || (road.roadMode === 'import' && c.from === road.id && c.to === node.id));
    if (!directlyConnected) continue;
    if (isRoadFluid(item)) return false;
    const status = roadMaterialState(state, sector, road);
    if (status.mixed) return false;
    if (status.materials.length && status.materials[0] !== cargoMaterial(item)) return false;
  }
  return true;
}
