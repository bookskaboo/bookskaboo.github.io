import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { normalizeLegacy } from '../persistence/legacyMigration';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';
import type { MachineNode } from '../domain/types';

const advance = (engine: GameEngine, ms: number) => {
  while (ms > 0) { const step = Math.min(ms, 100); engine.tick(step); ms -= step; }
};
const lab = (kind: MachineNode['kind'] = 'researchCenter'): MachineNode => ({
  id: 'lab', kind, name: 'Research Center', x: 1000, y: 1000, rotation: 0, input: { 'simple-core': 2 }, output: {},
  cycleMs: 1000, progressMs: 0, constructedAt: 0, constructionMs: 0,
});

describe('five-second Research Center baseline', () => {
  it.each(['researchCenter', 'research-center'] as const)('starts newly placed %s at five seconds', kind => {
    const state = createInitialState(401);
    state.sectors['5,5'].nodes = [];
    state.research.unlocked.push('researchCenter');
    const engine = new GameEngine(state, { autosave: false });
    const id = engine.placeNode(kind, 1000, 1000)!;
    expect(id).toBeTruthy();
    expect(engine.getSector().nodes[0].cycleMs).toBe(RESEARCH_CENTER_BASE_CYCLE_MS);
  });

  it.each(Array.from({ length: 7 }, (_, rank) => rank))('credits only at the end of each rank-%i cycle', rank => {
    const state = createInitialState(402);
    state.sectors['5,5'].nodes = [{ ...lab(), input: { 'simple-core': 2, 'basic-core': 2 } }];
    state.sectors['5,5'].connections = [];
    state.research.completed = ['exploration', 'extractor1', ...Array.from({ length: rank }, (_, i) => `researchCenter${i + 1}`)];
    const engine = new GameEngine(state, { autosave: false });
    engine.selectResearch('extractor2');
    const center = engine.getSector().nodes[0];
    const duration = 5000 - rank * 500;
    expect(center.cycleMs).toBe(5000);
    expect(center.input).toEqual({ 'simple-core': 2, 'basic-core': 2 });
    expect(engine.getState().research.contributed).toEqual({});
    advance(engine, duration - 1);
    expect(center.input['simple-core']).toBe(2);
    advance(engine, 1);
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    advance(engine, duration - 1);
    expect(center.input['simple-core']).toBe(1);
    advance(engine, 1);
    expect(center.input).toEqual({ 'simple-core': 0, 'basic-core': 0 });
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 2, 'basic-core': 2 });
  });

  it('normalizes saved labs, aliases and templates while retaining stock, progress and upgrades', () => {
    const state = createInitialState(403);
    const old = { ...lab('research-center'), progressMs: 350 };
    state.sectors['5,5'].nodes = [old];
    state.factoryTemplates = [{ name: 'Old lab', nodes: [lab()], connections: [] }];
    state.research.completed.push('researchCenter3');
    const loaded = normalizeLegacy(state)!;
    expect(loaded.sectors['5,5'].nodes[0]).toMatchObject({ cycleMs: 5000, progressMs: 350, input: { 'simple-core': 2 } });
    expect(loaded.factoryTemplates![0].nodes[0].cycleMs).toBe(5000);
    expect(loaded.research.completed).toContain('researchCenter3');
    expect(state.sectors['5,5'].nodes[0].cycleMs).toBe(1000);
    const engine = new GameEngine(state, { autosave: false });
    expect(engine.getSector().nodes[0].cycleMs).toBe(5000);
    engine.replaceState(state);
    expect(engine.getSector().nodes[0].cycleMs).toBe(5000);
  });
});
