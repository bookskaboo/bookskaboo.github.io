import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { parseSaveFile, serializeSaveFile } from './saves';

afterEach(() => vi.unstubAllGlobals());

describe('portable recovery saves', () => {
  it('round-trips the current factory without browser storage or source mutation', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('Unavailable'); }, setItem() { throw new Error('Unavailable'); } });
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    engine.getState().playTimeMs = 123456;
    engine.getSector().name = 'Portable factory';
    const original = structuredClone(engine.getState());
    const imported = parseSaveFile(serializeSaveFile(engine.getState()));
    const loaded = new GameEngine(imported.state, { autosave: false });
    expect(loaded.getState().playTimeMs).toBe(123456);
    expect(loaded.getSector().name).toBe('Portable factory');
    expect(engine.getState()).toEqual(original);
    expect(imported).toMatchObject({ playTimeMs: 123456, sectorName: 'Portable factory' });
  });
  it('accepts a raw factory snapshot as well as the exported wrapper', () => {
    const state = createInitialState(205);
    expect(parseSaveFile(JSON.stringify(state)).state.seed).toBe(205);
    expect(parseSaveFile(JSON.stringify({ state, name: 'Named recovery', savedAt: 1234 }))).toMatchObject({ name: 'Named recovery', savedAt: 1234 });
  });
  it.each(['{broken', 'null', '[]', '{}', '{"state":{"research":{"completed":{}}}}'])('rejects unsupported file contents %s', text => {
    expect(() => parseSaveFile(text)).toThrow('This file is not a supported NODE save. The current factory has been kept.');
  });
});
