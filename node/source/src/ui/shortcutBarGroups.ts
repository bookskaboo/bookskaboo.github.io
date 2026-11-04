import type { ShortcutBarGroup, ShortcutBarId, ShortcutBarsState } from './ShortcutBars';

const DISPLAY_ORDER: ShortcutBarId[] = ['production', 'logistics', 'storage'];

/** Floating group order runs left-to-right or top-to-bottom; docks use DOM order. */
export function shortcutGroupLead(group: ShortcutBarGroup, bars: ShortcutBarsState, docked = false) {
  const order = docked ? DISPLAY_ORDER.filter(id => group.barIds.includes(id)) : group.barIds;
  return order.find(id => bars[id].visible);
}

/** Release only the chosen bar; retain any group with at least two members. */
export function detachShortcutBarGroup(groups: ShortcutBarGroup[], barId: ShortcutBarId) {
  return groups.flatMap(group => {
    if (!group.barIds.includes(barId)) return [group];
    const barIds = group.barIds.filter(id => id !== barId);
    return barIds.length > 1 ? [{ ...group, barIds }] : [];
  });
}
