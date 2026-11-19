import { describe, expect, it } from 'vitest';
import { getResearchCosts, getResearchCostsForState, remainingMapNodePurchases, RESEARCH_PROJECTS } from '../content/research';
import type { MachineNode } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { outstandingResearchCores } from './researchStatus';
import { destinationMapCosts } from './mapExpansion';

const project = RESEARCH_PROJECTS.find(p => p.id === 'mapNode')!;
const cores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const access = ['simpleCore', 'basicCore', 'automataCore', 'hydroCore', 'shinyCore', 'complexCore'];
function setup(completions = 0, unlocked = access, legacyPricing = true) {
  const state = createInitialState(301);
  if (legacyPricing) state.isTraining = true;
  state.research.completed = ['exploration', ...unlocked];
  state.research.repeatableCompletions = { mapNode: completions };
  const lab: MachineNode = { id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0, input: {}, output: {}, cycleMs: 1000, progressMs: 0, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [lab];
  state.sectors['5,5'].connections = [];
  return new GameEngine(state, { autosave: false });
}

describe('legacy Map Point research', () => {
  it.each([
    [0, 1, 5], [8, 1, 5], [9, 2, 5], [10, 2, 6], [11, 2, 6], [16, 2, 9], [17, 2, 9], [18, 2, 10],
    [19, 3, 5], [28, 3, 15], [29, 4, 5], [38, 4, 20], [39, 5, 5], [44, 5, 16], [48, 5, 25],
    [49, 6, 5], [50, 6, 8], [54, 6, 19], [58, 6, 30], [59, 6, 31], [63, 6, 31], [64, 6, 32],
    [113, 6, 41], [114, 6, 42], [118, 6, 42],
  ])('prices %i prior completions at tier %i and %i each', (completed, tier, amount) => {
    expect(getResearchCosts(project, completed)).toEqual(Object.fromEntries(cores.slice(0, tier).map(core => [core, amount])));
  });

  it('matches the adopted half-world and full-world budgets including Exploration', () => {
    const exploration = RESEARCH_PROJECTS.find(p => p.id === 'exploration')!;
    for (const [count, expected] of [[59, 2805], [119, 15945]]) {
      let total = Object.values(getResearchCosts(exploration)).reduce<number>((sum, q) => sum + (q ?? 0), 0);
      for (let i = 0; i < count; i++) total += Object.values(getResearchCosts(project, i)).reduce<number>((sum, q) => sum + (q ?? 0), 0);
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
    expect(quote).toEqual({ 'simple-core': 21, 'basic-core': 21, 'automata-core': 21, 'hydro-core': 21 });
    engine.getState().research.completed.push('shinyCore');
    engine.selectResearch('mapNode');
    delete engine.getState().research.mapNodePricingPhase;
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
    expect(getResearchCostsForState(project, engine.getState().research)['shiny-core']).toBe(5);
  });

  it('reprices after changing projects without losing delivered progress', () => {
    const engine = setup(39, access.slice(0, 4));
    engine.selectResearch('mapNode');
    engine.getState().research.contributed = { 'simple-core': 3 };
    engine.getState().research.completed.push('shinyCore');
    engine.selectResearch('extractor1');
    engine.selectResearch('mapNode');
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 3 });
    expect(getResearchCostsForState(project, engine.getState().research)['shiny-core']).toBe(5);
  });

  it('honors a saved quote at the former Shiny price and uses the new price for the following purchase', () => {
    const state = setup(39).getState();
    delete state.research.mapNodePricingPhase;
    const shinyCores = cores.slice(0, 5);
    const oldCosts = Object.fromEntries(shinyCores.map(core => [core, 16]));
    state.research.selected = 'mapNode';
    state.research.mapNodeQuote = { completion: 39, costs: oldCosts };
    state.research.contributed = Object.fromEntries(shinyCores.map(core => [core, 15]));
    state.sectors['5,5'].nodes[0].input = Object.fromEntries(shinyCores.map(core => [core, 1]));
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!);
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual(oldCosts);
    for (let cycleStep = 0; cycleStep < 5; cycleStep++) loaded.tick(1000);
    expect(loaded.getState().research.repeatableCompletions?.mapNode).toBe(40);
    loaded.selectResearch('mapNode');
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual(Object.fromEntries(shinyCores.map(core => [core, 7])));
  });

  it('preserves old saves and derives a quote for an already selected purchase', () => {
    const engine = setup(65, access.slice(0, 3));
    const state = engine.getState();
    delete state.research.mapNodePricingPhase;
    state.research.selected = 'mapNode';
    state.research.mapPoints = 7;
    state.research.contributed = { 'simple-core': 12, 'basic-core': 9 };
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!);
    expect(loaded.getState().research).toMatchObject({ mapPoints: 7, repeatableCompletions: { mapNode: 65 }, contributed: { 'simple-core': 12, 'basic-core': 9 } });
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual({ 'simple-core': 23, 'basic-core': 23, 'automata-core': 23 });
  });

  it('starts a late Complex phase at five each and remembers its starting purchase across saves', () => {
    const engine = setup(59, access.slice(0, 5));
    const state = engine.getState();
    expect(getResearchCostsForState(project, state.research)).toEqual(Object.fromEntries(cores.slice(0, 5).map(core => [core, 28])));
    state.research.completed.push('complexCore');
    const resetBill = Object.fromEntries(cores.map(core => [core, 5]));
    expect(getResearchCostsForState(project, state.research)).toEqual(resetBill);
    engine.selectResearch('mapNode');
    state.research.contributed = Object.fromEntries(cores.map(core => [core, 4]));
    engine.getSector().nodes[0].input = Object.fromEntries(cores.map(core => [core, 1]));
    for (let cycleStep = 0; cycleStep < 5; cycleStep++) engine.tick(1000);
    expect(state.research.repeatableCompletions?.mapNode).toBe(60);

    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    loaded.selectResearch('mapNode');
    expect(getResearchCostsForState(project, loaded.getState().research)).toEqual(Object.fromEntries(cores.map(core => [core, 8])));
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

describe('destination map pricing', () => {
  it('starts each band at five of each Core and counts only opened maps in that band', () => {
    const engine = setup(0, access, false);
    const game = engine.getState();
    expect(engine.startMapResearch(6, 5)).toBe(true);
    expect(game.research.mapNodeQuote?.costs).toEqual({ 'simple-core': 5 });
    game.research.mapPoints = 6;
    for (let x = 6; x <= 10; x++) expect(engine.unlockSector(x, 5)).toBe(true);
    expect(engine.unlockSector(10, 4)).toBe(true);
    expect(destinationMapCosts(game, 4, 5)).toEqual({ 'simple-core': 15 });
    const tierSeven = Object.fromEntries(cores.slice(0, 4).map(core => [core, 5]));
    expect(destinationMapCosts(game, 10, 3)).toEqual(tierSeven);
    for (const [x, y] of [[10, 3], [9, 2]]) {
      if (x === 9) {
        game.research.mapPoints++;
        expect(engine.unlockSector(9, 3)).toBe(true);
      }
      game.research.mapPoints++;
      expect(engine.unlockSector(x, y)).toBe(true);
    }
    expect(destinationMapCosts(game, 8, 1)).toBeUndefined();
    game.research.mapPoints++;
    expect(engine.unlockSector(9, 1)).toBe(true);
    expect(destinationMapCosts(game, 8, 1)).toEqual(Object.fromEntries(cores.slice(0, 4).map(core => [core, 10])));
    game.research.mapPoints += 2;
    expect(engine.unlockSector(10, 1)).toBe(true);
    expect(engine.unlockSector(10, 2)).toBe(true);
    expect(destinationMapCosts(game, 10, 0)).toMatchObject({ 'simple-core': 5, 'command-core': 6 });
  });

  it('keeps a partially paid destination through switching and reload and opens only that map', () => {
    let engine = setup(0, access, false);
    const state = engine.getState();
    state.research.mapPoints = 1;
    expect(engine.startMapResearch(4, 5)).toBe(false);
    expect(engine.unlockSector(4, 5)).toBe(true);
    expect(engine.startMapResearch(3, 3)).toBe(false);
    engine.selectResearch('mapNode');
    expect(state.research.selected).toBeUndefined();
    expect(engine.startMapResearch(5, 4)).toBe(true);
    engine.getSector().nodes[0].input = { 'simple-core': 1 };
    for (let i = 0; i < 5; i++) engine.tick(1000);
    expect(state.research.contributed).toEqual({ 'simple-core': 1 });
    expect(engine.startMapResearch(6, 5)).toBe(false);
    engine.selectResearch('extractor1');
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    expect(engine.startMapResearch(5, 4)).toBe(true);
    expect(engine.getState().research).toMatchObject({ contributed: { 'simple-core': 1 },
      mapNodeQuote: { destination: '5,4', costs: { 'simple-core': 10 } } });
    for (let core = 0; core < 9; core++) {
      engine.getSector().nodes[0].input = { 'simple-core': 1 };
      for (let i = 0; i < 5; i++) engine.tick(1000);
    }
    expect(engine.getState().sectors['5,4'].unlocked).toBe(true);
    expect(engine.getState().sectors['6,5']?.unlocked).toBeUndefined();
    expect(engine.getState().research).toMatchObject({ mapPoints: 0, repeatableCompletions: { mapNode: 1 } });
    expect(engine.getState().research.mapNodeQuote).toBeUndefined();
    expect(destinationMapCosts(engine.getState(), 6, 5)).toEqual({ 'simple-core': 15 });
  });

  it('charges the approved 12,539 Cores to open the standard board', () => {
    const engine = setup(0, access, false);
    const game = engine.getState();
    const cells = Array.from({ length: 121 }, (_, index) => [index % 11, Math.floor(index / 11)] as const)
      .filter(([x, y]) => x !== 5 || y !== 5)
      .sort(([ax, ay], [bx, by]) => (Math.abs(ax - 5) + Math.abs(ay - 5)) - (Math.abs(bx - 5) + Math.abs(by - 5)));
    const free = cells.shift()!;
    game.research.mapPoints = 1;
    expect(engine.unlockSector(...free)).toBe(true);
    let total = 0;
    for (const [x, y] of cells) {
      expect(engine.startMapResearch(x, y)).toBe(true);
      const costs = game.research.mapNodeQuote!.costs;
      for (const amount of Object.values(costs)) total += amount ?? 0;
      game.research.contributed = { ...costs };
      engine.tick(100);
      expect(game.sectors[`${x},${y}`].unlocked).toBe(true);
    }
    expect(total).toBe(12539);
    expect(remainingMapNodePurchases(game)).toBe(0);
    expect(game.research.mapPoints).toBe(0);
  });
});
