import { describe, expect, it } from 'vitest';
import { getResearchCosts, getResearchCostsForState, remainingMapNodePurchases, RESEARCH_PROJECTS } from '../content/research';
import type { MachineNode } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { outstandingResearchCores } from './researchStatus';

const project = RESEARCH_PROJECTS.find(p => p.id === 'mapNode')!;
const cores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const access = ['refiner', 'assembler', 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
function setup(completions = 0, unlocked = access) {
  const state = createInitialState(301);
  state.research.completed = ['exploration', ...unlocked];
  state.research.repeatableCompletions = { mapNode: completions };
  const lab: MachineNode = { id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0, input: {}, output: {}, cycleMs: 1000, progressMs: 0, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [lab];
  state.sectors['5,5'].connections = [];
  return new GameEngine(state, { autosave: false });
}

describe('half-world Map Node research', () => {
  it.each([[0, 1, 5], [8, 1, 5], [9, 2, 6], [10, 2, 6], [11, 2, 7], [16, 2, 9], [17, 2, 10], [18, 2, 10], [19, 3, 11], [28, 3, 15], [29, 4, 16], [38, 4, 20], [39, 5, 21], [48, 5, 25], [49, 6, 26], [58, 6, 30], [59, 6, 31], [63, 6, 31], [64, 6, 32], [113, 6, 41], [114, 6, 42], [118, 6, 42]])('prices %i prior completions at tier %i and %i each', (completed, tier, amount) => {
    expect(getResearchCosts(project, completed)).toEqual(Object.fromEntries(cores.slice(0, tier).map(core => [core, amount])));
  });

  it('matches the adopted half-world and full-world budgets including Exploration', () => {
    for (const [count, expected] of [[59, 4147], [119, 17287]]) {
      let total = 2;
      for (let i = 0; i < count; i++) total += Object.values(getResearchCosts(project, i)).reduce((sum, q) => sum + (q ?? 0), 0);
      expect(total).toBe(expected);
    }
    expect(getResearchCosts(project, -1)).toEqual(getResearchCosts(project, 0));
    expect(getResearchCosts(project, 200)).toEqual(getResearchCosts(project, 118));
  });

  it.each(access)('never requires cores above unlocked access %s', unlocked => {
    const tier = access.indexOf(unlocked) + 1;
    const completed = access.slice(0, tier);
    expect(Object.keys(getResearchCosts(project, 118, completed))).toEqual(cores.slice(0, tier));
  });

  it('holds an active quote through core unlocks and save/load, then reprices the next purchase', () => {
    let engine = setup(39, access.slice(0, 4));
    engine.selectResearch('mapNode');
    const quote = getResearchCostsForState(project, engine.getState().research);
    engine.getState().research.completed.push('oreSeparation');
    engine.selectResearch('mapNode');
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(getResearchCostsForState(project, engine.getState().research)).toEqual(quote);
    expect(outstandingResearchCores(engine.getState().research)).toEqual(cores.slice(0, 4));
    engine.getState().research.contributed = Object.fromEntries(cores.slice(0, 4).map(core => [core, 20]));
    engine.getSector().nodes[0].input = Object.fromEntries(cores.slice(0, 4).map(core => [core, 1]));
    for (let cycleStep = 0; cycleStep < 5; cycleStep++) engine.tick(1000);
    expect(engine.getState().research.repeatableCompletions!.mapNode).toBe(40);
    expect(engine.getState().research.mapPoints).toBe(1);
    expect(engine.getState().research.mapNodeQuote).toBeUndefined();
    engine.selectResearch('mapNode');
    expect(getResearchCostsForState(project, engine.getState().research)['shiny-core']).toBe(21);
  });

  it('reprices after changing projects without losing delivered progress', () => {
    const engine = setup(39, access.slice(0, 4));
    engine.selectResearch('mapNode');
    engine.getState().research.contributed = { 'simple-core': 3 };
    engine.getState().research.completed.push('oreSeparation');
    engine.selectResearch('extractor1');
    engine.selectResearch('mapNode');
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 3 });
    expect(getResearchCostsForState(project, engine.getState().research)['shiny-core']).toBe(21);
  });

  it('honors a saved pre-ramp quote and uses the ramp for the following purchase', () => {
    const state = setup(9).getState();
    state.research.selected = 'mapNode';
    state.research.mapNodeQuote = { completion: 9, costs: { 'simple-core': 10, 'basic-core': 10 } };
    state.research.contributed = { 'simple-core': 9, 'basic-core': 9 };
    state.sectors['5,5'].nodes[0].input = { 'simple-core': 1, 'basic-core': 1 };
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!);
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual({ 'simple-core': 10, 'basic-core': 10 });
    for (let cycleStep = 0; cycleStep < 5; cycleStep++) loaded.tick(1000);
    expect(loaded.getState().research.repeatableCompletions?.mapNode).toBe(10);
    loaded.selectResearch('mapNode');
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual({ 'simple-core': 6, 'basic-core': 6 });
  });

  it('preserves old saves and derives a quote for an already selected purchase', () => {
    const engine = setup(65, access.slice(0, 3));
    const state = engine.getState();
    state.research.selected = 'mapNode';
    state.research.mapPoints = 7;
    state.research.contributed = { 'simple-core': 12, 'basic-core': 9 };
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!);
    expect(loaded.getState().research).toMatchObject({ mapPoints: 7, repeatableCompletions: { mapNode: 65 }, contributed: { 'simple-core': 12, 'basic-core': 9 } });
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual({ 'simple-core': 32, 'basic-core': 32, 'automata-core': 32 });
  });

  it('can fund and unlock the entire world and refuses excess map research', () => {
    const engine = setup();
    engine.getState().research.mapPoints = 1; // Exploration's point.
    for (let i = 0; i < 119; i++) {
      engine.selectResearch('mapNode');
      const costs = getResearchCostsForState(project, engine.getState().research);
      engine.getState().research.contributed = Object.fromEntries(Object.entries(costs).map(([core, n]) => [core, n! - 1]));
      engine.getSector().nodes[0].input = Object.fromEntries(Object.keys(costs).map(core => [core, 1]));
      for (let cycleStep = 0; cycleStep < 5; cycleStep++) engine.tick(1000);
    }
    expect(engine.getState().research.mapPoints).toBe(120);
    expect(remainingMapNodePurchases(engine.getState())).toBe(0);
    engine.selectResearch('mapNode');
    expect(engine.getState().research.selected).toBeUndefined();
    // Visit every coordinate along connected rows, preserving adjacency.
    let remaining = true;
    while (remaining) {
      remaining = false;
      for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
        if (engine.getState().sectors[`${x},${y}`]?.unlocked) continue;
        if (engine.unlockSector(x, y)) remaining = true;
      }
    }
    expect(Object.values(engine.getState().sectors).filter(s => s.unlocked)).toHaveLength(121);
    expect(engine.getState().research.mapPoints).toBe(0);
    engine.selectResearch('mapNode');
    expect(engine.getState().research.selected).toBeUndefined();
  });
});
