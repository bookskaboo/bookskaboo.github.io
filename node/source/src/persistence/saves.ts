import type { GameState } from '../domain/types';
import type { SaveSlot, SaveSlotsSnapshot } from './saveTypes';
import { SAVE_KEY, AUTOSAVE_KEY } from './storageKeys';
import { normalizeLegacy } from './legacyMigration';
import { record, number } from './saveValidation';

export { SAVE_KEY, AUTOSAVE_KEY } from './storageKeys';
export { normalizeLegacy } from './legacyMigration';
export type { SaveSlot, SaveSlotsSnapshot } from './saveTypes';

const SLOT_COUNT = 3;
const SLOTS_READ_ERROR = 'Saved slots could not be read. Saving and copying to manual slots are disabled to protect the stored data.';

function normalizeSlot(value: unknown): SaveSlot | null {
  const slot = record(value);
  const direct = normalizeLegacy(slot.state);
  if (direct) return { savedAt: number(slot.savedAt, Date.now()), playTimeMs: direct.playTimeMs, sectorName: direct.sectors[direct.activeSectorId]?.name ?? 'Unknown Sector', state: direct, name: typeof slot.name === 'string' ? slot.name.slice(0, 40) : undefined };
  const migrated = normalizeLegacy(slot.data);
  if (!migrated) return null;
  return { savedAt: Date.parse(typeof slot.savedAt === 'string' ? slot.savedAt : '') || Date.now(), playTimeMs: migrated.playTimeMs, sectorName: migrated.sectors[migrated.activeSectorId]?.name ?? 'Imported Save', state: migrated, name: typeof slot.name === 'string' ? slot.name.slice(0, 40) : undefined };
}

/** Keep raw sibling payloads, including unsupported saves, out of migration writes. */
function readStoredSlots(): unknown[] {
  try {
    const stored = localStorage.getItem(SAVE_KEY);
    if (stored === null) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Expected a save-slot array.');
    return parsed;
  } catch {
    throw new Error(SLOTS_READ_ERROR);
  }
}

function inspectSlots(stored: unknown[]): SaveSlotsSnapshot {
  const unreadableSlots: number[] = [];
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => {
    if (stored[index] === null || stored[index] === undefined) return null;
    let slot: SaveSlot | null = null;
    try { slot = normalizeSlot(stored[index]); } catch { /* Isolate this slot. */ }
    if (!slot) unreadableSlots.push(index);
    return slot;
  });
  return { slots, unreadableSlots };
}

export function readSaveSlots(): SaveSlotsSnapshot {
  try { return inspectSlots(readStoredSlots()); }
  catch { return { slots: Array<null>(SLOT_COUNT).fill(null), unreadableSlots: [], error: SLOTS_READ_ERROR }; }
}

export function readSlots(): Array<SaveSlot | null> { return readSaveSlots().slots; }

function writeSlot(index: number, slot: SaveSlot) {
  if (!Number.isInteger(index) || index < 0 || index >= SLOT_COUNT) throw new RangeError('Choose one of the three manual save slots.');
  // Read at the moment of writing so another slot saved since opening the panel survives.
  const stored = readStoredSlots();
  stored.length = Math.max(SLOT_COUNT, stored.length);
  stored[index] = slot;
  localStorage.setItem(SAVE_KEY, JSON.stringify(stored));
  return inspectSlots(stored).slots;
}

export function saveSlot(index: number, state: GameState, name?: string) {
  return writeSlot(index, { savedAt: Date.now(), playTimeMs: state.playTimeMs, sectorName: state.sectors[state.activeSectorId]?.name ?? 'Unknown Sector', state: structuredClone(state), name: name?.trim().slice(0, 40) || `Save ${index + 1}` });
}

export function copySaveToSlot(index: number, source: SaveSlot, name?: string) {
  return writeSlot(index, { ...structuredClone(source), savedAt: Date.now(), name: name?.trim().slice(0, 40) || source.name || `Save ${index + 1}` });
}

export function serializeSaveFile(state: GameState) {
  return JSON.stringify({ savedAt: Date.now(), playTimeMs: state.playTimeMs,
    sectorName: state.sectors[state.activeSectorId]?.name ?? 'Unknown Sector', state });
}

export function parseSaveFile(text: string): SaveSlot {
  try {
    const parsed: unknown = JSON.parse(text);
    const slot = normalizeSlot(parsed);
    if (slot) return slot;
    const state = normalizeLegacy(parsed);
    if (state) return { savedAt: Date.now(), playTimeMs: state.playTimeMs, sectorName: state.sectors[state.activeSectorId]?.name ?? 'Imported Save', state };
  } catch { /* Present one actionable error for invalid or unsupported files. */ }
  throw new Error('This file is not a supported NODE save. The current factory has been kept.');
}

export function readAutosave(): SaveSlot | null {
  try { const parsed = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) ?? 'null'); return normalizeSlot(parsed) ?? (normalizeLegacy(parsed) ? normalizeSlot({ state: parsed, savedAt: Date.now() }) : null); }
  catch { return null; }
}
