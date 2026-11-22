import type { GameState } from '../domain/types';
import { AUTOSAVE_KEY } from './storageKeys';

const listeners = new Set<() => void>();
export function subscribeAutosaveWrites(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** A failed atomic storage write leaves the previous autosave intact. */
export function writeAutosave(state: GameState) {
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
  for (const listener of [...listeners]) {
    try { listener(); } catch { /* Observer failure must not turn a successful storage write into an autosave failure. */ }
  }
}
