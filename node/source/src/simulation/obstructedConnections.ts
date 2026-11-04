import { isWorldObstacle } from '../content/nodeCapabilities';
import { getNodeSize } from '../domain/nodeGeometry';
import type { SectorState } from '../domain/types';
import { connectionBlockedByWorld } from './connectionRules';

const empty: ReadonlySet<string> = new Set();
const cache = new WeakMap<SectorState, { signature: string; blocked: ReadonlySet<string> }>();

/** Recheck only when cable geometry or an obstruction's visible outline changes. */
export function obstructedConnections(sector: SectorState): ReadonlySet<string> {
  if (!sector.nodes.some(node => isWorldObstacle(node.kind))) return empty;
  const signature = JSON.stringify([
    sector.nodes.map(node => [node.id, node.kind, node.x, node.y, getNodeSize(node), node.rotation, node.recipeId, node.connectorsMirrored, node.inputPortOrder, node.outputPortOrder, node.outputRowOffset, node.roadFacing, node.roadMode, node.infiniteResource]),
    sector.connections.map(cable => [cable.id, cable.from, cable.to, cable.fromPort, cable.toPort]),
  ]);
  const previous = cache.get(sector);
  if (previous?.signature === signature) return previous.blocked;
  const nodes = new Map(sector.nodes.map(node => [node.id, node]));
  const blocked = new Set<string>();
  for (const cable of sector.connections) {
    const from = nodes.get(cable.from), to = nodes.get(cable.to);
    if (from && to && connectionBlockedByWorld(from, to, { fromPort: cable.fromPort ?? 0, toPort: cable.toPort ?? 0 }, sector.nodes)) blocked.add(cable.id);
  }
  cache.set(sector, { signature, blocked });
  return blocked;
}
