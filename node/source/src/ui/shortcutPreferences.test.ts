import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHORTCUT_BARS_KEY } from '../persistence/storageKeys';
import { createDefaultShortcutBars, SHORTCUT_BAR_IDS } from './ShortcutBars';
import { readShortcutBars } from './shortcutPreferences';

const savedPreferences = new Map<string, string>();

beforeEach(() => {
  savedPreferences.clear();
  vi.stubGlobal('window', { innerWidth: 1280, innerHeight: 720 });
  vi.stubGlobal('localStorage', { getItem: (key: string) => savedPreferences.get(key) ?? null });
});
afterEach(() => vi.unstubAllGlobals());

describe('startup shortcut visibility', () => {
  it.each([null, '{invalid json'])('starts the first two bars visibly and the third hidden with missing or invalid preferences (%s)', stored => {
    if (stored) savedPreferences.set(SHORTCUT_BARS_KEY, stored);
    const bars = readShortcutBars({ recoverAllHidden: true });
    expect(bars.production.visible).toBe(true);
    expect(bars.logistics.visible).toBe(true);
    expect(bars.storage.visible).toBe(false);
  });

  it('recovers an all-hidden startup without changing custom geometry or assignments', () => {
    const saved = createDefaultShortcutBars();
    for (const id of SHORTCUT_BAR_IDS) saved[id].visible = false;
    Object.assign(saved.production, { position: { x: 25, y: 60 }, scale: 1.2, rotation: 90, locked: true });
    saved.storage.position = { x: 80, y: 70 };
    savedPreferences.set(SHORTCUT_BARS_KEY, JSON.stringify(saved));
    const bars = readShortcutBars({ recoverAllHidden: true });
    for (const id of SHORTCUT_BAR_IDS) expect(bars[id]).toEqual({ ...saved[id], visible: id !== 'storage' });
  });

  it('preserves individual hidden-bar preferences when at least one bar is visible', () => {
    const saved = createDefaultShortcutBars();
    saved.production.visible = false;
    saved.storage.visible = false;
    savedPreferences.set(SHORTCUT_BARS_KEY, JSON.stringify(saved));
    expect(readShortcutBars({ recoverAllHidden: true })).toEqual(saved);
  });

  it('preserves manual hiding when returning to an ongoing factory', () => {
    const saved = createDefaultShortcutBars();
    for (const id of SHORTCUT_BAR_IDS) saved[id].visible = false;
    savedPreferences.set(SHORTCUT_BARS_KEY, JSON.stringify(saved));
    expect(readShortcutBars()).toEqual(saved);
  });
});
