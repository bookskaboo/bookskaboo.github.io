import { describe, expect, it } from 'vitest';
import { CORE_RESEARCH } from '../content/coreResearch';
import { getResearchProject } from '../content/research';
import { isRecipeUnlocked } from '../content/recipes';
import { createInitialState, GameEngine } from './engine';
import type { MachineNode } from '../domain/types';
import { isResearchCycleActive, researchCoreStorage } from './researchStatus';

function advance(engine: GameEngine, milliseconds: number) {
  while (milliseconds > 0) { const step = Math.min(100, milliseconds); engine.tick(step); milliseconds -= step; }
}

function setup(project = 'extractor2') {
  const state = createInitialState(301);
  state.sectors['5,5'].nodes = [];
  state.research.completed = ['exploration', 'basicCore'];
  const center: MachineNode = {
    id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0,
    input: {}, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0,
  };
  state.sectors['5,5'].nodes.push(center);
  // Exploration itself is tested as an incomplete project, while its completion
  // is available to projects such as repeatable Map Node research.
  if (project === 'exploration') state.research.completed = [];
  const engine = new GameEngine(state);
  if (project === 'mapNode') engine.startMapResearch(4, 5);
  else engine.selectResearch(project);
  return { engine, center: engine.getSector().nodes[0], state: engine.getState() };
}

describe('synchronized Research Center cycles', () => {
  it('clears leftover progress on completion and stays idle on following ticks', () => {
    const { engine, center, state } = setup('assembler');
    state.research.contributed = { 'simple-core': 4 };
    center.input = { 'simple-core': 1 };
    center.progressMs = 4950;
    advance(engine, 100);
    expect(state.research.selected).toBeUndefined();
    expect(center.progressMs).toBe(0);
    expect(isResearchCycleActive(center, state.research)).toBe(false);
    for (let i = 0; i < 10; i++) advance(engine, 100);
    expect(center.progressMs).toBe(0);
  });

  it('clears progress immediately after consuming the last complete core set', () => {
    const { engine, center, state } = setup();
    center.input = { 'simple-core': 2, 'basic-core': 1 };
    center.progressMs = 4950;
    advance(engine, 100);
    expect(state.research.selected).toBe('extractor2');
    expect(center.progressMs).toBe(0);
    expect(isResearchCycleActive(center, state.research)).toBe(false);
    center.input['basic-core'] = 1;
    expect(isResearchCycleActive(center, state.research)).toBe(true);
    advance(engine, 100);
    expect(center.progressMs).toBe(100);
  });

  it('clears stale saved progress when no project is selected', () => {
    const { engine, center, state } = setup();
    state.research.selected = undefined;
    center.progressMs = 350;
    advance(engine, 100);
    expect(center.progressMs).toBe(0);
  });

  it('shows zero storage for unlocked cores and preserves visible buffered higher tiers', () => {
    const { center, state } = setup();
    state.research.selected = undefined;
    state.research.completed = ['simpleCore', 'basicCore', 'automataCore'];
    center.input = { 'basic-core': 3, 'command-core': 2 };
    expect(researchCoreStorage(center, state.research)).toEqual([
      { item: 'simple-core', amount: 0, capacity: 5 },
      { item: 'basic-core', amount: 3, capacity: 5 },
      { item: 'automata-core', amount: 0, capacity: 5 },
      { item: 'command-core', amount: 2, capacity: 5 },
    ]);
    state.research.completed.push('hydroCore', 'shinyCore', 'complexCore');
    expect(researchCoreStorage(center, state.research).map((core) => core.item)).toEqual([
      'simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core',
    ]);
  });

  it('consumes both required cores together only when a full cycle finishes', () => {
    const { engine, center, state } = setup();
    center.input = { 'simple-core': 2, 'basic-core': 2 };
    advance(engine, 4999);
    expect(center.input).toEqual({ 'simple-core': 2, 'basic-core': 2 });
    expect(state.research.contributed).toEqual({});
    advance(engine, 1);
    expect(center.input).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
  });

  it('waits for the slowest core without draining faster inputs or banking cycle time', () => {
    const { engine, center, state } = setup();
    center.input['simple-core'] = 5;
    for (let i = 0; i < 10; i++) advance(engine, 5000);
    expect(center.input['simple-core']).toBe(5);
    expect(center.progressMs).toBe(0);
    expect(state.research.contributed).toEqual({});
    center.input['basic-core'] = 1;
    advance(engine, 4999);
    expect(state.research.contributed).toEqual({});
    advance(engine, 1);
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    expect(center.input).toEqual({ 'simple-core': 4, 'basic-core': 0 });
    advance(engine, 5000);
    expect(center.input['simple-core']).toBe(4);
  });

  it('consumes a three-core set and respects the existing research-speed upgrade', () => {
    const { engine, center, state } = setup('treePlanter');
    state.research.completed.push('researchCenter1');
    center.input = { 'simple-core': 2, 'basic-core': 2, 'automata-core': 2 };
    advance(engine, 4499);
    expect(state.research.contributed).toEqual({});
    advance(engine, 1);
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1, 'automata-core': 1 });
    expect(center.input).toEqual({ 'simple-core': 1, 'basic-core': 1, 'automata-core': 1 });
  });

  it('completes a repeatable project in five sets and uses its next cost after reselection', () => {
    const { engine, center, state } = setup('mapNode');
    center.input = { 'simple-core': 6, 'basic-core': 6, 'automata-core': 2 };
    for (let i = 0; i < 5; i++) advance(engine, 5000);
    expect(state.research.repeatableCompletions?.mapNode).toBe(1);
    expect(state.sectors['4,5'].unlocked).toBe(true);
    expect(state.research.mapPoints).toBe(0);
    expect(state.research.selected).toBeUndefined();
    expect(center.input).toEqual({ 'simple-core': 1, 'basic-core': 6, 'automata-core': 2 });
    advance(engine, 5000);
    expect(center.input['simple-core']).toBe(1);
    expect(engine.startMapResearch(6, 5)).toBe(true);
    advance(engine, 5000);
    expect(state.research.contributed).toEqual({ 'simple-core': 1 });
    expect(state.research.repeatableCompletions?.mapNode).toBe(1);
  });

  it('does not consume already-fulfilled core types from uneven saved progress', () => {
    const { engine, center, state } = setup();
    state.research.contributed = { 'simple-core': 15, 'basic-core': 13 };
    center.input = { 'simple-core': 2, 'basic-core': 3 };
    advance(engine, 5000);
    expect(state.research.contributed).toEqual({ 'simple-core': 15, 'basic-core': 14 });
    expect(center.input['simple-core']).toBe(2);
    advance(engine, 5000);
    expect(state.research.completed).toContain('extractor2');
    expect(center.input).toEqual({ 'simple-core': 2, 'basic-core': 1 });
  });

  it('completes Assembler only after five full cycles with five stocked Simple Cores', () => {
    const { engine, center, state } = setup('assembler');
    engine.selectResearch();
    center.input = { 'simple-core': 5, 'basic-core': 5 };
    engine.selectResearch('assembler');
    expect(state.research.contributed).toEqual({});
    expect(center.input['simple-core']).toBe(5);
    advance(engine, 24999);
    expect(state.research.contributed).toEqual({ 'simple-core': 4 });
    expect(state.research.completed).not.toContain('assembler');
    advance(engine, 1);
    expect(state.research.completed).toContain('assembler');
    expect(center.input).toEqual({ 'simple-core': 0, 'basic-core': 5 });
  });
});

describe('standalone Core research', () => {
  it('charges five of every earlier Core and lets only its own project unlock each recipe', () => {
    const earlier = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
    CORE_RESEARCH.forEach(({ id, item, prerequisite }, index) => {
      const project = getResearchProject(id)!;
      expect(project.costs).toEqual(Object.fromEntries(earlier.slice(0, index).map(core => [core, 5])));
      expect(isRecipeUnlocked(item, [prerequisite])).toBe(false);
      expect(isRecipeUnlocked(item, [prerequisite, id])).toBe(true);
    });
    expect(getResearchProject('simpleCore')?.trigger?.id).toBe('refiner-unlocked');
  });

  it('requires all earlier Core types in a synchronized payment before unlocking Hydro Core', () => {
    const initial = createInitialState(301);
    initial.research.completed = ['refiner', 'simpleCore', 'basicCore', 'automataCore', 'hydraulicAssembly'];
    initial.sectors['5,5'].nodes = [setup().center];
    const engine = new GameEngine(initial, { autosave: false });
    engine.selectResearch('hydroCore');
    const lab = engine.getSector().nodes[0];
    lab.input = { 'simple-core': 5, 'basic-core': 5 };
    advance(engine, 5000);
    const research = engine.getState().research;
    expect(research.contributed).toEqual({});
    lab.input['automata-core'] = 5;
    advance(engine, 25000);
    expect(research.completed).toContain('hydroCore');
    expect(lab.input).toEqual({ 'simple-core': 0, 'basic-core': 0, 'automata-core': 0 });
  });

  it('retains previously bundled recipes on load while leaving later recipes locked', () => {
    const old = createInitialState(301);
    delete old.coreResearchVersion;
    old.research.completed = ['refiner', 'assembler', 'automataCore', 'hydraulicAssembly'];
    old.research.unlocked.push(...old.research.completed);
    const engine = new GameEngine(old, { autosave: false });
    const game = engine.getState();
    expect(game.coreResearchVersion).toBe(1);
    for (const { id, item } of CORE_RESEARCH.slice(0, 4)) {
      expect(game.research.unlocked).toContain(id);
      expect(isRecipeUnlocked(item, game.research.completed)).toBe(true);
    }
    expect(isRecipeUnlocked('shiny-core', game.research.completed)).toBe(false);
    game.research.completed.push('oreSeparation');
    engine.replaceState(game);
    expect(isRecipeUnlocked('shiny-core', engine.getState().research.completed)).toBe(false);
  });
});
