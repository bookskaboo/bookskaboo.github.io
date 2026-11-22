import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { emptyMod } from '../mods/modTypes';
import { generateSector } from './worldGeneration';
import { NODE_DEFINITIONS } from '../content/nodes';

const fixture = () => {
  const state = createInitialState(301);
  state.isTraining = true; state.paused = true; state.borderObstructionVersion = 0; state.borderObstructions = [];
  state.research.unlocked.push('joint'); state.research.completed.push('joint');
  state.sectors[state.activeSectorId].nodes = []; state.sectors[state.activeSectorId].connections = [];
  const remote = generateSector(6, 5, state.seed); remote.unlocked = true; remote.visited = false;
  state.sectors[remote.id] = remote;
  return state;
};
afterEach(() => { vi.restoreAllMocks(); new GameEngine(createInitialState(301), { autosave: false }); });

describe('engine lifecycle boundaries', () => {
  it('initializes missing collections on construction/replacement without mutating callers or retaining the previous factory', () => {
    const state = fixture();
    delete state.produced; delete state.extracted; delete state.hasCreatedConnection; delete state.inFlightTransfers;
    delete state.research.repeatableCompletions; delete state.research.projectContributions;
    const original = structuredClone(state), engine = new GameEngine(state, { autosave: false });
    expect(state).toEqual(original);
    expect(engine.getState()).toMatchObject({ produced: {}, extracted: {}, hasCreatedConnection: false, inFlightTransfers: [] });
    engine.getState().produced = { iron: 12 };
    expect(engine.placeNode('joint', 600, 600)).toBeTruthy();
    engine.replaceState(state); const replaced = structuredClone(engine.getState());
    expect(state).toEqual(original); expect(replaced.produced).toEqual({});
    engine.undo(); expect(engine.getState()).toEqual(replaced);
  });
  it('retains earned knowledge and depletion notices through ordinary Undo but rewinds factory work', () => {
    const engine = new GameEngine(fixture(), { autosave: false });
    engine.getState().researchHintHistory = { assignmentAcknowledged: false, unlocked: [{ title: 'Earlier', detail: 'Earlier detail' }] };
    const encounters = engine.getState().encounters ?? [];
    const id = engine.placeNode('joint', 600, 600)!;
    const current = engine.getState();
    current.devTutorialPromptsSuppressed = true; current.encounters = ['iron']; current.tutorialPromptsSeen = ['expansion'];
    current.researchHintHistory = { assignmentAcknowledged: true, unlocked: [{ title: 'Learned', detail: 'Learned detail' }] };
    current.sectors['6,5'].visited = true; current.sectors['6,5'].resourceDepletionPending = true;
    current.resourceDepletionLog = []; const log = current.resourceDepletionLog;
    engine.undo(); const restored = engine.getState();
    expect(restored.sectors['5,5'].nodes.some(n => n.id === id)).toBe(false);
    expect(restored).toMatchObject({ devTutorialPromptsSuppressed: true, encounters: expect.arrayContaining([...encounters, 'iron']), tutorialPromptsSeen: ['expansion'], researchHintHistory: { assignmentAcknowledged: true, unlocked: [{ title: 'Earlier', detail: 'Earlier detail' }, { title: 'Learned', detail: 'Learned detail' }] } });
    expect(restored.sectors['6,5']).toMatchObject({ visited: true, resourceDepletionPending: true });
    expect(restored.resourceDepletionLog).toBe(log);
  });
  it('rewinds developer map reveal discoveries while retaining ordinary learned hints and tutorial suppression', () => {
    const engine = new GameEngine(fixture(), { autosave: false }), before = structuredClone(engine.getState());
    engine.developerUnlockAllSectors();
    engine.getState().devTutorialPromptsSuppressed = true;
    engine.getState().researchHintHistory = { assignmentAcknowledged: true, unlocked: [{ title: 'Learned', detail: 'Kept' }] };
    engine.undo(); const restored = engine.getState();
    expect(restored.sectors['6,5'].visited).toBe(before.sectors['6,5'].visited);
    expect(restored.encounters).toEqual(before.encounters);
    expect(restored.researchHintHistory?.assignmentAcknowledged).toBe(true);
    expect(restored.devTutorialPromptsSuppressed).toBe(true);
  });
  it('rejects invalid replacement/mod packages before consuming history, publishing or changing the active catalog', () => {
    const engine = new GameEngine(fixture(), { autosave: false });
    const id = engine.placeNode('joint', 600, 600)!;
    const mod = emptyMod(); mod.nodes.joint = { name: 'Routing elbow' }; engine.applyMod(mod);
    const before = structuredClone(engine.getState()), publications = vi.fn(); engine.subscribe(publications);
    const invalid = emptyMod(); invalid.nodes.joint = { capacity: -1 };
    expect(() => engine.replaceState({ ...fixture(), mod: invalid })).toThrow();
    expect(() => engine.applyMod(invalid)).toThrow();
    expect(engine.getState()).toEqual(before); expect(publications).not.toHaveBeenCalled();
    expect(NODE_DEFINITIONS.joint.name).toBe('Routing elbow');
    engine.undo(); expect(engine.getState().mod).toBeUndefined();
    expect(NODE_DEFINITIONS.joint.name).toBe('Joint');
    engine.undo(); expect(engine.getSector().nodes.some(n => n.id === id)).toBe(false);
  });
  it('resets an active realtime clock on replacement and Undo without accruing the intervening wall time', () => {
    let now = 0; vi.spyOn(performance, 'now').mockImplementation(() => now);
    const state = fixture(); state.paused = false;
    const engine = new GameEngine(state, { autosave: false });
    engine.startRealtimeClock(); now = 5000; engine.replaceState(state); now = 5100; engine.tickRealtime();
    expect(engine.getState().playTimeMs).toBe(100);
    engine.placeNode('joint', 600, 600); now = 15000; engine.undo(); now = 15100; engine.tickRealtime();
    expect(engine.getState().playTimeMs).toBe(200);
    engine.stopRealtimeClock();
  });
});

