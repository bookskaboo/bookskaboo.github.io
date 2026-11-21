/** Shared border identities and corner constraints for generation, placement and presentation. */
import type { GameState } from './types';
export const BORDER_SIDES = ['north', 'east', 'south', 'west'] as const;
export type BorderSide = typeof BORDER_SIDES[number];
export type BorderObstruction = 'river' | 'mountain' | 'chasm';
export type MapBorderLayout = Record<BorderSide, BorderObstruction | null>;
export interface SharedBorderObstruction { from: string; to: string; kind: BorderObstruction }
export const BORDER_CROSSING_RESEARCH = { river: 'riverBridges', mountain: 'mountainTunnels', chasm: 'chasmSpans' } as const;
export const BORDER_NAMES = { river: 'River', mountain: 'Mountain', chasm: 'Chasm' } as const;
export const BORDER_CORE_TIERS = { river: 'Hydro', mountain: 'Shiny', chasm: 'Complex' } as const;
export const borderKey = (a: string, b: string) => [a, b].sort().join(':');
export function borderSide(from: string, to: string): BorderSide {
  const [x, y] = from.split(',').map(Number), [ox, oy] = to.split(',').map(Number);
  return ox > x ? 'east' : ox < x ? 'west' : oy > y ? 'south' : 'north';
}
export function sectorBorderObstructions(state: Pick<GameState, 'borderObstructionVersion' | 'borderObstructions'>, id: string) {
  return state.borderObstructionVersion === 1 ? (state.borderObstructions ?? []).filter(edge => edge.from === id || edge.to === id) : [];
}
export function borderCrossingFailure(state: Pick<GameState, 'borderObstructionVersion' | 'borderObstructions' | 'research'>, from: string, to: string) {
  const edge = sectorBorderObstructions(state, from).find(edge => borderKey(edge.from, edge.to) === borderKey(from, to));
  return edge && !state.research.completed.includes(BORDER_CROSSING_RESEARCH[edge.kind])
    ? `${BORDER_NAMES[edge.kind]} crossing requires ${BORDER_CORE_TIERS[edge.kind]} research: ${edge.kind === 'river' ? 'River Bridges' : edge.kind === 'mountain' ? 'Mountain Tunnels' : 'Chasm Spans'}.` : undefined;
}
export const SIDE_LABELS: Record<BorderSide, string> = { north: 'North', east: 'East', south: 'South', west: 'West' };
const perpendicular: Record<BorderSide, readonly BorderSide[]> = {
  north: ['east', 'west'], east: ['north', 'south'], south: ['east', 'west'], west: ['north', 'south'],
};

export function borderCornerConflict(layout: MapBorderLayout, side: BorderSide, terrain: BorderObstruction | null) {
  return terrain === null ? undefined : perpendicular[side].find(other => layout[other] !== null);
}

export function hasObstructedCorner(layout: MapBorderLayout) {
  return BORDER_SIDES.some(side => layout[side] !== null && borderCornerConflict(layout, side, layout[side]) !== undefined);
}

export function trySetBorder(layout: MapBorderLayout, side: BorderSide, terrain: BorderObstruction | null) {
  const conflict = borderCornerConflict(layout, side, terrain);
  if (conflict) return { accepted: false as const, layout, conflict };
  return { accepted: true as const, layout: { ...layout, [side]: terrain } };
}
