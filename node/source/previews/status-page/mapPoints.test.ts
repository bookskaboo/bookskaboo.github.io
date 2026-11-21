import { describe, expect, it } from 'vitest';
import { getResearchCostsForState, getResearchProject } from '../../src/content/research';
import { normalizeLegacy } from '../../src/persistence/saves';
import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { destinationMapCosts, mapResearchNeedsDestination, usesDestinationMapPricing } from '../../src/simulation/mapExpansion';
import { completeQueueExample, queueLabExample, supplyQueueExample } from './queueExamples';
import { restoreStatusFactory, savedMapPurchaseExample } from './savedProgress';

const mapProject = () => getResearchProject('mapNode')!;
const opened = (engine: GameEngine) => Object.values(engine.getState().sectors).filter(sector => sector.unlocked).map(sector => sector.id).sort();

describe('Upgrades banked Map Points', () => {
  it('transitions an active legacy purchase, charges only its remaining Cores and banks one point', () => {
    let engine = savedMapPurchaseExample();
    let state = engine.getState();
    const before = opened(engine);
    expect(state.mapResearchMode).toBe('points');
    const quoted = { completion: 2, costs: { 'simple-core': 9, 'basic-core': 4 } };
    expect(state.research.mapNodeQuote).toEqual(quoted);
    expect(state.research.contributed).toEqual({ 'simple-core': 7, 'basic-core': 4 });
    const saved = JSON.parse(JSON.stringify(state));
    engine = new GameEngine(restoreStatusFactory(saved)!, { autosave: false });
    state = engine.getState();
    expect(state.research.mapNodeQuote).toEqual(quoted);
    expect(state.research.paused).toBe(true);
    engine.setResearchPaused(false);
    for (let step = 0; step < 87; step++) engine.tick(100);
    expect(state.research.mapPoints).toBe(0);
    engine.tick(100);
    expect(state.research.mapPoints).toBe(1);
    expect(state.research.repeatableCompletions?.mapNode).toBe(3);
    expect(state.research.mapNodeQuote).toBeUndefined();
    expect(state.research.queue).toEqual(['extractor2', 'kiln2']);
    expect(state.research.selected).toBe('extractor2');
    expect(state.sectors['5,5'].nodes[0].input).toEqual({ 'simple-core': 1, 'basic-core': 3, 'automata-core': 3 });
    expect(opened(engine)).toEqual(before);
    expect(engine.unlockSector(5, 4)).toBe(true);
    expect(state.research.mapPoints).toBe(0);
    expect(state.sectors['5,4'].visited).not.toBe(true);
    expect(state.sectors['6,5']?.unlocked).not.toBe(true);
    engine.selectResearch('mapNode');
    expect(state.research.mapNodeQuote?.completion).toBe(3);
    expect(state.research.mapNodeQuote?.costs).not.toEqual(quoted.costs);
  });

  it('converts parked quotes without changing paid bags, queue, saved points or opened maps', () => {
    const old = savedMapPurchaseExample().getState();
    delete old.mapResearchMode;
    old.research.mapNodeQuote!.destination = '6,5';
    old.research.projectContributions!.mapNode = { ...old.research.contributed };
    old.research.selected = 'hydroCore';
    old.research.contributed = { 'simple-core': 2, 'basic-core': 2, 'automata-core': 2 };
    old.research.mapPoints = 2;
    const source = structuredClone(old);
    const migrated = restoreStatusFactory(old)!;
    expect(old).toEqual(source);
    expect(migrated.sectors).toEqual(old.sectors);
    expect(migrated.research.projectContributions).toEqual(old.research.projectContributions);
    expect(migrated.research.queue).toEqual(old.research.queue);
    expect(migrated.research.mapPoints).toBe(2);
    expect(migrated.research.mapNodeQuote).toEqual({ completion: 2, costs: { 'simple-core': 9, 'basic-core': 4 } });
    expect(restoreStatusFactory(migrated)).toEqual(migrated);
    const engine = new GameEngine(migrated, { autosave: false });
    engine.releasePriorityResearch('hydroCore');
    expect(engine.getState().research.selected).toBeUndefined();
    engine.setResearchPaused(false);
    expect(engine.getState().research.selected).toBe('mapNode');
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 7, 'basic-core': 4 });
    expect(normalizeLegacy(old)!.research.mapNodeQuote?.destination).toBeUndefined();
    expect(normalizeLegacy(old)!.mapResearchMode).toBe('points');
  });
  it('queues without a destination, awards one point and advances without opening a map', () => {
    const engine = queueLabExample(), before = opened(engine);
    expect(usesDestinationMapPricing(engine.getState())).toBe(false);
    expect(mapResearchNeedsDestination(engine.getState())).toBe(false);
    expect(destinationMapCosts(engine.getState(), 6, 5)).toBeUndefined();
    expect(engine.queueResearch('mapNode')).toBe('added');
    expect(engine.getState().research.mapNodeQuote).not.toHaveProperty('destination');
    engine.queueResearch('extractor2');
    completeQueueExample(engine);
    expect(engine.getState().research.mapPoints).toBe(1);
    expect(opened(engine)).toEqual(before);
    expect(engine.getState().research.selected).toBe('extractor2');
    expect(engine.getState().research.queue).toEqual(['extractor2']);
  });

  it('spends a point on a chosen frontier map without visiting it or paying again', () => {
    const engine = queueLabExample();
    engine.queueResearch('mapNode'); completeQueueExample(engine);
    expect(engine.unlockSector(7, 5)).toBe(false);
    expect(engine.getState().research.mapPoints).toBe(1);
    expect(engine.unlockSector(5, 4)).toBe(true);
    expect(engine.getState().research.mapPoints).toBe(0);
    expect(engine.getState().sectors['5,4'].unlocked).toBe(true);
    expect(engine.getState().sectors['5,4'].visited).not.toBe(true);
    expect(engine.getState().activeSectorId).toBe('5,5');
    expect(engine.unlockSector(5, 4)).toBe(false);
    expect(engine.unlockSector(6, 5)).toBe(false);
  });

  it('banks multiple completed points across save/load and keeps the existing price schedule', () => {
    let engine = queueLabExample();
    for (let purchase = 0; purchase < 2; purchase++) {
      expect(engine.queueResearch('mapNode')).toBe('added');
      expect(getResearchCostsForState(mapProject(), engine.getState().research)).toEqual({ 'simple-core': 5 });
      completeQueueExample(engine);
    }
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(engine.getState()).toMatchObject({ mapResearchMode: 'points', research: { mapPoints: 2, repeatableCompletions: { mapNode: 2 } } });
    expect(opened(engine)).toEqual(['5,5']);
    expect(engine.unlockSector(6, 5)).toBe(true);
    expect(engine.unlockSector(5, 4)).toBe(true);
    expect(engine.getState().research.mapPoints).toBe(0);
  });

  it('retains a paid price through project switching, a Core unlock and normalized reload', () => {
    let engine = queueLabExample();
    engine.getState().research.repeatableCompletions = { mapNode: 19 };
    engine.selectResearch('mapNode');
    const quote = getResearchCostsForState(mapProject(), engine.getState().research);
    for (let step = 0; step < 50; step++) engine.tick(100);
    engine.selectResearch('extractor2');
    engine.getState().research.completed.push('automataCore');
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    engine.selectResearch('mapNode');
    expect(getResearchCostsForState(mapProject(), engine.getState().research)).toEqual(quote);
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    completeQueueExample(engine);
    expect(engine.getState().research.mapPoints).toBe(1);
    engine.selectResearch('mapNode');
    expect(getResearchCostsForState(mapProject(), engine.getState().research)).toEqual({ 'simple-core': 5, 'basic-core': 5, 'automata-core': 5 });
  });

  it('retains a converted destination bill and payments while awarding a freely spendable point', () => {
    const state = queueLabExample().getState();
    state.research.selected = 'mapNode';
    state.research.contributed = { 'simple-core': 7 };
    state.research.mapNodeQuote = { completion: 0, costs: { 'simple-core': 9 }, destination: '6,5' };
    const engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    expect(engine.getState().research.mapNodeQuote).toEqual({ completion: 0, costs: { 'simple-core': 9 } });
    expect(engine.getState().research.contributed['simple-core']).toBe(7);
    completeQueueExample(engine);
    expect(opened(engine)).toEqual(['5,5']);
    expect(engine.getState().research.mapPoints).toBe(1);
    expect(engine.unlockSector(5, 4)).toBe(true);
  });

  it('keeps test lab supplies and research working at Home after traveling to a new map', () => {
    const engine = queueLabExample();
    engine.queueResearch('mapNode'); completeQueueExample(engine);
    engine.unlockSector(6, 5); engine.switchSector('6,5');
    const lab = engine.getState().sectors['5,5'].nodes.find(node => node.id === 'queue-test-lab')!;
    lab.input = {}; supplyQueueExample(engine);
    expect(lab.input['simple-core']).toBe(5);
    engine.queueResearch('mapNode'); completeQueueExample(engine);
    expect(engine.getState().research.mapPoints).toBe(1);
    expect(engine.getState().activeSectorId).toBe('6,5');
  });

  it('opens beside Deep Holes and rejects unsupported rule modes with banked points in ordinary worlds', () => {
    const engine = queueLabExample();
    engine.getState().research.mapPoints = 1;
    engine.getState().sectors['5,5'].nodes.push({ ...engine.getSector().nodes[0], id: 'blocker', kind: 'big-hole', holeOrigin: 'generated', resourceRemaining: 10 });
    expect(engine.unlockSector(6, 5)).toBe(true);
    expect(engine.getState().research.mapPoints).toBe(0);
    expect(engine.getState().sectors['5,5'].nodes.find(n=>n.id==='blocker')!.resourceRemaining).toBe(10);
    expect(normalizeLegacy({ ...engine.getState(), mapResearchMode: 'unknown' })).toBeNull();
    const ordinary = createInitialState(204);
    expect(ordinary.mapResearchMode).toBe('points');
    expect(usesDestinationMapPricing(ordinary)).toBe(false);
  });
});
