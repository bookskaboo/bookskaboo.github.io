import { describe, expect, it } from 'vitest';
import type { MachineNode } from '../domain/types';
import { createInitialState, GameEngine } from './engine';

function setup(target: MachineNode['miningTarget'] = 'iron') {
  const state = createInitialState(37);
  state.paused = false;
  state.research.completed.push('factoryTemplates', 'miningDrill');
  state.research.unlocked.push('miningDrill');
  const sector = state.sectors[state.activeSectorId];
  sector.connections = [];
  sector.nodes = [{
    id: 'source-drill', kind: 'miningDrill', name: 'Paid Drill',
    x: 500, y: 500, rotation: 0, input: { motor: 3 }, output: {},
    miningTarget: target, miningProgress: 19, progressMs: 900, cycleMs: 1000,
    constructedAt: 0, constructionMs: 0, disabled: true,
  }];
  const engine = new GameEngine(state, { autosave: false });
  return { engine, source: engine.getSector().nodes[0] };
}

function finishConstruction(node: MachineNode) {
  node.constructedAt = 0;
  node.constructionMs = 0;
}

describe('fresh Mining Drill layout copies', () => {
  it.each(['iron', 'copper', 'stone'] as const)('requires all twenty Motors for a new %s template copy', target => {
    const { engine, source } = setup(target);
    const original = structuredClone(source);
    expect(engine.saveFactoryTemplate('Drill layout', [source.id])).toBe(true);
    expect(engine.getState().factoryTemplates![0].nodes[0].miningProgress ?? 0).toBe(0);
    expect(source).toEqual(original);
    expect(engine.placeFactoryTemplate(0, 1200, 500)).toBe(true);
    const copy = engine.getSector().nodes.find(node => node.id !== source.id)!;
    expect(copy).toMatchObject({ miningTarget: target, name: 'Paid Drill', progressMs: 0, input: {}, output: {}, disabled: false });
    finishConstruction(copy);
    copy.input.motor = 1;
    engine.tick(1000);
    expect(copy).toMatchObject({ kind: 'miningDrill', miningProgress: 1, input: { motor: 0 } });
    copy.input.motor = 18;
    for (let i = 0; i < 18; i++) engine.tick(1000);
    expect(copy).toMatchObject({ kind: 'miningDrill', miningProgress: 19 });
    copy.input.motor = 1;
    engine.tick(1000);
    expect(copy).toMatchObject({ kind: target === 'stone' ? 'stoneDeposit' : target, resourceRemaining: 1000, resourceCapacity: 1000 });
    expect(source).toEqual(original);
  });

  it.each([19, 20])('clears %s paid Motors in existing templates without mutating the stored layout', progress => {
    const { engine, source } = setup('copper');
    engine.getState().factoryTemplates = [{
      name: 'Old template', nodes: [{ ...structuredClone(source), x: 0, y: 0, disabled: false, miningProgress: progress }], connections: [],
    }];
    // A loaded save can retain the old paid field; new previews and placements must ignore it.
    const loaded = new GameEngine(engine.getState(), { autosave: false });
    const stored = structuredClone(loaded.getState().factoryTemplates![0]);
    const original = structuredClone(loaded.getSector().nodes[0]);
    const preview = loaded.getTemplatePreview(0, 1200, 500)!;
    expect(preview.valid).toBe(true);
    expect(preview.nodes[0].miningProgress ?? 0).toBe(0);
    for (const x of [1200, 1800]) {
      expect(loaded.placeFactoryTemplate(0, x, 500)).toBe(true);
      const copy = loaded.getSector().nodes.find(node => node.x === x)!;
      expect(copy).toMatchObject({ miningTarget: 'copper', progressMs: 0, input: {} });
      finishConstruction(copy);
      copy.input.motor = 1;
    }
    loaded.tick(1000);
    expect(loaded.getSector().nodes.filter(node => node.id !== source.id).map(node => [node.kind, node.miningProgress])).toEqual([
      ['miningDrill', 1], ['miningDrill', 1],
    ]);
    expect(loaded.getState().factoryTemplates![0]).toEqual(stored);
    expect(loaded.getSector().nodes[0]).toEqual(original);
  });

  it.each(['clipboard', 'duplicate'] as const)('keeps %s copies unpaid and leaves the original Drill intact', method => {
    const { engine, source } = setup('stone');
    const original = structuredClone(source);
    let ids: string[];
    if (method === 'clipboard') {
      expect(engine.copyNodes([source.id])).toBe(true);
      ids = engine.pasteNodes({ x: 1200, y: 500 });
    } else ids = engine.duplicateNodes([source.id]);
    expect(ids).toHaveLength(1);
    const copy = engine.getSector().nodes.find(node => node.id === ids[0])!;
    expect(copy.miningProgress ?? 0).toBe(0);
    expect(copy).toMatchObject({ miningTarget: 'stone', input: {}, output: {}, progressMs: 0 });
    expect(source).toEqual(original);
  });
});
