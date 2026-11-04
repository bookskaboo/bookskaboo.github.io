import { describe, expect, it } from 'vitest';
import type { MachineNode } from '../domain/types';
import { createInitialState, GameEngine } from '../simulation/engine';
import { normalizeLegacy } from '../persistence/saves';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import { researchConsumptionGlow } from './researchConsumptionGlow';

function setup() {
  const state = createInitialState(301);
  state.research.completed = ['exploration', 'extractor1'];
  state.sectors['5,5'].nodes = [{ id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: RESEARCH_CENTER_BASE_CYCLE_MS, constructedAt: 0, constructionMs: 0 }];
  const engine = new GameEngine(state, { autosave: false });
  engine.selectResearch('extractor2');
  return { engine, center: engine.getSector().nodes[0] };
}
function advance(engine: GameEngine, duration: number) {
  for (let remaining = duration; remaining > 0;) { const step = Math.min(100, remaining); engine.tick(step); remaining -= step; }
}

describe('successful research check glow', () => {
  it('starts only when a complete set is consumed, then repeats beyond the ordinary completion flash', () => {
    const { engine, center } = setup();
    center.input = { 'simple-core': 5 }; // Arrival alone is not a successful check.
    advance(engine, 5000);
    expect(center.researchConsumption).toBeUndefined();
    expect(researchConsumptionGlow(center, engine.getState().playTimeMs)).toBe(0);
    center.input['basic-core'] = 1;
    advance(engine, 4999);
    expect(center.researchConsumption).toBeUndefined();
    advance(engine, 1);
    expect(center.researchConsumption).toEqual({ atMs: 10000, cycleMs: 5000 });
    expect(researchConsumptionGlow(center, 10120)).toBeGreaterThan(0);
    expect(researchConsumptionGlow(center, 10600)).toBeGreaterThan(0);
    expect(researchConsumptionGlow(center, 14900)).toBeGreaterThan(0);
    advance(engine, 5000); // No Basic Core: the next success does not happen.
    expect(center.researchConsumption?.atMs).toBe(10000);
    expect(researchConsumptionGlow(center, 15000)).toBe(0);
  });

  it('renews the full glow window after consecutive successful checks, including the final payment', () => {
    const { engine, center } = setup();
    const costs = getResearchCostsForState(getResearchProject('extractor2')!, engine.getState().research);
    engine.getState().research.contributed = Object.fromEntries(Object.entries(costs).map(([item, cost]) => [item, Math.max(0, (cost ?? 0) - 2)]));
    center.input = { 'simple-core': 5, 'basic-core': 5 };
    advance(engine, 5000);
    expect(center.researchConsumption?.atMs).toBe(5000);
    advance(engine, 5000);
    expect(center.researchConsumption).toEqual({ atMs: 10000, cycleMs: 5000 });
    expect(engine.getState().research.completed).toContain('extractor2');
    expect(engine.getState().research.selected).toBeUndefined();
    expect(researchConsumptionGlow(center, 10600)).toBeGreaterThan(0);
    expect(researchConsumptionGlow(center, 15000)).toBe(0);
  });

  it('uses the upgraded research interval rather than an unrelated visual timeout', () => {
    const { engine, center } = setup();
    engine.getState().research.completed.push('researchCenter1');
    center.input = { 'simple-core': 5, 'basic-core': 5 };
    advance(engine, 4500);
    expect(center.researchConsumption).toEqual({ atMs: 4500, cycleMs: 4500 });
    expect(researchConsumptionGlow(center, 8990)).toBeGreaterThan(0);
    expect(researchConsumptionGlow(center, 9000)).toBe(0);
  });

  it('clears prior-project feedback on an explicit cancellation or project switch', () => {
    for (const next of [undefined, 'exploration']) {
      const { engine, center } = setup();
      center.input = { 'simple-core': 1, 'basic-core': 1 };
      advance(engine, 5000);
      expect(center.researchConsumption).toBeDefined();
      if (next) engine.getState().research.completed = engine.getState().research.completed.filter(id => id !== next);
      engine.selectResearch(next);
      expect(center.researchConsumption).toBeUndefined();
    }
  });

  it('keeps timing tied to simulation across pauses and save/load', () => {
    const { engine, center } = setup();
    center.input = { 'simple-core': 1, 'basic-core': 1 };
    advance(engine, 5100);
    engine.getState().paused = true;
    const alpha = researchConsumptionGlow(center, engine.getState().playTimeMs);
    engine.tick(1000);
    expect(researchConsumptionGlow(center, engine.getState().playTimeMs)).toBe(alpha);
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(researchConsumptionGlow(loaded.getSector().nodes[0], loaded.getState().playTimeMs)).toBe(alpha);
  });

  it('provides steady reduced-motion feedback and hides feedback on disabled nodes', () => {
    const { center } = setup();
    center.researchConsumption = { atMs: 1000, cycleMs: 5000 };
    expect(researchConsumptionGlow(center, 1120, true)).toBe(.45);
    expect(researchConsumptionGlow(center, 4600, true)).toBe(.45);
    expect(researchConsumptionGlow(center, 6000, true)).toBe(0);
    center.disabled = true;
    expect(researchConsumptionGlow(center, 1120)).toBe(0);
    expect(researchConsumptionGlow({ ...center, disabled: false, processingPaused: true }, 1120)).toBe(0);
    expect(researchConsumptionGlow({ ...center, disabled: false, researchConsumption: undefined } as MachineNode, 1120)).toBe(0);
  });
});
