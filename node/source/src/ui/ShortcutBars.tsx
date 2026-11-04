import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BUILDABLE_NODES, isNodeUnlocked, NODE_DEFINITIONS, getBuildNodeDefinition } from '../content/nodes';
import type { NodeKind } from '../domain/types';
import { detachShortcutBarLayout, fitShortcutAssignmentMenu, fitShortcutBarPositions, type ShortcutDockLayout } from './responsiveLayout';
import { shortcutGroupLead } from './shortcutBarGroups';
import { NodeIcon } from './NodeIcon';
import { useViewport } from './useViewport';

export type ShortcutBarId = 'production' | 'logistics' | 'storage';
export interface ShortcutBarConfig {
  visible: boolean;
  position: { x: number; y: number };
  scale: number;
  rotation: 0 | 90;
  locked: boolean;
  assignments: Array<NodeKind | null>;
}
export type ShortcutBarsState = Record<ShortcutBarId, ShortcutBarConfig>;
export interface ShortcutBarGroup { axis: 'horizontal' | 'vertical'; barIds: ShortcutBarId[] }
interface ShortcutBarSnapTarget { movingBarId: ShortcutBarId; targetBarId: ShortcutBarId; axis: 'horizontal' | 'vertical'; before: boolean }
interface ShortcutBarRect { left: number; top: number; width: number; height: number }

export const SHORTCUT_BAR_IDS: ShortcutBarId[] = ['production', 'logistics', 'storage'];
export const SHORTCUT_BAR_LABELS: Record<ShortcutBarId, string> = { production: 'Production', logistics: 'Logistics', storage: 'Storage' };

export const DEFAULT_SHORTCUT_BARS: ShortcutBarsState = {
  production: { visible: true, position: { x: 30.76, y: 94 }, scale: .9, rotation: 0, locked: false, assignments: ['extractor', null, null, null, null] },
  logistics: { visible: true, position: { x: 50, y: 94 }, scale: .9, rotation: 0, locked: false, assignments: ['filter', null, null, null, null] },
  storage: { visible: false, position: { x: 69.24, y: 94 }, scale: .9, rotation: 0, locked: false, assignments: [null, null, null, null, null] },
};
export const DEFAULT_SHORTCUT_BAR_GROUPS: ShortcutBarGroup[] = [{ axis: 'horizontal', barIds: [...SHORTCUT_BAR_IDS] }];
export function createDefaultShortcutBars(width = 1280, height = 720): ShortcutBarsState {
  const bars = structuredClone(DEFAULT_SHORTCUT_BARS);
  const scale = Math.min(.9, Math.max(.72, (width - 44) / (267 * 3)));
  const step = 267 * scale + 6;
  SHORTCUT_BAR_IDS.forEach((id, index) => {
    bars[id].scale = scale;
    bars[id].position = { x: ((width / 2 + (index - 1) * step) / width) * 100, y: ((height - 12 - 53 * scale / 2) / height) * 100 };
  });
  return bars;
}
const GROUP_GAP = 6;
const SNAP_DISTANCE = 32;

export const shortcutBarForKind = (kind: NodeKind): ShortcutBarId => NODE_DEFINITIONS[kind].category === 'Storage' ? 'storage' : NODE_DEFINITIONS[kind].category === 'Logistics' ? 'logistics' : 'production';

/** Removes stale/locked assignments without auto-filling newly unlocked nodes. */
export function reconcileShortcutBars(bars: ShortcutBarsState, unlockedResearch: readonly string[]) {
  const unlockedKinds = new Set(BUILDABLE_NODES.filter((node) => isNodeUnlocked(node.kind, unlockedResearch)).map((node) => node.kind));
  const seen = new Set<NodeKind>();
  let displacedCart = false, cartRemovedFromStorage = false;
  const reconciled = Object.fromEntries(SHORTCUT_BAR_IDS.map((id) => {
    const assignments = bars[id].assignments.map((kind) => {
      if (kind === 'chest') kind = 'woodenChest';
      if (kind === 'woodenChest' && id !== 'logistics') {
        displacedCart ||= unlockedKinds.has(kind);
        cartRemovedFromStorage ||= id === 'storage';
        return null;
      }
      if (!kind || !unlockedKinds.has(kind) || seen.has(kind)) return null;
      seen.add(kind);
      return kind;
    });
    while (assignments.length > 5 && assignments.at(-1) === null) assignments.pop();
    return [id, { ...bars[id], assignments }];
  })) as ShortcutBarsState;
  if (cartRemovedFromStorage && reconciled.storage.assignments.every(kind => kind === null)) reconciled.storage.visible = false;
  return displacedCart ? addUnlockedNodeShortcuts(reconciled, ['woodenChest'], unlockedResearch) : reconciled;
}

/** Original progression rule: a new unlock fills its category bar's first empty slot, then extends the bar. */
export function addUnlockedNodeShortcuts(bars: ShortcutBarsState, kinds: readonly NodeKind[], unlockedResearch: readonly string[]) {
  let next = bars;
  const assigned = new Set(SHORTCUT_BAR_IDS.flatMap((id) => bars[id].assignments.filter((kind): kind is NodeKind => Boolean(kind))));
  kinds.forEach((kind) => {
    if (assigned.has(kind) || !BUILDABLE_NODES.some((definition) => definition.kind === kind) || !isNodeUnlocked(kind, unlockedResearch)) return;
    const barId = shortcutBarForKind(kind);
    const assignments = [...next[barId].assignments];
    const emptyIndex = assignments.indexOf(null);
    if (emptyIndex >= 0) assignments[emptyIndex] = kind;
    else assignments.push(kind);
    const firstStorageUnlock = barId === 'storage' && next.storage.assignments.every(kind => kind === null);
    next = { ...next, [barId]: { ...next[barId], assignments, visible: firstStorageUnlock || next[barId].visible } };
    assigned.add(kind);
  });
  return next;
}

export function normalizeShortcutBarGroups(value: unknown): ShortcutBarGroup[] {
  if (value === null) return DEFAULT_SHORTCUT_BAR_GROUPS;
  if (!Array.isArray(value)) return DEFAULT_SHORTCUT_BAR_GROUPS;
  const used = new Set<ShortcutBarId>();
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const raw = candidate as Partial<ShortcutBarGroup>;
    const barIds = Array.isArray(raw.barIds) ? raw.barIds.filter((id): id is ShortcutBarId => SHORTCUT_BAR_IDS.includes(id as ShortcutBarId) && !used.has(id as ShortcutBarId)) : [];
    if (barIds.length < 2) return [];
    barIds.forEach((id) => used.add(id));
    return [{ axis: raw.axis === 'horizontal' ? 'horizontal' : 'vertical', barIds }];
  });
}

export function normalizeShortcutBars(value: unknown): ShortcutBarsState {
  const incoming = value && typeof value === 'object' ? value as Partial<ShortcutBarsState> : {};
  return Object.fromEntries(SHORTCUT_BAR_IDS.map((id) => {
    const fallback = DEFAULT_SHORTCUT_BARS[id]; const candidate = incoming[id];
    return [id, {
      visible: typeof candidate?.visible === 'boolean' ? candidate.visible : fallback.visible,
      position: { x: Math.min(96, Math.max(4, Number(candidate?.position?.x) || fallback.position.x)), y: Math.min(98, Math.max(12, Number(candidate?.position?.y) || fallback.position.y)) },
      scale: Math.min(1.55, Math.max(.72, Number(candidate?.scale) || fallback.scale)), rotation: candidate?.rotation === 90 ? 90 : 0, locked: candidate?.locked === true,
      assignments: Array.from({ length: Math.max(5, candidate?.assignments?.length ?? 0) }, (_, index) => {
        if (!Array.isArray(candidate?.assignments)) return fallback.assignments[index] ?? null;
        const kind = candidate.assignments[index];
        return kind && NODE_DEFINITIONS[kind] ? kind : null;
      }),
    } satisfies ShortcutBarConfig];
  })) as ShortcutBarsState;
}

interface Props {
  bars: ShortcutBarsState;
  groups: ShortcutBarGroup[];
  unlockedResearch: readonly string[];
  newAssignmentKeys: ReadonlySet<string>;
  placing?: NodeKind;
  onChange(bars: ShortcutBarsState): void;
  onGroupsChange(groups: ShortcutBarGroup[]): void;
  dockLayout: ShortcutDockLayout;
  canBuild?(kind: NodeKind): boolean;
  onBuild(kind: NodeKind): void;
  onBuildDragEnd(kind: NodeKind, clientX: number, clientY: number, repeat: boolean): void;
  onBuildDragCancel(): void;
  onAcknowledgeAssignment(barId: ShortcutBarId, slot: number): void;
}

export function ShortcutBars({ dockLayout, canBuild, bars, groups, unlockedResearch, newAssignmentKeys, placing, onChange, onGroupsChange, onBuild, onBuildDragEnd, onBuildDragCancel, onAcknowledgeAssignment }: Props) {
  const [menu, setMenu] = useState<{ barId: ShortcutBarId; slot: number; x: number; y: number }>();
  const menuRef = useRef<HTMLDivElement>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<'All' | 'Production' | 'Logistics'>('All');
  const openMenu = (next: NonNullable<typeof menu>) => { setAssignmentFilter('All'); setMenu(next); };
  const viewport = useViewport();
  const dragRef = useRef<{ barId: ShortcutBarId; pointerId: number; startX: number; startY: number; movingIds: ShortcutBarId[]; origins: Partial<Record<ShortcutBarId, { x: number; y: number }>>; rects: Partial<Record<ShortcutBarId, ShortcutBarRect>> } | undefined>(undefined);
  const resizeRef = useRef<{ barId: ShortcutBarId; pointerId: number; startX: number; startY: number; scale: number } | undefined>(undefined);
  const shortcutDragRef = useRef<{ pointerId: number; barId: ShortcutBarId; slot: number; kind: NodeKind; startX: number; startY: number; started: boolean } | undefined>(undefined);
  const suppressClickRef = useRef<string | undefined>(undefined);
  const [draggingSlot, setDraggingSlot] = useState<string>();
  const elementsRef = useRef<Partial<Record<ShortcutBarId, HTMLElement | null>>>({});
  const barsRef = useRef(bars); const groupsRef = useRef(groups);
  const [snapTarget, setSnapTarget] = useState<ShortcutBarSnapTarget | undefined>(undefined); const snapTargetRef = useRef<ShortcutBarSnapTarget | undefined>(undefined);
  useEffect(() => { barsRef.current = bars; }, [bars]);
  useEffect(() => { groupsRef.current = groups; }, [groups]);
  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(undefined); };
    const closeOnOutside = (event: PointerEvent) => { if (menuRef.current && !event.composedPath().includes(menuRef.current)) setMenu(undefined); };
    window.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutside, true);
    return () => { window.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOnOutside, true); };
  }, [menu]);
  const commitBars = (next: ShortcutBarsState) => { barsRef.current = next; onChange(next); };
  const patchBar = (barId: ShortcutBarId, patch: Partial<ShortcutBarConfig>) => commitBars({ ...barsRef.current, [barId]: { ...barsRef.current[barId], ...patch } });
  const dockedRef = useRef(dockLayout.docked); dockedRef.current = dockLayout.docked;
  const reflowGroup = (group: ShortcutBarGroup) => {
    if (dockedRef.current) return;
    const ids = group.barIds.filter((id) => barsRef.current[id].visible && elementsRef.current[id]); if (ids.length < 2) return;
    const rects = Object.fromEntries(ids.map((id) => [id, elementsRef.current[id]!.getBoundingClientRect()])) as Record<ShortcutBarId, DOMRect>;
    const anchor = rects[ids[0]]; let cursor = group.axis === 'horizontal' ? anchor.left : anchor.top;
    const placements = Object.fromEntries(ids.map((id) => { const rect = rects[id]; const left = group.axis === 'horizontal' ? cursor : anchor.left + (anchor.width - rect.width) / 2; const top = group.axis === 'vertical' ? cursor : anchor.top; cursor += (group.axis === 'horizontal' ? rect.width : rect.height) + GROUP_GAP; return [id, { left, top }]; })) as Record<ShortcutBarId, { left: number; top: number }>;
    const placed = ids.map((id) => ({ left: placements[id].left, top: placements[id].top, right: placements[id].left + rects[id].width, bottom: placements[id].top + rects[id].height }));
    const minLeft = Math.min(...placed.map((rect) => rect.left)); const maxRight = Math.max(...placed.map((rect) => rect.right)); const minTop = Math.min(...placed.map((rect) => rect.top)); const maxBottom = Math.max(...placed.map((rect) => rect.bottom));
    let shiftX = minLeft < 8 ? 8 - minLeft : 0; let shiftY = minTop < 88 ? 88 - minTop : 0;
    if (maxRight + shiftX > window.innerWidth - 8) shiftX += window.innerWidth - 8 - (maxRight + shiftX);
    if (maxBottom + shiftY > window.innerHeight - 8) shiftY += window.innerHeight - 8 - (maxBottom + shiftY);
    const next = { ...barsRef.current };
    ids.forEach((id) => { const rect = rects[id]; next[id] = { ...next[id], position: { x: ((placements[id].left + shiftX + rect.width / 2) / window.innerWidth) * 100, y: ((placements[id].top + shiftY + rect.height / 2) / window.innerHeight) * 100 } }; });
    commitBars(next);
  };
  const fittedPositions = fitShortcutBarPositions(bars, groups, { width: window.innerWidth, height: window.innerHeight });
  const detachBar = (barId: ShortcutBarId) => {
    setMenu(undefined);
    const viewport = { width: Math.max(dockLayout.docked ? 1280 : 0, window.innerWidth), height: Math.max(dockLayout.docked ? 720 : 0, window.innerHeight) };
    const detached = detachShortcutBarLayout(barsRef.current, groupsRef.current, barId, viewport);
    groupsRef.current = detached.groups;
    commitBars(detached.bars);
    onGroupsChange(detached.groups);
  };

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, barId: ShortcutBarId) => {
    if (event.button !== 0 || bars[barId].locked) return; event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    const group = groupsRef.current.find((candidate) => candidate.barIds.includes(barId)); const movingIds = group?.barIds.filter((id) => barsRef.current[id].visible) ?? [barId];
    const rects = Object.fromEntries(SHORTCUT_BAR_IDS.flatMap((id) => { const bounds = elementsRef.current[id]?.getBoundingClientRect(); return bounds && barsRef.current[id].visible ? [[id, { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }] as const] : []; }));
    dragRef.current = { barId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, movingIds, origins: Object.fromEntries(movingIds.map((id) => { const rect = rects[id]!; return [id, { x: (rect.left + rect.width / 2) / window.innerWidth * 100, y: (rect.top + rect.height / 2) / window.innerHeight * 100 }]; })), rects };
    snapTargetRef.current = undefined; setSnapTarget(undefined);
  };
  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current; const resize = resizeRef.current;
    if (drag?.pointerId === event.pointerId) {
      const rawDeltaX = event.clientX - drag.startX; const rawDeltaY = event.clientY - drag.startY;
      const movingRects = drag.movingIds.map((id) => drag.rects[id]).filter((rect): rect is ShortcutBarRect => Boolean(rect));
      const minLeft = Math.min(...movingRects.map((rect) => rect.left)); const maxRight = Math.max(...movingRects.map((rect) => rect.left + rect.width)); const minTop = Math.min(...movingRects.map((rect) => rect.top)); const maxBottom = Math.max(...movingRects.map((rect) => rect.top + rect.height));
      let finalDeltaX = Math.min(window.innerWidth - 8 - maxRight, Math.max(8 - minLeft, rawDeltaX)); let finalDeltaY = Math.min(window.innerHeight - 8 - maxBottom, Math.max(88 - minTop, rawDeltaY)); let nearest: (ShortcutBarSnapTarget & { correctionX: number; correctionY: number; distance: number }) | undefined;
      drag.movingIds.forEach((movingId) => { const moving = drag.rects[movingId]; if (!moving) return; SHORTCUT_BAR_IDS.filter((id) => !drag.movingIds.includes(id) && barsRef.current[id].visible).forEach((targetId) => { const target = drag.rects[targetId]; if (!target) return; const movedLeft = moving.left + finalDeltaX; const movedTop = moving.top + finalDeltaY; const placements = [{ axis: 'horizontal' as const, before: true, x: target.left - GROUP_GAP - moving.width, y: target.top }, { axis: 'horizontal' as const, before: false, x: target.left + target.width + GROUP_GAP, y: target.top }, { axis: 'vertical' as const, before: true, x: target.left + (target.width - moving.width) / 2, y: target.top - GROUP_GAP - moving.height }, { axis: 'vertical' as const, before: false, x: target.left + (target.width - moving.width) / 2, y: target.top + target.height + GROUP_GAP }]; placements.forEach((placement) => { const correctionX = placement.x - movedLeft; const correctionY = placement.y - movedTop; const distance = Math.hypot(correctionX, correctionY); const correctedX = finalDeltaX + correctionX; const correctedY = finalDeltaY + correctionY; const inBounds = correctedX >= 8 - minLeft && correctedX <= window.innerWidth - 8 - maxRight && correctedY >= 88 - minTop && correctedY <= window.innerHeight - 8 - maxBottom; if (inBounds && distance <= SNAP_DISTANCE && (!nearest || distance < nearest.distance)) nearest = { movingBarId: movingId, targetBarId: targetId, axis: placement.axis, before: placement.before, correctionX, correctionY, distance }; }); }); });
      if (nearest) { finalDeltaX += nearest.correctionX; finalDeltaY += nearest.correctionY; }
      const next = { ...barsRef.current }; drag.movingIds.forEach((id) => { const origin = drag.origins[id]!; next[id] = { ...next[id], position: { x: Math.min(96, Math.max(4, origin.x + finalDeltaX / window.innerWidth * 100)), y: Math.min(92, Math.max(12, origin.y + finalDeltaY / window.innerHeight * 100)) } }; }); commitBars(next);
      const resolved = nearest ? { movingBarId: nearest.movingBarId, targetBarId: nearest.targetBarId, axis: nearest.axis, before: nearest.before } : undefined; snapTargetRef.current = resolved; setSnapTarget(resolved);
    }
    if (resize?.pointerId === event.pointerId) patchBar(resize.barId, { scale: Math.min(1.55, Math.max(.72, resize.scale + ((event.clientX - resize.startX) + (event.clientY - resize.startY)) / 260)) });
  };
  const end = (event: ReactPointerEvent<HTMLElement>, commit = true) => { const drag = dragRef.current; if (drag?.pointerId === event.pointerId) { dragRef.current = undefined; const snapped = snapTargetRef.current; if (!commit) { const next = { ...barsRef.current }; drag.movingIds.forEach((id) => { next[id] = { ...next[id], position: drag.origins[id]! }; }); commitBars(next); } else if (snapped) { const movingGroup = groupsRef.current.find((group) => group.barIds.includes(snapped.movingBarId)); const targetGroup = groupsRef.current.find((group) => group.barIds.includes(snapped.targetBarId)); const sortAlongAxis = (ids: ShortcutBarId[]) => [...ids].sort((a, b) => { const first = elementsRef.current[a]?.getBoundingClientRect(); const second = elementsRef.current[b]?.getBoundingClientRect(); return !first || !second ? 0 : snapped.axis === 'horizontal' ? first.left - second.left : first.top - second.top; }); const movingIds = sortAlongAxis(movingGroup?.barIds ?? [snapped.movingBarId]); const targetIds = sortAlongAxis(targetGroup?.barIds ?? [snapped.targetBarId]); const merged: ShortcutBarGroup = { axis: snapped.axis, barIds: [...new Set(snapped.before ? [...movingIds, ...targetIds] : [...targetIds, ...movingIds])] }; const mergedSet = new Set(merged.barIds); const nextGroups = [...groupsRef.current.filter((group) => !group.barIds.some((id) => mergedSet.has(id))), merged]; groupsRef.current = nextGroups; onGroupsChange(nextGroups); window.requestAnimationFrame(() => reflowGroup(merged)); } snapTargetRef.current = undefined; setSnapTarget(undefined); } if (resizeRef.current?.pointerId === event.pointerId) { const group = groupsRef.current.find((candidate) => candidate.barIds.includes(resizeRef.current!.barId)); resizeRef.current = undefined; if (group) window.requestAnimationFrame(() => reflowGroup(group)); } };
  const beginShortcutDrag = (event: ReactPointerEvent<HTMLButtonElement>, barId: ShortcutBarId, slot: number, kind: NodeKind) => {
    if (event.button !== 0 || placing) return; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); shortcutDragRef.current = { pointerId: event.pointerId, barId, slot, kind, startX: event.clientX, startY: event.clientY, started: false };
  };
  const updateShortcutDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = shortcutDragRef.current; if (!drag || drag.pointerId !== event.pointerId || drag.started || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
    event.preventDefault(); event.stopPropagation(); drag.started = true; suppressClickRef.current = `${drag.barId}:${drag.slot}`; setDraggingSlot(suppressClickRef.current); onBuild(drag.kind);
  };
  const finishShortcutDrag = (event: ReactPointerEvent<HTMLButtonElement>, commit: boolean) => {
    const drag = shortcutDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; shortcutDragRef.current = undefined; setDraggingSlot(undefined); if (!drag.started) return;
    event.preventDefault(); event.stopPropagation(); suppressClickRef.current = `${drag.barId}:${drag.slot}`; if (commit) onBuildDragEnd(drag.kind, event.clientX, event.clientY, event.shiftKey); else onBuildDragCancel(); window.setTimeout(() => { if (suppressClickRef.current === `${drag.barId}:${drag.slot}`) suppressClickRef.current = undefined; }, 0);
  };

  const assignmentChoices = BUILDABLE_NODES.filter(definition => (!definition.unlockResearch || unlockedResearch.includes(definition.unlockResearch)) && (assignmentFilter === 'All' || definition.category === assignmentFilter)).map(definition => getBuildNodeDefinition(definition.kind, unlockedResearch));
  const menuLayout = menu ? fitShortcutAssignmentMenu(viewport, menu, assignmentChoices.length) : undefined;

  return <div className="shortcut-bars-layer" data-docked={dockLayout.docked} data-stacked={dockLayout.stacked} aria-label="Node shortcut bars" onPointerDown={() => setMenu(undefined)}>
    {SHORTCUT_BAR_IDS.map((barId, barIndex) => { const bar = bars[barId]; if (!bar.visible) return null; const group = groups.find(group => group.barIds.includes(barId)); const releaseHandle = Boolean(group && shortcutGroupLead(group, bars, dockLayout.docked) !== barId); return <section
      ref={(element) => { elementsRef.current[barId] = element; }} key={barId} className={`node-shortcut-bar ${bar.rotation === 90 ? 'vertical' : 'horizontal'} ${bar.locked ? 'locked' : ''} ${groups.some((group) => group.barIds.includes(barId)) ? 'grouped' : ''} ${snapTarget && (snapTarget.movingBarId === barId || snapTarget.targetBarId === barId) ? 'snap-ready' : ''}`}
      aria-label={`Shortcut Bar ${barIndex + 1} — ${SHORTCUT_BAR_LABELS[barId]}`}
      style={{ left: `${fittedPositions[barId].x}%`, top: `${fittedPositions[barId].y}%`, transform: `translate(-50%, -50%) scale(${bar.scale})`, '--shortcut-bar-length': `${57 + bar.assignments.length * 42}px` } as React.CSSProperties}
      onPointerMove={move} onPointerUp={(event) => end(event, true)} onPointerCancel={(event) => end(event, false)} onContextMenu={(event) => { if ((event.target as HTMLElement).closest('.shortcut-slot')) return; const group = groupsRef.current.find((candidate) => candidate.barIds.includes(barId)); if (!group) return; event.preventDefault(); const next = groupsRef.current.filter((candidate) => candidate !== group); groupsRef.current = next; onGroupsChange(next); }}
    >
      <span className="shortcut-bar-name">{SHORTCUT_BAR_LABELS[barId]}</span><div className="shortcut-bar-controls">
        <button data-tooltip="Rotate shortcut bar" data-tooltip-detail={bar.locked ? 'Unlock this bar before rotating it.' : 'Attached bars rotate together.'} disabled={bar.locked} onClick={() => { const group = groupsRef.current.find((candidate) => candidate.barIds.includes(barId)); if (!group) { patchBar(barId, { rotation: bar.rotation === 0 ? 90 : 0 }); return; } const next = { ...barsRef.current }; group.barIds.forEach((id) => { next[id] = { ...next[id], rotation: next[id].rotation === 0 ? 90 : 0 }; }); commitBars(next); const rotated = { ...group, axis: group.axis === 'horizontal' ? 'vertical' as const : 'horizontal' as const }; const nextGroups = groupsRef.current.map((candidate) => candidate === group ? rotated : candidate); groupsRef.current = nextGroups; onGroupsChange(nextGroups); window.setTimeout(() => reflowGroup(rotated), 0); }}>↻</button>
        <button data-tooltip={bar.locked ? 'Unlock shortcut bar' : 'Lock shortcut bar'} data-tooltip-detail={bar.locked ? 'Allow this bar to move, rotate, and resize.' : 'Freeze this bar in its current layout.'} className={bar.locked ? 'active' : ''} onClick={() => patchBar(barId, { locked: !bar.locked })}>{bar.locked ? '●' : '○'}</button>
      </div>
      {/* A new lock must not receive the click that finishes dragging its former grip. */}
      {releaseHandle ? <button key="release" type="button" className="shortcut-drag-handle shortcut-group-release" aria-label={`Detach ${SHORTCUT_BAR_LABELS[barId]} shortcut bar`} data-tooltip="Detach shortcut bar" data-tooltip-detail="Release this bar from its attached group. It has filed for independence." onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); detachBar(barId); }} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }}>
        <svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2" /><rect x="2" y="7" width="12" height="9" rx="2" /><path d="M8 10v3" /></svg>
      </button> : <button key="drag" type="button" className="shortcut-drag-handle" aria-label={group ? 'Move attached shortcut bars' : `Move ${SHORTCUT_BAR_LABELS[barId]} shortcut bar`} data-tooltip={`${SHORTCUT_BAR_LABELS[barId]} shortcuts`} data-tooltip-detail={dockLayout.docked ? 'Widen the window to drag this bar.' : bar.locked ? 'This shortcut bar is locked.' : group ? 'Drag to move the attached bars. Click another bar’s lock to detach it.' : 'Drag near another bar to attach.'} disabled={bar.locked || dockLayout.docked} onPointerDown={(event) => beginDrag(event, barId)}><i /><i /><i /><i /><i /><i /></button>}
      <div className="shortcut-slots">
        {bar.assignments.map((kind, slot) => { const definition = kind ? getBuildNodeDefinition(kind, unlockedResearch) : undefined; const unlocked = !definition?.unlockResearch || unlockedResearch.includes(definition.unlockResearch); const slotKey = `${barId}:${slot}`; const isNewlyAdded = Boolean(kind && newAssignmentKeys.has(`${slotKey}:${kind}`)); return <span key={slot} className="shortcut-slot" data-tooltip={definition?.name ?? 'Unassigned shortcut'} data-tooltip-detail={definition ? `${definition.category} · ${canBuild && kind && !canBuild(kind) ? 'Available in another tutorial step.' : 'Click or drag to build · Right-click to reassign.'}` : 'Click or right-click to choose a node.'} data-tooltip-tone={definition?.accentCss} onPointerEnter={() => { if (isNewlyAdded) onAcknowledgeAssignment(barId, slot); }}><button
           className={`${kind === placing ? 'active' : ''} ${!kind ? 'empty' : ''} ${draggingSlot === slotKey ? 'dragging-build' : ''} ${isNewlyAdded ? 'new-auto-assignment' : ''}`} disabled={Boolean(kind && (!unlocked || placing || (canBuild && !canBuild(kind))))}
          data-shortcut-kind={kind ?? undefined}
          style={{ '--node-color': definition?.accentCss ?? '#87939b' } as React.CSSProperties}
          onPointerDown={(event) => { if (kind && unlocked && (!canBuild || canBuild(kind))) beginShortcutDrag(event, barId, slot, kind); }} onPointerMove={updateShortcutDrag} onPointerUp={(event) => finishShortcutDrag(event, true)} onPointerCancel={(event) => finishShortcutDrag(event, false)}
          onClick={(event) => { event.stopPropagation(); if (suppressClickRef.current === slotKey) { suppressClickRef.current = undefined; event.preventDefault(); return; } if (kind && unlocked && !placing && (!canBuild || canBuild(kind))) onBuild(kind); else if (!kind) { const bounds = event.currentTarget.getBoundingClientRect(); openMenu({ barId, slot, x: bounds.left + bounds.width / 2, y: bounds.bottom + 5 }); } }}
          onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openMenu({ barId, slot, x: event.clientX, y: event.clientY }); }}
        ><kbd>{barIndex === 0 ? '' : barIndex === 1 ? '⇧' : '⌃'}{slot + 1}</kbd><i>{kind ? <NodeIcon kind={kind} /> : '+'}</i><span>{definition?.name ?? 'Assign'}</span></button></span>; })}
      </div>
      <button className="shortcut-resize-handle" data-tooltip="Resize shortcut bar" data-tooltip-detail={bar.locked ? 'Unlock this bar before resizing it.' : 'Drag to change the bar scale.'} disabled={bar.locked} onPointerDown={(event) => { if (event.button !== 0 || bar.locked) return; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); resizeRef.current = { barId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, scale: bar.scale }; }} />
    </section>; })}
    {menu && menuLayout && <div ref={menuRef} className="shortcut-assignment-menu" role="menu" aria-label="Assign shortcut node" data-expand={menuLayout.direction}
      style={{ left: menuLayout.x, top: menuLayout.y, width: menuLayout.width, height: menuLayout.height }} onPointerDown={(event) => event.stopPropagation()}>
      <header><b>ASSIGN SLOT {menu.slot + 1}</b><button aria-label="Close node picker" onClick={() => setMenu(undefined)}>×</button></header>
      <div className="shortcut-assignment-filters" role="group" aria-label="Node categories">
        {(['Production', 'Logistics'] as const).map(category => <button key={category} type="button" aria-pressed={assignmentFilter === category}
          data-tooltip={category} data-tooltip-detail="Select again to show all nodes."
          onClick={() => setAssignmentFilter(current => current === category ? 'All' : category)}>{category}</button>)}
      </div>
      <div className="shortcut-assignment-choices" style={{ gridTemplateRows: `repeat(${menuLayout.rows}, 38px)` }}>
        {assignmentChoices.map((definition) => <button role="menuitem" key={definition.kind} disabled={Boolean(canBuild && !canBuild(definition.kind))} onClick={() => { const bar = barsRef.current[menu.barId]; patchBar(menu.barId, { assignments: bar.assignments.map((value, index) => index === menu.slot ? definition.kind : value) }); setMenu(undefined); }}><i style={{ color: definition.accentCss }}><NodeIcon kind={definition.kind} /></i><span>{definition.name}</span></button>)}
      </div>
      <button className="clear" onClick={() => { const bar = bars[menu.barId]; patchBar(menu.barId, { assignments: bar.assignments.map((value, index) => index === menu.slot ? null : value) }); setMenu(undefined); }}>CLEAR SLOT</button>
    </div>}
  </div>;
}
