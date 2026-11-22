import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTOSAVE_KEY } from '../persistence/storageKeys';
import { createInitialState, GameEngine } from './engine';

let memory: Map<string, string>;
let setItem: ReturnType<typeof vi.fn>;
let blocked: boolean;
const advance = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds; i++) engine.tick(1000); };
const setup = (autosave = true) => {
  const state = createInitialState(204);
  state.preferences.autosaveMinutes = 1;
  return new GameEngine(state, { autosave });
};

beforeEach(() => {
  memory = new Map([[AUTOSAVE_KEY, 'previous stored save']]);
  blocked = true;
  setItem = vi.fn((key: string, value: string) => {
    if (blocked) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    memory.set(key, value);
  });
  vi.stubGlobal('localStorage', { setItem, getItem: (key: string) => memory.get(key) ?? null });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('automatic save recovery', () => {
  it('contains quota failures, preserves the previous payload and continues simulation without retrying each tick', () => {
    const engine = setup();
    expect(() => advance(engine, 60)).not.toThrow();
    expect(engine.hasAutosaveFailure()).toBe(true);
    expect(memory.get(AUTOSAVE_KEY)).toBe('previous stored save');
    advance(engine, 5);
    expect(engine.getState().playTimeMs).toBe(65000);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(engine.hasAutosaveFailure()).toBe(true);
  });
  it('notifies subscribers of failure and successful paused retry using the current factory', () => {
    const engine = setup();
    const statuses: boolean[] = [];
    engine.subscribe(() => statuses.push(engine.hasAutosaveFailure()));
    advance(engine, 60);
    expect(statuses).toContain(true);
    engine.togglePause();
    expect(engine.retryAutosave()).toBe(false);
    expect(engine.hasAutosaveFailure()).toBe(true);
    blocked = false;
    engine.getSector().name = 'Latest factory';
    expect(engine.retryAutosave()).toBe(true);
    expect(statuses.at(-1)).toBe(false);
    expect(JSON.parse(memory.get(AUTOSAVE_KEY)!)).toMatchObject({ paused: true, playTimeMs: 60000 });
    expect(JSON.parse(memory.get(AUTOSAVE_KEY)!).sectors[engine.getState().activeSectorId].name).toBe('Latest factory');
    expect(engine.hasAutosaveFailure()).toBe(false);
    engine.togglePause();
    advance(engine, 59);
    expect(setItem).toHaveBeenCalledTimes(3);
    advance(engine, 1);
    expect(setItem).toHaveBeenCalledTimes(4);
  });
  it('clears a warning when the next scheduled autosave succeeds', () => {
    const engine = setup();
    advance(engine, 60);
    blocked = false;
    advance(engine, 60);
    expect(engine.hasAutosaveFailure()).toBe(false);
    expect(JSON.parse(memory.get(AUTOSAVE_KEY)!).playTimeMs).toBe(120000);
  });
  it('contains unavailable storage access', () => {
    const engine = setup();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage denied'); } });
    expect(() => engine.retryAutosave()).not.toThrow();
    expect(engine.hasAutosaveFailure()).toBe(true);
  });
  it('contains serialization failures before touching the existing save', () => {
    const engine = setup();
    vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => { throw new Error('Cannot serialize'); });
    expect(engine.retryAutosave()).toBe(false);
    expect(memory.get(AUTOSAVE_KEY)).toBe('previous stored save');
    expect(setItem).not.toHaveBeenCalled();
  });
  it('keeps runtime failure state through undo and replacement without serializing it into saves', () => {
    const engine = setup();
    engine.retryAutosave();
    const id = engine.placeNode('extractor', 2850, 300);
    expect(id).toBeTruthy();
    engine.undo();
    expect(engine.hasAutosaveFailure()).toBe(true);
    engine.replaceState(createInitialState(205));
    expect(engine.hasAutosaveFailure()).toBe(true);
    expect(JSON.stringify(engine.getState())).not.toContain('autosaveFailed');
  });
  it('does not write or create failures for an autosave-disabled practice engine', () => {
    const engine = setup(false);
    advance(engine, 60);
    expect(engine.retryAutosave()).toBe(false);
    expect(engine.hasAutosaveFailure()).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });
});
