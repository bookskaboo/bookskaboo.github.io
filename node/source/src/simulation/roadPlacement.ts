import type { MachineNode } from '../domain/types';
import type { Point } from '../domain/nodeGeometry';

export type RoadFacing = NonNullable<MachineNode['roadFacing']>;
type Field = { width: number; height: number };

const EDGE_INSET = 67.5;
const oppositeFacing: Record<RoadFacing, RoadFacing> = { north: 'south', south: 'north', east: 'west', west: 'east' };

export function facingAwayFromNeighbor(sector: Point, neighbor: Point): RoadFacing | undefined {
  const x = neighbor.x - sector.x, y = neighbor.y - sector.y;
  if (Math.abs(x) + Math.abs(y) !== 1) return;
  return x < 0 ? 'east' : x > 0 ? 'west' : y < 0 ? 'south' : 'north';
}

export function pairedRoadPositions(point: Point, facing: RoadFacing, field: Field) {
  const sideBySide = facing === 'east' || facing === 'west';
  const length = sideBySide ? field.height : field.width;
  const parallel = Math.max(EDGE_INSET, Math.min(length - EDGE_INSET, sideBySide ? point.y : point.x));
  const endpoint = (roadFacing: RoadFacing) => ({
    x: sideBySide ? roadFacing === 'east' ? EDGE_INSET : field.width - EDGE_INSET : parallel,
    y: sideBySide ? parallel : roadFacing === 'south' ? EDGE_INSET : field.height - EDGE_INSET,
    roadFacing,
  });
  return { local: endpoint(facing), remote: endpoint(oppositeFacing[facing]) };
}
