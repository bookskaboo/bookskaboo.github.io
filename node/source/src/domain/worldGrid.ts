import type { GameState } from './types';

export const DEFAULT_WORLD_GRID_SIZE = 11;
export const MAX_WORLD_GRID_SIZE = 21;
export const WORLD_GRID_SIZES = [11, 13, 15, 17, 19, 21] as const;
export const HOME_COORDINATE = 5;
export const HOME_SECTOR_ID = '5,5';

export const isWorldGridSize = (size: unknown): size is number => WORLD_GRID_SIZES.some(option => option === size);
export const worldGridSize = (state: Pick<GameState, 'worldGridSize'>) => state.worldGridSize ?? DEFAULT_WORLD_GRID_SIZE;

export function worldGridBounds(size: number) {
  const radius = (size - 1) / 2;
  return { min: HOME_COORDINATE - radius, max: HOME_COORDINATE + radius };
}

export function isWorldGridCell(x: number, y: number, size: number) {
  const { min, max } = worldGridBounds(size);
  return Number.isInteger(x) && Number.isInteger(y) && x >= min && x <= max && y >= min && y <= max;
}

export function worldCornerIds(size: number) {
  const { min, max } = worldGridBounds(size);
  return [`${min},${min}`, `${max},${min}`, `${max},${max}`, `${min},${max}`];
}
