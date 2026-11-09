import { NODE_MAP_LAYOUT_KEY as LAYOUT_KEY } from '../persistence/storageKeys';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ITEM_COLORS, ITEM_NAMES } from '../content/items';
import type { GameState } from '../domain/types';
import { DEFAULT_WORLD_GRID_SIZE, HOME_SECTOR_ID, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { fitMinimap } from './responsiveLayout';
import { useViewport } from './useViewport';
import { MapNodeDetails } from './MapNodeDetails';
import { IconGlyph } from './NodeIcon';
import { sectorId } from '../simulation/worldGeneration';
import { roadMaterialState } from '../simulation/roadMaterials';
import { MAP_LANDMARKS, mapLandmarkSurvey, mapNodeName, mapNodePosition, mapNodeResourceSummary, type MapLandmark } from './mapNodePresentation';

const landmarkOrder = Object.keys(MAP_LANDMARKS) as MapLandmark[];
const hasUnlockedNeighbor = (game: GameState, x: number, y: number) =>
  [sectorId(x - 1, y), sectorId(x + 1, y), sectorId(x, y - 1), sectorId(x, y + 1)].some(id => game.sectors[id]?.unlocked);

interface Props {
  expanded?: boolean;
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

export function NodeMinimap({ game, engine, allowedSectorId, dockHeight = 0, expanded = false, onTravel, onOpenMap, onClose, onHoverChange }: Props) {
  useEffect(() => () => onHoverChange(false), [onHoverChange]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReadonlySet<MapLandmark>>(() => new Set());
  const [compactZoom, setCompactZoom] = useState(1);
  const [expandedZoom, setExpandedZoom] = useState(1);
  const zoom = expanded ? expandedZoom : compactZoom;
  const setZoom = expanded ? setExpandedZoom : setCompactZoom;
  const [position, setPosition] = useState<Point | undefined>(() => readLayout().position);
  const [size, setSize] = useState(() => readLayout().size);
  const viewport = useViewport();
  const fitted = fitMinimap(viewport, size, position, dockHeight);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const [expandedGridSize, setExpandedGridSize] = useState(0);
  useEffect(() => {
    const field = mapViewportRef.current;
    if (!expanded || !field) return;
    const observer = new ResizeObserver(([entry]) => setExpandedGridSize(Math.min(entry.contentRect.width, entry.contentRect.height)));
    observer.observe(field);
    return () => observer.disconnect();
  }, [expanded]);
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | undefined>(undefined);
  const resizeRef = useRef<{ pointerId: number; start: Point; size: number } | undefined>(undefined);
  const gridSize = worldGridSize(game);
  const { min } = worldGridBounds(gridSize);
  useEffect(() => { setSelected(null); }, [allowedSectorId, gridSize]);
  const selectedKey = selected ?? game.activeSectorId;
  const sector = game.sectors[selectedKey];
  const unlocked = Boolean(sector?.unlocked);
  const active = selectedKey === game.activeSectorId;
  const [x, y] = selectedKey.split(',').map(Number);
  const available = Boolean(selected) && !unlocked && hasUnlockedNeighbor(game, x, y);
  const { discovered, bySector } = mapLandmarkSurvey(game);
  const availableFilters = landmarkOrder.filter(landmark => discovered.has(landmark));
  const activeFilters = availableFilters.filter(landmark => filters.has(landmark));
  const toggleFilter = (landmark: MapLandmark) => setFilters(previous => {
    const next = new Set(previous);
    if (next.has(landmark)) next.delete(landmark); else next.add(landmark);
    return next;
  });
  const roads = Object.values(game.sectors).flatMap((source) => source.nodes.flatMap((road) => {
    if (!['road', 'fluidRoad'].includes(road.kind) || !road.pairedSectorId || !road.pairedRoadId || road.roadMode === 'import') return [];
    const target = game.sectors[road.pairedSectorId]; if (!target) return [];
    const { materials } = roadMaterialState(game, source, road);
    const lastItem = materials.length ? undefined : source.connections.find(cable => cable.to === road.id)?.item;
    return [{ id: `${source.id}:${road.id}`, source, target, item: materials.length === 1 ? materials[0] : lastItem,
      itemLabel: materials.length ? materials.map(item => ITEM_NAMES[item]).join(', ') : lastItem ? ITEM_NAMES[lastItem] : 'No item assigned' }];
  }));
  const activate = () => {
    if (!selected || !permitsTutorialChoice(allowedSectorId, selected)) return;
    if (unlocked && !active) { onTravel(selected); setSelected(null); }
    else if (available && game.research.mapPoints > 0 && engine.unlockSector(x, y) && !expanded) setSelected(null);
  };
  const clampPanel = (next: Point, panelSize = size) => ({ x: Math.min(Math.max(8, window.innerWidth - panelSize - 8), Math.max(8, next.x)), y: Math.min(Math.max(82, window.innerHeight - panelSize - 82), Math.max(82, next.y)) });
  useEffect(() => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ position, size })); } catch { /* Keep dragging available when browser storage is full. */ } }, [position, size]);
  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => { if (expanded || event.button !== 0 || (event.target as HTMLElement).closest('button')) return; event.preventDefault(); const bounds = event.currentTarget.parentElement!.getBoundingClientRect(); event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: bounds.left, y: bounds.top } }; };
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPosition(clampPanel({ x: drag.origin.x + event.clientX - drag.start.x, y: drag.origin.y + event.clientY - drag.start.y })); };
  const endDrag = (event: ReactPointerEvent<HTMLElement>) => { if (dragRef.current?.pointerId === event.pointerId) dragRef.current = undefined; };
  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); resizeRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, size }; };
  const moveResize = (event: ReactPointerEvent<HTMLButtonElement>) => { const resize = resizeRef.current; if (!resize || resize.pointerId !== event.pointerId) return; const next = Math.min(450, Math.max(230, resize.size + Math.max(event.clientX - resize.start.x, event.clientY - resize.start.y))); setSize(next); if (position) setPosition(clampPanel(position, next)); };
  const endResize = (event: ReactPointerEvent<HTMLButtonElement>) => { if (resizeRef.current?.pointerId === event.pointerId) resizeRef.current = undefined; };

  return <div className={expanded ? 'node-map-host node-map-expansion modal-backdrop' : 'node-map-host'}><aside className={`node-minimap world-node-minimap glass${expanded ? ' expanded modal map-modal' : ''}`} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label="Interactive Node Map" onPointerEnter={() => onHoverChange(true)} onPointerLeave={() => onHoverChange(false)} onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }} style={expanded ? undefined : { width: fitted.size, left: fitted.x, top: fitted.y, right: 'auto', bottom: 'auto' }}>
    <header onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div className="minimap-drag-handle" aria-label={expanded ? 'Node Map' : 'Move Node Map'} data-tooltip={expanded ? undefined : 'Move Node Map'} data-tooltip-detail={expanded ? undefined : 'Drag this header to move the map. Press M to hide or show it.'}><span>{expanded ? 'NODE MAP' : <>⠿ NODE MAP <kbd>M</kbd></>}</span></div>
      {!expanded && <button className="minimap-open" aria-label="Expand Node Map" onClick={onOpenMap} data-tooltip="Expand Node Map">↗</button>}
      {(!expanded || gridSize > DEFAULT_WORLD_GRID_SIZE) && <div className="minimap-zoom">
        <button aria-label="Zoom out" onClick={() => setZoom(value => Math.max(.65, +(value - .15).toFixed(2)))}>−</button>
        <button aria-label={`Reset map zoom, currently ${Math.round(zoom * 100)}%`} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button aria-label="Zoom in" onClick={() => setZoom(value => Math.min(2.5, +(value + .15).toFixed(2)))}>+</button>
      </div>}
      <button className="minimap-close" aria-label={expanded ? 'Close expanded Node Map' : 'Hide Node Map'} onClick={onClose} data-tooltip={expanded ? 'Close expanded Node Map' : 'Hide Node Map'} data-tooltip-detail={expanded ? 'Return to the minimap.' : 'Press M to show it again.'}>×</button>
    </header>
    {expanded && availableFilters.length > 0 && <div className="node-map-filters" role="group" aria-label="Map landmark filters">
      <span>SHOW ON MAP</span>
      {availableFilters.map(landmark => <button key={landmark} type="button" className={`map-landmark-${landmark}`}
        aria-pressed={filters.has(landmark)} onClick={() => toggleFilter(landmark)}>
        <IconGlyph icon={MAP_LANDMARKS[landmark].icon} />{MAP_LANDMARKS[landmark].label}
      </button>)}
    </div>}
    <div className={expanded ? 'minimap-content map-content' : 'minimap-content'}><div ref={mapViewportRef} className="node-map-viewport" onWheel={(event) => { if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); setZoom((value) => Math.min(2.5, Math.max(.65, +(value + (event.deltaY < 0 ? .1 : -.1)).toFixed(2)))); }}>
      <div className={`node-map-grid${gridSize > DEFAULT_WORLD_GRID_SIZE ? ' larger-grid' : ''}`} style={{ '--map-grid-size': gridSize, width: expanded && expandedGridSize > 0 ? expandedGridSize * zoom : `${zoom * 100}%` } as CSSProperties}>
        {Array.from({ length: gridSize ** 2 }, (_, index) => {
          const cx = min + index % gridSize; const cy = min + Math.floor(index / gridSize); const id = sectorId(cx, cy);
          const known = game.sectors[id]; const isUnlocked = Boolean(known?.unlocked);
          const isActive = id === game.activeSectorId; const isSelected = id === selected;
          const isAvailable = !isUnlocked && hasUnlockedNeighbor(game, cx, cy);
          const location = mapNodePosition(cx, cy);
          const locationLabel = gridSize > DEFAULT_WORLD_GRID_SIZE && location.includes('.')
            ? <strong>{location.split('.').map(direction => <span key={direction}>{direction}</span>)}</strong>
            : <strong>{location}</strong>;
          const name = known ? mapNodeName(known) : location;
          const landmarks = bySector.get(id);
          const markers = landmarks ? activeFilters.filter(landmark => landmarks.has(landmark)) : [];
          const markerNames = markers.map(landmark => MAP_LANDMARKS[landmark].label).join(', ');
          return isUnlocked || isAvailable ? <button key={id} data-map-sector={id}
            aria-label={`Map Node ${location}: ${isUnlocked ? isActive ? 'current map' : 'travel available' : 'activate for 1 Map Point'}${markerNames ? ` · ${markerNames}` : ''}`}
            disabled={!permitsTutorialChoice(allowedSectorId, id)} type="button"
            className={`node-map-sector ${id === HOME_SECTOR_ID ? 'home' : isUnlocked ? 'explored' : 'adjacent'} ${isActive ? 'current' : ''} ${isSelected ? 'selected' : ''}${markers.length ? ' has-landmarks' : ''}`}
            onClick={() => setSelected(id)}
            onDoubleClick={() => { setSelected(id); if (isUnlocked && !isActive) { onTravel(id); setSelected(null); } else if (isAvailable && game.research.mapPoints > 0 && engine.unlockSector(cx, cy) && !expanded) setSelected(null); }}
            data-tooltip={expanded ? undefined : name}
            data-tooltip-detail={expanded ? undefined : `${isActive ? 'Current Node' : isUnlocked ? `${mapNodeResourceSummary(game, id)} · Double-click to travel` : `Map Node Unexplored · ${game.research.mapPoints ? 'Double-click to activate for 1 Map Point' : 'Requires 1 Map Point'}`}${markerNames ? ` · ${markerNames}` : ''}`}>
            {expanded ? locationLabel : <strong>{known?.label ?? (isSelected ? '●' : '?')}</strong>}
            {markers.length > 0 && <span className="node-map-landmarks" aria-hidden="true">
              {markers.map(landmark => <IconGlyph key={landmark} icon={MAP_LANDMARKS[landmark].icon} className={`map-landmark-${landmark}`} />)}
            </span>}
          </button> : <i key={id} className="node-map-sector uncharted">{expanded && locationLabel}</i>;
        })}
        {roads.map((road) => { const left = ((road.source.x + road.target.x - 2 * min + 1) / (2 * gridSize)) * 100; const top = ((road.source.y + road.target.y - 2 * min + 1) / (2 * gridSize)) * 100; const color = road.item ? `#${ITEM_COLORS[road.item].toString(16).padStart(6, '0')}` : '#7aa99e'; return <span key={road.id} className={`node-map-road ${road.item ? 'assigned' : 'idle'} ${road.source.id === game.activeSectorId ? 'active' : ''}`} style={{ left: `${left}%`, top: `${top}%`, '--road-color': color } as CSSProperties}
          data-tooltip={`${mapNodePosition(road.source.x, road.source.y)} → ${mapNodePosition(road.target.x, road.target.y)}`}
          data-tooltip-detail={road.itemLabel} />; })}
      </div>
    </div>{expanded && <MapNodeDetails game={game} engine={engine} selectedId={selected} allowedSectorId={allowedSectorId} onActivate={activate} />}</div>
    {!expanded && <footer><span>{!selected ? 'SELECT A MAP NODE' : active ? 'CURRENT NODE' : sector ? mapNodeName(sector) : mapNodePosition(x, y)}</span><button className={selected && ((!active && unlocked) || (available && game.research.mapPoints > 0)) ? 'ready' : ''} disabled={!selected || !permitsTutorialChoice(allowedSectorId, selected) || active || (!unlocked && (!available || game.research.mapPoints < 1))} onClick={activate}>{!selected ? 'Select a Node' : active ? 'Current Node' : unlocked ? 'Travel' : available && game.research.mapPoints ? 'Activate · 1' : 'Select a Node'}</button></footer>}
    {!expanded && <button className="node-map-resize" aria-label="Resize Node Map" onPointerDown={beginResize} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} />}
  </aside></div>;
}
