import { describe, expect, it } from 'vitest';
import { createDefaultShortcutBars, normalizeShortcutBarGroups, type ShortcutBarGroup, type ShortcutBarId } from './ShortcutBars';
import { detachShortcutBarLayout, fitShortcutBarPositions } from './responsiveLayout';
import { detachShortcutBarGroup, shortcutGroupLead } from './shortcutBarGroups';

const viewport = { width: 1280, height: 800 };

describe('attached shortcut bar handles', () => {
  it.each(['horizontal', 'vertical'] as const)('keeps the handle on the first displayed bar in a %s group', axis => {
    const bars = createDefaultShortcutBars(viewport.width, viewport.height);
    bars.storage.visible = true;
    const group: ShortcutBarGroup = { axis, barIds: ['storage', 'production', 'logistics'] };
    const fitted = fitShortcutBarPositions(bars, [group], viewport);
    const coordinate = axis === 'horizontal' ? 'x' : 'y';
    expect(shortcutGroupLead(group, bars)).toBe('storage');
    expect(fitted.storage[coordinate]).toBeLessThan(fitted.production[coordinate]);
    expect(fitted.production[coordinate]).toBeLessThan(fitted.logistics[coordinate]);
  });

  it('moves the primary handle to the next visible member', () => {
    const bars = createDefaultShortcutBars();
    const group: ShortcutBarGroup = { axis: 'vertical', barIds: ['storage', 'production', 'logistics'] };
    bars.storage.visible = false;
    expect(shortcutGroupLead(group, bars)).toBe('production');
    bars.production.visible = false;
    expect(shortcutGroupLead(group, bars)).toBe('logistics');
  });

  it('uses the dock display order when compact layout changes the visual order', () => {
    const bars = createDefaultShortcutBars();
    const group: ShortcutBarGroup = { axis: 'vertical', barIds: ['storage', 'production', 'logistics'] };
    expect(shortcutGroupLead(group, bars, true)).toBe('production');
  });

  it.each(['horizontal', 'vertical'] as const)('detaches one member and keeps the remaining %s pair attached', axis => {
    const groups: ShortcutBarGroup[] = [{ axis, barIds: ['production', 'logistics', 'storage'] }];
    const saved = structuredClone(groups);
    const remaining = detachShortcutBarGroup(groups, 'logistics');
    expect(remaining).toEqual([{ axis, barIds: ['production', 'storage'] }]);
    expect(groups).toEqual(saved);
    expect(normalizeShortcutBarGroups(JSON.parse(JSON.stringify(remaining)))).toEqual(remaining);
  });

  it('restores independent handles on both bars when a two-bar group separates', () => {
    const groups: ShortcutBarGroup[] = [{ axis: 'horizontal', barIds: ['production', 'storage'] }];
    expect(detachShortcutBarGroup(groups, 'storage')).toEqual([]);
    expect(detachShortcutBarGroup(groups, 'logistics')).toEqual(groups);
  });

  it.each(['horizontal', 'vertical'] as const)('keeps the released middle bar clear of the remaining %s group', axis => {
    const bars = createDefaultShortcutBars(viewport.width, viewport.height);
    const saved = structuredClone(bars);
    const groups: ShortcutBarGroup[] = [{ axis, barIds: ['production', 'logistics', 'storage'] }];
    const detached = detachShortcutBarLayout(bars, groups, 'logistics', viewport);
    const fitted = fitShortcutBarPositions(detached.bars, detached.groups, viewport);
    const rect = (id: ShortcutBarId) => ({ x: fitted[id].x / 100 * viewport.width - 267 * bars[id].scale / 2, y: fitted[id].y / 100 * viewport.height - 53 * bars[id].scale / 2, w: 267 * bars[id].scale, h: 53 * bars[id].scale });
    const free = rect('logistics');
    for (const peer of ['production', 'storage'] as const) {
      const other = rect(peer);
      expect(free.x < other.x + other.w && free.x + free.w > other.x && free.y < other.y + other.h && free.y + free.h > other.y).toBe(false);
    }
    expect(free.x).toBeGreaterThanOrEqual(8);
    expect(free.y).toBeGreaterThanOrEqual(88);
    expect(free.x + free.w).toBeLessThanOrEqual(viewport.width - 8);
    expect(free.y + free.h).toBeLessThanOrEqual(viewport.height - 8);
    expect(detached.groups).toEqual([{ axis, barIds: ['production', 'storage'] }]);
    expect(bars).toEqual(saved);
    for (const id of ['production', 'logistics', 'storage'] as const) {
      expect(detached.bars[id].assignments).toEqual(bars[id].assignments);
      expect(detached.bars[id].locked).toBe(bars[id].locked);
    }
  });

  it('keeps an already-clear trailing bar in place when it is released', () => {
    const bars = createDefaultShortcutBars(viewport.width, viewport.height);
    const groups: ShortcutBarGroup[] = [{ axis: 'horizontal', barIds: ['production', 'logistics', 'storage'] }];
    const before = fitShortcutBarPositions(bars, groups, viewport).storage;
    const detached = detachShortcutBarLayout(bars, groups, 'storage', viewport);
    const after = fitShortcutBarPositions(detached.bars, detached.groups, viewport).storage;
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });
});
