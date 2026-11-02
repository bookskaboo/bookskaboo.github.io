import { NODE_DEFINITIONS } from '../content/nodes';
import type { NodeKind } from '../domain/types';
import { SHORTCUT_BARS_KEY, SHORTCUT_BAR_GROUPS_KEY, SHORTCUT_UNLOCKS_KEY, SHORTCUT_NEW_ASSIGNMENTS_KEY } from '../persistence/storageKeys';
import { createDefaultShortcutBars, normalizeShortcutBars, normalizeShortcutBarGroups, DEFAULT_SHORTCUT_BAR_GROUPS, SHORTCUT_BAR_IDS } from './ShortcutBars';

export const readShortcutBars = () => { try { const saved = localStorage.getItem(SHORTCUT_BARS_KEY); return saved ? normalizeShortcutBars(JSON.parse(saved)) : createDefaultShortcutBars(window.innerWidth, window.innerHeight); } catch { return createDefaultShortcutBars(window.innerWidth, window.innerHeight); } };
export const readShortcutBarGroups = () => { try { const saved = localStorage.getItem(SHORTCUT_BAR_GROUPS_KEY); if (!saved && localStorage.getItem(SHORTCUT_BARS_KEY)) return [{ axis: 'vertical' as const, barIds: [...SHORTCUT_BAR_IDS] }]; return normalizeShortcutBarGroups(JSON.parse(saved ?? 'null')); } catch { return DEFAULT_SHORTCUT_BAR_GROUPS; } };
export const readKnownShortcutUnlocks = () => { try { const parsed = JSON.parse(localStorage.getItem(SHORTCUT_UNLOCKS_KEY) ?? 'null'); return Array.isArray(parsed) ? parsed.filter((kind): kind is NodeKind => typeof kind === 'string' && kind in NODE_DEFINITIONS) : undefined; } catch { return undefined; } };
export const readNewShortcutAssignments = () => { try { const parsed = JSON.parse(localStorage.getItem(SHORTCUT_NEW_ASSIGNMENTS_KEY) ?? '[]'); return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []); } catch { return new Set<string>(); } };

