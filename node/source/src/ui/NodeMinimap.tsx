import { NODE_MAP_LAYOUT_KEY as LAYOUT_KEY } from '../persistence/storageKeys';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { cargoMaterial } from '../content/botAssembly';
import { ITEM_COLORS, materialTypeName } from '../content/items';
import type { GameState, ItemId, SectorState } from '../domain/types';
import { DEFAULT_WORLD_GRID_SIZE, HOME_SECTOR_ID, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { fitMinimap } from './responsiveLayout';
import { useViewport } from './useViewport';
import { MapNodeDetails } from './MapNodeDetails';
import { IconGlyph } from './NodeIcon';
import { sectorId } from '../simulation/worldGeneration';
import { roadMaterialState } from '../simulation/roadMaterials';
import { MAP_LANDMARKS, mapCornerMarkers, mapLandmarkSurvey, mapNodeHoverDetails, mapNodeName, mapNodePosition, type MapLandmark } from './mapNodePresentation';

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
  const cornerMarkers = mapCornerMarkers(game);
  const availableFilters = landmarkOrder.filter(landmark => discovered.has(landmark));
  const activeFilters = availableFilters.filter(landmark => filters.has(landmark));
  const toggleFilter = (landmark: MapLandmark) => setFilters(previous => {
    const next = new Set(previous);
    if (next.has(landmark)) next.delete(landmark); else next.add(landmark);
    return next;
  });
  const roadBorders = new Map<string, { source: SectorState; target: SectorState; materials: Set<ItemId>; bidirectional: boolean; active: boolean }>();
  for (const source of Object.values(game.sectors)) for (const road of source.nodes) {
    if (!['road', 'fluidRoad'].includes(road.kind) || !road.pairedSectorId || !road.pairedRoadId || road.roadMode === 'import') continue;
    const target = game.sectors[road.pairedSectorId];
    if (!target) continue;
    const id = [source.id, target.id].sort().join(':');
    const border = roadBorders.get(id) ?? { source, target, materials: new Set<ItemId>(), bidirectional: false, active: false };
    const { materials } = roadMaterialState(game, source, road);
    const lastItem = materials.length ? undefined : source.connections.find(cable => cable.to === road.id)?.item;
    for (const item of materials) border.materials.add(item);
    if (lastItem) border.materials.add(cargoMaterial(lastItem));
    border.bidirectional ||= border.source.id !== source.id;
    border.active ||= source.id === game.activeSectorId;
    roadBorders.set(id, border);
  }
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
      <div className="minimap-drag-handle" aria-label={expanded ? 'Node Map' : 'Move Node Map'} data-tooltip={expanded ? undefined : 'Move Node Map'} data-tooltip-detail={expanded ? undefined : 'Drag this header to move the map. Press M to hide or show it.'}><span>{expanded ? 'Node Map' : <>⠿ Node Map <kbd>M</kbd></>}</span></div>
      {!expanded && <button className="minimap-open" aria-label="Expand Node Map" onClick={onOpenMap} data-tooltip="Expand Node Map">↗</button>}
      {(!expanded || gridSize > DEFAULT_WORLD_GRID_SIZE) && <div className="minimap-zoom">
        <button aria-label="Zoom out" onClick={() => setZoom(value => Math.max(.65, +(value - .15).toFixed(2)))}>−</button>
        <button aria-label={`Reset map zoom, currently ${Math.round(zoom * 100)}%`} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button aria-label="Zoom in" onClick={() => setZoom(value => Math.min(2.5, +(value + .15).toFixed(2)))}>+</button>
      </div>}
      <button className="minimap-close" aria-label={expanded ? 'Close expanded Node Map' : 'Hide Node Map'} onClick={onClose} data-tooltip={expanded ? 'Close expanded Node Map' : 'Hide Node Map'} data-tooltip-detail={expanded ? 'Return to the minimap.' : 'Press M to show it again.'}>×</button>
    </header>
    {expanded && availableFilters.length > 0 && <div className="node-map-filters" role="group" aria-label="Map landmark filters">
      <span>Show on map</span>
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
          const depletionPending = known?.resourceDepletionPending;
          const isActive = id === game.activeSectorId; const isSelected = id === selected;
          const isAvailable = !isUnlocked && hasUnlockedNeighbor(game, cx, cy);
          const location = mapNodePosition(cx, cy);
          const locationLabel = gridSize > DEFAULT_WORLD_GRID_SIZE && location.includes('.')
            ? <strong>{location.split('.').map(direction => <span key={direction}>{direction}</span>)}</strong>
            : <strong>{location}</strong>;
          const name = known ? mapNodeName(known) : location;
          const landmarks = bySector.get(id);
          const markers = landmarks ? activeFilters.filter(landmark => landmarks.has(landmark)) : [];
          const camps = markers.includes('camps') ? known.nodes.filter(node => node.kind === 'monster-camp') : [];
          const corner = cornerMarkers.get(id);
          const markerNames = [...markers.map(landmark => MAP_LANDMARKS[landmark].label), ...(corner ? [corner] : [])].join(', ');
          const icons = (corner || markers.length > 0) && <span className="node-map-landmarks" aria-hidden="true">
            {corner && <IconGlyph icon="final-core" className="map-landmark-corner" />}
            {camps.some(camp => !camp.lizardSettlement) && <IconGlyph icon={MAP_LANDMARKS.camps.icon} className="map-landmark-camps" />}
            {camps.some(camp => camp.lizardSettlement) && <IconGlyph icon={MAP_LANDMARKS.camps.icon} className="map-landmark-camps map-landmark-dwarven" />}
            {markers.filter(landmark => landmark !== 'camps').map(landmark => <IconGlyph key={landmark} icon={MAP_LANDMARKS[landmark].icon} className={`map-landmark-${landmark}`} />)}
          </span>;
          const markerClass = icons ? ' has-landmarks' : '';
          const tooltipDetails = !expanded && corner !== '???' && (isUnlocked || isAvailable) ? [
            ...(isActive ? ['Current Node'] : []),
            ...(depletionPending ? ['Resource depleted'] : []),
            ...mapNodeHoverDetails(game, id),
            ...(!isUnlocked ? [game.research.mapPoints ? 'Double-click to activate for 1 Map Point' : 'Requires 1 Map Point'] : []),
            ...markers.filter(landmark => landmark !== 'camps').map(landmark => MAP_LANDMARKS[landmark].label),
          ].join('\n') : undefined;
          return isUnlocked || isAvailable || (expanded && corner) ? <button key={id} data-map-sector={id}
            aria-label={`Map Node ${location}: ${isUnlocked ? isActive ? 'current map' : 'travel available' : isAvailable ? 'activate for 1 Map Point' : 'locked'}${depletionPending ? ' · Resource depleted' : ''}${markerNames ? ` · ${markerNames}` : ''}`}
            disabled={!permitsTutorialChoice(allowedSectorId, id)} type="button"
            className={`node-map-sector ${id === HOME_SECTOR_ID ? 'home' : isUnlocked ? 'explored' : isAvailable ? 'adjacent' : 'uncharted'} ${isActive ? 'current' : ''} ${isSelected ? 'selected' : ''}${markerClass}${depletionPending ? ' resource-depleted' : ''}`}
            onClick={() => setSelected(id)}
            onDoubleClick={() => { setSelected(id); if (isUnlocked && !isActive) { onTravel(id); setSelected(null); } else if (isAvailable && game.research.mapPoints > 0 && engine.unlockSector(cx, cy) && !expanded) setSelected(null); }}
            data-tooltip={corner ?? (expanded ? undefined : name)}
            data-tooltip-detail={tooltipDetails}>
            {expanded ? locationLabel : <strong>{known?.label ?? (isSelected ? '●' : '?')}</strong>}
            {icons}
          </button> : <i key={id} className={`node-map-sector uncharted${markerClass}`} data-tooltip={corner}
            role={corner ? 'img' : undefined} aria-label={corner ? `Map Node ${location}: ${corner}` : undefined}>
            {expanded && locationLabel}
            {icons}
          </i>;
        })}
        {Array.from(roadBorders, ([id, { source, target, materials, bidirectional, active }]) => {
          // Anchor to the two tiles so the midpoint includes the grid gap and padding.
          const gridColumn = `${Math.min(source.x, target.x) - min + 1} / ${Math.max(source.x, target.x) - min + 2}`;
          const gridRow = `${Math.min(source.y, target.y) - min + 1} / ${Math.max(source.y, target.y) - min + 2}`;
          const [item] = materials;
          const color = materials.size === 1 ? `#${ITEM_COLORS[item].toString(16).padStart(6, '0')}` : '#7aa99e';
          const itemLabel = materials.size ? Array.from(materials, materialTypeName).join(', ') : 'No material assigned';
          return <span key={id} className={`node-map-road ${materials.size ? 'assigned' : 'idle'} ${active ? 'active' : ''}`}
            style={{ gridColumn, gridRow, '--road-color': color } as CSSProperties}
            data-tooltip={`${mapNodePosition(source.x, source.y)} ${bidirectional ? '↔' : '→'} ${mapNodePosition(target.x, target.y)}`}
            data-tooltip-detail={itemLabel} />;
        })}
      </div>
    </div>{expanded && <MapNodeDetails game={game} engine={engine} selectedId={selected} cornerName={cornerMarkers.get(selectedKey)} allowedSectorId={allowedSectorId} onActivate={activate} />}</div>
    {!expanded && <footer><span>{!selected ? 'Select a Map Node' : active ? 'Current node' : sector ? mapNodeName(sector) : mapNodePosition(x, y)}</span><button className={selected && ((!active && unlocked) || (available && game.research.mapPoints > 0)) ? 'ready' : ''} disabled={!selected || !permitsTutorialChoice(allowedSectorId, selected) || active || (!unlocked && (!available || game.research.mapPoints < 1))} onClick={activate}>{!selected ? 'Select a Node' : active ? 'Current Node' : unlocked ? 'Travel' : available && game.research.mapPoints ? 'Activate · 1' : 'Select a Node'}</button></footer>}
    {!expanded && <button className="node-map-resize" aria-label="Resize Node Map" onPointerDown={beginResize} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} />}
  </aside></div>;
}
