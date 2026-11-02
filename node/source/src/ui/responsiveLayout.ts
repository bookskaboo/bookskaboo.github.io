import type { ShortcutBarGroup, ShortcutBarsState } from './ShortcutBars';

export interface ViewportSize { width: number; height: number }
export interface ShortcutDockLayout { docked: boolean; stacked: boolean; height: number }

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
