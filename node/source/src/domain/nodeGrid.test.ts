import { describe, expect, it } from 'vitest';
import { draggedNodePositions, snapNodePosition, WORLD_GRID_SIZE } from './nodeGrid';
import { getNodeSize } from './nodeGeometry';
import { NODE_DEFINITIONS } from '../content/nodes';
import type { NodeKind } from './types';
import { createInitialState, GameEngine } from '../simulation/engine';

const chest = getNodeSize({ kind: 'woodenChest' });
const corner = (point: { x: number; y: number }, size = chest) => ({ x: point.x - size.w / 2, y: point.y - size.h / 2 });

describe('world grid placement and movement', () => {
  it('keeps free placement exact and snaps the top-left corner', () => {
    const point = { x: 713, y: 689 };
    expect(snapNodePosition(point, false, chest)).toEqual(point);
    expect(corner(snapNodePosition(point, true, chest))).toEqual({ x: 640, y: 640 });
    expect(point).toEqual({ x: 713, y: 689 });
  });
  it('uses the same corner grid for every node type and 64-unit body dimensions', () => {
    for (const kind of Object.keys(NODE_DEFINITIONS) as NodeKind[]) {
      const size = getNodeSize({ kind });
      expect(size.w % WORLD_GRID_SIZE, `${kind} width`).toBe(0);
      expect(size.h % WORLD_GRID_SIZE, `${kind} height`).toBe(0);
      const position = snapNodePosition({ x: 713 + size.w / 2, y: 689 + size.h / 2 }, true, size);
      expect(corner(position, size), kind).toEqual({ x: 704, y: 704 });
    }
  });
  it('advances in world-grid steps regardless of camera pan or zoom', () => {
    for (const camera of [{ x: 0, y: 0, zoom: 1 }, { x: -475, y: 138, zoom: .45 }, { x: 173, y: -520, zoom: 1.75 }]) {
      const pointer = { x: 745 * camera.zoom + camera.x, y: 679 * camera.zoom + camera.y };
      const world = { x: (pointer.x - camera.x) / camera.zoom, y: (pointer.y - camera.y) / camera.zoom };
      const snapped = snapNodePosition(world, true, chest);
      expect(corner(snapped)).toEqual({ x: 704, y: 640 });
      expect(snapNodePosition({ ...world, x: world.x + 64 }, true, chest).x).toBe(snapped.x + 64);
    }
  });
  it('matches the preview and committed node while rejecting collisions', () => {
    const engine = new GameEngine(createInitialState(1), { autosave: false });
    engine.getState().research.unlocked.push('road');
    const point = snapNodePosition({ x: 1117, y: 663 }, true, chest);
    expect(engine.getNodePlacementPreview('woodenChest', point.x, point.y)).toMatchObject({ valid: true, node: point });
    const id = engine.placeNode('woodenChest', point.x, point.y);
    expect(engine.getSector().nodes.find(node => node.id === id)).toMatchObject(point);
    expect(engine.getNodePlacementPreview('woodenChest', point.x, point.y)?.valid).toBe(false);
    expect(engine.placeNode('woodenChest', point.x, point.y)).toBeUndefined();
  });
  it('aligns the grabbed node corner and preserves group spacing', () => {
    const origins = new Map([['first', { x: 507, y: 680 }], ['grabbed', { x: 713, y: 689 }]]);
    const size = getNodeSize({ kind: 'smelter' });
    const desired = draggedNodePositions(origins, 'grabbed', { x: 41, y: 63 }, true, size);
    expect(corner(desired.grabbed, size)).toEqual({ x: 640, y: 640 });
    expect(desired.grabbed.x - desired.first.x).toBe(206);
    expect(desired.grabbed.y - desired.first.y).toBe(9);
    expect(origins.get('grabbed')).toEqual({ x: 713, y: 689 });
  });
  it('toggles snapping without accumulating rounding errors', () => {
    const origins = new Map([['node', { x: 713, y: 689 }]]);
    const delta = { x: 41, y: 63 };
    const snapped = draggedNodePositions(origins, 'node', delta, true, chest).node;
    expect(draggedNodePositions(origins, 'node', delta, false, chest).node).toEqual({ x: 754, y: 752 });
    expect(draggedNodePositions(origins, 'node', delta, true, chest).node).toEqual(snapped);
  });
});
