import { describe, expect, it } from 'vitest';
import { NODE_DEFINITIONS } from '../content/nodes';
import { getNodeSize } from '../domain/nodeGeometry';
import type { MachineNode, NodeKind } from '../domain/types';
import { canPlaceNode, nodesOverlap } from './collisions';
import { createInitialState, GameEngine } from './engine';

function node(kind: NodeKind, id: string, left: number, top: number): MachineNode {
  const { w, h } = getNodeSize({ kind });
  return { id, kind, name: NODE_DEFINITIONS[kind].name, x: left + w / 2, y: top + h / 2,
    rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0 };
}

describe('touching player-built nodes', () => {
  it.each(['extractor', 'smelter', 'assembler', 'woodenChest', 'joint'] as const)('permits %s edge contact but rejects any body overlap', kind => {
    const first = node('smelter', 'first', 256, 128), size = getNodeSize(first);
    const right = node(kind, 'right', 256 + size.w, 128);
    const below = node(kind, 'below', 256, 128 + size.h);
    expect(nodesOverlap(first, right)).toBe(false);
    expect(nodesOverlap(right, first)).toBe(false);
    expect(nodesOverlap(first, below)).toBe(false);
    expect(nodesOverlap(first, { ...right, x: right.x - .01 })).toBe(true);
    expect(nodesOverlap(first, { ...below, y: below.y - .01 })).toBe(true);
    expect(nodesOverlap(first, right, 12)).toBe(true);
  });

  it('keeps resource and field clearance', () => {
    const resource = node('iron', 'reserve', 256, 128);
    const cart = node('woodenChest', 'cart', 576, 128);
    expect(nodesOverlap(cart, resource)).toBe(true);
    expect(nodesOverlap(resource, cart)).toBe(true);
    expect(nodesOverlap({ ...cart, x: cart.x + 12 }, resource)).toBe(false);
    expect(canPlaceNode(node('woodenChest', 'edge', 0, 128), [], { width: 3600, height: 2400 })).toBe(false);
  });

  it('uses matching preview, build and movement rules at a touching edge', () => {
    const engine = new GameEngine(createInitialState(1), { autosave: false });
    engine.getState().research.unlocked.push('road');
    const first = node('woodenChest', 'first', 1024, 640);
    engine.getSector().nodes = [first]; engine.getSector().connections = [];
    const second = node('woodenChest', 'second', 1152, 640);
    expect(engine.getNodePlacementPreview('woodenChest', second.x, second.y)).toMatchObject({ valid: true });
    const id = engine.placeNode('woodenChest', second.x, second.y)!;
    expect(id).toBeTruthy();
    expect(engine.getNodePlacementPreview('woodenChest', second.x - 32, second.y)).toMatchObject({ valid: false });
    expect(engine.placeNode('woodenChest', second.x - 32, second.y)).toBeUndefined();
    expect(engine.tryMoveNodesTo({ [id]: { x: second.x + 32, y: second.y } })).toBe(true);
    expect(engine.tryMoveNodesTo({ [id]: { x: second.x, y: second.y } }, false)).toBe(true);
    expect(engine.tryMoveNodesTo({ [id]: { x: second.x, y: second.y } })).toBe(true);
    expect(engine.tryMoveNodesTo({ [id]: { x: second.x - 32, y: second.y } })).toBe(false);
    expect(engine.connect(first.id, id)).toBe(true);
    first.output.wood = 4;
    engine.getState().paused = false;
    for (let step = 0; step < 20; step++) engine.tick(100);
    const receiver = engine.getSector().nodes.find(candidate => candidate.id === id)!;
    expect((receiver.input.wood ?? 0) + (receiver.output.wood ?? 0)).toBeGreaterThan(0);
  });
});
