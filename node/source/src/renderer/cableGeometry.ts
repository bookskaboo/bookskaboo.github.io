import { NODE_DEFINITIONS } from '../content/nodes';
import type { Connection, InFlightTransfer, MachineNode } from '../domain/types';
import { getConnectionControlPoints, getPortSide } from '../simulation/connectionRules';
import { getPortAnchor } from '../domain/nodeGeometry';
import type { CurveMotionSample } from './playfieldTypes';

export function connectionPoints(connection: Connection, nodes: Map<string, MachineNode>, connections: Connection[]) {
  const from = nodes.get(connection.from); const to = nodes.get(connection.to); if (!from || !to) return undefined;
  const outgoing = connections.filter((candidate) => candidate.from === from.id);
  const outputCount = Math.max(1, NODE_DEFINITIONS[from.kind].output.length);
  const outputIndex = Math.min(outputCount - 1, Math.max(0, connection.fromPort ?? outgoing.findIndex((candidate) => candidate.id === connection.id)));
  const inputIndex = Math.min(Math.max(0, NODE_DEFINITIONS[to.kind].input.length - 1), Math.max(0, connection.toPort ?? 0));
  const startAnchor = getPortAnchor(from, 'output', outputIndex); const endAnchor = getPortAnchor(to, 'input', inputIndex);
  return { from, to, outputIndex, inputIndex, sourceSide: getPortSide(from, 'output', outputIndex), targetSide: getPortSide(to, 'input', inputIndex), start: { x: from.x + startAnchor.x, y: from.y + startAnchor.y }, end: { x: to.x + endAnchor.x, y: to.y + endAnchor.y } };
}

export function curvePoint(connection: Connection, nodes: Map<string, MachineNode>, connections: Connection[], t: number) {
  const points = connectionPoints(connection, nodes, connections); if (!points) return undefined;
  const controls = getConnectionControlPoints(points.start, points.end, points.sourceSide, points.targetSide); const u = 1 - t;
  return {
    x: u ** 3 * points.start.x + 3 * u * u * t * controls.first.x + 3 * u * t * t * controls.second.x + t ** 3 * points.end.x,
    y: u ** 3 * points.start.y + 3 * u * u * t * controls.first.y + 3 * u * t * t * controls.second.y + t ** 3 * points.end.y,
  };
}

export function buildCurveMotionPath(connection: Connection, nodes: Map<string, MachineNode>, connections: Connection[]) {
  const samples: CurveMotionSample[] = []; let distance = 0; let previous: { x: number; y: number } | undefined;
  for (let index = 0; index <= 40; index += 1) {
    const point = curvePoint(connection, nodes, connections, index / 40); if (!point) return [];
    if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y);
    samples.push({ ...point, distance }); previous = point;
  }
  return samples;
}

export function buildTransferMotionPath(transfer: InFlightTransfer, nodes: Map<string, MachineNode>, connections: Connection[]) {
  const ids = transfer.routeConnectionIds ?? [transfer.connectionId];
  const path: CurveMotionSample[] = [], passages: Array<{ nodeId: string; phase: number }> = [];
  let distance = 0;
  for (let leg = 0; leg < ids.length; leg++) {
    const connection = connections.find(cable => cable.id === ids[leg]);
    if (!connection) return { path: [], passages: [] };
    const segment = buildCurveMotionPath(connection, nodes, connections);
    if (!segment.length) return { path: [], passages: [] };
    if (path.length) {
      const last = path.at(-1)!, first = segment[0], gap = Math.hypot(first.x - last.x, first.y - last.y);
      passages.push({ nodeId: connection.from, phase: distance + gap / 2 });
      distance += gap;
    }
    const offset = distance;
    segment.forEach(sample => path.push({ ...sample, distance: offset + sample.distance }));
    distance = path.at(-1)!.distance;
  }
  passages.forEach(passage => { passage.phase /= Math.max(1, distance); });
  return { path, passages };
}

export function sampleCurveMotion(path: CurveMotionSample[], progress: number) {
  if (!path.length) return undefined; const total = path[path.length - 1].distance; const target = Math.max(0, Math.min(total, total * progress));
  let index = 1; while (index < path.length && path[index].distance < target) index += 1;
  const after = path[Math.min(index, path.length - 1)]; const before = path[Math.max(0, index - 1)]; const span = Math.max(.001, after.distance - before.distance); const local = (target - before.distance) / span;
  return { x: before.x + (after.x - before.x) * local, y: before.y + (after.y - before.y) * local, angle: Math.atan2(after.y - before.y, after.x - before.x) };
}

