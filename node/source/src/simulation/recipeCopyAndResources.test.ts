import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { tutorialNode } from '../tutorials/tutorialState';
import type { MachineNode, NodeKind } from '../domain/types';

function fixture() {
  const state = createInitialState(27);
  const sector = state.sectors[state.activeSectorId];
  sector.nodes = []; sector.connections = [];
  state.research.completed = ['smelter', 'refiner', 'assembler', 'automataCore'];
  state.research.unlocked = [...state.research.completed];
  const engine = new GameEngine(state, { autosave: false });
  const add = (kind: NodeKind, id: string, extra: Partial<MachineNode> = {}) => {
    const active = engine.getSector();
    const node = tutorialNode(kind, id, 300 + active.nodes.length * 340, 500, extra);
    active.nodes.push(node);
    return node;
  };
  return { engine, add };
}

describe('copying a recipe', () => {
  it('copies between matching machines and restores the target with one undo', () => {
    const { engine, add } = fixture();
    const source = add('refiner', 'source', { recipeId: 'copper-gear' });
    const target = add('refiner', 'target', { recipeId: 'iron-wire', input: { 'iron-plate': 2 }, output: { 'iron-wire': 1 }, progressMs: 500, connectorsMirrored: true });
    const before = structuredClone(target);
    expect(engine.copyRecipe(source.id, target.id)).toBe(true);
    expect(target.recipeId).toBe('copper-gear');
    expect(target.input).toEqual({}); expect(target.output).toEqual({});
    expect(target.connectorsMirrored).toBe(true);
    expect(target.x).toBe(before.x);
    engine.undo();
    expect(engine.getSector().nodes.find(node => node.id === target.id)).toEqual(before);
  });
  it('does nothing with an unconfigured source, another machine type, missing nodes, or itself', () => {
    const { engine, add } = fixture();
    const source = add('refiner', 'source', { recipeId: 'copper-gear' });
    const empty = add('refiner', 'empty', { recipeId: undefined });
    const other = add('assembler', 'other');
    const before = structuredClone(engine.getState());
    for (const [from, to] of [[empty.id, source.id], [source.id, other.id], [source.id, source.id], ['missing', source.id]]) expect(engine.copyRecipe(from, to)).toBe(false);
    expect(engine.getState()).toEqual(before);
  });
  it('does not replace a committed batch', () => {
    const { engine, add } = fixture();
    const source = add('refiner', 'source', { recipeId: 'copper-gear' });
    const target = add('refiner', 'target', { recipeId: 'iron-wire', batch: { recipeId: 'iron-wire', outputs: { 'iron-wire': 1 } } });
    const before = structuredClone(target);
    expect(engine.copyRecipe(source.id, target.id)).toBe(false);
    expect(target).toEqual(before);
  });
});

describe('resource connections require extraction', () => {
  it('rejects even matching Iron reserves connected straight to an Iron Smelter', () => {
    const { engine, add } = fixture();
    const ore = add('iron', 'ore', { resourceItem: 'iron', resourceRemaining: 500 });
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-iron' });
    expect(engine.connect(ore.id, smelter.id)).toBe(false);
    expect(engine.connectPorts(ore.id, 0, smelter.id, 0)).toBe(false);
    expect(engine.getConnectionFailure(ore.id, 0, smelter.id, 0)?.title).toBe('Extractor required');
    expect(engine.getSector().connections).toEqual([]);
  });
  it.each([false, true])('rejects bypassing extraction through a Joint, downstream-first=%s', downstreamFirst => {
    const { engine, add } = fixture();
    const ore = add('iron', 'ore', { resourceItem: 'iron', resourceRemaining: 500 });
    const joint = add('joint', 'joint');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-iron' });
    if (downstreamFirst) {
      expect(engine.connect(joint.id, smelter.id)).toBe(true);
      expect(engine.connect(ore.id, joint.id)).toBe(false);
    } else {
      expect(engine.connect(ore.id, joint.id)).toBe(true);
      expect(engine.connect(joint.id, smelter.id)).toBe(false);
    }
  });
  it('keeps resource-to-Joint-to-Extractor routing and extracted Iron delivery valid', () => {
    const { engine, add } = fixture();
    const ore = add('iron', 'ore', { resourceItem: 'iron', resourceRemaining: 500 });
    const joint = add('joint', 'joint');
    const extractor = add('extractor', 'extractor');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-iron' });
    expect(engine.connect(ore.id, joint.id)).toBe(true);
    expect(engine.connect(joint.id, extractor.id)).toBe(true);
    expect(engine.connect(extractor.id, smelter.id)).toBe(true);
  });
});
