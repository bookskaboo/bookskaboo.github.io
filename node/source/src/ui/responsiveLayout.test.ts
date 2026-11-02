import { describe, expect, it } from 'vitest';
import { createDefaultShortcutBars, DEFAULT_SHORTCUT_BAR_GROUPS } from './ShortcutBars';
import { fitMinimap, shortcutDockLayout } from './responsiveLayout';

describe('responsive HUD layout', () => {
  it('docks visible bars on narrow screens and restores the saved desktop layout', () => {
    const bars = createDefaultShortcutBars(1920, 1080);
    const saved = structuredClone(bars);
    expect(shortcutDockLayout(bars, DEFAULT_SHORTCUT_BAR_GROUPS, { width: 390, height: 844 })).toEqual({ docked: true, stacked: true, height: 157 });
    expect(shortcutDockLayout(bars, DEFAULT_SHORTCUT_BAR_GROUPS, { width: 844, height: 390 }).docked).toBe(true);
    expect(shortcutDockLayout(bars, DEFAULT_SHORTCUT_BAR_GROUPS, { width: 1920, height: 1080 }).docked).toBe(false);
    expect(bars).toEqual(saved);
  });
  it('docks an attached group when progression makes it wider than the screen', () => {
    const bars = createDefaultShortcutBars();
    bars.production.assignments = Array(24).fill('extractor');
    expect(shortcutDockLayout(bars, DEFAULT_SHORTCUT_BAR_GROUPS, { width: 1280, height: 720 }).docked).toBe(true);
    expect(shortcutDockLayout(bars, DEFAULT_SHORTCUT_BAR_GROUPS, { width: 2400, height: 1200 }).docked).toBe(false);
    for (const bar of Object.values(bars)) bar.visible = false;
    expect(shortcutDockLayout(bars, DEFAULT_SHORTCUT_BAR_GROUPS, { width: 390, height: 844 }).height).toBe(0);
  });
  it('keeps the minimap inside a smaller screen without changing the preferred layout', () => {
    const preferred = { x: 1500, y: 800 };
    const small = fitMinimap({ width: 390, height: 844 }, 400, preferred, 157);
    expect(small.x + small.size).toBeLessThanOrEqual(378);
    expect(small.y).toBeGreaterThanOrEqual(124);
    expect(small.y + small.size + 76).toBeLessThanOrEqual(844 - 157);
    const large = fitMinimap({ width: 2560, height: 1440 }, 400, preferred);
    expect(large).toEqual({ size: 400, ...preferred });
    expect(preferred).toEqual({ x: 1500, y: 800 });
  });
});
