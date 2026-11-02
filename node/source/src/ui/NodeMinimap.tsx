import { NODE_MAP_LAYOUT_KEY as LAYOUT_KEY } from '../persistence/storageKeys';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ITEM_COLORS, ITEM_NAMES } from '../content/items';
import type { GameState } from '../domain/types';
import { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { fitMinimap } from './responsiveLayout';
import { useViewport } from './useViewport';
import { sectorDistance, sectorId } from '../simulation/worldGeneration';

interface Props {
  dockHeight?: number;
  allowedSectorId?: TutorialChoice;
  game: GameState;
  engine: GameEngine;
  onTravel(id: string): void;
  onOpenMap(): void;
  onClose(): void;
  onHoverChange(hovered: boolean): void;
}

type Point = { x: number; y: number };
function readLayout(): { position?: Point; size: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? 'null');
    return { size: Number.isFinite(saved?.size) ? Math.min(450, Math.max(230, saved.size)) : 276,
      position: Number.isFinite(saved?.position?.x) && Number.isFinite(saved?.position?.y) ? saved.position : undefined };
  } catch { return { size: 276 }; }
}

function resourceSummary(game: GameState, id: string) {
  const sector = game.sectors[id];
  if (!sector) return 'Resources unknown';
  const resources = sector.nodes.filter((node) => node.resourceItem).map((node) => `${ITEM_NAMES[node.resourceItem!]} ${Math.floor(node.resourceRemaining ?? 0).toLocaleString()}`);
  return resources.length ? resources.join(' · ') : 'No mapped resources';
}

export function NodeMinimap({ game, engine, allowedSectorId, dockHeight = 0, onTravel, onOpenMap, onClose, onHoverChange }: Props) {
  useEffect(() => () => onHoverChange(false), [onHoverChange]);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Point | undefined>(() => readLayout().position);
  const [size, setSize] = useState(() => readLayout().size);
  const viewport = useViewport();
  const fitted = fitMinimap(viewport, size, position, dockHeight);
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | undefined>(undefined);
  const resizeRef = useRef<{ pointerId: number; start: Point; size: number } | undefined>(undefined);
  useEffect(() => { setSelected(null); }, [allowedSectorId]);
  const selectedKey = selected ?? game.activeSectorId;
  const sector = game.sectors[selectedKey];
  const unlocked = Boolean(sector?.unlocked);
  const active = selectedKey === game.activeSectorId;
  const [x, y] = selectedKey.split(',').map(Number);
  const available = Boolean(selected) && !unlocked && Object.values(game.sectors).some((candidate) => candidate.unlocked && Math.abs(candidate.x - x) + Math.abs(candidate.y - y) === 1);
  const roads = Object.values(game.sectors).flatMap((source) => source.nodes.flatMap((road) => {
    if (road.kind !== 'road' || !road.pairedSectorId || !road.pairedRoadId || road.roadMode === 'import') return [];
    const target = game.sectors[road.pairedSectorId]; if (!target) return [];
    const connection = source.connections.find((candidate) => candidate.to === road.id);
    return [{ id: `${source.id}:${road.id}`, source, target, item: connection?.item }];
  }));
  const activate = () => {
    if (!selected || !permitsTutorialChoice(allowedSectorId, selected)) return;
    if (unlocked && !active) { onTravel(selected); setSelected(null); }
    else if (available && game.research.mapPoints > 0 && engine.unlockSector(x, y)) setSelected(null);
  };
  const clampPanel = (next: Point, panelSize = size) => ({ x: Math.min(Math.max(8, window.innerWidth - panelSize - 8), Math.max(8, next.x)), y: Math.min(Math.max(82, window.innerHeight - panelSize - 82), Math.max(82, next.y)) });
  useEffect(() => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ position, size })); } catch { /* Keep dragging available when browser storage is full. */ } }, [position, size]);
  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => { if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return; event.preventDefault(); const bounds = event.currentTarget.parentElement!.getBoundingClientRect(); event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: bounds.left, y: bounds.top } }; };
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPosition(clampPanel({ x: drag.origin.x + event.clientX - drag.start.x, y: drag.origin.y + event.clientY - drag.start.y })); };
  const endDrag = (event: ReactPointerEvent<HTMLElement>) => { if (dragRef.current?.pointerId === event.pointerId) dragRef.current = undefined; };
  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); resizeRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, size }; };
  const moveResize = (event: ReactPointerEvent<HTMLButtonElement>) => { const resize = resizeRef.current; if (!resize || resize.pointerId !== event.pointerId) return; const next = Math.min(450, Math.max(230, resize.size + Math.max(event.clientX - resize.start.x, event.clientY - resize.start.y))); setSize(next); if (position) setPosition(clampPanel(position, next)); };
  const endResize = (event: ReactPointerEvent<HTMLButtonElement>) => { if (resizeRef.current?.pointerId === event.pointerId) resizeRef.current = undefined; };

  return <aside className="node-minimap world-node-minimap glass" aria-label="Interactive Node Map" onPointerEnter={() => onHoverChange(true)} onPointerLeave={() => onHoverChange(false)} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }} style={{ width: fitted.size, left: fitted.x, top: fitted.y, right: 'auto', bottom: 'auto' }}>
    <header onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div className="minimap-drag-handle" aria-label="Move Node Map" data-tooltip="Move Node Map" data-tooltip-detail="Drag this header to move the map. Press M to hide or show it."><span>⠿ NODE MAP <kbd>M</kbd></span><b>{game.sectors[game.activeSectorId].name} · {game.research.mapPoints} MAP POINTS</b></div>
      <button className="minimap-open" aria-label="Open full Node Map" onClick={onOpenMap} data-tooltip="Open full Node Map">↗</button>
      <div className="minimap-zoom"><button onClick={() => setZoom((value) => Math.max(.65, +(value - .15).toFixed(2)))}>−</button><button onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button onClick={() => setZoom((value) => Math.min(2.5, +(value + .15).toFixed(2)))}>+</button></div>
      <button className="minimap-close" onClick={onClose} data-tooltip="Hide Node Map" data-tooltip-detail="Press M to show it again.">×</button>
    </header>
    <div className="node-map-viewport" onWheel={(event) => { if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); setZoom((value) => Math.min(2.5, Math.max(.65, +(value + (event.deltaY < 0 ? .1 : -.1)).toFixed(2)))); }}>
      <div className="node-map-grid" style={{ width: `${zoom * 100}%` }}>
        {Array.from({ length: 121 }, (_, index) => { const cx = index % 11; const cy = Math.floor(index / 11); const id = sectorId(cx, cy); const known = game.sectors[id]; const isUnlocked = Boolean(known?.unlocked); const isActive = id === game.activeSectorId; const isSelected = id === selected; const isAvailable = !isUnlocked && Object.values(game.sectors).some((candidate) => candidate.unlocked && Math.abs(candidate.x - cx) + Math.abs(candidate.y - cy) === 1); return isUnlocked || isAvailable ? <button key={id} disabled={!permitsTutorialChoice(allowedSectorId, id)} type="button" className={`node-map-sector ${id === '5,5' ? 'home' : isUnlocked ? 'explored' : 'adjacent'} ${isActive ? 'current' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelected(id)} onDoubleClick={() => { setSelected(id); if (isUnlocked && !isActive) { onTravel(id); setSelected(null); } else if (isAvailable && game.research.mapPoints > 0 && engine.unlockSector(cx, cy)) setSelected(null); }} data-tooltip={known?.name ?? `Available Node ${cx}.${cy}`} data-tooltip-detail={`Tier ${sectorDistance(cx, cy)} · ${isActive ? 'Current Node' : isUnlocked ? `${resourceSummary(game, id)} · Double-click to travel` : game.research.mapPoints ? 'Double-click to activate for 1 Map Point' : 'Requires 1 Map Point'}`}><strong>{known?.label ?? (isSelected ? '●' : '?')}</strong></button> : <i key={id} className="node-map-sector uncharted" />; })}
        {roads.map((road) => { const left = ((road.source.x + road.target.x + 1) / 22) * 100; const top = ((road.source.y + road.target.y + 1) / 22) * 100; const color = road.item ? `#${ITEM_COLORS[road.item].toString(16).padStart(6, '0')}` : '#7aa99e'; return <span key={road.id} className={`node-map-road ${road.item ? 'assigned' : 'idle'} ${road.source.id === game.activeSectorId ? 'active' : ''}`} style={{ left: `${left}%`, top: `${top}%`, '--road-color': color } as CSSProperties} data-tooltip="Road transport" data-tooltip-detail={`${road.item ? ITEM_NAMES[road.item] : 'No item assigned'} · ${road.source.name} → ${road.target.name}`} />; })}
      </div>
    </div>
    <footer><span>{!selected ? 'SELECT A MAP NODE' : active ? 'CURRENT NODE' : sector?.name ?? `NODE ${x}.${y}`}</span><button className={selected && ((!active && unlocked) || (available && game.research.mapPoints > 0)) ? 'ready' : ''} disabled={!selected || !permitsTutorialChoice(allowedSectorId, selected) || active || (!unlocked && (!available || game.research.mapPoints < 1))} onClick={activate}>{!selected ? 'Select Available' : active ? 'Current Node' : unlocked ? 'Travel' : available && game.research.mapPoints ? 'Activate · 1' : 'Select Available'}</button></footer>
    <button className="node-map-resize" aria-label="Resize Node Map" onPointerDown={beginResize} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} />
  </aside>;
}
