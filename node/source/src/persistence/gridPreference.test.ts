import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { normalizeLegacy } from './saves';

describe('grid snap preference', () => {
  it('starts disabled so existing free placement stays available', () => {
    expect(createInitialState(1).preferences.snapToGrid).toBe(false);
  });

  it.each([false, true])('persists an explicit %s preference through save loading', snapToGrid => {
    const engine = new GameEngine(createInitialState(1), { autosave: false });
    engine.updatePreferences({ snapToGrid });
    expect(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))?.preferences.snapToGrid).toBe(snapToGrid);
  });

  it('adds a disabled default to older saves without changing their factory or other options', () => {
    const saved = JSON.parse(JSON.stringify(createInitialState(1)));
    delete saved.preferences.snapToGrid;
    saved.preferences.showGrid = false;
    const restored = normalizeLegacy(saved)!;
    expect(restored.preferences).toEqual({ ...saved.preferences, snapToGrid: false });
    expect(restored.sectors).toEqual(saved.sectors);
    expect(saved.preferences.snapToGrid).toBeUndefined();
  });
});
