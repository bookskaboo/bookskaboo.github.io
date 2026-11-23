import { expect, it } from 'vitest';
import { audioGains, audioPreferences } from './audioPreferences';
import { createInitialState, GameEngine } from '../simulation/engine';
import { parseSaveFile, serializeSaveFile } from '../persistence/saves';
it('defaults new and older factories to unmuted midpoint values, independent of the retired sound flag', () => {
  const state = createInitialState(214); expect(audioPreferences(state.preferences)).toEqual({ effectsVolume: 50, musicVolume: 50, effectsMuted: false, musicMuted: false });
  delete state.preferences.effectsVolume; delete state.preferences.musicVolume;
  const loaded = parseSaveFile(serializeSaveFile(state)).state;
  expect(loaded.preferences.effectsVolume).toBe(50); expect(loaded.preferences.musicMuted).toBe(false);
  expect(audioGains(audioPreferences(loaded.preferences))).toEqual({ effects: .3, music: .15 });
});
it('normalizes malformed levels and retains each channel through saves and Undo', () => {
  expect(audioPreferences({ effectsVolume: -20, musicVolume: Infinity })).toEqual({ effectsVolume: 0, musicVolume: 50, effectsMuted: false, musicMuted: false });
  const engine = new GameEngine(createInitialState(214), { autosave: false });
  engine.getState().sectors['5,5'].nodes = []; engine.getState().research.unlocked.push('kiln');
  expect(engine.placeNode('kiln', 400, 400)).toBeTruthy();
  engine.updatePreferences({ effectsVolume: 35, musicVolume: 72, effectsMuted: true, musicMuted: false }); engine.undo();
  const restored = parseSaveFile(serializeSaveFile(engine.getState())).state;
  expect(audioPreferences(restored.preferences)).toEqual({ effectsVolume: 35, musicVolume: 72, effectsMuted: true, musicMuted: false });
  Object.assign(restored.preferences, { musicVolume: 'bad', effectsVolume: 200, effectsMuted: 'true' });
  const normalized = parseSaveFile(serializeSaveFile(restored)).state;
  expect(audioPreferences(normalized.preferences)).toEqual({ effectsVolume: 100, musicVolume: 50, effectsMuted: false, musicMuted: false });
});
