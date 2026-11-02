import type { Connection, GameState, InFlightTransfer, ItemId, MachineNode, SectorState } from '../domain/types';

/** Transient indexes for one simulation phase. Never saved or retained across edits. */
export class SimulationLookups {
  private sectors = new Map<SectorState, {
    nodes: Map<string, MachineNode>;
    connections: Map<string, Connection>;
    incoming: Map<string, Connection[]>;
    outgoing: Map<string, Connection[]>;
  }>();
  private pending?: Map<string, Map<string, {
    transfers: InFlightTransfer[];
    counts: Partial<Record<ItemId, number>>;
  }>>;

  constructor(private state: GameState) {}

  sector(sector: SectorState) {
    let index = this.sectors.get(sector);
    if (!index) {
      index = { nodes: new Map(), connections: new Map(), incoming: new Map(), outgoing: new Map() };
      for (const node of sector.nodes) index.nodes.set(node.id, node);
      for (const connection of sector.connections) {
        index.connections.set(connection.id, connection);
        for (const [map, id] of [[index.incoming, connection.to], [index.outgoing, connection.from]] as const) {
          const list = map.get(id);
          if (list) list.push(connection); else map.set(id, [connection]);
        }
      }
      this.sectors.set(sector, index);
    }
    return index;
  }

  private indexTransfer(transfer: InFlightTransfer) {
    let sector = this.pending!.get(transfer.sectorId);
    if (!sector) this.pending!.set(transfer.sectorId, sector = new Map());
    let target = sector.get(transfer.to);
    if (!target) sector.set(transfer.to, target = { transfers: [], counts: {} });
    target.transfers.push(transfer);
    target.counts[transfer.item] = (target.counts[transfer.item] ?? 0) + 1;
  }

  target(sectorId: string, nodeId: string) {
    if (!this.pending) {
      this.pending = new Map();
      for (const transfer of this.state.inFlightTransfers ?? []) this.indexTransfer(transfer);
    }
    return this.pending.get(sectorId)?.get(nodeId);
  }

  launched(transfer: InFlightTransfer) {
    // If not yet built, the eventual index reads the updated state array.
    if (this.pending) this.indexTransfer(transfer);
  }
}
