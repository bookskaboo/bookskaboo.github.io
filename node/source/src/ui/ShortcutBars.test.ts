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
    expect(shortcutBarForKind('woodenChest')).toBe('storage');
  });

  it('extends a category bar only after all five starting slots are occupied', () => {
    const bars = freshBars();
    const unlocks = ['kiln', 'smelter', 'refiner', 'assembler', 'charcoalGenerator'] as const;
    const unlocked = addUnlockedNodeShortcuts(bars, unlocks, ['kiln', 'smelter', 'refiner', 'assembler', 'basicElectricity']);
    expect(unlocked.production.assignments).toEqual(['extractor', 'kiln', 'smelter', 'refiner', 'assembler', 'charcoalGenerator']);
  });

  it('adds every node unlocked by the same research to its proper bar', () => {
    const unlocked = addUnlockedNodeShortcuts(freshBars(), ['charcoalGenerator', 'powerSplitter'], ['basicElectricity']);
    expect(unlocked.production.assignments).toContain('charcoalGenerator');
    expect(unlocked.logistics.assignments).toContain('powerSplitter');
  });

  it('trims stale empty dynamic slots back to the five-slot baseline', () => {
    const bars = freshBars();
    bars.production.assignments.push(null, null);
    expect(reconcileShortcutBars(bars, []).production.assignments).toHaveLength(5);
  });
});
