import type { ShortcutBarGroup, ShortcutBarId, ShortcutBarsState } from './ShortcutBars';
import { detachShortcutBarGroup } from './shortcutBarGroups';

export interface ViewportSize { width: number; height: number }
export interface ShortcutDockLayout { docked: boolean; stacked: boolean; height: number }

/** Short columns grow toward the roomier side; overflow remains horizontally scrollable. */
export function fitShortcutAssignmentMenu(viewport: ViewportSize, anchor: { x: number; y: number }, count: number) {
  const inset = 8, columnWidth = 152, columnGap = 6, chromeHeight = 146;
  const rows = Math.min(5, Math.max(1, count), Math.max(1, Math.floor((viewport.height - inset * 2 - chromeHeight) / 38)));
  const columns = Math.ceil(Math.max(1, count) / rows);
  const leftSpace = anchor.x - inset, rightSpace = viewport.width - inset - anchor.x;
  const direction = rightSpace >= leftSpace ? 'right' : 'left';
  const desiredWidth = 16 + columns * columnWidth + (columns - 1) * columnGap;
  const width = Math.min(desiredWidth, Math.max(168, direction === 'right' ? rightSpace : leftSpace), Math.max(0, viewport.width - inset * 2));
  const height = Math.min(chromeHeight + rows * 38, Math.max(0, viewport.height - inset * 2));
  const x = Math.max(inset, Math.min(direction === 'right' ? anchor.x : anchor.x - width, viewport.width - inset - width));
  const y = Math.max(inset, Math.min(anchor.y + height <= viewport.height - inset ? anchor.y : anchor.y - height, viewport.height - inset - height));
  return { x, y, width, height, rows, direction };
}

/** Preserve the visible layout and park a released middle bar clear of its peers. */
export function detachShortcutBarLayout(bars: ShortcutBarsState, groups: ShortcutBarGroup[], barId: ShortcutBarId, viewport: ViewportSize) {
  const group = groups.find(group => group.barIds.includes(barId));
  if (!group) return { bars, groups };
  const positions = fitShortcutBarPositions(bars, groups, viewport);
  const next = { ...bars };
  for (const id of group.barIds) next[id] = { ...bars[id], position: positions[id] };
  const remaining = detachShortcutBarGroup(groups, barId);
  const fitted = fitShortcutBarPositions(next, remaining, viewport);
  const bounds = (id: ShortcutBarId) => {
    const bar = next[id], length = (57 + bar.assignments.length * 42) * bar.scale, thickness = 53 * bar.scale;
    const width = bar.rotation === 90 ? thickness : length, height = bar.rotation === 90 ? length : thickness;
    return { left: fitted[id].x / 100 * viewport.width - width / 2, top: fitted[id].y / 100 * viewport.height - height / 2, width, height };
  };
  const released = bounds(barId);
  const others = (Object.keys(next) as ShortcutBarId[]).filter(id => id !== barId && next[id].visible).map(bounds);
  const overlaps = (box: typeof released) => others.some(other => box.left < other.left + other.width + 4 && box.left + box.width + 4 > other.left && box.top < other.top + other.height + 4 && box.top + box.height + 4 > other.top);
  if (overlaps(released)) {
    const peers = group.barIds.filter(id => id !== barId && next[id].visible).map(bounds);
    const minX = Math.min(...peers.map(p => p.left)), maxX = Math.max(...peers.map(p => p.left + p.width));
    const minY = Math.min(...peers.map(p => p.top)), maxY = Math.max(...peers.map(p => p.top + p.height));
    const candidates = [
      { ...released, left: maxX + 12 }, { ...released, left: minX - released.width - 12 },
      { ...released, top: maxY + 12 }, { ...released, top: minY - released.height - 12 },
    ].map(box => ({ ...box, left: Math.max(8, Math.min(viewport.width - 8 - box.width, box.left)), top: Math.max(88, Math.min(viewport.height - 8 - box.height, box.top)) }))
      .filter(box => !overlaps(box))
      .sort((a, b) => Math.hypot(a.left - released.left, a.top - released.top) - Math.hypot(b.left - released.left, b.top - released.top));
    const free = candidates[0];
    if (free) next[barId] = { ...next[barId], position: { x: (free.left + free.width / 2) / viewport.width * 100, y: (free.top + free.height / 2) / viewport.height * 100 } };
  }
  return { bars: next, groups: remaining };
}

/** Fit attached bars for display; only deliberate bar edits change saved positions. */
export function fitShortcutBarPositions(bars: ShortcutBarsState, groups: ShortcutBarGroup[], viewport: ViewportSize) {
  const ids = Object.keys(bars) as ShortcutBarId[];
  const positions = Object.fromEntries(ids.map(id => [id, { ...bars[id].position }])) as Record<ShortcutBarId, { x: number; y: number }>;
  const attached = new Set(groups.flatMap(group => group.barIds));
  const layouts = [...groups, ...ids.filter(id => !attached.has(id)).map(id => ({ axis: 'horizontal' as const, barIds: [id] }))];
  const size = (id: ShortcutBarId) => {
    const bar = bars[id], length = (57 + bar.assignments.length * 42) * bar.scale, thickness = 53 * bar.scale;
    return bar.rotation === 90 ? { width: thickness, height: length } : { width: length, height: thickness };
  };
  for (const group of layouts) {
    const visible = group.barIds.filter(id => bars[id].visible);
    if (!visible.length) continue;
    const anchorSize = size(visible[0]), anchor = positions[visible[0]];
    const left = anchor.x / 100 * viewport.width - anchorSize.width / 2;
    const top = anchor.y / 100 * viewport.height - anchorSize.height / 2;
    let cursor = group.axis === 'horizontal' ? left : top;
    const placements = visible.map(id => {
      const bounds = size(id);
      const x = group.axis === 'horizontal' ? cursor : left + (anchorSize.width - bounds.width) / 2;
      const y = group.axis === 'vertical' ? cursor : top;
      cursor += (group.axis === 'horizontal' ? bounds.width : bounds.height) + 6;
      return { id, x, y, ...bounds };
    });
    const minX = Math.min(...placements.map(p => p.x)), maxX = Math.max(...placements.map(p => p.x + p.width));
    const minY = Math.min(...placements.map(p => p.y)), maxY = Math.max(...placements.map(p => p.y + p.height));
    const shiftX = Math.min(Math.max(0, 8 - minX), viewport.width - 8 - maxX);
    const shiftY = Math.min(Math.max(0, 88 - minY), viewport.height - 8 - maxY);
    for (const p of placements) positions[p.id] = { x: (p.x + shiftX + p.width / 2) / viewport.width * 100, y: (p.y + shiftY + p.height / 2) / viewport.height * 100 };
  }
  return positions;
}

export function shortcutDockLayout(bars: ShortcutBarsState, groups: ShortcutBarGroup[], viewport: ViewportSize, practice = false): ShortcutDockLayout {
  const visible = Object.values(bars).filter(bar => bar.visible);
  const overflow = groups.some(group => {
    const sizes = group.barIds.filter(id => bars[id].visible).map(id => {
      const bar = bars[id], length = (57 + bar.assignments.length * 42) * bar.scale, thickness = 53 * bar.scale;
      return bar.rotation === 90 ? { width: thickness, height: length } : { width: length, height: thickness };
    });
    if (!sizes.length) return false;
    const width = group.axis === 'horizontal' ? sizes.reduce((sum, size) => sum + size.width, 0) + (sizes.length - 1) * 6 : Math.max(...sizes.map(size => size.width));
    const height = group.axis === 'vertical' ? sizes.reduce((sum, size) => sum + size.height, 0) + (sizes.length - 1) * 6 : Math.max(...sizes.map(size => size.height));
    return width > viewport.width - 32 || height > viewport.height - 140;
  });
  const docked = visible.length > 0 && (practice || viewport.width < 1000 || viewport.height < 560 || overflow);
  const stacked = viewport.width < 700;
  return { docked, stacked, height: !docked ? 0 : stacked ? visible.length * (viewport.height < 760 ? 43 : 49) + 10 : 76 };
}

/** Fit the displayed panel without changing the player's saved position or size. */
export function fitMinimap(viewport: ViewportSize, requestedSize: number, position?: { x: number; y: number }, dockHeight = 0) {
  const inset = 12, top = viewport.width <= 900 ? 124 : 100;
  const limit = Math.max(112, Math.min(viewport.width - inset * 2, viewport.height - top - dockHeight - 100));
  const size = Math.min(requestedSize, viewport.width < 1000 ? 210 : 450, limit);
  const maxX = Math.max(inset, viewport.width - size - inset);
  const maxY = Math.max(top, viewport.height - dockHeight - size - 90);
  return { size, x: Math.min(maxX, Math.max(inset, position?.x ?? maxX)), y: Math.min(maxY, Math.max(top, position?.y ?? maxY)) };
}
