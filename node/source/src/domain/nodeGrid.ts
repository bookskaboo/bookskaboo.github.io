import type { NodeSize } from './nodeGeometry';

export const WORLD_GRID_SIZE = 64;

interface Point { x: number; y: number }

/** Align the top-left corner to the drawn world grid, regardless of node size. */
export function snapNodePosition(point: Point, enabled: boolean, size: NodeSize): Point {
  return enabled
    ? { x: Math.round((point.x - size.w / 2) / WORLD_GRID_SIZE) * WORLD_GRID_SIZE + size.w / 2, y: Math.round((point.y - size.h / 2) / WORLD_GRID_SIZE) * WORLD_GRID_SIZE + size.h / 2 }
    : { ...point };
}

/** Align the grabbed node while keeping every selected node's relative offset. */
export function draggedNodePositions(origins: ReadonlyMap<string, Point>, anchorId: string, delta: Point, snap: boolean, anchorSize: NodeSize): Record<string, Point> {
  const origin = origins.get(anchorId);
  const anchor = origin && snapNodePosition({ x: origin.x + delta.x, y: origin.y + delta.y }, snap, anchorSize);
  const dx = anchor && origin ? anchor.x - origin.x : delta.x;
  const dy = anchor && origin ? anchor.y - origin.y : delta.y;
  return Object.fromEntries([...origins].map(([id, point]) => [id, { x: point.x + dx, y: point.y + dy }]));
}
