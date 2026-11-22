import { hasNodeBehavior } from '../content/nodeCapabilities';
import type { GameState } from '../domain/types';

/** Direction changes own the pair transaction; placement and dispatch stay with their existing owners. */
export class RoadCommandRuntime {
  constructor(
    private readonly getState: () => GameState,
    private readonly checkpoint: () => void,
    private readonly cancelTransfers: (connectionIds: Set<string>) => void,
    private readonly publish: () => void,
  ) {}

  private get state() { return this.getState(); }
  private getSector() { const state = this.state; return state.sectors[state.activeSectorId]; }

  getRoadReversalError(nodeId: string) {
    const sector = this.getSector();
    const road = sector.nodes.find(node => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    const pairedSector = road?.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
    const pair = pairedSector?.nodes.find(node => node.id === road?.pairedRoadId);
    if (!road || !pair || !pairedSector || !hasNodeBehavior(pair.kind, 'road')) return 'The paired road endpoint is unavailable.';
    if ((pair.pairedRoadId && pair.pairedRoadId !== road.id) || (pair.pairedSectorId && pair.pairedSectorId !== sector.id)) return 'The paired road endpoint belongs to another Road.';
    // Reversal changes direction without adding endpoints or consuming another face slot.
    return undefined;
  }
  reverseRoad(nodeId: string) {
    const road = this.getSector().nodes.find(node => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    return road ? this.setRoadDirection(nodeId, road.roadMode === 'import' ? 'export' : 'import') : false;
  }
  /** Either endpoint selects the single direction for this entire pair. */
  setRoadDirection(nodeId: string, direction: 'export' | 'import') {
    if (direction !== 'export' && direction !== 'import') return false;
    const sector = this.getSector();
    const road = sector.nodes.find((node) => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    const pairedSector = road?.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
    const pair = pairedSector?.nodes.find((node) => node.id === road?.pairedRoadId);
    if (!road || !pair || !pairedSector) return false;
    if (this.getRoadReversalError(nodeId)) return false;
    const pairedDirection = direction === 'export' ? 'import' : 'export';
    if (road.roadMode === direction && pair.roadMode === pairedDirection) return true;
    this.checkpoint();
    for (const [owner, endpoint, mode] of [[sector, road, direction], [pairedSector, pair, pairedDirection]] as const) {
      const removed = new Set(owner.connections.filter((connection) => connection.from === endpoint.id || connection.to === endpoint.id).map((connection) => connection.id));
      this.cancelTransfers(removed);
      owner.connections = owner.connections.filter((connection) => !removed.has(connection.id));
      if (endpoint.roadMode !== mode) [endpoint.input, endpoint.output] = [endpoint.output, endpoint.input];
      endpoint.roadMode = mode;
      endpoint.progressMs = 0;
    }
    this.publish();
    return true;
  }
}
