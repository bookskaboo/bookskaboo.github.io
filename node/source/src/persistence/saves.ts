import type { GameState } from '../domain/types';
import type { SaveSlot } from './saveTypes';
import { SAVE_KEY, AUTOSAVE_KEY } from './storageKeys';
import { normalizeLegacy } from './legacyMigration';
import { record, number } from './saveValidation';

export { SAVE_KEY, AUTOSAVE_KEY } from './storageKeys';
export { normalizeLegacy } from './legacyMigration';
export type { SaveSlot } from './saveTypes';

function normalizeSlot(value: unknown): SaveSlot | null {
  const slot = record(value);
  const direct = normalizeLegacy(slot.state);
  if (direct) return { savedAt: number(slot.savedAt, Date.now()), playTimeMs: direct.playTimeMs, sectorName: direct.sectors[direct.activeSectorId]?.name ?? 'Unknown Sector', state: direct, name: typeof slot.name === 'string' ? slot.name.slice(0, 40) : undefined };
  const migrated = normalizeLegacy(slot.data);
  if (!migrated) return null;
  return { savedAt: Date.parse(typeof slot.savedAt === 'string' ? slot.savedAt : '') || Date.now(), playTimeMs: migrated.playTimeMs, sectorName: migrated.sectors[migrated.activeSectorId]?.name ?? 'Imported Save', state: migrated, name: typeof slot.name === 'string' ? slot.name.slice(0, 40) : undefined };
}

export function readSlots(): Array<SaveSlot | null> {
  try { const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]'); return [0, 1, 2].map((index) => normalizeSlot(parsed[index])); }
  catch { return [null, null, null]; }
}

export function saveSlot(index: number, state: GameState, name?: string) {
  const slots = readSlots();
  slots[index] = { savedAt: Date.now(), playTimeMs: state.playTimeMs, sectorName: state.sectors[state.activeSectorId]?.name ?? 'Unknown Sector', state: structuredClone(state), name: name?.trim().slice(0, 40) || `Save ${index + 1}` };
  localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
  return slots;
}

export function copySaveToSlot(index: number, source: SaveSlot, name?: string) {
  const slots = readSlots();
  slots[index] = { ...structuredClone(source), savedAt: Date.now(), name: name?.trim().slice(0, 40) || source.name || `Save ${index + 1}` };
  localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
  return slots;
}

export function readAutosave(): SaveSlot | null {
  try { const parsed = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) ?? 'null'); return normalizeSlot(parsed) ?? (normalizeLegacy(parsed) ? normalizeSlot({ state: parsed, savedAt: Date.now() }) : null); }
  catch { return null; }
}
