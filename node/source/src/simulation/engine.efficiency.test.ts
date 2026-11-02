import { describe, expect, it } from 'vitest';
import { getEfficiencyMultiplier } from '../content/efficiency';
import { getResearchCosts, isResearchAvailable, RESEARCH_PROJECTS } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { MachineNode, NodeKind } from '../domain/types';
import { createInitialState, GameEngine } from './engine';
import { normalizeLegacy } from '../persistence/saves';

const families = ['extractor', 'kiln', 'smelter', 'refiner', 'assembler', 'researchCenter', 'hydroProcessor', 'advancedAssembler', 'separationFurnace'] as const;
const cores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const project = (id: string) => RESEARCH_PROJECTS.find(p => p.id === id)!;
const machine = (kind: NodeKind, recipeId?: string): MachineNode => ({
  id: 'machine', name: kind, kind, recipeId, x: 1000, y: 1000, rotation: 0,
  input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
});
const advance = (engine: GameEngine, milliseconds: number) => {
  for (let remaining = milliseconds; remaining > 0; remaining -= 100) engine.tick(Math.min(100, remaining));
};

describe('linear machine efficiency progression', () => {
  it('requires earlier ranks and core access without putting upgrades on core unlock paths', () => {
    for (const family of families) for (let rank = 1; rank <= 6; rank++) {
      const p = project(`${family}${rank}`);
      expect(RESEARCH_PROJECTS.filter(candidate => candidate.id === p.id)).toHaveLength(1);
      expect(getResearchCosts(p)).toEqual(Object.fromEntries(cores.slice(0, rank).map(core => [core, rank * 10])));
      const access = [undefined, undefined, 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'][rank - 1];
      const machineAccess: Record<string, string> = { hydroProcessor: 'lakeTools', advancedAssembler: 'fabricatorTools', separationFurnace: 'mithrilTools' };
      const completed = [rank > 1 ? `${family}${rank - 1}` : machineAccess[family] ?? family, access].filter((id): id is string => Boolean(id));
      expect(isResearchAvailable(p, completed)).toBe(true);
      if (rank > 1) expect(isResearchAvailable(p, completed.filter(id => id !== `${family}${rank - 1}`))).toBe(false);
      if (access) expect(isResearchAvailable(p, completed.filter(id => id !== access))).toBe(false);
    }
    for (const id of ['automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl', 'endgameTheory']) {
      const p = project(id);
      expect([p.prerequisite, ...(p.prerequisites ?? [])].filter(Boolean).some(id => /^(extractor|kiln|smelter|refiner|assembler|researchCenter)[1-6]$/.test(id!))).toBe(false);
    }
  });

  it.each(families)('uses the highest %s rank without compounding earlier ranks', family => {
    for (let rank = 1; rank <= 6; rank++) {
      expect(getEfficiencyMultiplier(family, Array.from({ length: rank }, (_, i) => `${family}${i + 1}`))).toBe((10 - rank) / 10);
    }
    expect(getEfficiencyMultiplier(family, [`${family}2`, `${family}6`])).toBe(.4);
  });

  it.each([
    ['kiln', 'charcoal'], ['smelter', 'smelt-copper'], ['refiner', 'copper-gear'], ['assembler', 'basic-core'],
    ['hydroProcessor', 'coolant'], ['advancedAssembler', 'hydro-core'], ['separationFurnace', 'refined-mithril'],
  ] as const)('finishes %s recipes at 40 percent of base with original inputs and yields', (kind, recipeId) => {
    const recipe = RECIPES[recipeId];
    const state = createInitialState(301);
    const node = machine(kind, recipeId);
    node.input = { ...recipe.inputs };
    state.sectors['5,5'].nodes = [node];
    state.research.completed.push(`${kind}1`, `${kind}2`, `${kind}6`);
    if (recipe.unlockResearch) state.research.completed.push(recipe.unlockResearch);
    const engine = new GameEngine(state);
    const live = engine.getSector().nodes[0];
    advance(engine, recipe.cycleMs * .4 - 1);
    expect(live.output).toEqual({});
    engine.tick(1);
    expect(live.output).toEqual(recipe.outputs);
    expect(Object.values(live.input).every(q => q === 0)).toBe(true);
  });

  it('preserves saved ranks and completes a six-core project in synchronized 400ms cycles', () => {
    const state = createInitialState(301);
    state.research.completed.push('researchCenter1', 'researchCenter2', 'researchCenter6', 'extractor5', 'precisionControl');
    state.sectors['5,5'].nodes = [machine('researchCenter')];
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    const engine = new GameEngine(loaded);
    engine.selectResearch('extractor6');
    engine.getState().research.contributed = Object.fromEntries(cores.map(core => [core, 59]));
    const lab = engine.getSector().nodes[0];
    lab.input = Object.fromEntries(cores.map(core => [core, 1]));
    engine.tick(399);
    expect(engine.getState().research.completed).not.toContain('extractor6');
    engine.tick(1);
    expect(engine.getState().research.completed).toContain('extractor6');
    expect(Object.values(lab.input)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('applies recovery research after the Separation Furnace cycle upgrade', () => {
    const recipe = RECIPES.recoverediron;
    const state = createInitialState(301);
    const furnace = machine('separationFurnace', recipe.id);
    furnace.input = { ...recipe.inputs };
    state.sectors['5,5'].nodes = [furnace];
    state.research.completed.push('separationFurnace6', 'mineralRecovery', 'mineralRecovery1');
    const engine = new GameEngine(state);
    advance(engine, recipe.cycleMs * .4 * .9 - 1);
    expect(engine.getSector().nodes[0].output).toEqual({});
    engine.tick(1);
    expect(engine.getSector().nodes[0].output).toEqual(recipe.outputs);
  });

  it('extracts every two seconds at rank six while retaining the five-second base', () => {
    const engine = new GameEngine(createInitialState(23));
    engine.getState().research.completed.push('extractor1', 'extractor2', 'extractor6');
    const extractor = engine.getSector().nodes.find(n => n.kind === 'extractor')!;
    const forest = engine.getSector().nodes.find(n => n.kind === 'forest')!;
    expect(engine.connect(forest.id, extractor.id)).toBe(true);
    advance(engine, 1999);
    expect(extractor.output.wood ?? 0).toBe(0);
    engine.tick(1);
    expect(extractor.output.wood).toBe(1);
    expect(extractor.cycleMs).toBe(5000);
  });
});
