import { describe, expect, it } from 'vitest';
import {
  addUnlockedNodeShortcuts,
  DEFAULT_SHORTCUT_BARS,
  createDefaultShortcutBars,
  normalizeShortcutBars,
  reconcileShortcutBars,
  shortcutBarForKind,
} from './ShortcutBars';

const freshBars = () => normalizeShortcutBars(structuredClone(DEFAULT_SHORTCUT_BARS));

describe('shortcut bar progression', () => {
  it('fits three default bars above the bottom edge without overwriting custom positions', () => {
    for (const [width, height] of [[800, 600], [1280, 720], [1920, 1080]]) {
      const bars = createDefaultShortcutBars(width, height);
      const ids = ['production', 'logistics', 'storage'] as const;
      const rects = ids.map(id => { const bar = bars[id]; return { left: bar.position.x / 100 * width - 267 * bar.scale / 2, right: bar.position.x / 100 * width + 267 * bar.scale / 2, bottom: bar.position.y / 100 * height + 53 * bar.scale / 2 }; });
      expect(rects[0].left).toBeGreaterThan(0);
      expect(rects[2].right).toBeLessThan(width);
      expect(rects[0].right).toBeLessThan(rects[1].left);
      expect(rects[1].right).toBeLessThan(rects[2].left);
      expect(rects.every(rect => Math.abs(rect.bottom - (height - 12)) < .01)).toBe(true);
    }
    const custom = freshBars(); custom.production.position = { x: 14, y: 26 };
    expect(normalizeShortcutBars(custom).production.position).toEqual({ x: 14, y: 26 });
  });
  it('starts every shortcut bar with exactly five slots', () => {
    const bars = freshBars();
    expect(bars.production.assignments).toHaveLength(5);
    expect(bars.logistics.assignments).toHaveLength(5);
    expect(bars.storage.assignments).toHaveLength(5);
  });

  it('keeps reconciliation separate from one-time unlock assignment', () => {
    const bars = reconcileShortcutBars(freshBars(), ['kiln']);
    expect(bars.production.assignments).toHaveLength(5);
    expect(bars.production.assignments).not.toContain('kiln');
  });

  it('adds a newly unlocked node immediately into the first empty category slot', () => {
    const bars = freshBars();
    expect(addUnlockedNodeShortcuts(bars, ['kiln'], [])).toBe(bars);
    const unlocked = addUnlockedNodeShortcuts(bars, ['kiln'], ['kiln']);
    expect(unlocked.production.assignments).toHaveLength(5);
    expect(unlocked.production.assignments[1]).toBe('kiln');
    expect(addUnlockedNodeShortcuts(unlocked, ['kiln'], ['kiln'])).toBe(unlocked);
  });

  it('routes newly unlocked nodes to their matching shortcut bar', () => {
    const bars = freshBars();
    const logistics = addUnlockedNodeShortcuts(bars, ['splitter'], ['splitter']);
    expect(logistics.logistics.assignments[1]).toBe('splitter');
    expect(logistics.production.assignments).toHaveLength(5);
    expect(shortcutBarForKind('woodenChest')).toBe('logistics');
    expect(shortcutBarForKind('fluidLink')).toBe('production');
  });

  it('extends a category bar only after all five starting slots are occupied', () => {
    const bars = freshBars();
    const unlocks = ['kiln', 'smelter', 'refiner', 'assembler', 'treePlanter'] as const;
    const unlocked = addUnlockedNodeShortcuts(bars, unlocks, ['kiln', 'smelter', 'refiner', 'assembler', 'treePlanter']);
    expect(unlocked.production.assignments).toEqual(['extractor', 'kiln', 'smelter', 'refiner', 'assembler', 'treePlanter']);
  });

  it('removes deferred Power shortcuts even when an old save completed their research', () => {
    const unlocked = addUnlockedNodeShortcuts(freshBars(), ['charcoalGenerator', 'powerSplitter'], ['basicElectricity']);
    expect(unlocked.production.assignments).not.toContain('charcoalGenerator');
    expect(unlocked.logistics.assignments).not.toContain('powerSplitter');
    const old = freshBars();
    old.production.assignments[1] = 'charcoalGenerator';
    old.logistics.assignments[1] = 'powerSplitter';
    const reconciled = reconcileShortcutBars(old, ['basicElectricity']);
    expect(reconciled.production.assignments[1]).toBeNull();
    expect(reconciled.logistics.assignments[1]).toBeNull();
  });

  it('trims stale empty dynamic slots back to the five-slot baseline', () => {
    const bars = freshBars();
    bars.production.assignments.push(null, null);
    expect(reconcileShortcutBars(bars, []).production.assignments).toHaveLength(5);
  });

  it('moves a saved Cart to the next Logistics slot and hides its emptied old bar', () => {
    const bars = freshBars();
    bars.storage.visible = true; bars.storage.assignments[0] = 'chest';
    bars.logistics.assignments = ['filter', 'splitter', 'merger', 'joint', 'road'];
    const next = reconcileShortcutBars(bars, ['road', 'filter', 'splitter', 'merger', 'joint']);
    expect(next.logistics.assignments.at(-1)).toBe('woodenChest');
    expect(next.logistics.assignments).toHaveLength(6);
    expect(next.storage.assignments.every(kind => kind === null)).toBe(true);
    expect(next.storage.visible).toBe(false);
    expect(bars.storage.assignments[0]).toBe('chest');
  });

  it('keeps a cleared Cart unassigned on reload and fills its normal slot only on a new unlock', () => {
    const bars = freshBars();
    bars.production.assignments[0] = null;
    const cleared = reconcileShortcutBars(normalizeShortcutBars(bars), ['road']);
    expect(cleared.production.assignments[0]).toBeNull();
    expect(cleared.logistics.assignments).not.toContain('woodenChest');
    const unlocked = addUnlockedNodeShortcuts(cleared, ['woodenChest'], ['road']);
    expect(unlocked.logistics.assignments[1]).toBe('woodenChest');
    expect(unlocked.storage.assignments).not.toContain('woodenChest');
    expect(addUnlockedNodeShortcuts(unlocked, ['woodenChest'], ['road', 'trucks', 'trains'])).toBe(unlocked);
  });

  it('starts the third bar hidden and reveals it on its first real Storage unlock', () => {
    const bars = freshBars();
    expect(bars.storage.visible).toBe(false);
    const withCart = addUnlockedNodeShortcuts(bars, ['woodenChest'], ['road']);
    expect(withCart.storage.visible).toBe(false);
    const withStorage = addUnlockedNodeShortcuts(withCart, ['storage'], ['road', 'autonomousLogistics']);
    expect(withStorage.storage.visible).toBe(true);
    expect(withStorage.storage.assignments[0]).toBe('storage');
  });
});
