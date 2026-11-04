import { describe, expect, it } from 'vitest';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import type { MachineNode } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { researchConsumptionGlow } from '../renderer/researchConsumptionGlow';
import { createInitialState, GameEngine } from './engine';

function setup(input: MachineNode['input'] = { 'simple-core': 5, 'basic-core': 5 }) {
  const state = createInitialState(308);
  state.research.completed = ['refiner', 'assembler', 'exploration', 'extractor1'];
  state.sectors['5,5'].nodes = [{ id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0, input, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0 }];
  state.sectors['5,5'].connections = [];
  const engine = new GameEngine(state, { autosave: false });
  return { engine, center: engine.getSector().nodes[0], state: engine.getState() };
}
function advance(engine: GameEngine, ms: number) {
  while (ms > 0) { const step = Math.min(ms, 100); engine.tick(step); ms -= step; }
}

describe('research selection Core check', () => {
  it('immediately consumes one complete set, credits progress and starts its glow without advancing time', () => {
    const { engine, center, state } = setup();
    engine.selectResearch('extractor2');
    expect(state.playTimeMs).toBe(0);
    expect(center.input).toEqual({ 'simple-core': 4, 'basic-core': 4 });
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    expect(center.researchConsumption).toEqual({ atMs: 0, cycleMs: 5000 });
    expect(researchConsumptionGlow(center, 120)).toBeGreaterThan(0);
    advance(engine, 4999);
    expect(state.research.contributed['simple-core']).toBe(1);
    advance(engine, 1);
    expect(state.research.contributed).toEqual({ 'simple-core': 2, 'basic-core': 2 });
  });

  it('checks missing Cores atomically and retains the normal supplied-cycle behavior afterward', () => {
    const { engine, center, state } = setup({ 'simple-core': 5 });
    engine.selectResearch('extractor2');
    expect(center.input['simple-core']).toBe(5);
    expect(state.research.contributed).toEqual({});
    expect(center.researchConsumption).toBeUndefined();
    advance(engine, 5000);
    center.input['basic-core'] = 1;
    advance(engine, 4999);
    expect(state.research.contributed).toEqual({});
    advance(engine, 1);
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
  });

  it.each(['disabled', 'processingPaused', 'construction', 'locked-sector'] as const)('does not charge an ineligible %s center', condition => {
    const { engine, center, state } = setup();
    if (condition === 'construction') { center.constructedAt = Date.now(); center.constructionMs = 60000; }
    else if (condition === 'locked-sector') state.sectors['5,5'].unlocked = false;
    else center[condition] = true;
    engine.selectResearch('extractor2');
    expect(state.research.selected).toBe('extractor2');
    expect(state.research.contributed).toEqual({});
    expect(center.input['simple-core']).toBe(5);
    expect(center.researchConsumption).toBeUndefined();
  });

  it('preserves the next payment deadline through same-project clicks, cancellation, switching and save/load', () => {
    let { engine, center, state } = setup();
    engine.selectResearch('extractor2');
    advance(engine, 1500);
    engine.selectResearch('extractor2');
    expect(center.progressMs).toBe(1500);
    expect(center.input['simple-core']).toBe(4);
    engine.selectResearch();
    engine.selectResearch('road');
    expect(center.input['simple-core']).toBe(4);
    expect(state.research.contributed).toEqual({});
    expect(center.progressMs).toBe(1500);
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    center = engine.getSector().nodes[0]; state = engine.getState();
    engine.selectResearch('extractor2');
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    advance(engine, 3499);
    expect(center.input['simple-core']).toBe(4);
    advance(engine, 1);
    expect(state.research.contributed).toEqual({ 'simple-core': 2, 'basic-core': 2 });
  });

  it('can finish a resumed project immediately while consuming only still-required types', () => {
    const { engine, center, state } = setup();
    const costs = getResearchCostsForState(getResearchProject('extractor2')!, state.research);
    state.research.projectContributions = { extractor2: { ...costs, 'basic-core': costs['basic-core']! - 1 } };
    engine.selectResearch('extractor2');
    expect(state.research.completed).toContain('extractor2');
    expect(state.research.selected).toBeUndefined();
    expect(center.input).toEqual({ 'simple-core': 5, 'basic-core': 4 });
    expect(center.researchConsumption).toEqual({ atMs: 0, cycleMs: 5000 });
  });

  it('leaves payment timing and feedback intact when an unavailable project is requested', () => {
    const { engine, center, state } = setup();
    engine.selectResearch('extractor2');
    advance(engine, 1500);
    engine.selectResearch('connectorMirroring');
    expect(state.research.selected).toBe('extractor2');
    expect(center.progressMs).toBe(1500);
    expect(center.input['simple-core']).toBe(4);
    expect(center.researchConsumption).toEqual({ atMs: 0, cycleMs: 5000 });
  });
});
