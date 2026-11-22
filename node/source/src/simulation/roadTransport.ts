import { getEffectiveNodeOutputFamilies } from '../content/nodes';
import { cartCapacity, isCartKind } from '../content/cartUpgrades';
import { isFluidItem } from '../content/items';
import type { Connection, GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { inputPortAcceptsItem, portFamilyAcceptsItem, roadVehicleError } from './connectionRules';
import { outputHead, queueOutputs, takeOutput } from './mixedOutput';
import { cargoMaterial } from '../content/botAssembly';
import { modRule } from '../mods/modRules';
import { isRoadFluid, roadMaterialState } from './roadMaterials';
import type { SimulationLookups } from './simulationLookups';
import type { LogisticsRoute } from './logisticsRoutes';

export const ROAD_TRANSFER_INTERVAL_MS = 5000;

const total = (bag: MachineNode['input']) => Object.values(bag).reduce<number>((sum, amount) => sum + (amount ?? 0), 0);

/** Old Road cargo returns to connected inventories; any overflow stays in the shared pool. */
export function recoverRoadStock(state: GameState, inputRoom: (node: MachineNode, port: number, item: ItemId, sector: SectorState) => number) {
  const cargo = Object.values(state.sectors).flatMap(sector => sector.nodes.filter(node => node.kind === 'road').map(road => {
    const amounts: MachineNode['input'] = { ...road.input };
    for (const [item, amount] of Object.entries(road.output) as Array<[ItemId, number]>) amounts[item] = (amounts[item] ?? 0) + amount;
    road.input = {}; road.output = {}; road.capacity = 0;
    return { sector, road, amounts };
  }));
  for (const { sector, road, amounts } of cargo) {
    const pairedSector = road.pairedSectorId ? state.sectors[road.pairedSectorId] : undefined;
    const pair = pairedSector?.nodes.find(node => node.id === road.pairedRoadId && node.kind === 'road');
    const endpoints = [{ sector, road }, ...(pairedSector && pair ? [{ sector: pairedSector, road: pair }] : [])];
    for (const [item, amount] of Object.entries(amounts) as Array<[ItemId, number]>) {
      let remaining = Math.max(0, amount);
      for (const endpoint of endpoints) {
        for (const cable of endpoint.sector.connections) {
          const receiving = endpoint.road.roadMode === 'import';
          if (receiving ? cable.from !== endpoint.road.id : cable.to !== endpoint.road.id) continue;
          const neighbor = endpoint.sector.nodes.find(node => node.id === (receiving ? cable.to : cable.from));
          if (!neighbor || neighbor.disabled || !isCartKind(neighbor.kind) || isFluidItem(item)) continue;
          const family = getEffectiveNodeOutputFamilies(neighbor)[cable.fromPort ?? 0];
          const room = receiving ? inputRoom(neighbor, cable.toPort ?? 0, item, endpoint.sector)
            : family && portFamilyAcceptsItem(family, item) ? Math.max(0, cartCapacity(neighbor) - total(neighbor.output) - total(neighbor.input)) : 0;
          const moved = Math.min(remaining, room);
          if (moved > 0) {
            if (receiving) {
              neighbor.input[item] = (neighbor.input[item] ?? 0) + moved;
              (neighbor.inputQueue ??= []).push(...Array<ItemId>(moved).fill(item));
            } else queueOutputs(neighbor, { [item]: moved });
            remaining -= moved;
          }
        }
      }
      if (remaining > 0) (state.globalPool ??= {})[item] = (state.globalPool?.[item] ?? 0) + remaining;
    }
  }
}

export type RoadDeliveryResolver = (connection: Connection, item: ItemId, sector: SectorState, lookups: SimulationLookups) => LogisticsRoute | undefined;

/** Commit one item only when both local wiring and the remote destination are ready. */
export function dispatchRoadItem(state: GameState, sector: SectorState, road: MachineNode, lookups: SimulationLookups,
  resolveDeliveryRoute: RoadDeliveryResolver, makeId: (prefix: string) => string) {
  const remote = road.pairedSectorId ? state.sectors[road.pairedSectorId] : undefined;
  const pair = remote && road.pairedRoadId ? lookups.sector(remote).nodes.get(road.pairedRoadId) : undefined;
  if (!remote?.unlocked || pair?.kind !== 'road' || pair.roadMode !== 'import' || pair.disabled
    || Date.now() - pair.constructedAt < pair.constructionMs
    || (pair.pairedRoadId && pair.pairedRoadId !== road.id) || (pair.pairedSectorId && pair.pairedSectorId !== sector.id)) return;
  const material = roadMaterialState(state, sector, road);
  if (material.mixed || material.fluid) return;
  const localIndex = lookups.sector(sector), remoteIndex = lookups.sector(remote);
  const exits = remoteIndex.outgoing.get(pair.id) ?? [];
  if (!exits.length) return;
  for (const feed of localIndex.incoming.get(road.id) ?? []) {
    const source = localIndex.nodes.get(feed.from);
    if (!source || roadVehicleError(source, road) || source.disabled || Date.now() - source.constructedAt < source.constructionMs) continue;
    const family = getEffectiveNodeOutputFamilies(source)[feed.fromPort ?? 0];
    if (!family) continue;
    const bags = [source.input, source.output];
    const items = [...new Set(bags.flatMap(bag => (Object.keys(bag) as ItemId[]).filter(item => (bag[item] ?? 0) >= 1)))];
    for (const item of items) {
      if (outputHead(source) && outputHead(source) !== item) continue;
      if (isRoadFluid(item) || (material.materials.length && material.materials[0] !== cargoMaterial(item))) continue;
      if (!portFamilyAcceptsItem(family, item) || !inputPortAcceptsItem(road, feed.toPort ?? 0, item, state.research.completed)) continue;
      for (const exit of exits) {
        const delivery = resolveDeliveryRoute(exit, item, remote, lookups);
        if (!delivery) continue;
        if ((source.input[item] ?? 0) >= 1) source.input[item]!--;
        else takeOutput(source, item);
        delivery.target.input[item] = (delivery.target.input[item] ?? 0) + 1;
        feed.item = item;
        exit.item = item;
        // Visual cable motion carries no inventory or capacity reservation.
        for (const [owner, cable] of [[sector, feed], [remote, exit]] as const) {
          (state.inFlightTransfers ??= []).push({ id: makeId('road-pulse'), sectorId: owner.id, connectionId: cable.id,
            from: cable.from, to: cable.to, item, launchedAtMs: state.playTimeMs, arrivesAtMs: state.playTimeMs + modRule('cableTravelMs'), cosmeticOnly: true });
        }
        return;
      }
    }
  }
}
