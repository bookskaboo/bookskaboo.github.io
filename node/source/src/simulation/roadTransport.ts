import { getNodeCapabilities, hasNodeBehavior } from '../content/nodeCapabilities';
import { getEffectiveNodeOutputFamilies } from '../content/nodes';
import { cartCapacity } from '../content/cartUpgrades';
import type { Connection, GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { portFamilyAcceptsItem } from './connectionRules';
import type { SimulationLookups } from './simulationLookups';
import { queueOutputs } from './mixedOutput';

export const ROAD_TRANSFER_INTERVAL_MS = 5000;

/** Find real inventories upstream, including feeds routed through logistics. */
export function roadFeedCandidates(road: MachineNode, index: ReturnType<SimulationLookups['sector']>) {
  const candidates: Array<{ source: MachineNode; first: Connection }> = [];
  const seen = new Set<string>([road.id]);
  const visit = (id: string) => {
    for (const first of index.incoming.get(id) ?? []) {
      const source = index.nodes.get(first.from);
      if (!source || source.disabled || seen.has(source.id)) continue;
      seen.add(source.id);
      if (!hasNodeBehavior(source.kind, 'road')) candidates.push({ source, first });
      if (getNodeCapabilities(source.kind).passThrough) visit(source.id);
    }
  };
  visit(road.id);
  return candidates;
}

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
          if (!neighbor || neighbor.disabled || hasNodeBehavior(neighbor.kind, 'road') || getNodeCapabilities(neighbor.kind).passThrough) continue;
          const family = getEffectiveNodeOutputFamilies(neighbor)[cable.fromPort ?? 0];
          const buffer = hasNodeBehavior(neighbor.kind, 'buffer');
          const room = receiving ? inputRoom(neighbor, cable.toPort ?? 0, item, endpoint.sector)
            : family && portFamilyAcceptsItem(family, item) ? Math.max(0, (buffer ? cartCapacity(neighbor) : neighbor.capacity ?? getNodeCapabilities(neighbor.kind).defaultCapacity ?? 5) - total(neighbor.output) - (buffer ? total(neighbor.input) : 0)) : 0;
          const moved = Math.min(remaining, room);
          const bag = receiving ? neighbor.input : neighbor.output;
          if (moved > 0) {
            if (receiving) {
              bag[item] = (bag[item] ?? 0) + moved;
              if (buffer) (neighbor.inputQueue ??= []).push(...Array<ItemId>(moved).fill(item));
            } else queueOutputs(neighbor, { [item]: moved });
            remaining -= moved;
          }
        }
      }
      if (remaining > 0) (state.globalPool ??= {})[item] = (state.globalPool?.[item] ?? 0) + remaining;
    }
  }
}
