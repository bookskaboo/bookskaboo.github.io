import { createCampNodeStatus, updateCampNodeStatus } from './campNodeStatus';
import { campStatus } from '../simulation/campStatus';
import { groveProgress } from './groveProgress';
import { researchCenterView } from './researchCenterView';
import { researchConsumptionGlow } from './researchConsumptionGlow';
import { createResearchNodeStatus, updateResearchNodeStatus } from './researchNodeStatus';
import { THEME } from './playfieldTheme';
import { outputTotal, inputTotal, outputCapacity, resourceCapacityReadout, resourceReserveFraction, nodeTextScale, isItemId, portRoleLabel, canDeleteNode, canCyclePortPositions, nodeCycleDuration } from './playfieldNodeState';
import { connectionPoints, curvePoint, buildTransferMotionPath, sampleCurveMotion } from './cableGeometry';
import { drawCurve, label, drawTrashIcon, drawRoadFlowArrow, escapeHtml } from './playfieldDrawing';
import { drawBufferSquares, updateProductionPort, updateBufferSquares, drawProductionCue, updateInputSquares } from './nodeBuffers';
import type { PlayfieldTooltip, PixiPlayfieldProps as Props, DragState, NodeView, PortHandle, PortView, ConnectionDragState, ConnectionRejection, FlowParticle, PlacementView } from './playfieldTypes';
export type { PlayfieldTooltip, SelectionInfo } from './playfieldTypes';
import { productionExplanation, productionVisual, productionVisualContext, type ProductionVisual } from './productionVisuals';
import { isProductionMachine } from './productionPortRows';
import { isStorageNode } from './bufferSlots';
import { NodeControlHover, JOINT_CONTROL_GRACE_MS } from './nodeControlHover';
import { nearestSocket, socketHitContains } from './socketTargeting';
import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { ITEM_COLORS, ITEM_NAMES } from '../content/items';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, getNodeDisplayDefinition } from '../content/nodes';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { RECIPES } from '../content/recipes';
import type { Connection, InFlightTransfer, ItemId, MachineNode } from '../domain/types';
import { getSectorWorldSize } from '../simulation/worldGeneration';
import { clampFieldCamera, scrollCameraForDrag } from '../domain/camera';
import { WORLD_GRID_SIZE, draggedNodePositions, snapNodePosition } from '../domain/nodeGrid';
import { boxControlSelection, ControlGroupSelection } from '../domain/controlGroups';
import { getPortSide, isMultiConnectionPort } from '../simulation/connectionRules';
import { getNodeSize, getPortAnchor, isCompactNode, isOrganicNode, isResourceNode, organicPolygon } from '../domain/nodeGeometry';
import { obstructionOutline } from '../domain/obstructionGeometry';
import { drawNodeIcon } from './drawNodeIcon';
import { MAX_VISIBLE_TRANSFERS, transferProgress } from '../simulation/transfers';
import { RESEARCH_CORE_TYPES, researchCoreStorage } from '../simulation/researchStatus';
import { modNode } from '../mods/modRules';

export function PixiPlayfield(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null); const propsRef = useRef(props); propsRef.current = props;

  useEffect(() => {
    const host = hostRef.current!; let destroyed = false; let initialized = false; let app: Application;
    let insertionPreviewLayer: Graphics; let insertionPreviewSignature = ''; let insertionPreviewCableId: string | undefined;
    let world: Container; let surfaceLayer: Container; let cableLayer: Container; let particleLayer: Container; let nodeLayer: Container; let placementLayer: Container; let overlayLayer: Container;
    let camera = { ...props.engine.getSector().camera }; let worldSize = getSectorWorldSize(props.engine.getSector(), props.engine.getState().research.completed);
    let renderedState = props.engine.getState(); let renderedSectorId = props.engine.getSector().id; let appliedCameraNonce = props.cameraFocus?.nonce ?? -1;
    let drag: DragState | undefined; let connectionDrag: ConnectionDragState | undefined; let snappedPortKey: string | undefined; let panning: { x: number; y: number; cameraX: number; cameraY: number } | undefined;
    const groupSelection = new ControlGroupSelection();
    let rightPress: { id: string; x: number; y: number; moved: boolean } | undefined;
    let marquee: { startX: number; startY: number; graphic: Graphics; baseSelection: string[]; previewIds: Set<string> } | undefined; let spaceHeld = false; let previewCable: Graphics | undefined; let previewPoint = { x: 0, y: 0 };
    let placementView: PlacementView | undefined; let placementPointerInside = false; let placementCursor = { x: 0, y: 0 };
    let dragPointer: { x: number; y: number } | undefined;
    let lastSnapToGrid = props.snapToGrid;
    let connectionRejection: ConnectionRejection | undefined; let rejectionGraphic: Graphics | undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controlHover = new NodeControlHover();
    const enterNodeHover = (id: string) => { controlHover.enter(id); hoveredNodeId = id; propsRef.current.onHoverNode?.(id); };
    let hoveredNodeId: string | undefined; let tooltipIntent: (PlayfieldTooltip & { key: string; visible: boolean; nodeId?: string }) | undefined; let tooltipTimer: number | undefined;
    let lastSceneSignature = ''; let drawnGridEnabled = props.engine.getState().preferences.showGrid; let lastTooltipAt = 0; let lastUiSignature = '';
    let observedPlayTimeMs = props.engine.getState().playTimeMs; let observedPlayTimeAt = performance.now();
    const nodeViews = new Map<string, NodeView>(); const portViews = new Map<string, PortView>(); const particles: FlowParticle[] = [];
    const flashStartedAt = new Map<string, number>(); const lastInputTotals = new Map<string, number>(); const seenTransferIds = new Set<string>(); const trackedTransfers = new Map<string, InFlightTransfer>();
    let lastParticleSignature = '';
    let sceneNodes = new Map<string, MachineNode>();
    let sceneNodeSource: MachineNode[] | undefined;
    let sceneMod = props.engine.getState().mod;
    let sceneConnections = new Map<string, Connection>();


    const toWorld = (x: number, y: number) => ({ x: (x - camera.x) / camera.zoom, y: (y - camera.y) / camera.zoom });
    const portKey = (handle: PortHandle) => `${handle.nodeId}:${handle.direction}:${handle.index}`;
    const portScreenPoint = (handle: PortHandle) => {
      const node = propsRef.current.engine.getSector().nodes.find((candidate) => candidate.id === handle.nodeId);
      if (!node) return undefined;
      const anchor = getPortAnchor(node, handle.direction, handle.index);
      return { x: camera.x + (node.x + anchor.x) * camera.zoom, y: camera.y + (node.y + anchor.y) * camera.zoom };
    };
    const normalizedConnection = (first: PortHandle, second: PortHandle) => first.direction === 'output'
      ? { output: first, input: second }
      : { output: second, input: first };
    const canSelectNode = (id: string) => !propsRef.current.selectableNodeId || propsRef.current.selectableNodeId === id;
    const socketAt = (x: number, y: number) => {
      const candidates = [...portViews.values()].flatMap(handle => {
        const node = propsRef.current.engine.getSector().nodes.find(n => n.id === handle.nodeId);
        const point = portScreenPoint(handle);
        if (!canSelectNode(handle.nodeId) || !node || !point || (node.kind === 'joint' && handle.direction === 'input')) return [];
        if (!socketHitContains(x - point.x, y - point.y, getPortSide(node, handle.direction, handle.index), isCompactNode(node))) return [];
        return [{ ...point, key: portKey(handle), handle }];
      });
      return nearestSocket(candidates, x, y, 10)?.handle;
    };
    const activeHandleForTarget = (state: ConnectionDragState, target: PortHandle): PortHandle => state.adaptiveJointDirection
      ? { nodeId: state.originNodeId, direction: target.direction === 'input' ? 'output' : 'input', index: 0 }
      : state.active;
    const findNearbyCompatiblePort = (x: number, y: number) => {
      const state = connectionDrag; if (!state) return undefined;
      let nearest: { handle: PortHandle; distance: number } | undefined;
      portViews.forEach((candidate) => {
        const handle: PortHandle = { nodeId: candidate.nodeId, direction: candidate.direction, index: candidate.index };
        const active = activeHandleForTarget(state, handle);
        if (handle.nodeId === active.nodeId || handle.direction === active.direction) return;
        const point = portScreenPoint(handle); if (!point) return; const distance = Math.hypot(point.x - x, point.y - y);
        if (distance <= 44 && (!nearest || distance < nearest.distance)) nearest = { handle, distance };
      });
      return nearest?.handle;
    };
    const updateSnappedPort = (handle?: PortHandle) => {
      if (snappedPortKey) { const previous = portViews.get(snappedPortKey); if (previous) previous.hovered = false; }
      snappedPortKey = handle ? portKey(handle) : undefined;
      if (snappedPortKey) { const next = portViews.get(snappedPortKey); if (next) next.hovered = true; }
      if (connectionDrag) connectionDrag.snapped = handle;
    };
    const cancelConnectionDrag = () => { updateSnappedPort(); connectionDrag = undefined; propsRef.current.onConnectionSource(undefined); if (previewCable) { previewCable.destroy(); previewCable = undefined; } };
    const clearConnectionRejection = () => { connectionRejection = undefined; rejectionGraphic?.destroy(); rejectionGraphic = undefined; };
    const rejectConnection = (state: ConnectionDragState, x: number, y: number, snapped?: PortHandle) => {
      clearConnectionRejection(); clearTooltip();
      let target = snapped; let distance = 44;
      if (!target) portViews.forEach(candidate => {
        if (portKey(candidate) === portKey(state.active)) return;
        const point = portScreenPoint(candidate); if (!point) return;
        const nextDistance = Math.hypot(point.x - x, point.y - y);
        if (nextDistance < distance) { distance = nextDistance; target = { nodeId: candidate.nodeId, direction: candidate.direction, index: candidate.index }; }
      });
      connectionRejection = { origin: target ? activeHandleForTarget(state, target) : state.active, target, point: toWorld(x, y), startedAt: performance.now() };
      rejectionGraphic = new Graphics(); rejectionGraphic.eventMode = 'none'; overlayLayer.addChild(rejectionGraphic);
    };
    const beginPortDrag = (handle: PortHandle, event: FederatedPointerEvent) => {
      clearConnectionRejection();
      event.preventDefault(); event.stopPropagation(); clearTooltip();
      const node = propsRef.current.engine.getSector().nodes.find(candidate => candidate.id === handle.nodeId);
      if (!node) return;
      let active = handle; let replaceConnectionId: string | undefined;
      if (handle.direction === 'input' && node.kind !== 'joint') {
        const attached = propsRef.current.engine.getSector().connections.filter(connection => connection.to === node.id && (connection.toPort ?? 0) === handle.index);
        const existing = attached.find(connection => connection.id === propsRef.current.selectedConnection) ?? (attached.length === 1 ? attached[0] : undefined);
        if (existing) { active = { nodeId: existing.from, direction: 'output', index: existing.fromPort ?? 0 }; replaceConnectionId = existing.id; }
      }
      dragPointer = { x: event.global.x, y: event.global.y };
      connectionDrag = { originNodeId: node.id, active, replaceConnectionId, adaptiveJointDirection: node.kind === 'joint', startX: event.global.x, startY: event.global.y, moved: false };
      previewPoint = { x: event.global.x, y: event.global.y };
      propsRef.current.onConnectionSource(active.nodeId);
    };
    const nodesInMarquee = (startX: number, startY: number, endX: number, endY: number) => {
      const start = toWorld(startX, startY); const end = toWorld(endX, endY);
      const left = Math.min(start.x, end.x), right = Math.max(start.x, end.x), top = Math.min(start.y, end.y), bottom = Math.max(start.y, end.y);
      if (Math.abs(right - left) <= 10 || Math.abs(bottom - top) <= 10) return [];
      const sector = propsRef.current.engine.getSector();
      const hits = sector.nodes.filter((node) => {
        const size = getNodeSize(node);
        return canSelectNode(node.id) && isPlayerMovableNode(node.kind, propsRef.current.engine.getState(), node) && !node.disabled && node.x + size.w / 2 >= left && node.x - size.w / 2 <= right && node.y + size.h / 2 >= top && node.y - size.h / 2 <= bottom;
      }).map((node) => node.id);
      const selectable = new Set(sector.nodes.filter(node => isPlayerMovableNode(node.kind, propsRef.current.engine.getState(), node) && !node.disabled).map(node => node.id));
      return boxControlSelection(hits, sector.controlGroups ?? [], start, end).ids.filter(id => selectable.has(id));
    };
    const drawMarqueeHighlights = (ids: ReadonlySet<string>) => {
      const nodes = new Map(propsRef.current.engine.getSector().nodes.map((node) => [node.id, node] as const));
      nodeViews.forEach((view, id) => {
        view.marqueeHighlight.clear(); if (!ids.has(id)) return;
        const node = nodes.get(id); if (!node) return;
        if (isOrganicNode(node)) view.marqueeHighlight.poly(obstructionOutline(node)).fill({ color: THEME.selected, alpha: .08 }).stroke({ color: THEME.selected, width: 4, alpha: 1 });
        else { const size = getNodeSize(node); view.marqueeHighlight.roundRect(-size.w / 2 - 3, -size.h / 2 - 3, size.w + 6, size.h + 6, 12).fill({ color: THEME.selected, alpha: .07 }).stroke({ color: THEME.selected, width: 4, alpha: 1 }); }
      });
    };
    const applyCamera = () => { world.x = camera.x; world.y = camera.y; world.scale.set(camera.zoom);
      const radius = Math.max(18, 10 / camera.zoom);
      portViews.forEach((port) => { port.root.hitArea = new Rectangle(-radius, -radius, radius * 2, radius * 2); });
    };
    const clampCamera = () => {
      if (initialized) camera = clampFieldCamera(camera, worldSize, app.screen);
    };
    const updateCamera = () => { clampCamera(); applyCamera(); propsRef.current.onCamera({ ...camera }); };
    const clearTooltip = () => { if (tooltipTimer) window.clearTimeout(tooltipTimer); tooltipTimer = undefined; tooltipIntent = undefined; propsRef.current.onTooltip?.(); };
    const showTooltip = (event: FederatedPointerEvent, title: string, detail: string, tone?: string, eyebrow?: string, nodeId?: string) => { if (connectionDrag || connectionRejection) return; const now = performance.now(); const key = `${eyebrow ?? ''}|${title}|${detail}`; const next = { key, title, detail, nodeId, x: event.global.x, y: event.global.y, tone, eyebrow, visible: tooltipIntent?.key === key && tooltipIntent.visible }; if (tooltipIntent?.key !== key) { if (tooltipTimer) window.clearTimeout(tooltipTimer); tooltipIntent = next; propsRef.current.onTooltip?.(); tooltipTimer = window.setTimeout(() => { if (!tooltipIntent || tooltipIntent.key !== key) return; tooltipIntent.visible = true; lastTooltipAt = performance.now(); propsRef.current.onTooltip?.({ title: tooltipIntent.title, detail: tooltipIntent.detail, x: tooltipIntent.x, y: tooltipIntent.y, tone: tooltipIntent.tone, eyebrow: tooltipIntent.eyebrow }); }, 170); return; } tooltipIntent = next; if (!next.visible || now - lastTooltipAt < 32) return; lastTooltipAt = now; propsRef.current.onTooltip?.({ title, detail, x: next.x, y: next.y, tone, eyebrow }); };

    const drawWorldSurface = () => {
      drawnGridEnabled = propsRef.current.engine.getState().preferences.showGrid;
      surfaceLayer.removeChildren().forEach((child) => child.destroy()); const surface = new Graphics();
      surface.rect(0, 0, worldSize.width, worldSize.height).fill({ color: THEME.surface }).stroke({ color: THEME.surfaceEdge, width: 4, alpha: .9 });
      if (propsRef.current.engine.getState().preferences.showGrid) {
        for (let x = WORLD_GRID_SIZE; x < worldSize.width; x += WORLD_GRID_SIZE) surface.moveTo(x, 0).lineTo(x, worldSize.height);
        for (let y = WORLD_GRID_SIZE; y < worldSize.height; y += WORLD_GRID_SIZE) surface.moveTo(0, y).lineTo(worldSize.width, y);
        surface.stroke({ color: THEME.fineGrid, width: 1, alpha: .025 });
        for (let x = WORLD_GRID_SIZE * 5; x < worldSize.width; x += WORLD_GRID_SIZE * 5) surface.moveTo(x, 0).lineTo(x, worldSize.height);
        for (let y = WORLD_GRID_SIZE * 5; y < worldSize.height; y += WORLD_GRID_SIZE * 5) surface.moveTo(0, y).lineTo(worldSize.width, y);
        surface.stroke({ color: THEME.coarseGrid, width: 2, alpha: .16 });
      }
      surfaceLayer.addChild(surface);
    };

    const drawFrame = (node: MachineNode, body: Graphics, header: Graphics) => {
      const size = getNodeSize(node); const selected = propsRef.current.selectedIds.includes(node.id); const definition = getNodeDisplayDefinition(node);
      if (isOrganicNode(node)) {
        const points = obstructionOutline(node);
        const fill = node.kind === 'resourceGolem' ? definition.accent : node.lizardSettlement ? 0x183a2a : node.kind === 'lake' ? 0x17334a : node.kind === 'monster-camp' ? 0x3b2023 : 0x090a0c;
        body.poly(points).fill({ color: fill, alpha: .98 }).stroke({ color: selected ? THEME.selected : definition.accent, width: selected ? 4 : 2, alpha: .86 });
        if (node.kind === 'lake') body.poly(organicPolygon(node, 18, .78)).stroke({ color: 0x55bde8, width: 2, alpha: .28 });
        if (node.kind === 'big-hole') body.poly(organicPolygon(node, 11, .72)).fill({ color: 0x000000, alpha: .82 });
        if (node.kind === 'resourceGolem') {
          body.rect(-size.w * .09, -size.h * .43, size.w * .055, size.h * .025).fill(0x101820);
          body.rect(size.w * .035, -size.h * .43, size.w * .055, size.h * .025).fill(0x101820);
          body.moveTo(-size.w * .12, -size.h * .21).lineTo(size.w * .12, -size.h * .21).stroke({ color: 0x101820, width: 5, alpha: .4 });
        }
        if (node.kind === 'monster-camp') [-.25, .05, .31].forEach((offset, index) => body.poly([-18 + offset * size.w, 12 + (index - 1) * 9, offset * size.w, -18 - index * 2 + (index - 1) * 9, 18 + offset * size.w, 12 + (index - 1) * 9]).fill({ color: node.lizardSettlement ? 0x326b4b : 0x6c3732 }).stroke({ color: node.lizardSettlement ? 0x71c99a : 0xc76a5f, width: 1 }));
        return;
      }
      if (node.kind === 'joint') { body.circle(0, 0, size.w / 2).fill({ color: THEME.body }).stroke({ color: selected ? THEME.selected : definition.accent, width: selected ? 3 : 1.5 }); body.circle(0, 0, 5).fill({ color: 0x202226 }).stroke({ color: definition.accent, width: 1.2 }); return; }
      const radius = isCompactNode(node) || node.kind === 'woodenChest' || node.kind === 'chest' ? 9 : 12;
      body.roundRect(-size.w / 2 + 1, -size.h / 2 + 8, size.w, size.h, radius).fill({ color: 0x000000, alpha: .42 });
      body.roundRect(-size.w / 2, -size.h / 2, size.w, size.h, radius).fill({ color: node.disabled ? 0x351d21 : THEME.body }).stroke({ color: selected ? THEME.selected : THEME.border, width: selected ? 3 : 1.25 });
      if(node.kind==='cornerChallenge'&&node.cornerType==='alpha') {
        body.poly([-20,20,-155,-75,-210,95,-110,50,-48,115,0,145,48,115,110,50,210,95,155,-75,20,20]).fill({color:0x873b38,alpha:.65}).stroke({color:0xe9a25e,width:3});
        body.poly([-38,5,-22,-40,0,-20,22,-40,38,5,24,50,0,72,-24,50]).fill({color:0xb66a43}).stroke({color:0xf4c17a,width:3});
        body.circle(-14,8,5).fill(0xffdf8c);body.circle(14,8,5).fill(0xffdf8c);
      }
      const shape = getNodeModule(node.kind).appearance.shape;
      const headerHeight = shape === 'road' || shape === 'chest' ? 42 : isCompactNode(node) ? 30 : isResourceNode(node) ? 73 : 61;
      header.roundRect(-size.w / 2 + 1, -size.h / 2 + 1, size.w - 2, headerHeight, Math.max(2, radius - 1)).fill({ color: node.disabled ? 0x542a2f : THEME.header });
      header.rect(-size.w / 2 + 1, -size.h / 2 + headerHeight - 1, size.w - 2, 1).fill({ color: 0xffffff, alpha: .06 });
      header.roundRect(-size.w / 2 + 10, -size.h / 2 - .5, size.w - 20, 2.5, 2).fill({ color: node.disabled ? THEME.danger : definition.accent });
    };

    const addAction = (node: MachineNode, root: Container, x: number, key: string, glyph: string, color: number, action: () => void) => {
      const compact = isCompactNode(node); const chest = getNodeModule(node.kind).appearance.shape === 'chest'; const actionSize = compact || chest ? 18 : 25; const button = new Container(); button.label = 'node-control'; button.visible = controlHover.visible(node.id, performance.now()); const plate = new Graphics();
      button.position.set(x, -getNodeSize(node).h / 2 + (compact ? -7 : chest ? 12 : 18)); button.eventMode = 'static'; button.cursor = 'pointer'; button.hitArea = new Rectangle(0, 0, actionSize, actionSize);
      const drawPlate = (hovered = false, pressed = false) => { const base = key === 'delete' ? 0x241b1d : key === 'pause' ? 0x252117 : 0x1d2328; const hover = key === 'delete' ? 0x5e292b : key === 'pause' ? 0x50401f : 0x293b47; plate.clear().roundRect(0, pressed ? 1 : 0, actionSize, actionSize, compact ? actionSize / 2 : 6).fill({ color: hovered ? hover : base, alpha: .98 }).stroke({ color, width: 1, alpha: hovered ? .82 : .34 }); };
      drawPlate(); button.addChild(plate);
      if (key === 'delete') drawTrashIcon(button, actionSize / 2, actionSize / 2, color); else { const text = label(glyph, compact ? 10 : 12, color, 'bold', 'monospace'); text.anchor.set(.5); text.position.set(actionSize / 2, actionSize / 2); button.addChild(text); }
      button.on('pointerdown', (event) => { if (event.button !== 0) return; event.stopPropagation(); controlHover.press(node.id); drawPlate(true, true); }); button.on('pointerup', () => { controlHover.release(); drawPlate(true); }); button.on('pointerupoutside', () => { controlHover.release(); drawPlate(); }); button.on('pointertap', (event) => { if (event.button !== 0) return; event.stopPropagation(); clearTooltip(); action(); });
      const actionTooltip = (event: FederatedPointerEvent) => showTooltip(event, key === 'delete' ? 'Decommission' : key === 'pause' ? (node.processingPaused ? 'Resume processing' : 'Pause processing') : key === 'rotate' ? 'Rotate connectors' : key === 'configure' ? 'Choose recipe' : 'Select', key === 'delete' ? 'Remove this node and its attached cables.' : key === 'pause' ? 'Stops new production. Completed output continues routing.' : key === 'rotate' ? 'Rotate the Splitter or Merger 90°.' : key === 'configure' ? 'Configure this machine with one of its unlocked production recipes.' : 'Select this node on the factory map.', `#${color.toString(16).padStart(6, '0')}`, 'NODE CONTROL');
      button.on('pointerover', (event) => { event.stopPropagation(); enterNodeHover(node.id); drawPlate(true); actionTooltip(event); }); button.on('pointermove', (event) => { event.stopPropagation(); enterNodeHover(node.id); actionTooltip(event); });
      button.on('pointerout', () => { drawPlate(); clearTooltip(); }); root.addChild(button);
    };

    const addPortOrderAction = (node: MachineNode, root: Container, x: number) => {
      const color = 0xaab0b8; const actionSize = 25; const button = new Container(); button.label = 'node-control'; button.visible = controlHover.visible(node.id, performance.now()); const plate = new Graphics();
      button.position.set(x, -getNodeSize(node).h / 2 + 18); button.eventMode = 'static'; button.cursor = 'pointer'; button.hitArea = new Rectangle(0, 0, actionSize, actionSize);
      const drawPlate = (hovered = false, pressed = false) => { plate.clear().roundRect(0, pressed ? 1 : 0, actionSize, actionSize, 6).fill({ color: hovered ? 0x41464d : 0x25282d, alpha: .98 }).stroke({ color, width: 1, alpha: hovered ? .82 : .34 }); };
      drawPlate(); button.addChild(plate);
      const icon = label('⇅', 15, color, 'bold', 'monospace'); icon.anchor.set(.5); icon.position.set(actionSize / 2, actionSize / 2); button.addChild(icon);
      const tooltip = (event: FederatedPointerEvent) => showTooltip(event, 'Reposition connectors', actionSize * camera.zoom < 12 ? 'Zoom in to rearrange connectors.' : 'Left-click cycles input order. Right-click cycles output position.', '#aab0b8', 'NODE CONTROL');
      button.on('pointerdown', (event: FederatedPointerEvent) => { if (event.button !== 0 && event.button !== 2) return; event.preventDefault(); event.stopPropagation(); controlHover.press(node.id); drawPlate(true, true); });
      button.on('pointerup', () => { controlHover.release(); drawPlate(true); }); button.on('pointerupoutside', () => { controlHover.release(); drawPlate(); });
      button.on('pointertap', (event: FederatedPointerEvent) => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); clearTooltip(); if (actionSize * camera.zoom < 12) { propsRef.current.onSelect([node.id]); tooltip(event); return; } propsRef.current.onCycleInputPorts(node.id); });
      button.on('rightclick', (event: FederatedPointerEvent) => { event.preventDefault(); event.stopPropagation(); clearTooltip(); if (actionSize * camera.zoom < 12) { propsRef.current.onSelect([node.id]); tooltip(event); return; } propsRef.current.onCycleOutputPorts(node.id); });
      button.on('pointerover', (event: FederatedPointerEvent) => { event.stopPropagation(); enterNodeHover(node.id); drawPlate(true); tooltip(event); });
      button.on('pointermove', (event: FederatedPointerEvent) => { event.stopPropagation(); enterNodeHover(node.id); tooltip(event); });
      button.on('pointerout', () => { drawPlate(); clearTooltip(); }); root.addChild(button);
    };

    const addPort = (node: MachineNode, root: Container, direction: 'input' | 'output', index: number, family: string, interactive = true) => {
      const anchor = getPortAnchor(node, direction, index); const definition = getNodeDisplayDefinition(node); const portRoot = new Container();
      portRoot.position.set(anchor.x, anchor.y); portRoot.eventMode = 'static'; portRoot.cursor = 'grab';
      portRoot.hitArea = { contains: (x: number, y: number) => socketHitContains(x * camera.zoom, y * camera.zoom, getPortSide(node, direction, index), isCompactNode(node)) };
      const pulse = new Graphics(); const shape = new Graphics(); const sector = propsRef.current.engine.getSector(); const connections = sector.connections;
      const related = connections.filter((connection) => direction === 'input' ? connection.to === node.id && (connection.toPort ?? 0) === index : connection.from === node.id && (connection.fromPort ?? 0) === index);
      const connected = related.length > 0; const connectedItem = related.find((connection) => connection.item)?.item;
      const buffer = direction === 'output' ? node.output : node.input;
      const bufferedItem = (Object.keys(buffer) as ItemId[]).find((item) => (buffer[item] ?? 0) > 0);
      const recipeItem = direction === 'output' && node.recipeId ? Object.keys(RECIPES[node.recipeId]?.outputs ?? {})[0] as ItemId | undefined : undefined;
      const filteredItem = direction === 'output' ? related.map((connection) => sector.nodes.find((candidate) => candidate.id === connection.to)?.filterItem).find((item): item is ItemId => Boolean(item)) : undefined;
      const declaredItem = isItemId(family) ? family : undefined;
      const routedItem = node.kind === 'goblinTribute' && direction === 'output' ? declaredItem : connectedItem ?? filteredItem ?? declaredItem ?? bufferedItem ?? recipeItem ?? node.resourceItem;
      const production = isProductionMachine(node);
      const portColor = node.kind === 'devSource' ? definition.accent : routedItem ? ITEM_COLORS[routedItem] : definition.accent; const multi = isMultiConnectionPort(node, direction, index);
      if (production) { shape.circle(0, 0, 10).fill(portColor); }
      else if (multi) { const points: number[] = []; for (let point = 0; point < 16; point++) { const angle = -Math.PI / 2 + point * Math.PI / 8; const radius = point % 2 === 0 ? 11 : 5.5; points.push(Math.cos(angle) * radius, Math.sin(angle) * radius); } shape.poly(points).fill({ color: connected ? portColor : 0x121315 }).stroke({ color: portColor, width: 2 }); }
      else shape.circle(0, 0, 9).fill({ color: connected ? portColor : 0x121315 }).stroke({ color: portColor, width: 2 });
      const highlight = new Graphics(); highlight.eventMode = 'none'; portRoot.addChild(highlight, pulse, shape);
      const roleLabel = portRoleLabel(node, direction, index, family, routedItem); if (!production && roleLabel && !(direction === 'output' && (isResourceNode(node) || node.kind === 'lake' || node.infiniteResource)) && !isStorageNode(node.kind) && definition.category !== 'Logistics' && getNodeCapabilities(node.kind).behavior !== 'research') { const side = getPortSide(node, direction, index); const displayName = roleLabel.length > 15 ? `${roleLabel.slice(0, 14)}…` : roleLabel; const text = label(displayName.toUpperCase(), 9, 0xf0f4f7, 'bold', 'monospace'); text.anchor.set(.5); const width = Math.max(28, text.width + 12); const badge = new Container(); badge.eventMode = 'none'; badge.addChild(new Graphics().roundRect(-width / 2, -9, width, 18, 4).fill({ color: 0x111419, alpha: .96 }).stroke({ color: portColor, width: 1, alpha: .78 })); badge.addChild(text); if (side === 'east') badge.position.set(-12 - width / 2, 0); else if (side === 'west') badge.position.set(12 + width / 2, 0); else if (side === 'north') badge.position.set(0, 18); else badge.position.set(0, -18); portRoot.addChild(badge); }
      let materialLabel: Text | undefined, materialBuffer: Graphics | undefined;
      if (production) {
        materialLabel = label('', 11, 0xe7ebef, 'bold'); materialLabel.eventMode = 'none';
        materialBuffer = new Graphics(); materialBuffer.eventMode = 'none'; portRoot.addChild(materialLabel, materialBuffer);
      }
      const view: PortView = { nodeId: node.id, direction, index, root: portRoot, highlight, pulse, pulseColor: THEME.flow, pulseStartedAt: 0, hovered: false, materialShape: production ? shape : undefined, materialLabel, materialBuffer };
      if (production) updateProductionPort(view, node, sector);
      root.addChild(portRoot); if (!interactive) { portRoot.eventMode = 'none'; portRoot.cursor = 'default'; return; }
      const key = `${node.id}:${direction}:${index}`; portViews.set(key, view);
      const tooltip = (event: FederatedPointerEvent) => {
        if (multi && !propsRef.current.engine.getState().preferences.skipMultiConnectionTooltip) showTooltip(event, 'Multi-connection connector', 'This connector can accept multiple connections at the same time.', `#${portColor.toString(16).padStart(6, '0')}`, 'MULTI-CONNECTION PORT');
      };
      portRoot.on('pointerover', (event) => { view.hovered = true; tooltip(event); }); portRoot.on('pointermove', tooltip); portRoot.on('pointerout', () => { view.hovered = false; clearTooltip(); });
      portRoot.on('pointerdown', (event: FederatedPointerEvent) => {
        if (event.button !== 0 || spaceHeld) return;
        event.preventDefault(); event.stopPropagation(); clearTooltip();
        let handle: PortHandle = { nodeId: node.id, direction, index };
        let closest = Infinity;
        portViews.forEach((candidate) => {
          if (candidate.nodeId !== node.id || candidate.direction !== direction) return;
          const point = portScreenPoint(candidate); if (!point) return;
          const distance = Math.hypot(point.x - event.global.x, point.y - event.global.y);
          if (distance < closest) { closest = distance; handle = { nodeId: node.id, direction, index: candidate.index }; }
        });
        beginPortDrag(handle, event);
      });
    };

    const createNodeView = (node: MachineNode, placementPreview = false): NodeView => {
      const definition = getNodeDisplayDefinition(node); const size = getNodeSize(node); const compact = isCompactNode(node); const root = new Container();
      const readabilityLabels: Text[] = [];
      const movable = isPlayerMovableNode(node.kind, propsRef.current.engine.getState(), node);
      root.x = node.x; root.y = node.y; root.eventMode = placementPreview || node.disabled ? 'none' : 'static'; root.cursor = placementPreview ? 'default' : node.disabled ? 'not-allowed' : movable ? 'grab' : 'default'; root.alpha = placementPreview ? .78 : node.disabled ? .68 : 1;
      const body = new Graphics(); const header = new Graphics(); drawFrame(node, body, header); root.addChild(body, header);
      const controlGroup = !placementPreview && propsRef.current.engine.getSector().controlGroups?.find(group => group.nodeIds.includes(node.id));
      if (controlGroup) {
        const marker = new Graphics(); marker.eventMode = 'none';
        marker.roundRect(-size.w / 2 - 2, -size.h / 2 - 2, size.w + 4, size.h + 4, 10).stroke({ color: controlGroup.color, width: 2, alpha: .75 });
        const badge = node.kind === 'joint' ? { x: 0, y: -12, r: 4 } : compact ? { x: size.w / 2 - 8, y: size.h / 2 - 8, r: 4 } : getNodeModule(node.kind).appearance.shape === 'chest' ? { x: -size.w / 2 + 13, y: -size.h / 2 + 20, r: 4 } : { x: -size.w / 2 + (isResourceNode(node) ? 64 : 56), y: -size.h / 2 + (isResourceNode(node) ? 36 : 30), r: 5 };
        marker.circle(badge.x, badge.y, badge.r).fill(controlGroup.color).stroke({ color: 0xffffff, width: 1, alpha: .7 });
        root.addChild(marker);
      }
      if (!isOrganicNode(node) && node.kind !== 'joint') {
        const road = getNodeModule(node.kind).appearance.shape === 'road';
        const chest = getNodeModule(node.kind).appearance.shape === 'chest';
        const iconSize = road || chest ? 33 : compact ? 24 : isResourceNode(node) ? 40 : 33; const iconX = compact || chest ? 0 : -size.w / 2 + (isResourceNode(node) ? 34 : 29); const iconY = -size.h / 2 + (road || chest ? 21 : compact ? 15 : isResourceNode(node) ? 36 : 30);
        root.addChild(new Graphics().roundRect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize, 7).fill({ color: definition.accent, alpha: .1 }).stroke({ color: definition.accent, width: 1, alpha: .42 }));
        drawNodeIcon(root, getNodeModule(node.kind).appearance.icon, iconX, iconY, road || chest ? 21 : compact ? 16 : isResourceNode(node) ? 25 : 21, definition.accent, modNode(node.kind)?.icon);
        if (!compact && !chest) {
          const title = label(node.name, isResourceNode(node) ? 20 : 17, 0xf3f5f7, 'bold'); title.x = -size.w / 2 + (isResourceNode(node) ? 63 : 55) + (controlGroup ? 16 : 0); title.y = -size.h / 2 + (isResourceNode(node) ? 22 : 17); root.addChild(title); readabilityLabels.push(title);
        }
      }
      if (isOrganicNode(node)) {
        const title = label(node.name.toUpperCase(), 16, 0xf3f5f7, 'bold', 'monospace'); title.anchor.set(.5); title.position.set(0, node.kind === 'resourceGolem' ? -size.h / 2 - 30 : node.kind === 'lake' ? 0 : -72); root.addChild(title); readabilityLabels.push(title);
      }
      if (getNodeModule(node.kind).appearance.shape === 'road') drawRoadFlowArrow(root, node);
      if (node.kind === 'devSource') {
        const status = label('AUTO SUPPLY', 15, definition.accent, 'bold', 'monospace'); status.anchor.set(.5); status.position.set(0, 24); root.addChild(status); readabilityLabels.push(status);
      }
      const grove = groveProgress(node); const initialProgress = grove ? grove.fraction : isResourceNode(node) ? resourceReserveFraction(node) : getNodeCapabilities(node.kind).behavior === 'research' ? researchCenterView(node, propsRef.current.engine.getState()).progress : 0;
      const campView = node.kind === 'monster-camp' ? createCampNodeStatus() : undefined;
      if (campView) { root.addChild(campView.halo, campView.root); updateCampNodeStatus(campView, node, 0, 1); }
      const progress = new Graphics(); const progressTrack = new Graphics(); let progressLabel: Text | undefined; let bufferLabel: Text | undefined; let bufferSquares: Graphics | undefined; let inputSquares: Graphics | undefined; let coreStorageLabels: Text[] | undefined; let coreStorageSquares: Graphics[] | undefined;
      if (!compact && !isOrganicNode(node)) {
        const progressWidth = size.w - (isResourceNode(node) ? 32 : 26); const progressY = size.h / 2 - (isResourceNode(node) ? 26 : 22);
        if (!isStorageNode(node.kind) && node.kind !== 'goblinTribute' && node.kind !== 'devSource') {
        progressTrack.roundRect(-progressWidth / 2, progressY, progressWidth, isResourceNode(node) ? 10 : 8, 4).fill({ color: THEME.progressTrack }).stroke({ color: 0x0e0f11, width: 1 });
        progress.roundRect(0, 0, progressWidth, isResourceNode(node) ? 10 : 8, 4).fill({ color: isProductionMachine(node) ? 0x8ea0a6 : definition.accent }); progress.position.set(-progressWidth / 2, progressY);
        progress.scale.x = initialProgress;
        if (!isProductionMachine(node) && getNodeCapabilities(node.kind).behavior !== 'research') { progressLabel = label(grove?.label ?? `${Math.round(initialProgress * 100)}%`, 12, 0xf0f2f4, 'bold', 'monospace'); progressLabel.anchor.set(1, .5); progressLabel.position.set(size.w / 2 - 14, progressY - 14); readabilityLabels.push(progressLabel); } root.addChild(progressTrack, progress); if (progressLabel) root.addChild(progressLabel);
        }
        if (getNodeCapabilities(node.kind).behavior === 'research') {
          coreStorageSquares = RESEARCH_CORE_TYPES.map(() => { const squares = new Graphics(); squares.eventMode = 'none'; root.addChild(squares); return squares; });
          coreStorageLabels = RESEARCH_CORE_TYPES.map((item) => {
            const text = label('', 11, ITEM_COLORS[item], 'bold', 'monospace');
            root.addChild(text); return text;
          });
        } else {
          if (isResourceNode(node)) {
            bufferLabel = label(resourceCapacityReadout(node), 12, 0xd1d7de, 'bold', 'monospace'); bufferLabel.anchor.set(.5, .5); bufferLabel.position.set(0, progressY - 21); root.addChild(bufferLabel); readabilityLabels.push(bufferLabel);
          } else if (outputCapacity(node) > 0 && !isProductionMachine(node)) {
            bufferSquares = new Graphics(); bufferSquares.eventMode = 'none'; root.addChild(bufferSquares);
          }
        }
      }
      if (!compact && !isOrganicNode(node) && !isStorageNode(node.kind) && !isProductionMachine(node) && getNodeCapabilities(node.kind).behavior !== 'research') {
        inputSquares = new Graphics(); inputSquares.eventMode = 'none'; root.addChild(inputSquares);
      }
      getEffectiveNodeInputFamilies(node, propsRef.current.engine.getState().research.completed).forEach((family, index) => addPort(node, root, 'input', index, family, !placementPreview)); getEffectiveNodeOutputFamilies(node).forEach((family, index) => addPort(node, root, 'output', index, family, !placementPreview));
      if (!placementPreview) {
        const chest = getNodeModule(node.kind).appearance.shape === 'chest';
        let actionX = size.w / 2 - (compact ? 9 : chest ? 25 : 32);
        if (canDeleteNode(node)) { addAction(node, root, actionX, 'delete', '×', 0xff8d93, () => propsRef.current.onDeleteNode(node.id)); actionX -= compact || chest ? 22 : 30; }
        if (!compact && canCyclePortPositions(node)) { addPortOrderAction(node, root, actionX); actionX -= 30; }
        const controls = getNodeModule(node.kind).controls;
        if (controls.rotatable && definition.category !== 'Logistics') addAction(node, root, actionX, 'rotate', '↻', 0x8ec9ff, () => propsRef.current.onRotate(node.id)); else if (controls.configuration && controls.configuration !== 'recipe' && controls.configuration !== 'research' && controls.configuration !== 'tribute') addAction(node, root, actionX, 'configure', '⚙', 0x8ec9ff, () => propsRef.current.onConfigure(node.id));
      }
      let researchStatus;
      if (!placementPreview && getNodeCapabilities(node.kind).behavior === 'research') {
        researchStatus = createResearchNodeStatus(node, () => propsRef.current.onConfigure(node.id));
        updateResearchNodeStatus(researchStatus, researchCenterView(node, propsRef.current.engine.getState()).projectName, nodeTextScale(camera.zoom));
        root.addChild(researchStatus.root);
      }
      let jointMoveHandle: Container | undefined;
      if (node.kind === 'joint' && !placementPreview) {
        jointMoveHandle = new Container(); jointMoveHandle.label = 'joint-move-handle';
        jointMoveHandle.position.set(-size.w / 2 - 15, -15);
        jointMoveHandle.eventMode = 'static'; jointMoveHandle.cursor = 'grab';
        jointMoveHandle.hitArea = new Rectangle(0, 0, 17, 30);
        const grip = new Graphics(); grip.eventMode = 'none';
        grip.roundRect(0, 0, 17, 30, 6).fill({ color: 0x202328, alpha: .98 }).stroke({ color: definition.accent, width: 1.3, alpha: .85 });
        for (let dot = 0; dot < 6; dot++) grip.circle(5.5 + dot % 2 * 6, 9 + Math.floor(dot / 2) * 6, 1.5).fill(definition.accent);
        jointMoveHandle.addChild(grip);
        jointMoveHandle.visible = hoveredNodeId === node.id || Boolean(propsRef.current.jointMoveHint);
        root.addChild(jointMoveHandle);
      }
      const productionCue = new Graphics(); productionCue.eventMode = 'none'; root.addChild(productionCue);
      const flash = new Graphics(); const marqueeHighlight = new Graphics(); const invalidOverlay = new Graphics(); root.addChild(flash, marqueeHighlight, invalidOverlay);
      if (!placementPreview) {
        const nodeTooltip = (event: FederatedPointerEvent) => { const obstruction = isOrganicNode(node); const engine = propsRef.current.engine; const live = engine.getSector().nodes.find(n => n.id === node.id) ?? node; const production = productionExplanation(live, engine.getState(), engine.getSector()); const detail = node.kind === 'lake' ? 'Water source · Fixed world obstruction · Connect from any output socket.' : node.kind === 'big-hole' ? `${Math.floor(node.resourceRemaining ?? 0)} Stone required · Fixed world obstruction.` : node.kind === 'monster-camp' ? `Threat ${live.campStrength ?? 25}% · ${campStatus(live).apLabel} per check · ${campStatus(live).checkLabel}.` : production.summary || `Click to select${movable ? ' · Drag to move' : ''}.`; showTooltip(event, node.name, detail, definition.accentCss, obstruction ? 'WORLD OBSTRUCTION' : definition.category.toUpperCase(), node.id); };
        root.on('pointerenter', () => { if (!propsRef.current.placing) enterNodeHover(node.id); }); root.on('pointermove', (event) => { if (!drag && !propsRef.current.placing && event.target === root) nodeTooltip(event); });
        root.on('pointerleave', () => { controlHover.leave(node.id, performance.now(), node.kind === 'joint' ? JOINT_CONTROL_GRACE_MS : 0); if (hoveredNodeId === node.id) { hoveredNodeId = undefined; propsRef.current.onHoverNode?.(); } clearTooltip(); });
        root.on('pointerdown', (event: FederatedPointerEvent) => {
          if (!canSelectNode(node.id)) { event.stopPropagation(); return; }
          if (event.button === 2 && !propsRef.current.placing) { rightPress = { id: node.id, x: event.global.x, y: event.global.y, moved: false }; return; }
          if (event.button !== 0 || spaceHeld) return; event.stopPropagation();
          if (event.shiftKey && propsRef.current.onCopyRecipe(node.id)) return;
          if ((event.ctrlKey || event.metaKey) && movable) { groupSelection.clear(); propsRef.current.onClonePlacement(node.kind); return; }
          // The body can win Pixi hit testing over an enlarged socket. Resolve
          // nearby sockets before starting a machine move, including inside edges.
          if (event.target === jointMoveHandle) controlHover.press(node.id);
          const nearby = event.target === jointMoveHandle ? undefined : socketAt(event.global.x, event.global.y);
          if (nearby) { beginPortDrag(nearby, event); return; }
          const sector = propsRef.current.engine.getSector();
          const existing = propsRef.current.selectedIds;
          const selectedIds = !movable || node.kind === 'road' || node.kind === 'fluidRoad' ? [node.id] : groupSelection.press(node.id, existing, sector.controlGroups ?? [], event.global, performance.now(), event.shiftKey, event.detail);
          propsRef.current.onSelect(selectedIds, { source: 'node', individual: groupSelection.individualId === node.id, priority: groupSelection.priorityIds.length > 0 }); propsRef.current.onConnectionSelect(undefined); if (!movable) { groupSelection.clear(); return; } const origins = new Map<string, { x: number; y: number }>();
          const movableIds = sector.nodes.filter((candidate) => selectedIds.includes(candidate.id) && isPlayerMovableNode(candidate.kind, propsRef.current.engine.getState(), candidate) && !candidate.disabled).map((candidate) => candidate.id);
          propsRef.current.engine.getSector().nodes.filter((candidate) => movableIds.includes(candidate.id)).forEach((candidate) => origins.set(candidate.id, { x: candidate.x, y: candidate.y })); dragPointer = { x: event.global.x, y: event.global.y }; drag = { ids: movableIds, anchorId: node.id, anchorSize: getNodeSize(node), start: toWorld(event.global.x, event.global.y), origins, moved: false, valid: true };
        });
        // A stationary right-click invokes the node action; dragging still pans.
        root.on('pointerup', (event: FederatedPointerEvent) => {
          if (event.button === 0 && drag?.ids.includes(node.id) && !drag.moved && getNodeModule(node.kind).controls.configuration === 'research') {
            propsRef.current.onConfigure(node.id);
          }
          if (event.button === 2) {
            const press = rightPress; rightPress = undefined;
            if (press?.id === node.id && !press.moved && Math.hypot(event.global.x - press.x, event.global.y - press.y) <= 4) {
              panning = undefined; clearTooltip();
              propsRef.current.onNodeContextMenu(node.id, groupSelection.priorityIds.includes(node.id), event.shiftKey);
              event.stopPropagation();
            }
          }
        });
      }
      return { root, campStatus: campView, jointMoveHandle, researchStatus, productionCue, progress, progressLabel, bufferLabel, bufferSquares, inputSquares, coreStorageLabels, coreStorageSquares, readabilityLabels, flash, marqueeHighlight, invalidOverlay, invalidVisible: false, displayedProgress: initialProgress };
    };

    const drawInsertionPreview = (node?: MachineNode, valid = true) => {
      if (!insertionPreviewLayer) return false;
      const sector = propsRef.current.engine.getSector();
      const signature = node && valid ? [propsRef.current.engine.getState().revision, node.id, node.x, node.y, node.rotation].join('|') : '';
      if (signature === insertionPreviewSignature) {
        const original = cableLayer.children.find(child => child.label === insertionPreviewCableId);
        if (original) original.visible = false;
        return Boolean(insertionPreviewCableId);
      }
      const previous = cableLayer.children.find(child => child.label === insertionPreviewCableId);
      if (previous) previous.visible = true;
      insertionPreviewSignature = signature; insertionPreviewCableId = undefined; insertionPreviewLayer.clear();
      if (!node || !valid) return false;
      const plan = propsRef.current.engine.getCableInsertionPreview(node);
      if (!plan) return false;
      insertionPreviewCableId = plan.replacedConnectionId;
      const original = cableLayer.children.find(child => child.label === plan.replacedConnectionId);
      if (original) original.visible = false;
      const nodes = new Map(sector.nodes.map(candidate => [candidate.id, candidate])); nodes.set(node.id, node);
      const cables = [...sector.connections.filter(cable => cable.id !== plan.replacedConnectionId), ...plan.connections];
      for (const cable of plan.connections) {
        const points = connectionPoints(cable, nodes, cables); if (!points) continue;
        drawCurve(insertionPreviewLayer, points.start, points.end, points.sourceSide, points.targetSide);
        insertionPreviewLayer.stroke({ color: 0x72dca1, width: 11, alpha: .3, cap: 'round' });
        drawCurve(insertionPreviewLayer, points.start, points.end, points.sourceSide, points.targetSide);
        insertionPreviewLayer.stroke({ color: cable.item ? ITEM_COLORS[cable.item] : 0x9ee7c0, width: 5, alpha: 1, cap: 'round' });
      }
      return true;
    };

    const syncPlacementPreview = () => {
      const kind = propsRef.current.placing;
      if (!kind || !placementPointerInside) {
        if (drag?.desired && drag.ids.length === 1) {
          const node = propsRef.current.engine.getSector().nodes.find(candidate => candidate.id === drag!.ids[0]);
          if (node) drawInsertionPreview({ ...node, ...drag.desired[node.id] }, drag.valid);
        } else drawInsertionPreview();
        if (placementView) placementView.view.root.visible = false; return; }
      const point = snapNodePosition(toWorld(placementCursor.x, placementCursor.y), propsRef.current.snapToGrid, getNodeSize({ kind })); const preview = propsRef.current.engine.getNodePlacementPreview(kind, point.x, point.y);
      if (!preview) { drawInsertionPreview(); if (placementView) placementView.view.root.visible = false; return; }
      if (!placementView || placementView.kind !== kind) {
        placementLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
        const view = createNodeView(preview.node, true); const status = label('', 11, 0xffffff, 'bold', 'monospace'); status.anchor.set(.5); view.root.addChild(status); placementLayer.addChild(view.root); placementView = { kind, view, status };
      }
      const { view, status } = placementView; const size = getNodeSize(preview.node); const color = preview.valid ? 0x72dca1 : THEME.danger;
      view.root.visible = true; view.root.alpha = preview.valid ? .8 : .66; view.root.position.set(preview.node.x, preview.node.y); view.invalidOverlay.clear().roundRect(-size.w / 2 - 6, -size.h / 2 - 6, size.w + 12, size.h + 12, 15).fill({ color, alpha: preview.valid ? .055 : .16 }).stroke({ color, width: 4, alpha: .98 });
      const inserts = drawInsertionPreview(preview.node, preview.valid);
      status.text = preview.valid ? inserts ? 'CLICK TO INSERT' : 'CLICK TO PLACE' : 'BLOCKED'; status.style.fill = color; status.position.set(0, size.h / 2 + 18); status.scale.set(nodeTextScale(camera.zoom));
    };

    const createCableView = (connection: Connection, nodes: Map<string, MachineNode>, connections: Connection[]) => {
      const points = connectionPoints(connection, nodes, connections); if (!points) return; const selected = propsRef.current.selectedConnection === connection.id; const color = connection.item ? ITEM_COLORS[connection.item] : 0x60758f;
      const root = new Container(); root.label = connection.id; root.eventMode = 'static'; root.cursor = 'pointer'; const underlay = new Graphics(); drawCurve(underlay, points.start, points.end, points.sourceSide, points.targetSide); underlay.stroke({ color: selected ? THEME.cableSelected : THEME.cableUnderlay, width: selected ? 12 : 10, cap: 'round' });
      const cable = new Graphics(); drawCurve(cable, points.start, points.end, points.sourceSide, points.targetSide); cable.stroke({ color, width: selected ? 7 : 5, alpha: .94, cap: 'round' }); const hit = new Graphics(); drawCurve(hit, points.start, points.end, points.sourceSide, points.targetSide); hit.stroke({ color: 0xffffff, width: 20, alpha: .001, cap: 'round' }); root.addChild(underlay, cable, hit);
      root.on('pointerdown', (event) => { if (event.button !== 0) return; event.stopPropagation(); propsRef.current.onConnectionSelect(connection.id); propsRef.current.onSelect([]); });
      const cableTooltip = (event: FederatedPointerEvent) => showTooltip(event, connection.item ? ITEM_NAMES[connection.item] : 'Untyped cable', `${points.from.name} [${points.outputIndex + 1}] → ${points.to.name} [${points.inputIndex + 1}] · Click to select.`, connection.item ? `#${ITEM_COLORS[connection.item].toString(16).padStart(6, '0')}` : '#60758f', 'CONNECTION');
      root.on('pointerover', cableTooltip); root.on('pointermove', cableTooltip); root.on('pointerout', clearTooltip);
      if (selected) { const midpoint = curvePoint(connection, nodes, connections, .5)!; const button = new Container(); button.position.set(midpoint.x, midpoint.y + 22 / camera.zoom); button.eventMode = 'static'; button.cursor = 'pointer'; button.hitArea = new Rectangle(-15, -15, 30, 30); button.addChild(new Graphics().circle(0, 0, 13).fill({ color: 0x291316, alpha: .98 }).stroke({ color: 0xf06c72, width: 2 })); drawTrashIcon(button, 0, 0, 0xff8d93); button.on('pointerdown', (event) => { if (event.button === 0) event.stopPropagation(); }); button.on('pointertap', (event) => { if (event.button !== 0) return; event.stopPropagation(); propsRef.current.onDeleteConnection(connection.id); }); root.addChild(button); }
      cableLayer.addChild(root);
    };

    const syncParticles = () => {
      const engine = propsRef.current.engine;
      const sector = engine.getSector();
      const visible = engine.getState().preferences.particles ? engine.getActiveTransfers().slice(0, MAX_VISIBLE_TRANSFERS) : [];
      const signature = `${sector.id}|${visible.map((transfer) => transfer.id).join(',')}`;
      if (signature === lastParticleSignature) return;
      lastParticleSignature = signature;
      particleLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
      const passedByTransfer = new Map(particles.map(particle => [particle.transfer.id, particle.passed]));
      particles.length = 0;
      for (const transfer of visible) {
        const connection = sceneConnections.get(transfer.connectionId);
        if (!connection) continue;
        const { path, passages } = buildTransferMotionPath(transfer, sceneNodes, sector.connections);
        if (!path.length) continue;
        const root = new Container();
        const outerGlow = new Graphics().roundRect(-23, -7, 46, 14, 7).fill({ color: THEME.flow, alpha: .1 });
        const glow = new Graphics().roundRect(-19, -4.5, 38, 9, 4.5).fill({ color: THEME.flow, alpha: .32 });
        const bar = new Graphics().roundRect(-16, -2, 32, 4, 2).fill({ color: THEME.flowCore, alpha: 1 });
        outerGlow.blendMode = 'add'; glow.blendMode = 'add'; bar.blendMode = 'add';
        root.addChild(outerGlow, glow, bar);
        if ((transfer.amount ?? 1) > 1) {
          const quantity = label(`×${transfer.amount}`, 14, THEME.text, 'bold', 'monospace');
          quantity.position.set(4, -24); root.addChild(quantity);
        }
        particleLayer.addChild(root);
        particles.push({ root, connectionId: connection.id, transfer, path, passages, passed: passedByTransfer.get(transfer.id) ?? new Set() });
        if (!seenTransferIds.has(transfer.id)) {
          seenTransferIds.add(transfer.id);
          const pulse = portViews.get(`${transfer.from}:output:${connection.fromPort ?? 0}`);
          if (pulse) pulse.pulseStartedAt = performance.now();
        }
      }
    };

    const renderScene = () => {
      const sector = propsRef.current.engine.getSector(); const preferences = propsRef.current.engine.getState().preferences; const nextWorldSize = getSectorWorldSize(sector, propsRef.current.engine.getState().research.completed);
      if (tooltipIntent?.visible && tooltipIntent.nodeId) {
        const live = sector.nodes.find(n => n.id === tooltipIntent!.nodeId);
        const summary = live && productionExplanation(live, propsRef.current.engine.getState(), sector).summary;
        if (summary && summary !== tooltipIntent.detail) { tooltipIntent.detail = summary; propsRef.current.onTooltip?.({ ...tooltipIntent }); }
      }
      const positionPart = drag ? '' : sector.nodes.map((node) => `${Math.round(node.x)}:${Math.round(node.y)}`).join(',');
      const signature = [sector.id, propsRef.current.engine.getState().research.completed.join(','), JSON.stringify(propsRef.current.engine.getState().research.repeatableCompletions), nextWorldSize.width, nextWorldSize.height, preferences.particles, preferences.showGrid, propsRef.current.engine.getState().research.selected ?? '', Number(propsRef.current.engine.getState().research.completed.includes('treePlanter')), propsRef.current.selectedIds.join(','), propsRef.current.selectedConnection ?? '', positionPart, JSON.stringify(sector.controlGroups ?? []), sector.nodes.map((node) => `${node.id}:${node.kind}:${node.name}:${node.tributeItem ?? ''}:${node.golemMineral ?? ''}:${node.recipeId ?? ''}:${node.filterItem ?? ''}:${node.rotation}:${node.roadMode ?? ""}:${node.roadFacing ?? ""}:${node.inputPortOrder?.join('.') ?? ''}:${node.outputPortOrder?.join('.') ?? ''}:${node.outputRowOffset ?? 0}:${Number(node.connectorsMirrored)}:${Number(node.disabled)}:${Number(node.processingPaused)}:${node.campStrength ?? 0}:${node.obstructionRadius ?? 0}:${node.obstructionMaxRadius ?? 0}:${node.obstructionWidth ?? 0}:${node.obstructionHeight ?? 0}`).join('|'), sector.connections.map((connection) => `${connection.id}:${connection.from}:${connection.fromPort ?? 0}:${connection.to}:${connection.toPort ?? 0}:${connection.item ?? ''}`).join('|')].join('~');
      if (signature === lastSceneSignature && sceneNodeSource === sector.nodes && sceneMod === propsRef.current.engine.getState().mod) { syncParticles(); return; } lastSceneSignature = signature;
      sceneMod = propsRef.current.engine.getState().mod;
      const worldSizeChanged = worldSize.width !== nextWorldSize.width || worldSize.height !== nextWorldSize.height;
      worldSize = nextWorldSize;
      if (renderedSectorId !== sector.id || renderedState !== propsRef.current.engine.getState()) { drag = undefined; propsRef.current.onDragPreview?.(undefined); groupSelection.clear(); controlHover.clear(); renderedState = propsRef.current.engine.getState(); renderedSectorId = sector.id; camera = { ...sector.camera }; clearConnectionRejection(); trackedTransfers.clear(); seenTransferIds.clear(); lastInputTotals.clear(); flashStartedAt.clear(); updateCamera(); }
      if (worldSizeChanged || !surfaceLayer.children.length) { drawWorldSurface(); updateCamera(); }
      else if (preferences.showGrid !== drawnGridEnabled) drawWorldSurface();
      nodeLayer.removeChildren().forEach((child) => child.destroy({ children: true })); cableLayer.removeChildren().forEach((child) => child.destroy({ children: true })); particleLayer.removeChildren().forEach((child) => child.destroy({ children: true })); nodeViews.clear(); portViews.clear(); particles.length = 0;
      const nodes = new Map(sector.nodes.map((node) => [node.id, node])); sector.connections.forEach((connection) => createCableView(connection, nodes, sector.connections));
      sceneNodes = nodes;
      sceneNodeSource = sector.nodes;
      sceneConnections = new Map(sector.connections.map((connection) => [connection.id, connection]));
      lastParticleSignature = '';
      sector.nodes.forEach((node) => { lastInputTotals.set(node.id, inputTotal(node)); const view = createNodeView(node); nodeLayer.addChild(view.root); nodeViews.set(node.id, view); });
      syncParticles();
    };

    const init = async () => {
      app = new Application(); await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, resolution: Math.min(3, Math.max(2, window.devicePixelRatio || 1)), autoDensity: true, preference: 'webgl' }); initialized = true;
      if (destroyed) { app.destroy(true); return; } host.appendChild(app.canvas); app.stage.eventMode = 'static'; app.stage.hitArea = app.screen;
      world = new Container(); surfaceLayer = new Container(); cableLayer = new Container(); particleLayer = new Container(); nodeLayer = new Container(); placementLayer = new Container(); placementLayer.eventMode = 'none'; overlayLayer = new Container(); insertionPreviewLayer = new Graphics(); insertionPreviewLayer.eventMode = 'none'; world.addChild(surfaceLayer, cableLayer, insertionPreviewLayer, particleLayer, nodeLayer, placementLayer); app.stage.addChild(world, overlayLayer); drawWorldSurface(); updateCamera(); renderScene();
      app.stage.on('pointerdowncapture', (event: FederatedPointerEvent) => {
        for (let target = event.target as Container | null; target; target = target.parent) { if (target.label === 'node-control' || target.label === 'joint-move-handle') return; }
        if (!propsRef.current.placing && event.button === 0 && !spaceHeld) {
          const handle = socketAt(event.global.x, event.global.y);
          if (handle) { beginPortDrag(handle, event); return; }
        }
        const active = propsRef.current.placing;
        if (!active || event.button !== 0 || spaceHeld) return;
        event.preventDefault(); event.stopPropagation();
        const point = toWorld(event.global.x, event.global.y);
        propsRef.current.onPlace(active, point.x, point.y, event.shiftKey);
      });
      app.stage.on('pointerdown', (event: FederatedPointerEvent) => {
        if (event.defaultPrevented) return; clearTooltip(); if (event.button === 1 || event.button === 2 || (event.button === 0 && spaceHeld)) { panning = { x: event.global.x, y: event.global.y, cameraX: camera.x, cameraY: camera.y }; return; } if (event.button !== 0) return;
        const active = propsRef.current.placing; const point = toWorld(event.global.x, event.global.y); if (active) { propsRef.current.onPlace(active, point.x, point.y, event.shiftKey); return; }
        const baseSelection = event.shiftKey ? [...propsRef.current.selectedIds] : [];
        propsRef.current.onConnectionSelect(undefined); propsRef.current.onSelect(baseSelection); const graphic = new Graphics(); overlayLayer.addChild(graphic); marquee = { startX: event.global.x, startY: event.global.y, graphic, baseSelection, previewIds: new Set() };
      });
      const updateDragAt = (point: { x: number; y: number }) => {
        previewPoint = { x: point.x, y: point.y };
        if (connectionDrag) {
          if (Math.hypot(point.x - connectionDrag.startX, point.y - connectionDrag.startY) > 4) connectionDrag.moved = true;
          const snapped = findNearbyCompatiblePort(point.x, point.y); updateSnappedPort(snapped);
          const snappedPoint = snapped ? portScreenPoint(snapped) : undefined; if (snappedPoint) previewPoint = snappedPoint;
        }
        if (drag) { const now = toWorld(point.x, point.y); const dx = now.x - drag.start.x; const dy = now.y - drag.start.y; if (Math.abs(dx) + Math.abs(dy) > 2) { drag.moved = true; clearTooltip(); }
          const sector = propsRef.current.engine.getSector(); const desired = draggedNodePositions(drag.origins, drag.anchorId, { x: dx, y: dy }, propsRef.current.snapToGrid && drag.moved, drag.anchorSize);
          drag.desired = desired; propsRef.current.onDragPreview?.(desired); drag.valid = propsRef.current.engine.canMoveNodesTo(desired);
          drag.ids.forEach((id) => { const position = desired[id]; if (position) nodeViews.get(id)?.root.position.set(position.x, position.y); });
          cableLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
          const nodeMap = new Map(sector.nodes.map((candidate) => { const position = desired[candidate.id]; return [candidate.id, position ? { ...candidate, ...position } : candidate] as const; }));
          sector.connections.forEach((connection) => createCableView(connection, nodeMap, sector.connections));
          // In-flight bars must remain attached to the live cable geometry while
          // either endpoint is being dragged. Their transfer clock is unchanged;
          // only the path is resampled against the preview node positions.
          particles.forEach((particle) => {
            const connection = sector.connections.find((candidate) => candidate.id === particle.connectionId);
            if (!connection) return;
            const { path, passages } = buildTransferMotionPath(particle.transfer, nodeMap, sector.connections);
            if (path.length) { particle.path = path; particle.passages = passages; }
          });
          drawInsertionPreview(drag.ids.length === 1 ? nodeMap.get(drag.ids[0]) : undefined, drag.valid);
        }
      };
      app.stage.on('pointermove', (event: FederatedPointerEvent) => {
        if (rightPress && Math.hypot(event.global.x - rightPress.x, event.global.y - rightPress.y) > 4) rightPress.moved = true;
        placementPointerInside = true; placementCursor = { x: event.global.x, y: event.global.y }; if (propsRef.current.placing) clearTooltip(); previewPoint = { x: event.global.x, y: event.global.y }; if (panning) { camera.x = panning.cameraX + event.global.x - panning.x; camera.y = panning.cameraY + event.global.y - panning.y; updateCamera(); }
        dragPointer = { x: event.global.x, y: event.global.y };
        updateDragAt(dragPointer);
        if (marquee) { const x = Math.min(marquee.startX, event.global.x); const y = Math.min(marquee.startY, event.global.y); const width = Math.abs(event.global.x - marquee.startX); const height = Math.abs(event.global.y - marquee.startY); marquee.graphic.clear().rect(x, y, width, height).fill({ color: THEME.selected, alpha: .1 }).stroke({ color: THEME.selected, width: 1, alpha: .92 }); marquee.previewIds = new Set(nodesInMarquee(marquee.startX, marquee.startY, event.global.x, event.global.y)); drawMarqueeHighlights(marquee.previewIds); }
      });
      const pointerUp = (event: { global: { x: number; y: number }; shiftKey: boolean }, commitInteraction = true) => {
        controlHover.release();
        if (drag?.moved && commitInteraction) updateDragAt(event.global);
        if (connectionDrag) {
          const finished = connectionDrag;
          // Pointer-up can arrive after the last move sample, especially when
          // sockets are close together. Resolve against the actual release.
          const snapped = commitInteraction ? findNearbyCompatiblePort(event.global.x, event.global.y) : undefined;
          let connected = false;
          if (snapped) {
            const active = activeHandleForTarget(finished, snapped); const { output, input } = normalizedConnection(active, snapped);
            connected = propsRef.current.onConnect(output.nodeId, input.nodeId, output.index, input.index, finished.replaceConnectionId);
          }
          cancelConnectionDrag();
          if (commitInteraction && finished.moved && !connected) {
            rejectConnection(finished, event.global.x, event.global.y, snapped);
            let failure = { title: 'Choose a socket', detail: 'Release the cable on an input or output socket on another node. A highlighted socket shows the destination before release.' };
            if (snapped) {
              const { output, input } = normalizedConnection(activeHandleForTarget(finished, snapped), snapped);
              failure = propsRef.current.engine.getConnectionFailure(output.nodeId, output.index, input.nodeId, input.index, finished.replaceConnectionId) ?? { title: 'Connection unavailable', detail: 'Choose a different socket or route, then try again.' };
            }
            propsRef.current.onConnectionRejected({ ...failure, x: event.global.x, y: event.global.y });
          }
        }
        if (panning) { panning = undefined; updateCamera(); } if (drag) { const finished = drag; drag = undefined; if (commitInteraction && finished.moved && finished.valid && finished.desired) { propsRef.current.engine.beginMove(); if (propsRef.current.engine.tryMoveNodesTo(finished.desired)) propsRef.current.engine.commitMove(); } propsRef.current.onDragPreview?.(undefined); lastSceneSignature = ''; renderScene(); }
        if (marquee) { const finished = marquee; if (commitInteraction) { const hits = nodesInMarquee(finished.startX, finished.startY, event.global.x, event.global.y); const ids = Array.from(new Set([...finished.baseSelection, ...hits])); const priority = event.global.x < finished.startX && event.global.y < finished.startY; groupSelection.box(ids, priority); propsRef.current.onSelect(ids, { source: 'box', priority, forward: event.global.x >= finished.startX && event.global.y >= finished.startY }); } drawMarqueeHighlights(new Set()); finished.graphic.destroy(); marquee = undefined; }
      };
      app.stage.on('pointerup', (event) => pointerUp(event, true)); app.stage.on('pointerupoutside', (event) => pointerUp(event, true)); app.stage.on('pointercancel', (event) => pointerUp(event, false));
      const wheel = (event: WheelEvent) => { event.preventDefault(); const rect = app.canvas.getBoundingClientRect(); const mx = event.clientX - rect.left; const my = event.clientY - rect.top; const trackpadPan = !event.ctrlKey && event.deltaMode === 0 && (Math.abs(event.deltaX) > 0 || Math.abs(event.deltaY) < 50); if (trackpadPan) { camera.x -= event.deltaX; camera.y -= event.deltaY; updateCamera(); return; } const before = toWorld(mx, my); camera.zoom *= event.deltaY < 0 ? 1.1 : .9; clampCamera(); camera.x = mx - before.x * camera.zoom; camera.y = my - before.y * camera.zoom; updateCamera(); };
      const blockContextMenu = (event: MouseEvent) => event.preventDefault();
      app.canvas.addEventListener('wheel', wheel, { passive: false }); app.canvas.addEventListener('contextmenu', blockContextMenu); const keyDown = (event: KeyboardEvent) => { if (event.code === 'Space' && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable))) { spaceHeld = true; event.preventDefault(); } if (event.code === 'Escape' && connectionDrag) cancelConnectionDrag(); }; const keyUp = (event: KeyboardEvent) => { if (event.code === 'Space') spaceHeld = false; };
      const cancelLostInteractions = () => {
        controlHover.clear();
        rightPress = undefined;
        spaceHeld = false;
        clearConnectionRejection();
        if (connectionDrag) cancelConnectionDrag();
        if (panning) { panning = undefined; updateCamera(); }
        if (drag) { drag = undefined; propsRef.current.onDragPreview?.(undefined); lastSceneSignature = ''; renderScene(); }
        if (marquee) { drawMarqueeHighlights(new Set()); marquee.graphic.destroy(); marquee = undefined; }
      };
      const releaseGlobalInteractions = (event: PointerEvent) => {
        if (!connectionDrag && !panning && !drag && !marquee) return;
        const rect = app.canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
        const insideCanvas = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        pointerUp({ global: { x, y }, shiftKey: event.shiftKey }, insideCanvas);
      };
      window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('pointerup', releaseGlobalInteractions); window.addEventListener('pointercancel', cancelLostInteractions); window.addEventListener('blur', cancelLostInteractions);
      const pointerEnter = () => { placementPointerInside = true; }; const pointerLeave = () => { controlHover.clear(); hoveredNodeId = undefined; placementPointerInside = false; clearTooltip(); propsRef.current.onHoverNode?.(); syncPlacementPreview(); };
      app.canvas.addEventListener('pointerenter', pointerEnter); app.canvas.addEventListener('pointerleave', pointerLeave);
      let cueRevision = -1; let cueTime = -1; const productionCues = new Map<string, ProductionVisual>();
      app.ticker.add(() => {
        if (lastSnapToGrid !== propsRef.current.snapToGrid) {
          lastSnapToGrid = propsRef.current.snapToGrid;
          if (drag?.moved && dragPointer) updateDragAt(dragPointer);
        }
        if (placementPointerInside && dragPointer && !panning && (drag?.moved || connectionDrag?.moved)) {
          const next = scrollCameraForDrag(camera, worldSize, app.screen, dragPointer, app.ticker.deltaMS);
          if (next.x !== camera.x || next.y !== camera.y) {
            camera = next; updateCamera(); updateDragAt(dragPointer);
          }
        }
        if (!propsRef.current.selectedIds.length && !marquee && !drag) groupSelection.clear(); const uiSignature = `${propsRef.current.selectedIds.join(',')}|${propsRef.current.selectedConnection ?? ''}|${propsRef.current.placing ?? ''}`; if (uiSignature !== lastUiSignature) { lastUiSignature = uiSignature; renderScene(); }
        syncPlacementPreview();
        const focus = propsRef.current.cameraFocus; if (focus && focus.nonce !== appliedCameraNonce) { appliedCameraNonce = focus.nonce; camera = { ...focus.camera }; updateCamera(); }
        syncParticles();
        const sector = propsRef.current.engine.getSector(); const nodeMap = sceneNodes; const frameNow = performance.now();
        const gameState = propsRef.current.engine.getState();
        if (gameState.playTimeMs !== observedPlayTimeMs) { observedPlayTimeMs = gameState.playTimeMs; observedPlayTimeAt = frameNow; }
        const animationPlayTimeMs = gameState.paused ? gameState.playTimeMs : gameState.playTimeMs + Math.min(120, Math.max(0, frameNow - observedPlayTimeAt));
        if (cueRevision !== gameState.revision || cueTime !== gameState.playTimeMs) {
          cueRevision = gameState.revision; cueTime = gameState.playTimeMs; productionCues.clear();
          const context = productionVisualContext(sector);
          sector.nodes.forEach(node => productionCues.set(node.id, productionVisual(node, gameState, sector, context)));
        }
        const activeTransfers = propsRef.current.engine.getActiveTransfers();
        const liveTransferIds = new Set(activeTransfers.map((transfer) => transfer.id));
        activeTransfers.forEach((transfer) => trackedTransfers.set(transfer.id, transfer));
        seenTransferIds.forEach((id) => { if (!liveTransferIds.has(id)) seenTransferIds.delete(id); });
        trackedTransfers.forEach((transfer, id) => { if (liveTransferIds.has(id)) return; trackedTransfers.delete(id); if (transfer.sectorId !== sector.id || transfer.arrivesAtMs > gameState.playTimeMs) return; const connection = sector.connections.find((candidate) => candidate.id === (transfer.routeConnectionIds?.at(-1) ?? transfer.connectionId)); const inputPulse = portViews.get(`${transfer.to}:input:${connection?.toPort ?? 0}`); if (inputPulse) inputPulse.pulseStartedAt = frameNow; });
        particles.forEach((particle) => { const connection = sector.connections.find((candidate) => candidate.id === particle.connectionId); if (!connection) { particle.root.visible = false; return; } const phase = transferProgress(particle.transfer, animationPlayTimeMs); particle.passages.forEach(passage => { if (phase >= passage.phase && !particle.passed.has(passage.nodeId)) { particle.passed.add(passage.nodeId); flashStartedAt.set(passage.nodeId, frameNow); portViews.forEach(port => { if (port.nodeId === passage.nodeId) port.pulseStartedAt = frameNow; }); } }); const motion = sampleCurveMotion(particle.path, phase); if (!motion) return; particle.root.visible = phase < 1; particle.root.position.set(motion.x, motion.y); particle.root.rotation = motion.angle; particle.root.alpha = Math.max(0, Math.min(1, phase / .08, (1 - phase) / .12)); });
        nodeViews.forEach((view, id) => { const node = nodeMap.get(id); if (!node) return; const selectable = canSelectNode(id); view.root.eventMode = node.disabled || !selectable ? 'none' : 'static'; view.root.alpha = node.disabled ? .68 : selectable ? 1 : .45; const controlsVisible = selectable && !propsRef.current.placing && controlHover.visible(id, frameNow); view.root.children.forEach(child => { if (child.label === 'node-control') child.visible = controlsVisible; }); if (view.jointMoveHandle) { view.jointMoveHandle.visible = !propsRef.current.placing && (controlsVisible || Boolean(propsRef.current.jointMoveHint)); view.jointMoveHandle.cursor = drag?.ids.includes(id) ? 'grabbing' : 'grab'; } const dragPosition = drag?.desired?.[id]; view.root.position.set(dragPosition?.x ?? node.x, dragPosition?.y ?? node.y); const readabilityScale = nodeTextScale(camera.zoom); view.readabilityLabels.forEach((text) => text.scale.set(readabilityScale)); const invalid = Boolean(drag?.moved && !drag.valid && drag.ids.includes(id)); if (invalid !== view.invalidVisible) { view.invalidVisible = invalid; view.invalidOverlay.clear(); if (invalid) { const size = getNodeSize(node); view.invalidOverlay.roundRect(-size.w / 2 - 5, -size.h / 2 - 5, size.w + 10, size.h + 10, 16).fill({ color: THEME.danger, alpha: .18 }).stroke({ color: THEME.danger, width: 3, alpha: .98 }); } } const currentInput = inputTotal(node); if (getNodeCapabilities(node.kind).behavior !== 'research' && (lastInputTotals.get(id) ?? currentInput) < currentInput) flashStartedAt.set(id, frameNow); lastInputTotals.set(id, currentInput); const duration = nodeCycleDuration(node, gameState.research.completed); const interpolation = !gameState.paused && !node.disabled && !node.processingPaused && node.progressMs > 0 ? (animationPlayTimeMs - gameState.playTimeMs) / (modNode(node.kind)?.cycleMultiplier ?? 1) : 0; const cycleProgress = duration ? Math.min(1, (node.progressMs + interpolation) / duration) : 0; if (view.campStatus) updateCampNodeStatus(view.campStatus, node, interpolation, readabilityScale); const cue = productionCues.get(id); drawProductionCue(view.productionCue, node, cue, gameState.research.completed); const grove = groveProgress(node); const target = grove ? grove.fraction : isResourceNode(node) ? resourceReserveFraction(node) : getNodeCapabilities(node.kind).behavior === 'research' ? researchCenterView(node, gameState).progress : cue?.working ? cycleProgress : 0; view.displayedProgress = target; view.progress.scale.x = target; if (view.progressLabel) view.progressLabel.text = grove?.label ?? `${Math.round(target * 100)}%`; if (node.kind === 'filter') { if (!view.filterNotice) { view.filterNotice = new Text({ text: '', style: { fontSize: 13, fill: 0xffc46b, fontWeight: 'bold' } }); view.filterNotice.anchor.set(.5, 0); view.filterNotice.position.set(0, getNodeSize(node).h / 2 + 10); view.root.addChild(view.filterNotice); } view.filterNotice.text = node.filterBlocked ? `! ${node.filterBlocked.toUpperCase()} OUTLET BLOCKED` : ''; } if (view.bufferLabel) view.bufferLabel.text = node.resourceItem ? resourceCapacityReadout(node) : `${outputTotal(node)} / ${outputCapacity(node)}`; updateBufferSquares(view, node); updateInputSquares(view, node); if (view.researchStatus) updateResearchNodeStatus(view.researchStatus, researchCenterView(node, gameState).projectName, readabilityScale); if (view.coreStorageLabels) {
          const storage = researchCoreStorage(node, gameState.research);
          view.coreStorageLabels.forEach((text, index) => {
            const core = storage[index]; text.visible = Boolean(core); if (view.coreStorageSquares?.[index]) view.coreStorageSquares[index].visible = Boolean(core);
            if (!core) return;
            text.style.fill = ITEM_COLORS[core.item];
            text.text = ITEM_NAMES[core.item].replace(' Core', '');
            const size = getNodeSize(node);
            text.scale.set(1);
            text.position.set(-size.w / 2 + 18 + (index % 2) * ((size.w - 36) / 2), getPortAnchor(node, 'input', 0).y + 28 + Math.floor(index / 2) * 36);
            const squares = view.coreStorageSquares?.[index];
            if (squares) { drawBufferSquares(squares, core.amount, core.capacity, ITEM_COLORS[core.item], 11, 4, 5); squares.position.set(text.x, text.y + 16); }
          });
        }
        let flashAlpha = 0;
        if (getNodeCapabilities(node.kind).behavior === 'research') {
          flashAlpha = researchConsumptionGlow(node, animationPlayTimeMs, reducedMotion.matches);
        } else {
          const flashAt = flashStartedAt.get(id);
          if (flashAt) {
            const elapsed = frameNow - flashAt;
            if (elapsed > 480) flashStartedAt.delete(id);
            else flashAlpha = Math.sin(Math.PI * elapsed / 480);
          }
        }
        view.flash.clear();
        if (flashAlpha > 0) {
          const size = getNodeSize(node);
          view.flash.roundRect(-size.w / 2 - 3, -size.h / 2 - 3, size.w + 6, size.h + 6, 14)
            .fill({ color: 0x168cf0, alpha: flashAlpha * .08 }).stroke({ color: 0x55baff, width: 2, alpha: flashAlpha });
        }
        });
        portViews.forEach((port) => {
          const live = nodeMap.get(port.nodeId); if (live && port.materialBuffer) updateProductionPort(port, live, sector);
          port.highlight.clear();
          const active = connectionDrag && portKey(connectionDrag.active) === portKey(port);
          const snapped = snappedPortKey === portKey(port);
          const rejected = connectionRejection?.target && portKey(connectionRejection.target) === portKey(port);
          if (!rejected && (port.hovered || active || snapped)) {
            let invalid = false;
            if (snapped && connectionDrag) { const { output, input } = normalizedConnection(activeHandleForTarget(connectionDrag, port), port); invalid = Boolean(propsRef.current.engine.getConnectionFailure(output.nodeId, output.index, input.nodeId, input.index, connectionDrag.replaceConnectionId)); }
            const color = invalid ? THEME.danger : snapped ? 0x9de0c1 : 0xffdf91;
            port.highlight.circle(0, 0, connectionDrag ? 12 : 19).fill({ color, alpha: .18 }).stroke({ color, width: 2.5, alpha: 1 });
            // Outward/inward arrows show connector direction without a label.
            const node = nodeMap.get(port.nodeId);
            if (node) {
              const side = getPortSide(node, port.direction, port.index);
              const dx = side === 'east' ? 1 : side === 'west' ? -1 : 0;
              const dy = side === 'south' ? 1 : side === 'north' ? -1 : 0;
              const tip = port.direction === 'output' ? 33 : 23;
              const tail = port.direction === 'output' ? 26 : 30;
              port.highlight.moveTo(dx * tail - dy * 5, dy * tail + dx * 5).lineTo(dx * tip, dy * tip).lineTo(dx * tail + dy * 5, dy * tail - dx * 5).stroke({ color, width: 2.5 });
            }
          }
          port.root.cursor = connectionDrag ? 'grabbing' : 'grab';
          port.pulse.clear(); let arrivalScale = 1; if (port.pulseStartedAt) { const progress = (frameNow - port.pulseStartedAt) / 520; if (progress >= 1) port.pulseStartedAt = 0; else { const intensity = 1 - progress; arrivalScale = 1 + Math.sin(Math.PI * progress) * .48; port.pulse.circle(0, 0, 13 + progress * 22).fill({ color: port.pulseColor, alpha: intensity * .18 }).stroke({ color: port.pulseColor, width: 3, alpha: intensity }); port.pulse.circle(0, 0, 8 + progress * 9).stroke({ color: THEME.flowHighlight, width: 1.5, alpha: intensity * .72 }); } } port.root.scale.set(connectionDrag || port.materialBuffer ? 1 : arrivalScale); });
        if (connectionDrag) {
          const active = connectionDrag.snapped ? activeHandleForTarget(connectionDrag, connectionDrag.snapped) : connectionDrag.active;
          const activePoint = portScreenPoint(active);
          if (activePoint) {
            if (!previewCable) { previewCable = new Graphics(); overlayLayer.addChild(previewCable); }
            previewCable.clear();
            if (active.direction === 'output') {
              const targetSide = connectionDrag.snapped ? getPortSide(nodeMap.get(connectionDrag.snapped.nodeId)!, 'input', connectionDrag.snapped.index) : 'west';
              drawCurve(previewCable, activePoint, previewPoint, getPortSide(nodeMap.get(active.nodeId)!, 'output', active.index), targetSide);
            } else {
              const sourceSide = connectionDrag.snapped ? getPortSide(nodeMap.get(connectionDrag.snapped.nodeId)!, 'output', connectionDrag.snapped.index) : 'east';
              drawCurve(previewCable, previewPoint, activePoint, sourceSide, getPortSide(nodeMap.get(active.nodeId)!, 'input', active.index));
            }
            previewCable.stroke({ color: connectionDrag.snapped ? THEME.flowHighlight : THEME.flow, width: connectionDrag.snapped ? 4 : 3, alpha: .94, cap: 'round' });
          }
        } else if (previewCable) { previewCable.destroy(); previewCable = undefined; }
        if (connectionRejection && rejectionGraphic) {
          const age = (frameNow - connectionRejection.startedAt) / 1000;
          if (age >= 1) clearConnectionRejection();
          else {
            const cue = connectionRejection;
            const origin = portScreenPoint(cue.origin);
            const target = cue.target && portScreenPoint(cue.target);
            const end = target ?? { x: camera.x + cue.point.x * camera.zoom, y: camera.y + cue.point.y * camera.zoom };
            const graphic = rejectionGraphic; graphic.clear(); graphic.alpha = Math.min(1, (1 - age) / .28);
            if (origin && !reducedMotion.matches && age < .35) {
              const remaining = 1 - (age / .35) ** 2;
              drawCurve(graphic, origin, { x: origin.x + (end.x - origin.x) * remaining, y: origin.y + (end.y - origin.y) * remaining });
              graphic.stroke({ color: THEME.danger, width: 3, alpha: 1 });
            }
            const shake = reducedMotion.matches ? 0 : Math.sin(age * 60) * 4 * Math.max(0, 1 - age / .3);
            const x = end.x + shake, y = end.y;
            graphic.poly([x, y - 15, x + 15, y, x, y + 15, x - 15, y]).fill({ color: 0x211418, alpha: .96 }).stroke({ color: THEME.danger, width: 2.5 });
            graphic.moveTo(x - 5, y - 5).lineTo(x + 5, y + 5).moveTo(x + 5, y - 5).lineTo(x - 5, y + 5).stroke({ color: 0xffe7e9, width: 2.5, cap: 'round' });
          }
        }
      });
      const unsubscribe = props.engine.subscribe(renderScene); (host as HTMLDivElement & { cleanup?: () => void }).cleanup = () => { unsubscribe(); app.canvas.removeEventListener('wheel', wheel); app.canvas.removeEventListener('contextmenu', blockContextMenu); app.canvas.removeEventListener('pointerenter', pointerEnter); app.canvas.removeEventListener('pointerleave', pointerLeave); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('pointerup', releaseGlobalInteractions); window.removeEventListener('pointercancel', cancelLostInteractions); window.removeEventListener('blur', cancelLostInteractions); };
    };
    void init().catch((error: unknown) => { console.error('Pixi playfield failed to initialize', error); if (!destroyed) { const message = error instanceof Error ? error.message : String(error); host.innerHTML = `<div class="pixi-boot-error"><b>PLAYFIELD BOOT INTERRUPTED</b><span>${escapeHtml(message)}</span><small>Reload the local page. If this persists, verify that WebGL is enabled.</small></div>`; } });
    return () => { propsRef.current.onDragPreview?.(undefined); destroyed = true; clearConnectionRejection(); clearTooltip(); (host as HTMLDivElement & { cleanup?: () => void }).cleanup?.(); if (initialized && app) app.destroy(true, { children: true }); };
  }, [props.engine]);

  return <div ref={hostRef} className={`pixi-host ${props.placing ? 'is-placing' : ''}`} aria-label="Factory node canvas" />;
}

