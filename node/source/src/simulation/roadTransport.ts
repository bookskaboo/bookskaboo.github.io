import { getEffectiveNodeOutputFamilies } from '../content/nodes';
import { cartCapacity, isCartKind } from '../content/cartUpgrades';
import { isFluidItem } from '../content/items';
import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { portFamilyAcceptsItem } from './connectionRules';
import { queueOutputs } from './mixedOutput';

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
