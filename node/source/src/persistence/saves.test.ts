import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../simulation/engine';
import { copySaveToSlot, readSaveSlots, readSlots, saveSlot, SAVE_KEY } from './saves';

const state = createInitialState(204);
const saved = (name: string) => ({ savedAt: 1234, name, state: structuredClone(state), preservedMetadata: { name } });
let memory: Map<string, string>;
let setItem: ReturnType<typeof vi.fn>;

beforeEach(() => {
  memory = new Map();
  setItem = vi.fn((key: string, value: string) => memory.set(key, value));
  vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem });
});
afterEach(() => vi.unstubAllGlobals());

describe('manual save-slot isolation', () => {
  it.each([0, 1, 2])('isolates a throwing payload in slot %i without hiding healthy siblings or changing stored data', index => {
    const slots: unknown[] = [saved('A'), saved('B'), saved('C')];
    slots[index] = { ...saved('Broken'), state: { ...state, research: { ...state.research, completed: {} } } };
    const original = '  ' + JSON.stringify(slots) + '\n';
    memory.set(SAVE_KEY, original);
    const snapshot = readSaveSlots();
    expect(snapshot.error).toBeUndefined();
    expect(snapshot.unreadableSlots).toEqual([index]);
    expect(snapshot.slots.map(slot => slot?.name ?? null)).toEqual(['A', 'B', 'C'].map((name, i) => i === index ? null : name));
    expect(readSlots()).toEqual(snapshot.slots);
    expect(memory.get(SAVE_KEY)).toBe(original);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('distinguishes unsupported and invalid payloads from empty slots', () => {
    memory.set(SAVE_KEY, JSON.stringify([
      { ...saved('Future'), state: { ...state, worldRulesVersion: 99 } },
      false,
      null,
    ]));
    expect(readSaveSlots()).toEqual({ slots: [null, null, null], unreadableSlots: [0, 1] });
  });

  it('saves beside a malformed slot without erasing a healthy sibling or the unreadable payload', () => {
    const broken = { ...saved('Broken'), state: { ...state, research: { ...state.research, completed: {} } } };
    const untouched = saved('Healthy C');
    memory.set(SAVE_KEY, JSON.stringify([saved('Old A'), broken, untouched]));
    const result = saveSlot(0, state, 'New A');
    const stored = JSON.parse(memory.get(SAVE_KEY)!);
    expect(result.map(slot => slot?.name ?? null)).toEqual(['New A', null, 'Healthy C']);
    expect(stored[1]).toEqual(broken);
    expect(stored[2]).toEqual(untouched);
    expect(readSaveSlots().unreadableSlots).toEqual([1]);
  });

  it('copies a save beside an unsupported slot without rewriting legacy siblings or extra stored entries', () => {
    const legacy = saved('Legacy A');
    delete legacy.state.mapResearchMode;
    const future = { ...saved('Future B'), state: { ...state, worldRulesVersion: 99 } };
    const extra = { futureSlot: 'Retain this too' };
    memory.set(SAVE_KEY, JSON.stringify([legacy, future, null, extra]));
    const source = readSlots()[0]!;
    const before = structuredClone(source);
    expect(source.state.mapResearchMode).toBe('points');
    const result = copySaveToSlot(2, source, 'Copy C');
    const stored = JSON.parse(memory.get(SAVE_KEY)!);
    expect(result[2]?.name).toBe('Copy C');
    expect(stored[0]).toEqual(legacy);
    expect(stored[0].state.mapResearchMode).toBeUndefined();
    expect(stored[1]).toEqual(future);
    expect(stored[3]).toEqual(extra);
    expect(source).toEqual(before);
  });

  it('reads the latest stored siblings at write time', () => {
    memory.set(SAVE_KEY, JSON.stringify([null, null, saved('Old C')]));
    readSaveSlots();
    const newer = saved('Newer C from another view');
    memory.set(SAVE_KEY, JSON.stringify([null, null, newer]));
    saveSlot(0, state, 'A');
    expect(JSON.parse(memory.get(SAVE_KEY)!)[2]).toEqual(newer);
  });

  it('can replace only the selected unreadable slot', () => {
    const left = saved('A'), right = saved('C');
    memory.set(SAVE_KEY, JSON.stringify([left, { unsupported: true }, right]));
    copySaveToSlot(1, readSlots()[0]!, 'Replacement B');
    const stored = JSON.parse(memory.get(SAVE_KEY)!);
    expect(stored[0]).toEqual(left);
    expect(stored[1].name).toBe('Replacement B');
    expect(stored[2]).toEqual(right);
    expect(readSaveSlots().unreadableSlots).toEqual([]);
  });

  it.each(['{broken', '{}', 'null', 'false', '42', '"text"'])('blocks saves and copies when the whole collection is unreadable: %s', stored => {
    memory.set(SAVE_KEY, stored);
    expect(readSaveSlots().error).toContain('Saved slots could not be read');
    expect(() => saveSlot(0, state)).toThrow('Saved slots could not be read');
    expect(() => copySaveToSlot(1, { savedAt: 1, playTimeMs: 0, sectorName: 'Home', state })).toThrow('Saved slots could not be read');
    expect(memory.get(SAVE_KEY)).toBe(stored);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('blocks writes when storage cannot be read', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Storage unavailable'); }, setItem });
    expect(readSaveSlots().error).toContain('Saved slots could not be read');
    expect(() => saveSlot(0, state)).toThrow('Saved slots could not be read');
    expect(() => copySaveToSlot(0, { savedAt: 1, playTimeMs: 0, sectorName: 'Home', state })).toThrow('Saved slots could not be read');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('retains normal saves, copy names and empty-slot behavior', () => {
    expect(readSaveSlots()).toEqual({ slots: [null, null, null], unreadableSlots: [] });
    const before = structuredClone(state);
    const first = saveSlot(2, state, '  Kept name  ');
    expect(first[2]?.name).toBe('Kept name');
    expect(first[2]?.state.seed).toBe(state.seed);
    const copied = copySaveToSlot(0, first[2]!);
    expect(copied.map(slot => slot?.name ?? null)).toEqual(['Kept name', null, 'Kept name']);
    expect(state).toEqual(before);
  });

  it.each([-1, 3, .5, NaN, Infinity])('rejects invalid slot index %s without writing', index => {
    expect(() => saveSlot(index, state)).toThrow(RangeError);
    expect(() => copySaveToSlot(index, { savedAt: 1, playTimeMs: 0, sectorName: 'Home', state })).toThrow(RangeError);
    expect(setItem).not.toHaveBeenCalled();
  });
});
