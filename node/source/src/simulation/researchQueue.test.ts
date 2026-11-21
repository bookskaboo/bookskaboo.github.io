import { describe, expect, it } from 'vitest';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import { normalizeLegacy } from '../persistence/saves';
import { researchProgress } from '../ui/researchProgress';
import { createInitialState, GameEngine } from './engine';
import { isResearchCycleActive } from './researchStatus';

function setup() {
  const state = createInitialState(308);
  state.research.completed = ['kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'exploration', 'basicCore'];
  state.sectors['5,5'].nodes = [{ id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000,
    rotation: 0, input: { 'simple-core': 5, 'basic-core': 5 }, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0 }];
  state.sectors['5,5'].connections = [];
  const engine = new GameEngine(state, { autosave: false });
  return { engine, center: engine.getSector().nodes[0], state: engine.getState() };
}
function advance(engine: GameEngine, ms: number) {
  while (ms > 0) { const step = Math.min(ms, 100); engine.tick(step); ms -= step; }
}
function onePaymentLeft(engine: GameEngine, id: string) {
  const research = engine.getState().research;
  const remaining = Object.fromEntries(Object.entries(getResearchCostsForState(getResearchProject(id)!, research)).map(([item, cost]) => [item, cost! - 1]));
  if (research.selected === id) research.contributed = remaining;
  else (research.projectContributions ??= {})[id] = remaining;
}

describe('research queue and pause', () => {
  it('starts the first project immediately and holds four distinct projects including active', () => {
    const { engine, state } = setup();
    for (const id of ['extractor2', 'kiln2', 'smelter2', 'researchCenter1']) expect(engine.queueResearch(id)).toBe('added');
    expect(state.research.selected).toBe('extractor2');
    expect(engine.queueResearch('extractor2')).toBe('duplicate');
    expect(engine.queueResearch('road')).toBe('full');
    expect(state.research.queue).toEqual(['extractor2', 'kiln2', 'smelter2', 'researchCenter1']);
    expect(state.research.contributed).toEqual({});
  });

  it('waits for the full Core set, then pays and advances in order without sharing a cycle', () => {
    const { engine, state, center } = setup();
    engine.queueResearch('extractor2'); engine.queueResearch('kiln2');
    onePaymentLeft(engine, 'extractor2');
    center.input['basic-core'] = 0;
    advance(engine, 6000);
    expect(state.research.selected).toBe('extractor2');
    expect(center.input['simple-core']).toBe(5);
    center.input['basic-core'] = 5;
    advance(engine, 5000);
    expect(state.research.completed).toContain('extractor2');
    expect(state.research.queue).toEqual(['kiln2']);
    expect(state.research.selected).toBe('kiln2');
    expect(state.research.contributed).toEqual({});
    expect(center.progressMs).toBe(0);
    advance(engine, 4999);
    expect(state.research.contributed).toEqual({});
    advance(engine, 1);
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
  });

  it('pauses payments and cycle time while the factory clock continues, then resumes', () => {
    const { engine, state, center } = setup();
    engine.queueResearch('extractor2'); engine.queueResearch('kiln2');
    advance(engine, 6500);
    engine.setResearchPaused(true);
    const stock = { ...center.input };
    advance(engine, 10000);
    expect(state.playTimeMs).toBe(16500);
    expect(center.progressMs).toBe(1500);
    expect(center.input).toEqual(stock);
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    expect(isResearchCycleActive(center, state.research)).toBe(false);
    expect(researchProgress(getResearchProject('extractor2')!, state).status).toBe('Research paused.');
    engine.setResearchPaused(false);
    advance(engine, 3500);
    expect(state.research.contributed).toEqual({ 'simple-core': 2, 'basic-core': 2 });
    expect(state.research.queue).toEqual(['extractor2', 'kiln2']);
  });

  it('can build a queue while paused and starts its head only when resumed', () => {
    const { engine, state, center } = setup();
    engine.setResearchPaused(true); engine.queueResearch('extractor2');
    advance(engine, 10000);
    expect(state.research.selected).toBeUndefined();
    expect(center.input['simple-core']).toBe(5);
    engine.setResearchPaused(false);
    expect(state.research.selected).toBe('extractor2');
    advance(engine, 5000);
    expect(state.research.contributed['simple-core']).toBe(1);
  });

  it('removes queued cards and preserves payments when removing and readding the active one', () => {
    const { engine, state } = setup();
    engine.queueResearch('extractor2'); engine.queueResearch('kiln2'); engine.queueResearch('smelter2');
    advance(engine, 5000);
    engine.removeQueuedResearch('kiln2');
    expect(state.research.selected).toBe('extractor2');
    engine.removeQueuedResearch('extractor2');
    expect(state.research.selected).toBe('smelter2');
    expect(state.research.projectContributions?.extractor2).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    engine.queueResearch('extractor2'); engine.removeQueuedResearch('smelter2');
    expect(state.research.selected).toBe('extractor2');
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
  });

  it('adopts an existing project without restarting its cycle or losing paid Cores', () => {
    const { engine, state, center } = setup();
    engine.selectResearch('extractor2'); advance(engine, 6500);
    expect(engine.queueResearch('extractor2')).toBe('added');
    expect(engine.queueResearch('kiln2')).toBe('added');
    expect(center.progressMs).toBe(1500);
    expect(state.research.contributed['simple-core']).toBe(1);
    expect(state.research.queue).toEqual(['extractor2', 'kiln2']);
  });

  it('lets manual selection take priority and makes manual cancellation pause the queue', () => {
    const { engine, state } = setup();
    engine.queueResearch('extractor2'); engine.queueResearch('kiln2');
    engine.selectResearch('road');
    onePaymentLeft(engine, 'road'); advance(engine, 5000);
    expect(state.research.selected).toBe('extractor2');
    engine.selectResearch(); advance(engine, 5000);
    expect(state.research.selected).toBeUndefined();
    expect(state.research.paused).toBe(true);
    engine.setResearchPaused(false);
    expect(state.research.selected).toBe('extractor2');
  });

  it('releases priority work back to the queue, retaining both projects payments and queue order', () => {
    const { engine, state } = setup();
    engine.queueResearch('extractor2'); engine.queueResearch('kiln2');
    advance(engine, 5000);
    engine.selectResearch('road'); advance(engine, 5000);
    engine.releasePriorityResearch('road');
    expect(state.research.queue).toEqual(['extractor2', 'kiln2']);
    expect(state.research.selected).toBe('extractor2');
    expect(state.research.paused).not.toBe(true);
    expect(state.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    expect(state.research.projectContributions?.road).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    advance(engine, 5000);
    expect(state.research.contributed['simple-core']).toBe(2);
    expect(state.research.projectContributions?.road?.['simple-core']).toBe(1);
  });

  it('can fill all four queue slots behind a priority task without adopting or interrupting it', () => {
    const { engine, state } = setup();
    engine.selectResearch('road');
    for (const id of ['extractor2', 'kiln2', 'smelter2', 'researchCenter1']) {
      expect(engine.queueResearch(id, { adoptSelected: false })).toBe('added');
    }
    expect(state.research.queue).toEqual(['extractor2', 'kiln2', 'smelter2', 'researchCenter1']);
    expect(state.research.selected).toBe('road');
    advance(engine, 5000);
    expect(state.research.contributed['simple-core']).toBe(1);
    expect(state.research.projectContributions?.extractor2).toBeUndefined();
    engine.releasePriorityResearch('road');
    expect(state.research.selected).toBe('extractor2');
  });

  it('preserves an explicit pause when priority work is disabled and resumes the queued head on play', () => {
    const { engine, state, center } = setup();
    engine.queueResearch('extractor2'); advance(engine, 5000);
    engine.selectResearch('road'); advance(engine, 5000);
    engine.setResearchPaused(true);
    engine.releasePriorityResearch('road');
    const stock = { ...center.input };
    expect(state.research.selected).toBeUndefined();
    expect(state.research.paused).toBe(true);
    advance(engine, 10000);
    expect(center.input).toEqual(stock);
    expect(state.research.queue).toEqual(['extractor2']);
    engine.setResearchPaused(false);
    expect(state.research.selected).toBe('extractor2');
    expect(state.research.contributed['simple-core']).toBe(1);
  });

  it.each([false, true])('returns from loaded priority work without requeueing it (legacy adoption: %s)', adopted => {
    let { engine } = setup();
    engine.selectResearch('road'); advance(engine, 5000);
    engine.queueResearch('extractor2', { adoptSelected: adopted });
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(engine.getState().research.selected).toBe('road');
    engine.releasePriorityResearch('road');
    expect(engine.getState().research.queue).toEqual(['extractor2']);
    expect(engine.getState().research.selected).toBe('extractor2');
    expect(engine.getState().research.paused).not.toBe(true);
    expect(engine.getState().research.projectContributions?.road?.['simple-core']).toBe(1);
  });

  it('ignores stale priority releases and can disable priority work with an empty queue', () => {
    const { engine, state } = setup();
    engine.selectResearch('road'); advance(engine, 5000);
    engine.releasePriorityResearch('extractor2');
    expect(state.research.selected).toBe('road');
    engine.releasePriorityResearch('road');
    expect(state.research.selected).toBeUndefined();
    expect(state.research.queue).toEqual([]);
    expect(state.research.paused).not.toBe(true);
    expect(state.research.projectContributions?.road?.['simple-core']).toBe(1);
  });

  it('retains the queue, pause flag, stock, paid amounts and partial cycle through save normalization', () => {
    let { engine } = setup();
    engine.queueResearch('extractor2'); engine.queueResearch('kiln2'); advance(engine, 6500);
    engine.setResearchPaused(true);
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(engine.getState().research).toMatchObject({ selected: 'extractor2', queue: ['extractor2', 'kiln2'], paused: true, contributed: { 'simple-core': 1, 'basic-core': 1 } });
    expect(engine.getSector().nodes[0]).toMatchObject({ progressMs: 1500, input: { 'simple-core': 4, 'basic-core': 4 } });
    advance(engine, 7000);
    expect(engine.getSector().nodes[0].progressMs).toBe(1500);
    engine.setResearchPaused(false); advance(engine, 3500);
    expect(engine.getState().research.contributed['simple-core']).toBe(2);
  });

  it('reconciles old or invalid queues and initializes the new queue default', () => {
    const { engine, state } = setup();
    expect(state.research.queue).toEqual([]); expect(state.research.paused).toBe(false);
    state.research.completed.push('road');
    state.research.queue = ['unknown', 'road', 'kiln', 'extractor2', 'extractor2', 'kiln2', 'smelter2', 'researchCenter1', 'assembler'];
    engine.replaceState(state);
    expect(engine.getState().research.queue).toEqual(['extractor2', 'kiln2', 'smelter2', 'researchCenter1']);
    expect(engine.getState().research.selected).toBe('extractor2');
  });

  it('rejects locked, completed and automatic projects while accepting destination-free map research', () => {
    const { engine, state } = setup();
    expect(engine.queueResearch('connectorMirroring')).toBe('unavailable');
    expect(engine.queueResearch('basicCore')).toBe('unavailable');
    expect(engine.queueResearch('kiln')).toBe('unavailable');
    expect(engine.queueResearch('mapNode')).toBe('added');
    expect(state.research.queue).toEqual(['mapNode']);
  });

  it('processes a repeatable once per queued card and drains the queue after the last completion', () => {
    const { engine, state } = setup();
    state.isTraining = true;
    expect(engine.queueResearch('mapNode')).toBe('added');
    engine.queueResearch('extractor2');
    onePaymentLeft(engine, 'mapNode'); advance(engine, 5000);
    expect(state.research.repeatableCompletions?.mapNode).toBe(1);
    expect(state.research.queue).toEqual(['extractor2']);
    onePaymentLeft(engine, 'extractor2'); advance(engine, 5000);
    expect(state.research.queue).toEqual([]);
    expect(state.research.selected).toBeUndefined();
    advance(engine, 10000);
    expect(state.research.repeatableCompletions?.mapNode).toBe(1);
  });
});
