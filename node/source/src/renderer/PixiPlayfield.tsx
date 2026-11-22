import { createPlayfieldInteractionState, createPlayfieldInteractions } from './playfieldInteractions';
import { PlayfieldResources, destroyPlayfieldApplication } from './playfieldResources';
import { CableLayers } from './cableLayers';
import { GuardedRefillLinks } from './guardedRefillLinks';
import { roadTravelDestination } from './roadNodeTravel';
import { createRoadTravelControl, positionRoadTravelControl } from './roadTravelControl';
import { createBorderTerrain } from './borderTerrain';
import { MapTerrainTextures } from './mapTerrain';
import { revealedMapTerrain } from '../simulation/mapTerrain';
import { OverviewTextures, setOverviewArtworkVisibility } from './overviewTextures';
import { createCampNodeStatus, updateCampNodeStatus } from './campNodeStatus';
import { createCornerCampStatus, drawCornerCamp, updateCornerCampStatus } from './cornerCampView';
import { campStatus } from '../simulation/campStatus';
import { groveProgress } from './groveProgress';
import { researchCenterView, researchCoreGrid } from './researchCenterView';
import { researchConsumptionGlow } from './researchConsumptionGlow';
import { createResearchNodeStatus, updateResearchNodeStatus } from './researchNodeStatus';
import { THEME } from './playfieldTheme';
import { outputTotal, inputTotal, outputCapacity, resourceCapacityReadout, resourceReserveFraction, deepHoleStoneReadout, golemApReadout, nodeTextScale, isItemId, portLabelText, portRoleLabel, canDeleteNode, canCyclePortPositions, nodeCycleDuration } from './playfieldNodeState';
import { connectionPoints, curvePoint, buildTransferMotionPath, sampleCurveMotion } from './cableGeometry';
import { drawCurve, label, drawTrashIcon, drawRoadFlowArrow, drawFreightVehicleFlowArrow, escapeHtml, nodeHeaderHeight } from './playfieldDrawing';
import { drawBufferSquares, updateProductionPort, updateBufferSquares, drawProductionCue, updateInputSquares } from './nodeBuffers';
import type { PlayfieldTooltip, PixiPlayfieldProps as Props, NodeView, PortHandle, PortView, ConnectionDragState, ConnectionRejection, FlowParticle, PlacementView } from './playfieldTypes';
export type { PlayfieldTooltip, SelectionInfo } from './playfieldTypes';
import { productionExplanation, productionVisual, productionVisualContext, type ProductionVisual } from './productionVisuals';
import { createProductionRecipeIcon } from './productionRecipeIcon';
import { isProductionMachine } from './productionPortRows';
import { isStorageNode } from './bufferSlots';
import { JOINT_CONTROL_GRACE_MS } from './nodeControlHover';
import { CORNER_SOCKET_RADIUS, socketHitContains } from './socketTargeting';
import { ROAD_PREVIEW_GAP, roadPreviewCrop, roadPreviewPosition } from './roadPreviewCrop';
import { useEffect, useRef } from 'react';
import { Application, ColorMatrixFilter, Container, Graphics, Rectangle, Sprite, Text, type FederatedPointerEvent } from 'pixi.js';
import { ITEM_COLORS, ITEM_NAMES } from '../content/items';
import { isCartKind } from '../content/cartUpgrades';
import { endgameRank } from '../content/endgame';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, getNodeDisplayDefinition, getNodeDisplayName } from '../content/nodes';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { RECIPES } from '../content/recipes';
import type { Connection, InFlightTransfer, ItemId, MachineNode, SectorState } from '../domain/types';
import type { RoadPlacementTarget } from '../simulation/engine';
import { getWorldFieldSize } from '../simulation/worldGeneration';
import { clampFieldCamera, exteriorFieldOverviewSize, scrollCameraForDrag } from '../domain/camera';
import { WORLD_GRID_SIZE, snapNodePosition } from '../domain/nodeGrid';
import { getConnectionControlPoints, getPortSide, isMultiConnectionPort } from '../simulation/connectionRules';
import { filterOutletLabels, getNodeSize, getPortAnchor, isCompactNode, isOrganicNode, isResourceNode, organicPolygon } from '../domain/nodeGeometry';
import { blockedFilterPort, filterOutlet } from '../domain/filterRouting';
import { obstructionOutline } from '../domain/obstructionGeometry';
import { drawNodeIcon } from './drawNodeIcon';
import { drawEncounterArt } from './encounterArt';
import { campArtworkLayout, guardedResourceLocked, nodeStackOrder } from './campPresentation';
import { getNodeArt } from '../art/nodeArt';
import { MAX_VISIBLE_TRANSFERS, transferProgress } from '../simulation/transfers';
import { RESEARCH_CORE_TYPES } from '../simulation/researchStatus';
import { modNode } from '../mods/modRules';
import { mapNodePosition } from '../ui/mapNodePresentation';
import { measureFieldViewport } from '../ui/responsiveLayout';
import { boundsOnScreen, nodeDrawingKey, nodeOnScreen, playfieldResolution, progressBarTransform, reconcileViews, showNodeDetails, showNodeReadouts, type CableBounds, type ViewIdentity } from './sceneUpdates';

const cornerSocketScale = (zoom: number, limit: number) => Math.min(Math.max(2, 1 / zoom), limit);

export function PixiPlayfield(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null); const propsRef = useRef(props); propsRef.current = props;

  useEffect(() => {
    const host = hostRef.current!; let destroyed = false; let app: Application;
    const inputState = createPlayfieldInteractionState();
    const resources = new PlayfieldResources();
    const viewportElement = props.viewportRef.current!;
    let viewport = measureFieldViewport(viewportElement);
    let insertionPreviewLayer: Graphics; let insertionPreviewSignature = ''; let insertionPreviewCableId: string | undefined;
    let world: Container; let surfaceLayer: Container; let cableLayer: Container; let particleLayer: Container; let nodeLayer: Container; let campPortLayer: Container; let placementLayer: Container; let overlayLayer: Container;
    let camera = { ...props.engine.getSector().camera }; let worldSize = getWorldFieldSize(props.engine.getState());
    let renderedState = props.engine.getState(); let renderedSectorId = props.engine.getSector().id; let appliedCameraNonce = props.cameraFocus?.nonce ?? -1;
       
    
    
    
    
      let previewCable: Graphics | undefined; 
    let placementView: PlacementView | undefined;  
    let pasteView: { root: Container; outlines: Graphics; status: Text; connections: Connection[] } | undefined;
    let pastePreviewKey = '';
    let roadPreview: ReturnType<typeof createRoadPreview> | undefined;
    let lastRoadInHand = props.placing === 'road';
    
    let lastSnapToGrid = props.snapToGrid;
    let connectionRejection: ConnectionRejection | undefined; let rejectionGraphic: Graphics | undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const enterNodeHover = (id: string) => { inputState.controlHover.enter(id); inputState.hoveredNodeId = id; propsRef.current.onHoverNode?.(id); };
     let tooltipIntent: (PlayfieldTooltip & { key: string; visible: boolean }) | undefined; let tooltipTimer: number | undefined;
    let drawnGridEnabled = props.engine.getState().preferences.showGrid; let drawnTerrain = ''; let lastTooltipAt = 0; let lastUiSignature = '';
    let observedPlayTimeMs = props.engine.getState().playTimeMs; let observedPlayTimeAt = performance.now();
    const portsByNode = new Map<string, PortView[]>();
    const nodeViews = new Map<string, NodeView>(); const portViews = new Map<string, PortView>(); const particles: FlowParticle[] = [];
    const nodeIdentities = new Map<string, ViewIdentity>();
    const cableViews = new Map<string, Container>();
    const cableIdentities = new Map<string, ViewIdentity>();
    const cableBounds = new Map<string, CableBounds>();
    const cableInputs = new Map<string, string>();
    const pathCache = new Map<string, { ids: string[]; motion: ReturnType<typeof buildTransferMotionPath> }>();
    const particlePool: FlowParticle[] = [];
    const overviewTextures = new OverviewTextures();
    resources.add(() => overviewTextures.destroy());
    let overviewContext = '';
    let cachedCables = false; let cableLayers: CableLayers;
    let guardedRefills: GuardedRefillLinks;
    let cableVisibilitySignature = '';
    const diagnostics = { nodesCreated: 0, nodesDestroyed: 0, particleObjectsCreated: 0 };
    let diagnosticsAt = 0;
    const flashStartedAt = new Map<string, number>(); const lastInputTotals = new Map<string, number>(); const seenTransferIds = new Set<string>(); const trackedTransfers = new Map<string, InFlightTransfer>();
    let lastParticleSignature = '';
    let sceneNodes = new Map<string, MachineNode>();
    let sceneMod = props.engine.getState().mod;
    let sceneConnections = new Map<string, Connection>();
    let motionNodes = new Map<string, MachineNode>();
    let pathRevision = 0;


    
    
    
    
    
    
    
    
    
    
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
      portViews.forEach((port) => {
        if (port.cornerScaleLimit !== undefined) port.root.scale.set(cornerSocketScale(camera.zoom, port.cornerScaleLimit));
        else port.root.hitArea = new Rectangle(-radius, -radius, radius * 2, radius * 2);
      });
    };
    const roadInHand = () => propsRef.current.placing === 'road' || Boolean(inputState.drag?.road);
    const cameraOverviewSize = () => !propsRef.current.training
      ? exteriorFieldOverviewSize(worldSize)
      : roadInHand()
      ? { width: worldSize.width * 1.5 + ROAD_PREVIEW_GAP, height: worldSize.height * 1.5 + ROAD_PREVIEW_GAP }
      : worldSize;
    const clampCamera = () => { camera = clampFieldCamera(camera, worldSize, viewport, cameraOverviewSize()); };
    const updateCamera = () => { clampCamera(); applyCamera(); propsRef.current.onCamera({ ...camera }); };
    const viewportObserver = new ResizeObserver(() => {
      const next = measureFieldViewport(viewportElement);
      if (next.top === viewport.top && next.width === viewport.width && next.height === viewport.height) return;
      viewport = next;
      updateCamera();
    });
    resources.add(() => viewportObserver.disconnect());
    const clearTooltip = () => { if (tooltipTimer) window.clearTimeout(tooltipTimer); tooltipTimer = undefined; tooltipIntent = undefined; propsRef.current.onTooltip?.(); };
    const showTooltip = (event: FederatedPointerEvent, title: string, detail: string, tone?: string, eyebrow?: string, nodeId?: string) => {
      if (inputState.connectionDrag || connectionRejection) return;
      const now = performance.now();
      const key = `${nodeId ?? ''}|${eyebrow ?? ''}|${title}|${detail}`;
      const next = { key, title, detail, nodeId, x: event.global.x, y: event.global.y, tone, eyebrow, visible: tooltipIntent?.key === key && tooltipIntent.visible };
      if (tooltipIntent?.key !== key) {
        if (tooltipTimer) window.clearTimeout(tooltipTimer);
        tooltipIntent = next;
        propsRef.current.onTooltip?.();
        tooltipTimer = window.setTimeout(() => {
          if (!tooltipIntent || tooltipIntent.key !== key) return;
          tooltipIntent.visible = true;
          lastTooltipAt = performance.now();
          propsRef.current.onTooltip?.(tooltipIntent);
        }, 170);
        return;
      }
      tooltipIntent = next;
      if (!next.visible || now - lastTooltipAt < 32) return;
      lastTooltipAt = now;
      propsRef.current.onTooltip?.(next);
    };

    const terrainTextures = new MapTerrainTextures(() => { if (!destroyed) { drawnTerrain=''; clearRoadPreview(); renderScene(); } });
    resources.add(() => terrainTextures.destroy());
    const fieldSurface = ({ width, height }: typeof worldSize, showGrid: boolean, sectorId: string) => {
      const root = new Container(); root.eventMode = 'none';
      const floor = terrainTextures.create(propsRef.current.engine.getState(), sectorId, { width, height });
      if (floor) root.addChild(floor);
      const surface = new Graphics();
      if (!floor) surface.rect(0, 0, width, height).fill({ color: THEME.surface });
      surface.rect(0, 0, width, height).stroke({ color: THEME.surfaceEdge, width: 4, alpha: .9 });
      if (showGrid) {
        for (let x = WORLD_GRID_SIZE; x < width; x += WORLD_GRID_SIZE) surface.moveTo(x, 0).lineTo(x, height);
        for (let y = WORLD_GRID_SIZE; y < height; y += WORLD_GRID_SIZE) surface.moveTo(0, y).lineTo(width, y);
        surface.stroke({ color: THEME.fineGrid, width: 1, alpha: .025 });
        for (let x = WORLD_GRID_SIZE * 5; x < width; x += WORLD_GRID_SIZE * 5) surface.moveTo(x, 0).lineTo(x, height);
        for (let y = WORLD_GRID_SIZE * 5; y < height; y += WORLD_GRID_SIZE * 5) surface.moveTo(0, y).lineTo(width, y);
        surface.stroke({ color: THEME.coarseGrid, width: 2, alpha: .16 });
      }
      root.addChild(surface);
      return root;
    };

    const drawWorldSurface = () => {
      drawnGridEnabled = propsRef.current.engine.getState().preferences.showGrid;
      surfaceLayer.removeChildren().forEach(child => child.destroy({ children: true }));
      const sector = propsRef.current.engine.getSector();
      surfaceLayer.addChild(fieldSurface(worldSize, drawnGridEnabled, sector.id));
      surfaceLayer.addChild(createBorderTerrain(propsRef.current.engine.getState(), sector.id, worldSize));
      drawnTerrain = sector.id + JSON.stringify(sector.filledHoles ?? []) + JSON.stringify(propsRef.current.engine.getState().borderObstructions) + revealedMapTerrain(propsRef.current.engine.getState(), sector.id);
      for (const patch of sector.filledHoles ?? []) {
        const hole: MachineNode = { id:patch.id, kind:'big-hole', name:'Filled ground', x:patch.x,y:patch.y,rotation:patch.rotation,
          obstructionRadius:patch.radius, input:{},output:{},cycleMs:0,progressMs:0,constructedAt:0,constructionMs:0 };
        const ground = new Graphics(); ground.eventMode='none'; ground.position.set(patch.x,patch.y);
        ground.poly(obstructionOutline(hole)).fill({color:0x676b70}).stroke({color:getNodeDisplayDefinition(hole).accent,width:2,alpha:.86});
        surfaceLayer.addChild(ground);
      }
    };

    const drawFrame = (node: MachineNode, body: Graphics, header: Graphics) => {
      const size = getNodeSize(node); const selected = propsRef.current.selectedIds.includes(node.id); const definition = getNodeDisplayDefinition(node);
      if (node.kind === 'cornerChallenge') { drawCornerCamp(body, node, selected); return; }
      if (isOrganicNode(node)) {
        const points = obstructionOutline(node);
        const fill = node.kind === 'resourceGolem' ? 0x20272b : node.lizardSettlement ? 0x183a2a : node.kind === 'lake' ? 0x17334a : node.kind === 'monster-camp' ? 0x3b2023 : 0x090a0c;
        const outlineWidth = node.kind === 'resourceGolem' ? 6 : 2;
        body.poly(points).fill({ color: fill, alpha: .98 }).stroke({ color: selected ? THEME.selected : definition.accent, width: outlineWidth + (selected ? 2 : 0), alpha: .86 });
        if (node.kind === 'lake') body.poly(organicPolygon(node, 18, .78)).stroke({ color: 0x55bde8, width: 2, alpha: .28 });
        if (node.kind === 'big-hole') body.poly(organicPolygon(node, 11, .72)).fill({ color: 0x000000, alpha: .82 });
        return;
      }
      if (node.kind === 'joint') { body.circle(0, 0, size.w / 2).fill({ color: THEME.body }).stroke({ color: selected ? THEME.selected : definition.accent, width: selected ? 3 : 1.5 }); body.circle(0, 0, 5).fill({ color: 0x202226 }).stroke({ color: definition.accent, width: 1.2 }); return; }
      const radius = isCompactNode(node) || node.kind === 'woodenChest' || node.kind === 'chest' ? 9 : 12;
      body.roundRect(-size.w / 2 + 1, -size.h / 2 + 8, size.w, size.h, radius).fill({ color: 0x000000, alpha: .42 });
      const inaccessible = node.disabled || guardedResourceLocked(node);
      body.roundRect(-size.w / 2, -size.h / 2, size.w, size.h, radius).fill({ color: inaccessible ? 0x351d21 : THEME.body }).stroke({ color: selected ? THEME.selected : THEME.border, width: selected ? 3 : 1.25 });
      const headerHeight = nodeHeaderHeight(node);
      header.roundRect(-size.w / 2 + 1, -size.h / 2 + 1, size.w - 2, headerHeight, Math.max(2, radius - 1)).fill({ color: inaccessible ? 0x542a2f : THEME.header });
      header.rect(-size.w / 2 + 1, -size.h / 2 + headerHeight - 1, size.w - 2, 1).fill({ color: 0xffffff, alpha: .06 });
      header.roundRect(-size.w / 2 + 10, -size.h / 2 - .5, size.w - 20, 2.5, 2).fill({ color: inaccessible ? THEME.danger : definition.accent });
    };

    const addAction = (node: MachineNode, root: Container, x: number, key: string, glyph: string, color: number, action: () => void) => {
      const compact = isCompactNode(node); const chest = getNodeModule(node.kind, node).appearance.shape === 'chest'; const actionSize = compact || chest ? 18 : 25; const button = new Container(); button.label = 'node-control'; button.visible = inputState.controlHover.visible(node.id, performance.now()); const plate = new Graphics();
      button.position.set(x, -getNodeSize(node).h / 2 + (compact ? -7 : chest ? 12 : 18)); button.eventMode = 'static'; button.cursor = 'pointer'; button.hitArea = new Rectangle(0, 0, actionSize, actionSize);
      const drawPlate = (hovered = false, pressed = false) => { const base = key === 'delete' ? 0x241b1d : key === 'pause' ? 0x252117 : 0x1d2328; const hover = key === 'delete' ? 0x5e292b : key === 'pause' ? 0x50401f : 0x293b47; plate.clear().roundRect(0, pressed ? 1 : 0, actionSize, actionSize, compact ? actionSize / 2 : 6).fill({ color: hovered ? hover : base, alpha: .98 }).stroke({ color, width: 1, alpha: hovered ? .82 : .34 }); };
      drawPlate(); button.addChild(plate);
      if (key === 'delete') drawTrashIcon(button, actionSize / 2, actionSize / 2, color); else { const text = label(glyph, compact ? 10 : 12, color, '600'); text.anchor.set(.5); text.position.set(actionSize / 2, actionSize / 2); button.addChild(text); }
      button.on('pointerdown', (event) => { if (event.button !== 0) return; event.stopPropagation(); inputState.controlHover.press(node.id); drawPlate(true, true); }); button.on('pointerup', () => { inputState.controlHover.release(); drawPlate(true); }); button.on('pointerupoutside', () => { inputState.controlHover.release(); drawPlate(); }); button.on('pointertap', (event) => { if (event.button !== 0) return; event.stopPropagation(); clearTooltip(); action(); });
      const actionTooltip = (event: FederatedPointerEvent) => showTooltip(event, key === 'delete' ? 'Decommission' : key === 'pause' ? (node.processingPaused ? 'Resume processing' : 'Pause processing') : key === 'rotate' ? 'Rotate connectors' : key === 'configure' ? 'Choose recipe' : key === 'recipes' ? 'Choose Recycler recipe' : 'Select', key === 'delete' ? 'Remove this node and its attached cables.' : key === 'pause' ? 'Stops new production. Completed output continues routing.' : key === 'rotate' ? 'Rotate the Splitter or Merger 90°.' : key === 'configure' ? 'Configure this machine with one of its unlocked production recipes.' : key === 'recipes' ? 'Pin a recipe or match the incoming material.' : 'Select this node on the factory map.', `#${color.toString(16).padStart(6, '0')}`, 'NODE CONTROL');
      button.on('pointerover', (event) => { event.stopPropagation(); enterNodeHover(node.id); drawPlate(true); actionTooltip(event); }); button.on('pointermove', (event) => { event.stopPropagation(); enterNodeHover(node.id); actionTooltip(event); });
      button.on('pointerout', () => { drawPlate(); clearTooltip(); }); root.addChild(button);
    };

    const addPortOrderAction = (node: MachineNode, root: Container, x: number) => {
      const color = 0xaab0b8; const actionSize = 25; const button = new Container(); button.label = 'node-control'; button.visible = inputState.controlHover.visible(node.id, performance.now()); const plate = new Graphics();
      button.position.set(x, -getNodeSize(node).h / 2 + 18); button.eventMode = 'static'; button.cursor = 'pointer'; button.hitArea = new Rectangle(0, 0, actionSize, actionSize);
      const drawPlate = (hovered = false, pressed = false) => { plate.clear().roundRect(0, pressed ? 1 : 0, actionSize, actionSize, 6).fill({ color: hovered ? 0x41464d : 0x25282d, alpha: .98 }).stroke({ color, width: 1, alpha: hovered ? .82 : .34 }); };
      drawPlate(); button.addChild(plate);
      const icon = label('⇅', 15, color, '600'); icon.anchor.set(.5); icon.position.set(actionSize / 2, actionSize / 2); button.addChild(icon);
      const tooltip = (event: FederatedPointerEvent) => showTooltip(event, 'Reposition connectors', actionSize * camera.zoom < 12 ? 'Zoom in to rearrange connectors.' : 'Left-click cycles input order. Right-click cycles output position.', '#aab0b8', 'NODE CONTROL');
      button.on('pointerdown', (event: FederatedPointerEvent) => { if (event.button !== 0 && event.button !== 2) return; event.preventDefault(); event.stopPropagation(); inputState.controlHover.press(node.id); drawPlate(true, true); });
      button.on('pointerup', () => { inputState.controlHover.release(); drawPlate(true); }); button.on('pointerupoutside', () => { inputState.controlHover.release(); drawPlate(); });
      button.on('pointertap', (event: FederatedPointerEvent) => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); clearTooltip(); if (actionSize * camera.zoom < 12) { propsRef.current.onSelect([node.id]); tooltip(event); return; } propsRef.current.onCycleInputPorts(node.id); });
      button.on('rightclick', (event: FederatedPointerEvent) => { event.preventDefault(); event.stopPropagation(); clearTooltip(); if (actionSize * camera.zoom < 12) { propsRef.current.onSelect([node.id]); tooltip(event); return; } propsRef.current.onCycleOutputPorts(node.id); });
      button.on('pointerover', (event: FederatedPointerEvent) => { event.stopPropagation(); enterNodeHover(node.id); drawPlate(true); tooltip(event); });
      button.on('pointermove', (event: FederatedPointerEvent) => { event.stopPropagation(); enterNodeHover(node.id); tooltip(event); });
      button.on('pointerout', () => { drawPlate(); clearTooltip(); }); root.addChild(button);
    };

    const addPort = (node: MachineNode, root: Container, direction: 'input' | 'output', index: number, family: string, interactive: boolean, sector: SectorState) => {
      const anchor = getPortAnchor(node, direction, index); const definition = getNodeDisplayDefinition(node); const portRoot = new Container();
      portRoot.position.set(anchor.x, anchor.y); portRoot.eventMode = 'static'; portRoot.cursor = guardedResourceLocked(node) ? 'not-allowed' : 'grab';
      const corner = node.kind === 'cornerChallenge' || node.kind === 'cornerTribute';
      let cornerScaleLimit: number | undefined;
      if (corner) {
        cornerScaleLimit = Infinity;
        if (node.kind === 'cornerChallenge' && getEffectiveNodeInputFamilies(node, []).length > 1) {
          const first = getPortAnchor(node, direction, 0), next = getPortAnchor(node, direction, 1);
          // Keep adjacent Foundry sockets and their badges distinct, including in older compact camps.
          cornerScaleLimit = Math.hypot(next.x - first.x, next.y - first.y) / (2 * CORNER_SOCKET_RADIUS + 2);
        }
        portRoot.scale.set(cornerSocketScale(camera.zoom, cornerScaleLimit));
        portRoot.hitArea = { contains: (x: number, y: number) => Math.hypot(x, y) <= CORNER_SOCKET_RADIUS };
      } else {
        portRoot.hitArea = { contains: (x: number, y: number) => socketHitContains(x * camera.zoom, y * camera.zoom, getPortSide(node, direction, index), isCompactNode(node)) };
      }
      const pulse = new Graphics(); const shape = new Graphics(); const connections = sector.connections;
      const related = connections.filter((connection) => direction === 'input' ? connection.to === node.id && (connection.toPort ?? 0) === index : connection.from === node.id && (connection.fromPort ?? 0) === index);
      const connected = related.length > 0; const connectedItem = related.find((connection) => connection.item)?.item;
      const buffer = direction === 'output' ? node.output : node.input;
      const bufferedItem = (Object.keys(buffer) as ItemId[]).find((item) => (buffer[item] ?? 0) > 0);
      const recipeItem = direction === 'output' && node.recipeId ? Object.keys(RECIPES[node.recipeId]?.outputs ?? {})[0] as ItemId | undefined : undefined;
      const filteredItem = direction === 'output' ? related.map((connection) => sector.nodes.find((candidate) => candidate.id === connection.to)?.filterItem).find((item): item is ItemId => Boolean(item)) : undefined;
      const declaredItem = isItemId(family) ? family : undefined;
      const filterOutput = node.kind === 'filter' && direction === 'output';
      const routedItem = filterOutput ? declaredItem ?? (connectedItem && filterOutlet(node, connectedItem) === index ? connectedItem : undefined)
        : node.kind === 'goblinTribute' && direction === 'output' ? declaredItem : connectedItem ?? filteredItem ?? declaredItem ?? bufferedItem ?? recipeItem ?? node.resourceItem;
      const production = isProductionMachine(node);
      const portColor = node.kind === 'devSource' ? definition.accent : routedItem ? ITEM_COLORS[routedItem] : definition.accent; const multi = isMultiConnectionPort(node, direction, index);
      if (production) { shape.circle(0, 0, 10).fill(portColor); }
      else if (multi) { const points: number[] = []; for (let point = 0; point < 16; point++) { const angle = -Math.PI / 2 + point * Math.PI / 8; const radius = point % 2 === 0 ? 11 : 5.5; points.push(Math.cos(angle) * radius, Math.sin(angle) * radius); } shape.poly(points).fill({ color: connected ? portColor : 0x121315 }).stroke({ color: portColor, width: 2 }); }
      else shape.circle(0, 0, 9).fill({ color: connected ? portColor : 0x121315 }).stroke({ color: portColor, width: 2 });
      pulse.label = 'live-overlay';
      const highlight = new Graphics(); highlight.label = 'live-overlay'; highlight.eventMode = 'none'; portRoot.addChild(highlight, pulse, shape);
      const stoneInput = node.kind === 'big-hole' && direction === 'input';
      const roleLabel = portRoleLabel(node, direction, index, family, routedItem);
      if (!stoneInput && !production && roleLabel && !(direction === 'output' && (isResourceNode(node) || node.kind === 'lake' || node.infiniteResource)) && !isStorageNode(node.kind) && definition.category !== 'Logistics' && getNodeCapabilities(node.kind).behavior !== 'research') {
        const side = getPortSide(node, direction, index);
        const name = portLabelText(roleLabel);
        const displayName = !corner && name.length > 15 ? `${name.slice(0, 14)}…` : name;
        const text = label(displayName, corner ? 14 : 9, 0xf0f4f7, '500', 'mono');
        text.anchor.set(.5);
        const width = Math.max(28, text.width + (corner ? 16 : 12));
        const height = corner ? 22 : 18;
        const offset = corner ? 17 : 12;
        const badge = new Container(); badge.eventMode = 'none'; badge.label = 'port-label';
        badge.addChild(new Graphics().roundRect(-width / 2, -height / 2, width, height, 4).fill({ color: 0x111419, alpha: .96 }).stroke({ color: portColor, width: 1, alpha: .78 }), text);
        if (node.kind === 'monster-camp' && node.guardedDepositId) badge.position.set(-offset - width / 2, 0);
        else if (node.kind === 'cornerTribute') badge.position.set(offset + width / 2, height + 1);
        else if (side === 'east') badge.position.set(-offset - width / 2, 0);
        else if (side === 'west') badge.position.set(offset + width / 2, 0);
        else if (side === 'north') badge.position.set(0, 18);
        else badge.position.set(0, -18);
        portRoot.addChild(badge);
      }
      let stoneCounter: PortView['stoneCounter'];
      if (stoneInput) {
        const badge = new Container();
        badge.eventMode = 'none';
        badge.position.set(anchor.x, anchor.y);
        const plate = new Graphics();
        const text = label('', 13, 0xf0f4f7, '500', 'mono');
        text.anchor.set(.5);
        badge.addChild(plate, text);
        root.addChild(badge);
        stoneCounter = { root: badge, plate, text };
      }
      let materialLabel: Text | undefined, materialBuffer: Graphics | undefined;
      if (production) {
        materialLabel = label('', 11, 0xe7ebef, '500'); materialLabel.eventMode = 'none';
        materialBuffer = new Graphics(); materialBuffer.label = 'live-overlay'; materialBuffer.eventMode = 'none'; portRoot.addChild(materialLabel, materialBuffer);
      }
      portRoot.label = `socket:${direction}:${index}:${portColor}:${connected}:${multi}`;
      const view: PortView = { nodeId: node.id, direction, index, root: portRoot, highlight, pulse, pulseColor: THEME.flow, pulseStartedAt: 0, hovered: false, cornerScaleLimit, materialShape: production ? shape : undefined, materialLabel, materialBuffer, stoneCounter };
      if (production) updateProductionPort(view, node, sector);
      root.addChild(portRoot); if (!interactive) { portRoot.eventMode = 'none'; portRoot.cursor = 'default'; return; }
      const key = `${node.id}:${direction}:${index}`; portViews.set(key, view);
      const siblings = portsByNode.get(node.id) ?? []; siblings.push(view); portsByNode.set(node.id, siblings);
      const tooltip = (event: FederatedPointerEvent) => {
        if (multi && !propsRef.current.engine.getState().preferences.skipMultiConnectionTooltip) showTooltip(event, 'Multi-connection connector', 'This connector can accept multiple connections at the same time.', `#${portColor.toString(16).padStart(6, '0')}`, 'MULTI-CONNECTION PORT');
        else if (filterOutput) showTooltip(event, roleLabel, `${filterOutletLabels(node)[index]} outlet`, `#${portColor.toString(16).padStart(6, '0')}`, 'FILTER');
      };
      portRoot.on('pointerover', (event) => { view.hovered = true; tooltip(event); }); portRoot.on('pointermove', tooltip); portRoot.on('pointerout', () => { view.hovered = false; clearTooltip(); });
      portRoot.on('pointerdown', (event: FederatedPointerEvent) => {
        if (event.button !== 0 || inputState.spaceHeld) return;
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

    const createNodeView = (node: MachineNode, placementPreview = false, sector = propsRef.current.engine.getSector()): NodeView => {
      const definition = getNodeDisplayDefinition(node); const size = getNodeSize(node); const compact = isCompactNode(node); const root = new Container();
      root.zIndex = nodeStackOrder(node);
      const campPortOverlay = !placementPreview && node.kind === 'monster-camp' && node.guardedDepositId ? new Container() : undefined;
      if (campPortOverlay) { campPortOverlay.position.set(node.x, node.y); campPortOverlay.label = `camp-input:${node.id}`; }
      const isCornerTribute = node.kind === 'cornerTribute';
      const readabilityLabels: Text[] = [];
      const movable = isPlayerMovableNode(node.kind, propsRef.current.engine.getState(), node);
      root.x = node.x; root.y = node.y; root.eventMode = placementPreview || node.disabled ? 'none' : 'static'; root.cursor = placementPreview ? 'default' : node.disabled ? 'not-allowed' : movable ? 'grab' : 'default'; root.alpha = placementPreview ? .78 : node.disabled ? .68 : 1;
      const body = new Graphics(); const header = new Graphics(); drawFrame(node, body, header); root.addChild(body, header);
      drawEncounterArt(root, node, definition.accent);
      const controlGroup = !placementPreview && sector.controlGroups?.find(group => group.nodeIds.includes(node.id));
      if (controlGroup) {
        const marker = new Graphics(); marker.eventMode = 'none';
        marker.roundRect(-size.w / 2 - 2, -size.h / 2 - 2, size.w + 4, size.h + 4, 10).stroke({ color: controlGroup.color, width: 2, alpha: .75 });
        const badge = node.kind === 'joint' ? { x: 0, y: -12, r: 4 } : compact ? { x: size.w / 2 - 8, y: size.h / 2 - 8, r: 4 } : getNodeModule(node.kind, node).appearance.shape === 'chest' ? { x: -size.w / 2 + 13, y: -size.h / 2 + 20, r: 4 } : { x: -size.w / 2 + (isResourceNode(node) ? 64 : 56), y: -size.h / 2 + (isResourceNode(node) ? 36 : 30), r: 5 };
        marker.circle(badge.x, badge.y, badge.r).fill(controlGroup.color).stroke({ color: 0xffffff, width: 1, alpha: .7 });
        root.addChild(marker);
      }
      if (!isOrganicNode(node) && node.kind !== 'joint') {
        const road = getNodeModule(node.kind, node).appearance.shape === 'road';
        const chest = getNodeModule(node.kind, node).appearance.shape === 'chest';
        const iconSize = road || chest ? 33 : compact ? 24 : isResourceNode(node) ? 40 : 33; const iconX = compact || chest ? 0 : -size.w / 2 + (isResourceNode(node) ? 34 : 29); const iconY = -size.h / 2 + (road || chest ? 21 : compact ? 15 : isResourceNode(node) ? 36 : 30);
        root.addChild(new Graphics().roundRect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize, 7).fill({ color: definition.accent, alpha: .1 }).stroke({ color: definition.accent, width: 1, alpha: .42 }));
        drawNodeIcon(root, getNodeArt(node.kind, node, propsRef.current.engine.getState().research.completed), iconX, iconY, road || chest ? 21 : compact ? 16 : isResourceNode(node) ? 25 : 21, definition.accent, modNode(node.kind)?.icon);
        if (!compact && !chest && !isCornerTribute) {
          const title = label(getNodeDisplayName(node), isResourceNode(node) ? 20 : 17, 0xf3f5f7, '600'); title.x = -size.w / 2 + (isResourceNode(node) ? 63 : 55) + (controlGroup ? 16 : 0); title.y = -size.h / 2 + (isResourceNode(node) ? 22 : 17); root.addChild(title); readabilityLabels.push(title);
        }
      }
      if (isOrganicNode(node) && node.kind !== 'cornerChallenge') {
        const title = label(node.name, 16, 0xf3f5f7, '600'); title.anchor.set(.5); title.position.set(0, node.kind === 'monster-camp' ? campArtworkLayout(node).titleY : node.kind === 'resourceGolem' ? -size.h / 2 - 30 : node.kind === 'lake' ? 0 : -72); root.addChild(title); readabilityLabels.push(title);
      }
      if (getNodeModule(node.kind, node).appearance.shape === 'road') drawRoadFlowArrow(root, node);
      else if (isCartKind(node.kind)) drawFreightVehicleFlowArrow(root, node);
      if (node.kind === 'devSource') {
        const status = label('Auto supply', 15, definition.accent, '500'); status.anchor.set(.5); status.position.set(0, 24); root.addChild(status); readabilityLabels.push(status);
      }
      const grove = groveProgress(node); const initialProgress = grove ? grove.fraction : isResourceNode(node) ? resourceReserveFraction(node) : getNodeCapabilities(node.kind).behavior === 'research' ? researchCenterView(node, propsRef.current.engine.getState()).progress : 0;
      const campView = node.kind === 'monster-camp' ? createCampNodeStatus() : undefined;
      if (campView) { root.addChild(campView.halo, campView.root); updateCampNodeStatus(campView, node, 0, 1); }
      const golemApLabel = node.kind === 'resourceGolem' ? label(golemApReadout(node), 22, 0xf3f5f7, 'normal', 'mono') : undefined;
      if (golemApLabel) {
        golemApLabel.eventMode = 'none';
        golemApLabel.anchor.set(.5);
        golemApLabel.position.set(0, 52);
        root.addChild(golemApLabel);
        readabilityLabels.push(golemApLabel);
      }
      const cornerCampStatus = node.kind === 'cornerChallenge' ? createCornerCampStatus(node) : undefined;
      if (cornerCampStatus) { root.addChild(cornerCampStatus.root); updateCornerCampStatus(cornerCampStatus, node, camera.zoom); }
      let cornerTributeLabel: Text | undefined;
      if (isCornerTribute) {
        const camp = sector.nodes.find(candidate => candidate.id === node.tributeCampId);
        const below = !camp?.cornerCampQuadrant?.startsWith('south');
        cornerTributeLabel = label('Tribute', 13, definition.accent, '600');
        cornerTributeLabel.eventMode = 'none';
        cornerTributeLabel.anchor.set(.5, below ? 0 : 1);
        cornerTributeLabel.y = (below ? 1 : -1) * (size.h / 2 + 32);
        root.addChild(cornerTributeLabel);
      }
      const progress = new Graphics(); const progressTrack = new Graphics(); let progressLabel: Text | undefined; let bufferLabel: Text | undefined; let bufferSquares: Graphics | undefined; let inputSquares: Graphics | undefined; let coreStorageLabels: Text[] | undefined; let coreStorageSquares: Graphics[] | undefined;
      if (!compact && !isOrganicNode(node)) {
        const progressWidth = size.w - (isResourceNode(node) ? 32 : 26); const progressY = size.h / 2 - (isResourceNode(node) ? 26 : 22);
        if (!isStorageNode(node.kind) && node.kind !== 'goblinTribute' && node.kind !== 'devSource') {
        progressTrack.roundRect(0, 0, progressWidth, isResourceNode(node) ? 10 : 8, 4).fill({ color: THEME.progressTrack }).stroke({ color: 0x0e0f11, width: 1 });
        progressTrack.position.set(-progressWidth / 2, progressY);
        progress.roundRect(0, 0, progressWidth, isResourceNode(node) ? 10 : 8, 4).fill({ color: definition.accent }); progress.position.set(-progressWidth / 2, progressY);
        progress.scale.x = initialProgress;
        if (!isCornerTribute && !node.infiniteResource && !isProductionMachine(node) && getNodeCapabilities(node.kind).behavior !== 'research') {
          progressLabel = label(grove?.label ?? `${Math.round(initialProgress * 100)}%`, 12, 0xf0f2f4, 'normal', 'mono');
          progressLabel.anchor.set(1, .5);
          progressLabel.position.set(size.w / 2 - 14, progressY - 14);
          readabilityLabels.push(progressLabel);
        }
        root.addChild(progressTrack, progress);
        if (progressLabel) root.addChild(progressLabel);
        }
        if (getNodeCapabilities(node.kind).behavior === 'research') {
          coreStorageSquares = RESEARCH_CORE_TYPES.map(() => { const squares = new Graphics(); squares.eventMode = 'none'; root.addChild(squares); return squares; });
          coreStorageLabels = RESEARCH_CORE_TYPES.map((item) => {
            const text = label('', 11, ITEM_COLORS[item], 'normal');
            text.anchor.set(.5, 0);
            root.addChild(text); return text;
          });
        } else {
          if (isResourceNode(node)) {
            bufferLabel = label(resourceCapacityReadout(node), node.infiniteResource ? 42 : 12, 0xd1d7de, 'normal', node.infiniteResource ? 'ui' : 'mono');
            bufferLabel.anchor.set(.5);
            bufferLabel.position.set(0, progressY - (node.infiniteResource ? 30 : 21));
            root.addChild(bufferLabel);
            readabilityLabels.push(bufferLabel);
          } else if (outputCapacity(node) > 0 && !isProductionMachine(node)) {
            bufferSquares = new Graphics(); bufferSquares.eventMode = 'none'; root.addChild(bufferSquares);
          }
        }
      }
      if (!compact && !isOrganicNode(node) && !isStorageNode(node.kind) && !isProductionMachine(node) && getNodeCapabilities(node.kind).behavior !== 'research') {
        inputSquares = new Graphics(); inputSquares.eventMode = 'none'; root.addChild(inputSquares);
      }
      getEffectiveNodeInputFamilies(node, propsRef.current.engine.getState().research.completed).forEach((family, index) => addPort(node, campPortOverlay ?? root, 'input', index, family, !placementPreview, sector)); getEffectiveNodeOutputFamilies(node).forEach((family, index) => addPort(node, root, 'output', index, family, !placementPreview, sector));
      if (!placementPreview && !propsRef.current.training) {
        const chest = getNodeModule(node.kind, node).appearance.shape === 'chest';
        let actionX = size.w / 2 - (compact ? 9 : chest ? 25 : 32);
        if (canDeleteNode(node)) { addAction(node, root, actionX, 'delete', '×', 0xff8d93, () => propsRef.current.onDeleteNode(node.id)); actionX -= compact || chest ? 22 : 30; }
        if (!compact && canCyclePortPositions(node)) { addPortOrderAction(node, root, actionX); actionX -= 30; }
        const controls = getNodeModule(node.kind, node).controls;
        if (node.kind === 'recycler') {
          addAction(node, root, actionX, 'recipes', '≡', 0x8ec9ff, () => propsRef.current.onConfigure(node.id));
        } else if (controls.rotatable && definition.category !== 'Logistics') {
          addAction(node, root, actionX, 'rotate', '↻', 0x8ec9ff, () => propsRef.current.onRotate(node.id));
        } else if (controls.configuration === 'mining-target') {
          addAction(node, root, actionX, 'configure', '⚙', 0x8ec9ff, () => propsRef.current.onConfigure(node.id));
        }
      }
      let researchStatus: NodeView['researchStatus'];
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
        jointMoveHandle.visible = inputState.hoveredNodeId === node.id || Boolean(propsRef.current.jointMoveHint);
        root.addChild(jointMoveHandle);
      }
      const productionRecipeIcon = !placementPreview && isProductionMachine(node) ? createProductionRecipeIcon(node) : undefined;
      if (productionRecipeIcon) root.addChild(productionRecipeIcon.root);
      const productionCue = new Graphics(); productionCue.eventMode = 'none'; root.addChild(productionCue);
      const overviewWarning = new Graphics({ eventMode: 'none', visible: false });
      overviewWarning.circle(0, 0, 13).fill({ color: 0xffc46b }).stroke({ color: 0x191b1f, width: 2 });
      overviewWarning.moveTo(0, -6).lineTo(0, 2).stroke({ color: 0x191b1f, width: 3 });
      overviewWarning.circle(0, 7, 1.5).fill(0x191b1f);
      overviewWarning.position.set(size.w / 2 - 18, -size.h / 2 + 18); root.addChild(overviewWarning);
      const flash = new Graphics(); const marqueeHighlight = new Graphics(); const invalidOverlay = new Graphics(); root.addChild(flash, marqueeHighlight, invalidOverlay);
      if (!placementPreview) {
        const nodeTooltip = (event: FederatedPointerEvent) => { const obstruction = isOrganicNode(node); const engine = propsRef.current.engine; const live = engine.getSector().nodes.find(n => n.id === node.id) ?? node; const production = productionExplanation(live, engine.getState(), engine.getSector()); const detail = node.kind === 'lake' ? 'Water source · Fixed world obstruction · Connect from any output socket.' : node.kind === 'big-hole' ? `${Math.floor(node.resourceRemaining ?? 0)} Stone required · Fixed world obstruction.` : node.kind === 'monster-camp' ? `Threat ${live.campStrength ?? 25}% · ${campStatus(live).apLabel} per check · ${campStatus(live).checkLabel}.` : production.summary || `Click to select${movable ? ' · Drag to move' : ''}.`; showTooltip(event, getNodeDisplayName(live), detail, definition.accentCss, obstruction ? 'WORLD OBSTRUCTION' : definition.category.toUpperCase(), node.id); };
        root.on('pointerenter', () => { if (!propsRef.current.placing) enterNodeHover(node.id); }); root.on('pointermove', (event) => { if (!inputState.drag && !propsRef.current.placing && event.target === root) nodeTooltip(event); });
        root.on('pointerleave', () => { inputState.controlHover.leave(node.id, performance.now(), node.kind === 'joint' ? JOINT_CONTROL_GRACE_MS : 0); if (inputState.hoveredNodeId === node.id) { inputState.hoveredNodeId = undefined; propsRef.current.onHoverNode?.(); } clearTooltip(); });
        root.on('pointerdown', (event: FederatedPointerEvent) => interactions.nodePointerDown(node, movable, jointMoveHandle, event));
        // A stationary right-click invokes the node action; dragging still pans.
        root.on('pointerup', (event: FederatedPointerEvent) => interactions.nodePointerUp(node, event));
      }
      const travelDestination = !placementPreview && !propsRef.current.training && propsRef.current.onTravelToSector ? roadTravelDestination(propsRef.current.engine.getState(), node.id) : undefined;
      const travelTarget = travelDestination ? propsRef.current.engine.getState().sectors[travelDestination] : undefined;
      const travelControl = travelTarget ? createRoadTravelControl(travelTarget.x-sector.x, travelTarget.y-sector.y, () => tryRoadTravel(node.id, sector.id)) : undefined;
      if (travelControl) root.addChild(travelControl);
      const detailChildren = [...readabilityLabels.filter(text => text !== golemApLabel && !(node.infiniteResource && text === bufferLabel)), ...[bufferSquares, inputSquares].filter((child): child is Graphics => Boolean(child))];
      const overviewArtwork = !placementPreview && !isOrganicNode(node) && !isResourceNode(node) && !node.infiniteResource && !['joint', 'cornerTribute', 'extractor'].includes(node.kind) && getNodeCapabilities(node.kind).behavior !== 'research'
        ? root.children.filter(child => ![progress, progressTrack, productionCue, overviewWarning, flash, marqueeHighlight, invalidOverlay, ...detailChildren].includes(child as Graphics) && child.label !== 'node-control' && child !== travelControl && child !== jointMoveHandle && child !== researchStatus?.root)
        : undefined;
      if (overviewArtwork) root.hitArea = new Rectangle(-size.w / 2, -size.h / 2, size.w, size.h);
      if (travelControl && travelTarget) root.hitArea = positionRoadTravelControl(travelControl, size, travelTarget.x-sector.x, travelTarget.y-sector.y, camera.zoom);
      const overviewKey = overviewArtwork ? [nodeDrawingKey({ ...node, name: '' }), controlGroup && controlGroup.color, ...root.children.filter(child => child.label?.startsWith('socket:')).map(child => child.label)].join('|') : '';
      return { root, campPortOverlay, overviewArtwork, overviewKey, detailChildren, overviewWarning, campStatus: campView, golemApLabel, cornerCampStatus, cornerTributeLabel, jointMoveHandle, researchStatus, productionRecipeIcon, productionCue, progress, progressTrack, progressLabel, bufferLabel, bufferSquares, inputSquares, coreStorageLabels, coreStorageSquares, readabilityLabels, flash, marqueeHighlight, invalidOverlay, invalidVisible: false, displayedProgress: initialProgress };
    };

    const drawInsertionPreview = (node?: MachineNode, valid = true) => {
      if (!insertionPreviewLayer) return false;
      const sector = propsRef.current.engine.getSector();
      const signature = node && valid ? [propsRef.current.engine.getState().revision, node.id, node.x, node.y, node.rotation].join('|') : '';
      if (signature === insertionPreviewSignature) {
        const original = cableViews.get(insertionPreviewCableId ?? '');
        if (original?.visible) { original.visible = false; cableLayers.invalidate(original); }
        return Boolean(insertionPreviewCableId);
      }
      const previous = cableViews.get(insertionPreviewCableId ?? '');
      if (previous && !previous.visible) { previous.visible = true; cableLayers.invalidate(previous); }
      insertionPreviewSignature = signature; insertionPreviewCableId = undefined; insertionPreviewLayer.clear();
      if (!node || !valid) return false;
      const plan = propsRef.current.engine.getCableInsertionPreview(node);
      if (!plan) return false;
      insertionPreviewCableId = plan.replacedConnectionId;
      const original = cableViews.get(plan.replacedConnectionId);
      if (original?.visible) { original.visible = false; cableLayers.invalidate(original); }
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

    const createRoadPreview = ({ sector, localFacing, endpoint }: RoadPlacementTarget, field: typeof worldSize, showGrid: boolean) => {
      const crop = roadPreviewCrop(field, localFacing);
      const scale = Math.min(1, 1600 / Math.max(field.width, field.height));
      const scene = new Container();
      const terrain = new Container();
      terrain.scale.set(scale);
      terrain.position.set(-crop.x * scale, -crop.y * scale);
      scene.addChild(terrain);
      terrain.addChild(fieldSurface(field, showGrid, sector.id));
      terrain.addChild(createBorderTerrain(propsRef.current.engine.getState(), sector.id, field));

      const nodes = new Map(sector.nodes.map(node => [node.id, node]));
      const cables = new Graphics();
      const movedCables = sector.connections.filter(connection => connection.from === endpoint.id || connection.to === endpoint.id);
      const movedCableIds = new Set(movedCables.map(connection => connection.id));
      for (const connection of sector.connections) {
        if (movedCableIds.has(connection.id)) continue;
        const points = connectionPoints(connection, nodes, sector.connections);
        if (!points) continue;
        drawCurve(cables, points.start, points.end, points.sourceSide, points.targetSide);
        cables.stroke({ color: connection.item ? ITEM_COLORS[connection.item] : 0x60758f, width: 8 });
      }
      terrain.addChild(cables);
      for (const node of sector.nodes) if (node.id !== endpoint.id) terrain.addChild(createNodeView(node, true, sector).root);

      const grayscale = new ColorMatrixFilter();
      grayscale.desaturate();
      grayscale.brightness(1.3, true);
      scene.filters = [grayscale];
      const texture = app.renderer.generateTexture({ target: scene, frame: new Rectangle(0, 0, Math.ceil(crop.width * scale), Math.ceil(crop.height * scale)), resolution: 1, antialias: true });
      scene.destroy({ children: true });
      grayscale.destroy();
      const image = new Sprite(texture);
      image.setSize(crop.width, crop.height);
      image.alpha = .92;

      const root = new Container({ eventMode: 'none' });
      const border = new Graphics().rect(0, 0, crop.width, crop.height).stroke({ color: 0x888888, width: 5, alpha: .8 });
      const title = label(`${mapNodePosition(sector.x, sector.y)} · Paired Road`, 34, 0xe4e4e4, '600');
      title.position.set(24, 20);
      const marker = new Graphics();
      const cablePreview = new Graphics();
      const cableMask = new Graphics().rect(0, 0, crop.width, crop.height).fill(0xffffff);
      cablePreview.position.set(-crop.x, -crop.y);
      cablePreview.mask = cableMask;
      const status = label('Blocked', 26, 0xe4e4e4, '600');
      status.anchor.set(.5);
      root.addChild(image, cablePreview, cableMask, border, title, marker, status);
      world.addChild(root);
      return { root, texture, marker, status, crop, endpointId: endpoint.id, movedCables, cablePreview, nodeById: nodes,
        sector, localFacing, field, showGrid, nodes: sector.nodes, nodeCount: sector.nodes.length, connections: sector.connections };
    };

    const clearRoadPreview = () => {
      if (!roadPreview) return;
      const { root, texture } = roadPreview;
      root.destroy({ children: true });
      texture.destroy(true);
      roadPreview = undefined;
    };

    const tryRoadTravel = (nodeId: string, sourceSectorId: string) => {
      const props = propsRef.current;
      if (props.training || props.placing || !props.onTravelToSector || props.engine.getSector().id !== sourceSectorId) return;
      const destination = roadTravelDestination(props.engine.getState(), nodeId);
      if (!destination) return;
      inputState.roadBodyPress = undefined; inputState.roadTravelClicks.clear(); clearTooltip(); clearRoadPreview();
      props.onTravelToSector(destination, nodeId);
    };

    const syncRoadPreview = (target?: RoadPlacementTarget, valid = false) => {
      if (!target) { if (roadPreview) roadPreview.root.visible = false; return; }
      const game = propsRef.current.engine.getState();
      const field = getWorldFieldSize(game);
      const showGrid = game.preferences.showGrid;
      if (!roadPreview || roadPreview.sector !== target.sector || roadPreview.localFacing !== target.localFacing ||
        roadPreview.endpointId !== target.endpoint.id ||
        roadPreview.field.width !== field.width || roadPreview.field.height !== field.height || roadPreview.showGrid !== showGrid ||
        roadPreview.nodes !== target.sector.nodes || roadPreview.nodeCount !== target.sector.nodes.length || roadPreview.connections !== target.sector.connections) {
        clearRoadPreview();
        roadPreview = createRoadPreview(target, field, showGrid);
      }
      const { root, marker, status, crop, movedCables, cablePreview, nodeById } = roadPreview;
      const position = roadPreviewPosition(target.localFacing, worldSize, crop);
      root.scale.set(position.scale);
      root.position.set(position.x, position.y);
      const x = target.endpoint.x - crop.x, y = target.endpoint.y - crop.y;
      if (movedCables.length) {
        nodeById.set(target.endpoint.id, target.endpoint);
        cablePreview.clear();
        for (const connection of movedCables) {
          const points = connectionPoints(connection, nodeById, target.sector.connections);
          if (!points) continue;
          drawCurve(cablePreview, points.start, points.end, points.sourceSide, points.targetSide);
          cablePreview.stroke({ color: 0xa0a0a0, width: 8 });
        }
      }
      const { w, h } = getNodeSize(target.endpoint);
      marker.clear().roundRect(x - w / 2, y - h / 2, w, h, 12)
        .fill({ color: valid ? 0xf6f6f6 : 0x888888, alpha: .4 }).stroke({ color: 0xf6f6f6, width: 8 });
      status.position.set(x, y);
      status.visible = !valid;
      root.visible = true;
    };

    const pasteAnchor = (x: number, y: number) =>
      snapNodePosition(toWorld(x, y), propsRef.current.snapToGrid, { w: 0, h: 0 });

    const syncPastePreview = () => {
      const { engine, onPaste } = propsRef.current;
      nodeLayer.interactiveChildren = campPortLayer.interactiveChildren = cableLayer.interactiveChildren = !onPaste;
      if (!onPaste) {
        pasteView?.root.destroy({ children: true });
        pasteView = undefined;
        pastePreviewKey = '';
        return;
      }
      if (!inputState.placementPointerInside || inputState.placementCursor.y < viewport.top) {
        if (pasteView) pasteView.root.visible = false;
        pastePreviewKey = '';
        return;
      }
      const point = pasteAnchor(inputState.placementCursor.x, inputState.placementCursor.y);
      const sector = engine.getSector();
      const key = `${sector.id}:${engine.getState().revision}:${point.x}:${point.y}:${camera.zoom}`;
      if (key === pastePreviewKey) return;
      pastePreviewKey = key;
      const preview = engine.getPastePreview(point);
      if (!preview) return;
      if (pasteView?.connections !== preview.connections) {
        pasteView?.root.destroy({ children: true });
        const root = new Container();
        const cables = new Graphics();
        const outlines = new Graphics();
        const status = label('', 11, 0xffffff, '600');
        status.anchor.set(.5);
        root.addChild(cables);
        const nodes = preview.nodes.map(node => ({ ...node, x: node.x - point.x, y: node.y - point.y }));
        const nodeMap = new Map(nodes.map(node => [node.id, node]));
        for (const connection of preview.connections) {
          const points = connectionPoints(connection, nodeMap, preview.connections);
          if (!points) continue;
          drawCurve(cables, points.start, points.end, points.sourceSide, points.targetSide);
          cables.stroke({ color: connection.item ? ITEM_COLORS[connection.item] : 0x60758f, width: 6, cap: 'round' });
        }
        const previewSector = { ...sector, nodes, connections: preview.connections, controlGroups: [] };
        for (const node of nodes) {
          root.addChild(createNodeView(node, true, previewSector).root);
          const { w, h } = getNodeSize(node);
          outlines.roundRect(node.x - w / 2 - 6, node.y - h / 2 - 6, w + 12, h + 12, 15)
            .fill({ color: 0xffffff, alpha: .1 }).stroke({ color: 0xffffff, width: 4 });
        }
        status.y = Math.max(...nodes.map(node => node.y + getNodeSize(node).h / 2)) + 18;
        root.addChild(outlines, status);
        placementLayer.addChild(root);
        pasteView = { root, outlines, status, connections: preview.connections };
      }
      const { root, outlines, status } = pasteView;
      const color = preview.valid ? 0x72dca1 : THEME.danger;
      root.visible = true;
      root.position.set(point.x, point.y);
      outlines.tint = color;
      status.style.fill = color;
      status.text = preview.valid ? 'Click to place' : 'Blocked';
      status.scale.set(nodeTextScale(camera.zoom));
    };

    const syncPlacementPreview = () => {
      syncPastePreview();
      const kind = propsRef.current.placing;
      if (!roadInHand()) clearRoadPreview();
      if (!kind || !inputState.placementPointerInside) {
        if (inputState.drag?.desired && inputState.drag.ids.length === 1) {
          const node = propsRef.current.engine.getSector().nodes.find(candidate => candidate.id === inputState.drag!.ids[0]);
          if (node) drawInsertionPreview({ ...node, ...inputState.drag.desired[node.id] }, inputState.drag.valid);
        } else drawInsertionPreview();
        syncRoadPreview(inputState.placementPointerInside ? inputState.drag?.road : undefined, inputState.drag?.valid);
        if (placementView) placementView.view.root.visible = false; return; }
      const point = snapNodePosition(toWorld(inputState.placementCursor.x, inputState.placementCursor.y), propsRef.current.snapToGrid, getNodeSize({ kind }));
      const destination = propsRef.current.roadPlacementPoint?.(point) ?? point;
      const preview = propsRef.current.engine.getNodePlacementPreview(kind, destination.x, destination.y);
      if (!preview) { syncRoadPreview(); drawInsertionPreview(); if (placementView) placementView.view.root.visible = false; return; }
      syncRoadPreview(kind === 'road' ? preview.road : undefined, preview.valid);
      if (!placementView || placementView.kind !== kind || placementView.roadFacing !== preview.node.roadFacing) {
        placementView?.view.root.destroy({ children: true });
        const view = createNodeView(preview.node, true); const status = label('', 11, 0xffffff, '600'); status.anchor.set(.5); view.root.addChild(status); placementLayer.addChild(view.root); placementView = { kind, roadFacing: preview.node.roadFacing, view, status };
      }
      const { view, status } = placementView; const size = getNodeSize(preview.node); const color = preview.valid ? 0x72dca1 : THEME.danger;
      view.root.visible = true; view.root.alpha = preview.valid ? .8 : .66; view.root.position.set(preview.node.x, preview.node.y); view.invalidOverlay.clear().roundRect(-size.w / 2 - 6, -size.h / 2 - 6, size.w + 12, size.h + 12, 15).fill({ color, alpha: preview.valid ? .055 : .16 }).stroke({ color, width: 4, alpha: .98 });
      const inserts = drawInsertionPreview(preview.node, preview.valid);
      status.text = preview.valid ? inserts ? 'Click to insert' : 'Click to place' : preview.crossingRequirement ?? 'Blocked';
      status.style.wordWrap = Boolean(preview.crossingRequirement);
      status.style.wordWrapWidth = Math.min(240, Math.max(100, worldSize.width * camera.zoom - 16));
      status.style.fill = color;
      status.style.fontSize = preview.crossingRequirement ? 12 : 11;
      if (placementView.crossingFeedback !== Boolean(preview.crossingRequirement)) {
        placementView.crossingFeedback = Boolean(preview.crossingRequirement);
        status.style.stroke = { color: THEME.surface, width: preview.crossingRequirement ? 3 : 0 };
      }
      if (preview.crossingRequirement) {
        // A required action must remain readable at overview zoom and inside this field.
        status.anchor.set(.5, 0); status.scale.set(1 / camera.zoom);
        const margin = 8 / camera.zoom, halfWidth = status.width / 2;
        const x = Math.max(margin + halfWidth - preview.node.x, Math.min(0, worldSize.width - margin - halfWidth - preview.node.x));
        const y = Math.max(margin - preview.node.y, Math.min(size.h / 2 + margin, worldSize.height - margin - status.height - preview.node.y));
        status.position.set(x, y);
      } else {
        status.anchor.set(.5); status.position.set(0, size.h / 2 + 18); status.scale.set(nodeTextScale(camera.zoom));
      }
    };

    const createCableView = (connection: Connection, nodes: Map<string, MachineNode>, connections: Connection[]) => {
      const points = connectionPoints(connection, nodes, connections); if (!points) return; const selected = propsRef.current.selectedConnection === connection.id; const color = connection.item ? ITEM_COLORS[connection.item] : 0x60758f;
      const root = new Container(); root.label = connection.id; root.eventMode = 'static'; root.cursor = 'pointer'; const underlay = new Graphics(); drawCurve(underlay, points.start, points.end, points.sourceSide, points.targetSide); underlay.stroke({ color: selected ? THEME.cableSelected : THEME.cableUnderlay, width: selected ? 12 : 10, cap: 'round' });
      const cable = new Graphics(); drawCurve(cable, points.start, points.end, points.sourceSide, points.targetSide); cable.stroke({ color, width: selected ? 7 : 5, alpha: .94, cap: 'round' }); const hit = new Graphics(); drawCurve(hit, points.start, points.end, points.sourceSide, points.targetSide); hit.stroke({ color: 0xffffff, width: 20, alpha: .001, cap: 'round' }); root.addChild(underlay, cable, hit);
      root.on('pointerdown', (event) => { if (event.button !== 0) return; event.stopPropagation(); propsRef.current.onConnectionSelect(connection.id); propsRef.current.onSelect([]); });
      const cableTooltip = (event: FederatedPointerEvent) => showTooltip(event, connection.item ? ITEM_NAMES[connection.item] : 'Untyped cable', `${points.from.name} [${points.outputIndex + 1}] → ${points.to.name} [${points.inputIndex + 1}] · Click to select.`, connection.item ? `#${ITEM_COLORS[connection.item].toString(16).padStart(6, '0')}` : '#60758f', 'CONNECTION');
      root.on('pointerover', cableTooltip); root.on('pointermove', cableTooltip); root.on('pointerout', clearTooltip);
      if (selected && !propsRef.current.training) { const midpoint = curvePoint(connection, nodes, connections, .5)!; const button = new Container(); button.position.set(midpoint.x, midpoint.y + 22 / camera.zoom); button.eventMode = 'static'; button.cursor = 'pointer'; button.hitArea = new Rectangle(-15, -15, 30, 30); button.addChild(new Graphics().circle(0, 0, 13).fill({ color: 0x291316, alpha: .98 }).stroke({ color: 0xf06c72, width: 2 })); drawTrashIcon(button, 0, 0, 0xff8d93); button.on('pointerdown', (event) => { if (event.button === 0) event.stopPropagation(); }); button.on('pointertap', (event) => { if (event.button !== 0) return; event.stopPropagation(); propsRef.current.onDeleteConnection(connection.id); }); root.addChild(button); }
      cableLayers.add(root, points.start, selected);
      return root;
    };

    const syncCableViews = (nodes: Map<string, MachineNode>, connections: Connection[]) => {
      motionNodes = nodes;
      const next = new Map<string, ViewIdentity>();
      const endpoints = new Map([...nodes].map(([id, node]) => [id, [node.x, node.y, nodeIdentities.get(id)?.key].join(':')]));
      const legacyOrder = connections.some(c => c.fromPort === undefined) ? connections.map(c => c.id).join(',') : '';
      for (const connection of connections) {
        const input = [connection.from, connection.to, endpoints.get(connection.from), endpoints.get(connection.to), connection.fromPort, connection.toPort, connection.item, propsRef.current.selectedConnection === connection.id, connection.fromPort === undefined ? legacyOrder : ''].join('|');
        const previous = cableIdentities.get(connection.id);
        if (cableInputs.get(connection.id) === input && previous?.source === connection) { next.set(connection.id, previous); continue; }
        cableInputs.set(connection.id, input);
        const points = connectionPoints(connection, nodes, connections);
        if (!points) continue;
        const controls = getConnectionControlPoints(points.start, points.end, points.sourceSide, points.targetSide);
        const xs = [points.start.x, points.end.x, controls.first.x, controls.second.x], ys = [points.start.y, points.end.y, controls.first.y, controls.second.y];
        cableBounds.set(connection.id, { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) });
        next.set(connection.id, { source: connection, key: [points.start.x, points.start.y, points.end.x, points.end.y,
          points.sourceSide, points.targetSide, points.outputIndex, points.inputIndex, points.from.name, points.to.name,
          connection.item, propsRef.current.selectedConnection === connection.id].join(':') });
      }
      const changed = new Set([...cableIdentities.keys(), ...next.keys()].filter(id => cableIdentities.get(id)?.key !== next.get(id)?.key || cableIdentities.get(id)?.source !== next.get(id)?.source));
      if (changed.size) pathRevision++;
      for (const [key, cached] of pathCache) if (cached.ids.some(id => changed.has(id))) pathCache.delete(key);
      const byId = new Map(connections.map(connection => [connection.id, connection]));
      reconcileViews(cableViews, cableIdentities, next, id => createCableView(byId.get(id)!, nodes, connections), (view, id) => { cableLayers.invalidate(view); view.destroy({ children: true }); if (!next.has(id)) { cableBounds.delete(id); cableInputs.delete(id); } });
    };

    const transferPath = (transfer: InFlightTransfer, nodes: Map<string, MachineNode>) => {
      const ids = transfer.routeConnectionIds ?? [transfer.connectionId];
      const key = JSON.stringify(ids);
      let cached = pathCache.get(key);
      if (!cached) {
        if (pathCache.size > 2048) pathCache.clear();
        cached = { ids, motion: buildTransferMotionPath(transfer, nodes, propsRef.current.engine.getSector().connections) };
        pathCache.set(key, cached);
      }
      return cached.motion;
    };

    const syncParticles = () => {
      const engine = propsRef.current.engine;
      const sector = engine.getSector();
      const visible = engine.getState().preferences.particles ? engine.getActiveTransfers().slice(0, MAX_VISIBLE_TRANSFERS) : [];
      const signature = `${sector.id}|${pathRevision}|${visible.map((transfer) => transfer.id).join(',')}`;
      if (signature === lastParticleSignature) return;
      lastParticleSignature = signature;
      const retained = new Map(particles.map(particle => [particle.transfer.id, particle]));
      const visibleIds = new Set(visible.map(transfer => transfer.id));
      for (const particle of particles) if (!visibleIds.has(particle.transfer.id)) {
        particle.root.visible = false; particle.root.removeFromParent(); particlePool.push(particle); retained.delete(particle.transfer.id);
      }
      particles.length = 0;
      for (const transfer of visible) {
        const connection = sceneConnections.get(transfer.connectionId);
        if (!connection) continue;
        const { path, passages } = transferPath(transfer, motionNodes);
        if (!path.length) continue;
        let particle = retained.get(transfer.id);
        if (!particle) {
        particle = particlePool.pop();
        if (!particle) {
        diagnostics.particleObjectsCreated++;
        const root = new Container({ eventMode: 'none' });
        const outerGlow = new Graphics().roundRect(-23, -7, 46, 14, 7).fill({ color: THEME.flow, alpha: .1 });
        const glow = new Graphics().roundRect(-19, -4.5, 38, 9, 4.5).fill({ color: THEME.flow, alpha: .32 });
        const bar = new Graphics().roundRect(-16, -2, 32, 4, 2).fill({ color: THEME.flowCore, alpha: 1 });
        outerGlow.blendMode = 'add'; glow.blendMode = 'add'; bar.blendMode = 'add';
        root.addChild(outerGlow, glow, bar);
        particle = { root, connectionId: connection.id, transfer, path, passages, passed: new Set() };
        }
        particle.passed.clear();
        particleLayer.addChild(particle.root);
        }
        particle.connectionId = connection.id; particle.transfer = transfer; particle.path = path; particle.passages = passages;
        const quantityText = (transfer.amount ?? 1) > 1 ? `×${transfer.amount}` : '';
        if (quantityText && !particle.quantity) {
          particle.quantity = label('', 14, THEME.text, 'normal', 'mono');
          particle.quantity.position.set(4, -24); particle.root.addChild(particle.quantity);
        }
        if (particle.quantity) { particle.quantity.text = quantityText; particle.quantity.visible = Boolean(quantityText); }
        particles.push(particle); retained.delete(transfer.id);
        if (!seenTransferIds.has(transfer.id)) {
          seenTransferIds.add(transfer.id);
          const pulse = portViews.get(`${transfer.from}:output:${connection.fromPort ?? 0}`);
          if (pulse) pulse.pulseStartedAt = performance.now();
        }
      }
      for (const particle of retained.values()) { particle.root.visible = false; particle.root.removeFromParent(); particlePool.push(particle); }
    };

    const renderScene = () => {
      const sector = propsRef.current.engine.getSector(); const preferences = propsRef.current.engine.getState().preferences; const nextWorldSize = getWorldFieldSize(propsRef.current.engine.getState());
      if (tooltipIntent?.visible && tooltipIntent.nodeId) {
        const live = sector.nodes.find(n => n.id === tooltipIntent!.nodeId);
        const summary = live && productionExplanation(live, propsRef.current.engine.getState(), sector).summary;
        if (summary && summary !== tooltipIntent.detail) { tooltipIntent.detail = summary; propsRef.current.onTooltip?.({ ...tooltipIntent }); }
      }
      const game = propsRef.current.engine.getState();
      const common = [game.research.completed.join(','), JSON.stringify(game.research.repeatableCompletions), propsRef.current.training].join('|');
      const reset = renderedSectorId !== sector.id || renderedState !== game || sceneMod !== game.mod;
      if (sceneMod !== game.mod || overviewContext !== common) { overviewTextures.destroy(); overviewContext = common; }
      sceneMod = game.mod;
      const worldSizeChanged = worldSize.width !== nextWorldSize.width || worldSize.height !== nextWorldSize.height;
      worldSize = nextWorldSize;
      if (renderedSectorId !== sector.id || renderedState !== propsRef.current.engine.getState()) { inputState.roadBodyPress=undefined; inputState.roadTravelClicks.clear(); inputState.drag = undefined; propsRef.current.onDragPreview?.(undefined); inputState.groupSelection.clear(); inputState.controlHover.clear(); renderedState = propsRef.current.engine.getState(); renderedSectorId = sector.id; camera = { ...sector.camera }; clearConnectionRejection(); trackedTransfers.clear(); seenTransferIds.clear(); lastInputTotals.clear(); flashStartedAt.clear(); updateCamera(); }
      if (worldSizeChanged || !surfaceLayer.children.length) {
        // Expansion rebases all saved cameras with the factory's rigid layout.
        // Adopt that view before publishing this renderer's local camera again.
        if (worldSizeChanged) {
          camera = { ...sector.camera };
          inputState.drag = undefined; inputState.panning = undefined; inputState.dragPointer = undefined;
          propsRef.current.onDragPreview?.(undefined); cancelConnectionDrag();
          if (inputState.marquee) { drawMarqueeHighlights(new Set()); inputState.marquee.graphic.destroy(); inputState.marquee = undefined; }
        }
        drawWorldSurface(); updateCamera();
      }
      else if (preferences.showGrid !== drawnGridEnabled || drawnTerrain !== sector.id + JSON.stringify(sector.filledHoles ?? []) + JSON.stringify(propsRef.current.engine.getState().borderObstructions) + revealedMapTerrain(propsRef.current.engine.getState(), sector.id)) drawWorldSurface();
      if (reset) {
        nodeIdentities.clear(); cableIdentities.clear(); cableInputs.clear(); pathCache.clear();
        particleLayer.removeChildren().forEach(child => child.destroy({ children: true }));
        particlePool.forEach(particle => particle.root.destroy({ children: true })); particlePool.length = 0; particles.length = 0;
      }
      const nodes = new Map(sector.nodes.map((node) => [node.id, node]));
      guardedRefills.sync(sector);
      const groupKeys = new Map<string, string>();
      for (const group of sector.controlGroups ?? []) for (const id of group.nodeIds) groupKeys.set(id, `${group.id}:${group.color}`);
      const next = new Map(sector.nodes.map(node => [node.id, { source: node, key: `${common}|${nodeDrawingKey(node)}|${getEffectiveNodeOutputFamilies(node).join(',')}|${propsRef.current.selectedIds.includes(node.id)}|${groupKeys.get(node.id) ?? ''}` }]));
      reconcileViews(nodeViews, nodeIdentities, next, id => {
        const node = nodes.get(id)!;
        diagnostics.nodesCreated++;
        lastInputTotals.set(id, inputTotal(node));
        const view = createNodeView(node); nodeLayer.addChild(view.root); if (view.campPortOverlay) campPortLayer.addChild(view.campPortOverlay); return view;
      }, (view, id) => {
        diagnostics.nodesDestroyed++;
        for (const port of portsByNode.get(id) ?? []) portViews.delete(portKey(port));
        portsByNode.delete(id);
        view.campPortOverlay?.destroy({ children: true });
        view.root.destroy({ children: true });
        lastInputTotals.delete(id); flashStartedAt.delete(id);
      });
      const visualNodes = inputState.drag?.desired ? new Map(sector.nodes.map(node => [node.id, inputState.drag!.desired![node.id] ? { ...node, ...inputState.drag!.desired![node.id] } : node])) : nodes;
      syncCableViews(visualNodes, sector.connections);
      sceneNodes = nodes;
      sceneConnections = new Map(sector.connections.map((connection) => [connection.id, connection]));
      lastParticleSignature = '';
      syncParticles();
    };

    const interactions = createPlayfieldInteractions(inputState, {
      propsRef, get camera() { return camera; }, get viewport() { return viewport; },
      get nodes() { return sceneNodes; }, ports: portViews, get overlay() { return overlayLayer; },
      clearTooltip, clearConnectionRejection, rejectConnection, drawMarqueeHighlights,
      updateCamera, clampCamera, renderScene, syncPlacementPreview, pasteAnchor, tryRoadTravel,
      clearConnectionPreview: () => { previewCable?.destroy(); previewCable = undefined; },
      previewDrag: (sector, desired, drag) => {
          drag.ids.forEach((id) => { const position = desired[id]; if (position) nodeViews.get(id)?.root.position.set(position.x, position.y); });
          const nodeMap = new Map(sector.nodes.map((candidate) => { const position = desired[candidate.id]; return [candidate.id, position ? { ...candidate, ...position } : candidate] as const; }));
          syncCableViews(nodeMap, sector.connections);
          // In-flight bars must remain attached to the live cable geometry while
          // either endpoint is being dragged. Their transfer clock is unchanged;
          // only the path is resampled against the preview node positions.
          particles.forEach((particle) => {
            const connection = sceneConnections.get(particle.connectionId);
            if (!connection) return;
            const { path, passages } = transferPath(particle.transfer, nodeMap);
            if (path.length) { particle.path = path; particle.passages = passages; }
          });
          drawInsertionPreview(drag.ids.length === 1 ? nodeMap.get(drag.ids[0]) : undefined, drag.valid);
      },
    });
    const { toWorld, portKey, portScreenPoint, normalizedConnection, canSelectNode, activeHandleForTarget, cancelConnectionDrag, beginPortDrag } = interactions;

    const init = async () => {
      app = new Application();
      if (!await resources.initialize(() => app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, resolution: playfieldResolution(window.devicePixelRatio), autoDensity: true, preference: 'webgl' }), () => destroyPlayfieldApplication(app))) return;
      resources.add(() => { particlePool.forEach(particle => particle.root.destroy({ children: true })); particlePool.length = 0; propsRef.current.onDragPreview?.(undefined); clearRoadPreview(); clearConnectionRejection(); clearTooltip(); }); host.appendChild(app.canvas); app.stage.eventMode = 'static'; app.stage.hitArea = app.screen;
      viewport = measureFieldViewport(viewportElement);
      viewportObserver.observe(viewportElement);
      viewportObserver.observe(host);
      world = new Container(); surfaceLayer = new Container(); cableLayer = new Container(); cableLayers = new CableLayers(cableLayer); particleLayer = new Container(); nodeLayer = new Container(); nodeLayer.sortableChildren = true; campPortLayer = new Container(); const refillLayer = new Container(); guardedRefills = new GuardedRefillLinks(refillLayer); placementLayer = new Container(); placementLayer.eventMode = 'none'; overlayLayer = new Container(); insertionPreviewLayer = new Graphics(); insertionPreviewLayer.eventMode = 'none'; world.addChild(surfaceLayer, cableLayer, insertionPreviewLayer, particleLayer, nodeLayer, refillLayer, campPortLayer, placementLayer); app.stage.addChild(world, overlayLayer); drawWorldSurface(); updateCamera(); renderScene();
      const { updateDragAt } = interactions.install(app, resources);
      let cueRevision = -1; let cueTime = -1; const productionCues = new Map<string, ProductionVisual>();
      const tick = () => {
        if (propsRef.current.onDiagnostics && performance.now() - diagnosticsAt > 1000) {
          diagnosticsAt = performance.now();
          propsRef.current.onDiagnostics({ ...diagnostics, visibleNodes: [...nodeViews.values()].filter(view => view.root.visible).length,
            totalNodes: nodeViews.size, activeParticles: particles.length, pooledParticles: particlePool.length, overviewTextures: overviewTextures.size, cableChunks: cableLayers.size, cachedCables });
        }
        const roadHeld = roadInHand();
        if (lastRoadInHand && !roadHeld) updateCamera();
        lastRoadInHand = roadHeld;
        if (lastSnapToGrid !== propsRef.current.snapToGrid) {
          lastSnapToGrid = propsRef.current.snapToGrid;
          if (inputState.drag?.moved && inputState.dragPointer) updateDragAt(inputState.dragPointer);
        }
        if (inputState.placementPointerInside && inputState.dragPointer && !inputState.panning && (inputState.drag?.moved || inputState.connectionDrag?.moved)) {
          const next = scrollCameraForDrag(camera, worldSize, viewport, inputState.dragPointer, app.ticker.deltaMS, cameraOverviewSize());
          if (next.x !== camera.x || next.y !== camera.y) {
            camera = next; updateCamera(); updateDragAt(inputState.dragPointer);
          }
        }
        if (!propsRef.current.selectedIds.length && !inputState.marquee && !inputState.drag) inputState.groupSelection.clear(); const uiSignature = `${propsRef.current.selectedIds.join(',')}|${propsRef.current.selectedConnection ?? ''}|${propsRef.current.placing ?? ''}`; if (uiSignature !== lastUiSignature) { lastUiSignature = uiSignature; renderScene(); }
        syncPlacementPreview();
        const focus = propsRef.current.cameraFocus; if (focus && focus.nonce !== appliedCameraNonce) { appliedCameraNonce = focus.nonce; camera = { ...focus.camera }; updateCamera(); }
        syncParticles();
        // Cache static neighborhoods; moved cables refresh only their own chunks.
        const cacheCables = camera.zoom < .4;
        if (cacheCables !== cachedCables) { cachedCables = cacheCables; cableVisibilitySignature = ''; }
        const visibilitySignature = [cachedCables, camera.x, camera.y, camera.zoom, viewport.width, viewport.height, viewport.top, pathRevision, insertionPreviewCableId].join(':');
        if (visibilitySignature !== cableVisibilitySignature) {
          cableVisibilitySignature = visibilitySignature;
          cableViews.forEach((view, id) => {
            const bounds = cableBounds.get(id);
            view.visible = id !== insertionPreviewCableId && (cachedCables || Boolean(bounds && boundsOnScreen(bounds, camera, viewport)));
          });
        }
        cableLayers.update(cachedCables, camera, viewport);
        const sector = propsRef.current.engine.getSector(); const nodeMap = sceneNodes; const frameNow = performance.now();
        const gameState = propsRef.current.engine.getState();
        guardedRefills.update(frameNow, { paused: gameState.paused, particles: gameState.preferences.particles,
          reducedMotion: reducedMotion.matches, positions: inputState.drag?.desired });
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
        trackedTransfers.forEach((transfer, id) => { if (liveTransferIds.has(id)) return; trackedTransfers.delete(id); if (transfer.sectorId !== sector.id || transfer.arrivesAtMs > gameState.playTimeMs) return; const connection = sceneConnections.get(transfer.routeConnectionIds?.at(-1) ?? transfer.connectionId); const inputPulse = portViews.get(`${transfer.to}:input:${connection?.toPort ?? 0}`); if (inputPulse) inputPulse.pulseStartedAt = frameNow; });
        particles.forEach((particle) => { const connection = sceneConnections.get(particle.connectionId); if (!connection) { particle.root.visible = false; return; } const phase = transferProgress(particle.transfer, animationPlayTimeMs); particle.passages.forEach(passage => { if (phase >= passage.phase && !particle.passed.has(passage.nodeId)) { particle.passed.add(passage.nodeId); flashStartedAt.set(passage.nodeId, frameNow); portsByNode.get(passage.nodeId)?.forEach(port => { port.pulseStartedAt = frameNow; }); } }); const motion = sampleCurveMotion(particle.path, phase); if (!motion) return; particle.root.visible = phase < 1; particle.root.position.set(motion.x, motion.y); particle.root.rotation = motion.angle; particle.root.alpha = Math.max(0, Math.min(1, phase / .08, (1 - phase) / .12)); });
        nodeViews.forEach((view, id) => {
          const node = nodeMap.get(id); if (!node) return;
          const dragPosition = inputState.drag?.desired?.[id];
          view.root.visible = nodeOnScreen(node, camera, viewport, dragPosition ?? node);
          if (view.campPortOverlay) {
            view.campPortOverlay.visible = view.root.visible;
            view.campPortOverlay.position.set(dragPosition?.x ?? node.x, dragPosition?.y ?? node.y);
          }
          if (!view.root.visible) return;
          const important = propsRef.current.selectedIds.includes(id) || inputState.hoveredNodeId === id || Boolean(inputState.drag?.ids.includes(id)) || inputState.connectionDrag?.active.nodeId === id || inputState.connectionDrag?.snapped?.nodeId === id;
          const fullArtwork = showNodeDetails(camera.zoom, important);
          const details = showNodeReadouts(camera.zoom, important, propsRef.current.showDistantNodeDetails);
          const dataChanged = view.dataRevision !== gameState.revision || view.dataTime !== gameState.playTimeMs || view.detailVisible !== details || view.dataZoom !== camera.zoom;
          view.detailVisible = details;
          view.detailChildren?.forEach(child => { child.visible = details; });
          const selectable = canSelectNode(id);
          view.root.eventMode = node.disabled || !selectable ? 'none' : 'static';
          view.root.alpha = node.disabled || guardedResourceLocked(node) ? .68 : !selectable ? .45 : 1;
          if (view.campPortOverlay) { view.campPortOverlay.alpha = view.root.alpha; view.campPortOverlay.interactiveChildren = selectable; }
          const controlsVisible = selectable && !propsRef.current.placing && inputState.controlHover.visible(id, frameNow);
          view.root.children.forEach(child => { if (child.label === 'node-control') child.visible = controlsVisible; });
          const travelControl = view.root.children.find(child => child.label === 'road-travel-control');
          if (travelControl) {
            const destination = roadTravelDestination(gameState, id), target = destination ? gameState.sectors[destination] : undefined;
            travelControl.visible = selectable && !propsRef.current.placing && !propsRef.current.training && Boolean(target);
            if (target) view.root.hitArea = positionRoadTravelControl(travelControl, getNodeSize(node), target.x-sector.x, target.y-sector.y, camera.zoom);
          }
          if (view.jointMoveHandle) {
            view.jointMoveHandle.visible = !propsRef.current.placing && (controlsVisible || Boolean(propsRef.current.jointMoveHint));
            view.jointMoveHandle.cursor = inputState.drag?.ids.includes(id) ? 'grabbing' : 'grab';
          }
          view.root.position.set(dragPosition?.x ?? node.x, dragPosition?.y ?? node.y);
          const readabilityScale = nodeTextScale(camera.zoom);
          if (details) view.readabilityLabels.forEach(text => text.scale.set(readabilityScale));
          const invalid = Boolean(inputState.drag?.moved && !inputState.drag.valid && inputState.drag.ids.includes(id));
          if (invalid !== view.invalidVisible) {
            view.invalidVisible = invalid; view.invalidOverlay.clear();
            if (invalid) { const size = getNodeSize(node); view.invalidOverlay.roundRect(-size.w / 2 - 5, -size.h / 2 - 5, size.w + 10, size.h + 10, 16).fill({ color: THEME.danger, alpha: .18 }).stroke({ color: THEME.danger, width: 3, alpha: .98 }); }
          }
          if (dataChanged) {
            const currentInput = inputTotal(node);
            if (getNodeCapabilities(node.kind).behavior !== 'research' && (lastInputTotals.get(id) ?? currentInput) < currentInput) flashStartedAt.set(id, frameNow);
            lastInputTotals.set(id, currentInput);
          }
          const duration = nodeCycleDuration(node, gameState.research.completed);
          const interpolation = !gameState.paused && !node.disabled && !node.processingPaused && node.progressMs > 0 ? (animationPlayTimeMs - gameState.playTimeMs) / (modNode(node.kind)?.cycleMultiplier ?? 1) : 0;
          const cycleProgress = duration ? Math.min(1, (node.progressMs + interpolation) / duration) : 0;
          if (view.campStatus) updateCampNodeStatus(view.campStatus, node, interpolation, readabilityScale);
          const cue = productionCues.get(id);
          if (view.overviewWarning) { view.overviewWarning.visible = !details && !cue?.working && Boolean(cue?.missingInputs.length || cue?.blockedOutputs.length); }
          if (view.golemApLabel) view.golemApLabel.text = golemApReadout(node);
          view.productionRecipeIcon?.update(node, propsRef.current.showRecipeIcons);
          if (view.overviewArtwork) {
            const key = view.overviewKey + '|' + (propsRef.current.showRecipeIcons ? node.batch?.recipeId ?? node.recipeId ?? node.lastRecipeId : 'no-recipe-icons');
            if (!fullArtwork && view.overviewSpriteKey !== key) {
              setOverviewArtworkVisibility(view.overviewArtwork, false, true);
              if (view.overviewSprite) { view.overviewSprite.destroy(); view.overviewSprite = undefined; }
              view.overviewSprite = overviewTextures.sprite(key, view.root, view.overviewArtwork, app.renderer);
              view.overviewSpriteKey = key;
              if (view.overviewSprite) view.root.addChildAt(view.overviewSprite, 0);
            }
            const overview = !fullArtwork && Boolean(view.overviewSprite);
            if (view.overviewSprite) view.overviewSprite.visible = overview;
            setOverviewArtworkVisibility(view.overviewArtwork, overview, details);
            view.productionCue.visible = !overview || details;
          }
          const grove = groveProgress(node);
          const target = grove ? grove.fraction : isResourceNode(node) ? resourceReserveFraction(node) : getNodeCapabilities(node.kind).behavior === 'research' ? researchCenterView(node, gameState).progress : cue?.working ? cycleProgress : 0;
          view.displayedProgress = target;
          view.progress.scale.x = target;
          if (view.progress.parent && ((propsRef.current.minimumProgressBarPixels ?? 0) > 0 || view.progress.scale.y !== 1)) {
            const bar = progressBarTransform(camera.zoom, isResourceNode(node) ? 10 : 8, getNodeSize(node).h / 2 - (isResourceNode(node) ? 26 : 22), propsRef.current.minimumProgressBarPixels);
            view.progress.scale.y = bar.scaleY; view.progress.y = bar.y;
            if (view.progressTrack) { view.progressTrack.scale.y = bar.scaleY; view.progressTrack.y = bar.y; }
          }
          if (details && view.progressLabel) view.progressLabel.text = grove?.label ?? `${Math.round(target * 100)}%`;
          if (dataChanged) {
            view.dataRevision = gameState.revision; view.dataTime = gameState.playTimeMs; view.dataZoom = camera.zoom;
            drawProductionCue(view.productionCue, node, cue, gameState.research.completed);
            if (node.kind === 'filter') {
              if (!view.filterNotice) { view.filterNotice = label('', 13, 0xffc46b, '600'); view.filterNotice.anchor.set(.5, 0); view.filterNotice.position.set(0, getNodeSize(node).h / 2 + 10); view.root.addChild(view.filterNotice); }
              const blockedPort = blockedFilterPort(node);
              view.filterNotice.text = blockedPort === undefined ? '' : `! ${filterOutletLabels(node)[blockedPort].toUpperCase()} OUTLET BLOCKED`;
            }
            if (view.bufferLabel && (details || node.infiniteResource)) view.bufferLabel.text = node.resourceItem ? resourceCapacityReadout(node) : `${outputTotal(node)} / ${outputCapacity(node)}`;
            if (details) { updateBufferSquares(view, node); updateInputSquares(view, node); }
          }
          if (view.researchStatus) updateResearchNodeStatus(view.researchStatus, researchCenterView(node, gameState).projectName, readabilityScale);
          if (view.coreStorageLabels && dataChanged) {
          const storage = researchCoreGrid(node, gameState.research);
          const { w } = getNodeSize(node);
          const gridTop = getPortAnchor(node, 'input', 0).y + 28;
          const columnOffset = (w - 36) / 4;
          const pipSize = 11, pipGap = 4, maxPips = 5;
          view.coreStorageLabels.forEach((text, index) => {
            const core = storage[index];
            const squares = view.coreStorageSquares?.[index];
            text.visible = Boolean(core) && (details || camera.zoom >= .48);
            if (squares) squares.visible = Boolean(core) && details;
            if (!core) return;
            text.style.fill = ITEM_COLORS[core.item];
            text.text = ITEM_NAMES[core.item].replace(' Core', '');
            text.scale.set(readabilityScale);
            text.position.set(core.column * columnOffset, gridTop + core.row * 42);
            if (squares) {
              const pipCount = Math.min(maxPips, Math.ceil(core.capacity));
              const pipWidth = pipCount * (pipSize + pipGap) - pipGap;
              drawBufferSquares(squares, core.amount, core.capacity, ITEM_COLORS[core.item], pipSize, pipGap, maxPips, maxPips);
              squares.position.set(text.x - pipWidth / 2, text.y + 22);
            }
          });
        }
        if (view.cornerCampStatus) updateCornerCampStatus(view.cornerCampStatus, node, camera.zoom);
        if (view.cornerTributeLabel) {
          view.cornerTributeLabel.visible = camera.zoom < .55;
          view.cornerTributeLabel.scale.set(1 / camera.zoom);
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
        if (!view.flashActive) {
          view.flashActive = true;
          if (node.kind === 'cornerChallenge' || node.kind === 'big-hole') view.flash.poly(obstructionOutline(node));
          else { const size = getNodeSize(node); view.flash.roundRect(-size.w / 2 - 3, -size.h / 2 - 3, size.w + 6, size.h + 6, 14); }
          view.flash.fill({ color: 0x168cf0, alpha: .08 }).stroke({ color: 0x55baff, width: 2, alpha: 1 });
        }
        view.flash.visible = flashAlpha > 0;
        view.flash.alpha = flashAlpha;
        });
        portViews.forEach((port) => {
          const live = nodeMap.get(port.nodeId);
          const owner = nodeViews.get(port.nodeId);
          if (!live || !owner?.root.visible || (owner.overviewSprite?.visible && !owner.detailVisible && !port.hovered && !inputState.connectionDrag)) return;
          const details = owner.detailVisible || port.hovered || Boolean(inputState.connectionDrag);
          port.root.children.forEach(child => { if (child.label === 'port-label') child.visible = Boolean(details); });
          if (port.materialLabel) port.materialLabel.visible = Boolean(details);
          if (port.materialBuffer) port.materialBuffer.visible = Boolean(details);
          if (details && (port.dataRevision !== gameState.revision || port.dataTime !== gameState.playTimeMs || port.detailVisible !== Boolean(details))) {
            updateProductionPort(port, live, sector);
            port.dataRevision = gameState.revision; port.dataTime = gameState.playTimeMs;
          }
          port.detailVisible = Boolean(details);
          if (live && port.stoneCounter) {
            const { root, plate, text } = port.stoneCounter;
            const zoom = camera.zoom;
            const scale = Math.max(1 / zoom, nodeTextScale(zoom));
            // Clear the screen-space hit area and the arrival pulse, which reaches 42 world units.
            const socketClearance = Math.max(12 / zoom, 42);
            root.scale.set(scale);
            root.y = port.root.y + socketClearance + 10 * scale + 4 / zoom;
            const readout = deepHoleStoneReadout(live, endgameRank(gameState, 'efficientLandfill'));
            if (text.text !== readout) {
              text.text = readout;
              const width = text.width + 12;
              plate.clear().roundRect(-width / 2, -10, width, 20, 4)
                .fill({ color: 0x111419, alpha: .96 }).stroke({ color: ITEM_COLORS.stone, width: 1, alpha: .78 });
            }
          }
          const active = inputState.connectionDrag && portKey(inputState.connectionDrag.active) === portKey(port);
          const snapped = inputState.snappedPortKey === portKey(port);
          const rejected = connectionRejection?.target && portKey(connectionRejection.target) === portKey(port);
          const highlightSignature = active || snapped || rejected || port.hovered ? `${Boolean(active)}:${Boolean(snapped)}:${Boolean(rejected)}:${port.hovered}:${Boolean(inputState.connectionDrag)}:${gameState.revision}` : '';
          if (port.highlightSignature !== highlightSignature) {
          port.highlightSignature = highlightSignature; port.highlight.clear();
          if (!rejected && (port.hovered || active || snapped)) {
            let invalid = false;
            if (snapped && inputState.connectionDrag) { const { output, input } = normalizedConnection(activeHandleForTarget(inputState.connectionDrag, port), port); invalid = Boolean(propsRef.current.engine.getConnectionFailure(output.nodeId, output.index, input.nodeId, input.index, inputState.connectionDrag.replaceConnectionId)); }
            const color = invalid ? THEME.danger : snapped ? 0x9de0c1 : 0xffdf91;
            port.highlight.circle(0, 0, port.cornerScaleLimit !== undefined ? 13 : inputState.connectionDrag ? 12 : 19).fill({ color, alpha: .18 }).stroke({ color, width: 2.5, alpha: 1 });
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
          }
          port.root.cursor = inputState.connectionDrag ? 'grabbing' : 'grab';
          if (port.pulseStartedAt || port.pulseActive) port.pulse.clear();
          port.pulseActive = Boolean(port.pulseStartedAt);
          let arrivalScale = 1;
          if (port.pulseStartedAt) {
            const progress = (frameNow - port.pulseStartedAt) / 520;
            if (progress >= 1) port.pulseStartedAt = 0;
            else {
              const intensity = 1 - progress;
              arrivalScale = 1 + Math.sin(Math.PI * progress) * .48;
              port.pulse.circle(0, 0, 13 + progress * (port.cornerScaleLimit === undefined ? 22 : 6)).fill({ color: port.pulseColor, alpha: intensity * .18 }).stroke({ color: port.pulseColor, width: 3, alpha: intensity });
              port.pulse.circle(0, 0, 8 + progress * 9).stroke({ color: THEME.flowHighlight, width: 1.5, alpha: intensity * .72 });
            }
          }
          if (port.cornerScaleLimit === undefined) port.root.scale.set(inputState.connectionDrag || port.materialBuffer ? 1 : arrivalScale);
        });
        if (inputState.connectionDrag) {
          const active = inputState.connectionDrag.snapped ? activeHandleForTarget(inputState.connectionDrag, inputState.connectionDrag.snapped) : inputState.connectionDrag.active;
          const activePoint = portScreenPoint(active);
          if (activePoint) {
            if (!previewCable) { previewCable = new Graphics(); overlayLayer.addChild(previewCable); }
            previewCable.clear();
            if (active.direction === 'output') {
              const targetSide = inputState.connectionDrag.snapped ? getPortSide(nodeMap.get(inputState.connectionDrag.snapped.nodeId)!, 'input', inputState.connectionDrag.snapped.index) : 'west';
              drawCurve(previewCable, activePoint, inputState.previewPoint, getPortSide(nodeMap.get(active.nodeId)!, 'output', active.index), targetSide);
            } else {
              const sourceSide = inputState.connectionDrag.snapped ? getPortSide(nodeMap.get(inputState.connectionDrag.snapped.nodeId)!, 'output', inputState.connectionDrag.snapped.index) : 'east';
              drawCurve(previewCable, inputState.previewPoint, activePoint, sourceSide, getPortSide(nodeMap.get(active.nodeId)!, 'input', active.index));
            }
            previewCable.stroke({ color: inputState.connectionDrag.snapped ? THEME.flowHighlight : THEME.flow, width: inputState.connectionDrag.snapped ? 4 : 3, alpha: .94, cap: 'round' });
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
      };
      app.ticker.add(tick); resources.add(() => app.ticker.remove(tick));
      resources.add(props.engine.subscribe(renderScene));
    };
    void init().catch((error: unknown) => { console.error('Pixi playfield failed to initialize', error); const report = !destroyed; destroyed = true; resources.dispose(); if (report) { const message = error instanceof Error ? error.message : String(error); host.innerHTML = `<div class="pixi-boot-error"><b>PLAYFIELD BOOT INTERRUPTED</b><span>${escapeHtml(message)}</span><small>Reload the local page. If this persists, verify that WebGL is enabled.</small></div>`; } });
    return () => { destroyed = true; resources.dispose(); };
  }, [props.engine, props.viewportRef]);

  return <div ref={props.viewportRef} className="playfield-viewport">
    <div ref={hostRef} className={`pixi-host ${props.placing ? 'is-placing' : ''}`} aria-label="Factory node canvas" />
  </div>;
}

