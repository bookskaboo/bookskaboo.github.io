import type { GameState, MachineNode, SectorState } from '../domain/types';
import type { Point } from '../domain/nodeGeometry';
import { hasNodeBehavior } from '../content/nodeCapabilities';

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

/** Shared final pair geometry for moves, expansion and natural spawn reservations. */
export function roadPairLayoutForField(state: GameState, sector: SectorState, node: MachineNode, point: Point, field: Field) {
  const neighbor=node.pairedSectorId?state.sectors[node.pairedSectorId]:undefined;
  if(!neighbor?.unlocked)return;
  const pair=neighbor.nodes.find(candidate=>candidate.id===node.pairedRoadId&&hasNodeBehavior(candidate.kind,'road'));
  const localFacing=facingAwayFromNeighbor(sector,neighbor);
  if(!pair||!localFacing||(pair.pairedRoadId&&pair.pairedRoadId!==node.id)||(pair.pairedSectorId&&pair.pairedSectorId!==sector.id))return;
  const {local,remote}=pairedRoadPositions(point,localFacing,field);
  return {node:{...node,...local},road:{sector:neighbor,endpoint:{...pair,...remote},localFacing},pair};
}
