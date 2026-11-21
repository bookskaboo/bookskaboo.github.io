import { borderSide, sectorBorderObstructions, type BorderSide } from '../domain/borderObstructionLayout';
import { BORDER_FIELD_CROSS_SCALE, BORDER_RESOURCE_GAP, borderTerrainArtSeed, borderTerrainCrossBounds } from '../domain/borderTerrainGeometry';
import { getNodeSize } from '../domain/nodeGeometry';
import { defeatResourceGolem } from '../content/resourceGolems';
import type { GameState, MachineNode } from '../domain/types';

export type BorderTerrainInsets = Record<BorderSide, number>;

/** Reserve the visible half-band plus a gap. Future expansion can enlarge upright peaks. */
export function borderTerrainInsets(state: Pick<GameState, 'seed' | 'borderObstructionVersion' | 'borderObstructions'>, sectorId: string, largestField: { width: number; height: number }): BorderTerrainInsets {
  const insets: BorderTerrainInsets = { north: 0, east: 0, south: 0, west: 0 };
  for (const edge of sectorBorderObstructions(state, sectorId)) {
    const side = borderSide(sectorId, edge.from === sectorId ? edge.to : edge.from);
    const bounds = borderTerrainCrossBounds(edge.kind, borderTerrainArtSeed(state.seed, edge.from, edge.to), {
      horizontal: side === 'north' || side === 'south', field: largestField,
    });
    const extent = side === 'west' || side === 'north' ? bounds.max - 350 : 350 - bounds.min;
    insets[side] = Math.max(0, extent) * BORDER_FIELD_CROSS_SCALE + BORDER_RESOURCE_GAP;
  }
  return insets;
}

/** Conservative body bounds, including future settlement growth and defeated Golem reserves. */
export function clearsBorderTerrain(node: MachineNode, field: { width: number; height: number }, insets?: BorderTerrainInsets) {
  if (!insets) return true;
  const size = getNodeSize(node.kind === 'monster-camp' ? { ...node, campStrength: 100 } : node);
  const reserve = { ...node };
  if (node.kind === 'resourceGolem') defeatResourceGolem(reserve);
  const futureSize = node.kind === 'resourceGolem' ? getNodeSize(reserve) : size;
  const w = Math.max(size.w, futureSize.w), h = Math.max(size.h, futureSize.h);
  return (!insets.west || node.x - w / 2 >= insets.west)
    && (!insets.east || node.x + w / 2 <= field.width - insets.east)
    && (!insets.north || node.y - h / 2 >= insets.north)
    && (!insets.south || node.y + h / 2 <= field.height - insets.south);
}
