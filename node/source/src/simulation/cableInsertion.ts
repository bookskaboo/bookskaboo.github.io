import type { MachineNode, SectorState } from '../domain/types';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { getConnectionControlPoints, getPortSide } from './connectionRules';

/** Match the drawn Bezier, including curved and rotated routes. */
export function cablesUnderNode(node: MachineNode, sector: SectorState) {
  const nodes = new Map(sector.nodes.map(candidate => [candidate.id, candidate]));
  const size = getNodeSize(node), tolerance = Math.min(size.w, size.h) / 2 + 6;
  return sector.connections.flatMap(connection => {
    if (connection.from === node.id || connection.to === node.id) return [];
    const from = nodes.get(connection.from), to = nodes.get(connection.to);
    if (!from || !to) return [];
    const a = getPortAnchor(from, 'output', connection.fromPort ?? 0), b = getPortAnchor(to, 'input', connection.toPort ?? 0);
    const start = { x: from.x + a.x, y: from.y + a.y }, end = { x: to.x + b.x, y: to.y + b.y };
    const controls = getConnectionControlPoints(start, end, getPortSide(from, 'output', connection.fromPort ?? 0), getPortSide(to, 'input', connection.toPort ?? 0));
    let previous = start, distance = Infinity;
    for (let index = 1; index <= 80; index++) {
      const t = index / 80, u = 1 - t;
      const point = { x: u ** 3 * start.x + 3 * u * u * t * controls.first.x + 3 * u * t * t * controls.second.x + t ** 3 * end.x,
        y: u ** 3 * start.y + 3 * u * u * t * controls.first.y + 3 * u * t * t * controls.second.y + t ** 3 * end.y };
      const dx = point.x - previous.x, dy = point.y - previous.y;
      const fraction = Math.max(0, Math.min(1, ((node.x - previous.x) * dx + (node.y - previous.y) * dy) / Math.max(.001, dx * dx + dy * dy)));
      distance = Math.min(distance, Math.hypot(node.x - previous.x - fraction * dx, node.y - previous.y - fraction * dy));
      previous = point;
    }
    return distance <= tolerance ? [{ connection, distance }] : [];
  }).sort((a, b) => a.distance - b.distance).map(candidate => candidate.connection);
}
