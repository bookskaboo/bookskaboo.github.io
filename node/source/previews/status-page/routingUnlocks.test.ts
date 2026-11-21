import { describe, expect, it } from 'vitest';
import { BASE_RESEARCH_PROJECTS, getResearchProject } from '../../src/content/research';
import { RECIPES } from '../../src/content/recipes';
import type { MachineNode } from '../../src/domain/types';
import { normalizeLegacy } from '../../src/persistence/saves';
import { GameEngine } from '../../src/simulation/engine';
import { installBotUpgradeProposal, previewState } from './model';

installBotUpgradeProposal();

function setup() {
  const state = previewState(0);
  state.paused = false;
  state.research.completed = ['refiner'];
  state.research.unlocked = ['extractor', 'refiner'];
  const refiner: MachineNode = { id: 'routing-test-refiner', kind: 'refiner', name: 'Refiner', x: 1000, y: 1000, rotation: 0,
    recipeId: 'copper-gear', input: { 'copper-plate': 2 }, output: {}, progressMs: 0, cycleMs: 3000, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [refiner];
  const engine = new GameEngine(state, { autosave: false });
  return { engine, state: engine.getState(), refiner: engine.getSector().nodes[0] };
}
function advance(engine: GameEngine, duration: number) {
  for (let elapsed = 0; elapsed < duration; elapsed += 100) engine.tick(Math.min(100, duration - elapsed));
}
function unlocked(state: ReturnType<GameEngine['getState']>) {
  return ['splitter', 'merger'].filter(id => state.research.completed.includes(id));
}

describe('prototype routing unlocks', () => {
  it('unlocks both nodes on the first Simple Core output, retaining progress across reload', () => {
    const { engine, state, refiner } = setup();
    refiner.recipeId = 'simple-core';
    refiner.input = { 'copper-gear': 2 };
    expect(unlocked(state)).toEqual([]);
    advance(engine, 4900);
    expect(unlocked(state)).toEqual([]);
    advance(engine, 100);
    expect(state.produced?.['simple-core']).toBe(1);
    expect(unlocked(state)).toEqual(['splitter', 'merger']);
    expect(state.research.completed).not.toContain('simpleCore');
    state.sectors['5,5'].nodes = [];
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    expect(unlocked(restored.getState())).toEqual(['splitter', 'merger']);
  });

  it('recognizes saved Simple Core production and preserves previously completed routing unlocks', () => {
    const { state } = setup();
    state.sectors['5,5'].nodes = [];
    state.produced = { 'simple-core': 1 };
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    advance(restored, 100);
    expect(unlocked(restored.getState())).toEqual(['splitter', 'merger']);
    state.produced = {};
    state.research.completed.push('splitter', 'merger', 'simpleCore');
    const legacy = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    advance(legacy, 100);
    expect(unlocked(legacy.getState())).toEqual(['splitter', 'merger']);
    expect(legacy.getState().research.completed).toContain('simpleCore');
  });
  it('inherits the shared first Simple Core triggers in both catalogs', () => {
    for (const id of ['splitter', 'merger']) expect(getResearchProject(id)?.trigger).toMatchObject({
      id: 'simple-core-produced', pending: 'Produce 1 Simple Core',
    });
    expect(BASE_RESEARCH_PROJECTS.find(project => project.id === 'splitter')?.trigger?.id).toBe('simple-core-produced');
    expect(BASE_RESEARCH_PROJECTS.find(project => project.id === 'merger')?.trigger?.id).toBe('simple-core-produced');
  });

  it('does not unlock either node when a Refiner makes another item', () => {
    const { engine, state, refiner } = setup();
    expect(unlocked(state)).toEqual([]);
    advance(engine, 2900);
    expect(unlocked(state)).toEqual([]);
    expect(state.hasProducedWithRefiner).not.toBe(true);
    advance(engine, 100);
    expect(refiner.output['copper-gear']).toBe(1);
    expect(state.hasProducedWithRefiner).toBe(true);
    expect(unlocked(state)).toEqual([]);
    expect(state.research.completed).not.toContain('assembler');
    expect(state.research.completed).not.toContain('basicCore');
    expect(state.research.unlocked).not.toContain('splitter');
    state.sectors['5,5'].nodes = [];
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(loaded.hasProducedWithRefiner).toBe(true);
    expect(unlocked(new GameEngine(loaded, { autosave: false }).getState())).toEqual([]);
  });

  it('does not count Refiner access, old stock, an Assembler or a blocked production attempt', () => {
    const { engine, state, refiner } = setup();
    state.produced = { 'basic-core': 1, 'copper-gear': 1 };
    state.globalPool = { 'simple-core': 5 };
    state.sectors['5,5'].nodes.push({ ...refiner, id: 'old-gate-assembler', kind: 'assembler', input: {}, output: {}, recipeId: undefined });
    refiner.output = { 'iron-wire': 5 };
    advance(engine, 6000);
    expect(unlocked(state)).toEqual([]);
    expect(state.hasProducedWithRefiner).not.toBe(true);
    expect(refiner.input['copper-plate']).toBe(2);
  });

  it.each([0, 1])('counts extended Refiner batches only when a Simple Core is produced (chance %s)', probability => {
    const original = RECIPES['simple-core'];
    try {
      RECIPES['simple-core'] = { ...original, outputs: {}, chanceOutputs: [{ item: 'simple-core', amount: 1, probability }] };
      const { engine, state, refiner } = setup();
      refiner.recipeId = 'simple-core'; refiner.input = { 'copper-gear': 2 };
      advance(engine, 5000);
      expect(Boolean(state.hasProducedWithRefiner)).toBe(probability === 1);
      expect(unlocked(state)).toEqual(probability === 1 ? ['splitter', 'merger'] : []);
    } finally { RECIPES['simple-core'] = original; }
  });
});
