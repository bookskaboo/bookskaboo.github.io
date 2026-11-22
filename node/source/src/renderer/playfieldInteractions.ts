import { Container, Graphics, type Application, type FederatedPointerEvent } from 'pixi.js';
import type { CameraState, MachineNode, SectorState } from '../domain/types';
import { THEME } from './playfieldTheme';
import type { FieldViewport } from '../domain/camera';
import { ControlGroupSelection, boxControlSelection } from '../domain/controlGroups';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { getNodeSize, getPortAnchor, isCompactNode } from '../domain/nodeGeometry';
import { draggedNodePositions } from '../domain/nodeGrid';
import { getPortSide } from '../simulation/connectionRules';
import { hasOpenDialog } from '../ui/dialogFocus';
import { RoadTravelClicks, roadTravelDestination } from './roadNodeTravel';
import { NodeControlHover } from './nodeControlHover';
import { CORNER_SOCKET_RADIUS, nearestSocket, socketHitContains } from './socketTargeting';
import type { PixiPlayfieldProps, DragState, ConnectionDragState, PortHandle, PortView } from './playfieldTypes';
import { PlayfieldResources } from './playfieldResources';

export interface PlayfieldInteractionState {
  drag: DragState | undefined;
  connectionDrag: ConnectionDragState | undefined;
  snappedPortKey: string | undefined;
  panning: { x: number; y: number; cameraX: number; cameraY: number } | undefined;
  groupSelection: ControlGroupSelection;
  roadTravelClicks: RoadTravelClicks;
  roadBodyPress: { nodeId: string; sectorId: string; x: number; y: number } | undefined;
  rightPress: { id: string; x: number; y: number; moved: boolean } | undefined;
  marquee: { startX: number; startY: number; graphic: Graphics; baseSelection: string[]; previewIds: Set<string> } | undefined;
  spaceHeld: boolean;
  previewPoint: { x: number; y: number };
  placementPointerInside: boolean;
  placementCursor: { x: number; y: number };
  dragPointer: { x: number; y: number } | undefined;
  controlHover: NodeControlHover;
  hoveredNodeId: string | undefined;
}
export function createPlayfieldInteractionState(): PlayfieldInteractionState {
  return {
    drag: undefined,
    connectionDrag: undefined,
    snappedPortKey: undefined,
    panning: undefined,
    groupSelection: new ControlGroupSelection(),
    roadTravelClicks: new RoadTravelClicks(),
    roadBodyPress: undefined,
    rightPress: undefined,
    marquee: undefined,
    spaceHeld: false,
    previewPoint: { x: 0, y: 0 },
    placementPointerInside: false,
    placementCursor: { x: 0, y: 0 },
    dragPointer: undefined,
    controlHover: new NodeControlHover(),
    hoveredNodeId: undefined,
  };
}
interface InteractionScene {
  propsRef: { current: PixiPlayfieldProps };
  readonly camera: CameraState; readonly viewport: FieldViewport;
  readonly nodes: Map<string, MachineNode>; ports: Map<string, PortView>; readonly overlay: Container;
  clearTooltip(): void; clearConnectionRejection(): void; clearConnectionPreview(): void;
  rejectConnection(state: ConnectionDragState, x: number, y: number, snapped?: PortHandle): void;
  drawMarqueeHighlights(ids: ReadonlySet<string>): void; updateCamera(): void; clampCamera(): void;
  renderScene(): void; syncPlacementPreview(): void; pasteAnchor(x: number, y: number): { x: number; y: number };
  tryRoadTravel(id: string, sectorId: string): void;
  previewDrag(sector: SectorState, desired: Record<string, { x: number; y: number }>, drag: DragState): void;
}

/** Input coordination is separate from scene drawing and mount resource ownership. */
export function createPlayfieldInteractions(inputState: PlayfieldInteractionState, scene: InteractionScene) {
  const toWorld = (x: number, y: number) => ({ x: (x - scene.camera.x) / scene.camera.zoom, y: (y - scene.camera.y) / scene.camera.zoom });

  const portKey = (handle: PortHandle) => `${handle.nodeId}:${handle.direction}:${handle.index}`;

  const portScreenPoint = (handle: PortHandle) => {
    const node = scene.nodes.get(handle.nodeId);
    if (!node) return undefined;
    const anchor = getPortAnchor(node, handle.direction, handle.index);
    return { x: scene.camera.x + (node.x + anchor.x) * scene.camera.zoom, y: scene.camera.y + (node.y + anchor.y) * scene.camera.zoom };
  };

  const normalizedConnection = (first: PortHandle, second: PortHandle) => first.direction === 'output'
    ? { output: first, input: second }
    : { output: second, input: first };

  const canSelectNode = (id: string) => !scene.propsRef.current.selectableNodeId || scene.propsRef.current.selectableNodeId === id;

  const socketAt = (x: number, y: number) => {
    const candidates = [...scene.ports.values()].flatMap(handle => {
      const node = scene.nodes.get(handle.nodeId);
      const point = portScreenPoint(handle);
      if (!canSelectNode(handle.nodeId) || !node || !point || point.y < scene.viewport.top || (node.kind === 'joint' && handle.direction === 'input')) return [];
      const dx = x - point.x, dy = y - point.y;
      if (handle.cornerScaleLimit !== undefined
        ? Math.hypot(dx, dy) > CORNER_SOCKET_RADIUS * handle.root.scale.x * scene.camera.zoom
        : !socketHitContains(dx, dy, getPortSide(node, handle.direction, handle.index), isCompactNode(node))) return [];
      return [{ ...point, key: portKey(handle), side: getPortSide(node, handle.direction, handle.index), handle }];
    });
    return nearestSocket(candidates, x, y, Infinity)?.handle;
  };

  const activeHandleForTarget = (state: ConnectionDragState, target: PortHandle): PortHandle => state.adaptiveJointDirection
    ? { nodeId: state.originNodeId, direction: target.direction === 'input' ? 'output' : 'input', index: 0 }
    : state.active;

  const findNearbyCompatiblePort = (x: number, y: number) => {
    const state = inputState.connectionDrag; if (!state) return undefined;
    let nearest: { handle: PortHandle; distance: number } | undefined;
    scene.ports.forEach((candidate) => {
      const handle: PortHandle = { nodeId: candidate.nodeId, direction: candidate.direction, index: candidate.index };
      const active = activeHandleForTarget(state, handle);
      if (handle.nodeId === active.nodeId || handle.direction === active.direction) return;
      const point = portScreenPoint(handle); if (!point || point.y < scene.viewport.top) return; const distance = Math.hypot(point.x - x, point.y - y);
      const radius = candidate.cornerScaleLimit === undefined ? 44 : Math.max(44, CORNER_SOCKET_RADIUS * candidate.root.scale.x * scene.camera.zoom);
      if (distance <= radius && (!nearest || distance < nearest.distance)) nearest = { handle, distance };
    });
    return nearest?.handle;
  };

  const updateSnappedPort = (handle?: PortHandle) => {
    if (inputState.snappedPortKey) { const previous = scene.ports.get(inputState.snappedPortKey); if (previous) previous.hovered = false; }
    inputState.snappedPortKey = handle ? portKey(handle) : undefined;
    if (inputState.snappedPortKey) { const next = scene.ports.get(inputState.snappedPortKey); if (next) next.hovered = true; }
    if (inputState.connectionDrag) inputState.connectionDrag.snapped = handle;
  };

  const cancelConnectionDrag = () => {
    updateSnappedPort();
    inputState.connectionDrag = undefined;
    scene.clearConnectionPreview();
  };

  const beginPortDrag = (handle: PortHandle, event: FederatedPointerEvent) => {
    inputState.roadBodyPress=undefined; inputState.roadTravelClicks.clear();
    scene.clearConnectionRejection();
    event.preventDefault(); event.stopPropagation(); scene.clearTooltip();
    const node = scene.propsRef.current.engine.getSector().nodes.find(candidate => candidate.id === handle.nodeId);
    if (!node) return;
    let active = handle; let replaceConnectionId: string | undefined;
    if (handle.direction === 'input' && node.kind !== 'joint') {
      const attached = scene.propsRef.current.engine.getSector().connections.filter(connection => connection.to === node.id && (connection.toPort ?? 0) === handle.index);
      const existing = attached.find(connection => connection.id === scene.propsRef.current.selectedConnection) ?? (attached.length === 1 ? attached[0] : undefined);
      if (existing) { active = { nodeId: existing.from, direction: 'output', index: existing.fromPort ?? 0 }; replaceConnectionId = existing.id; }
    }
    inputState.dragPointer = { x: event.global.x, y: event.global.y };
    inputState.connectionDrag = { originNodeId: node.id, active, replaceConnectionId, adaptiveJointDirection: node.kind === 'joint', startX: event.global.x, startY: event.global.y, moved: false };
    inputState.previewPoint = { x: event.global.x, y: event.global.y };
  };

  const nodesInMarquee = (startX: number, startY: number, endX: number, endY: number) => {
    const start = toWorld(startX, startY); const end = toWorld(endX, endY);
    const left = Math.min(start.x, end.x), right = Math.max(start.x, end.x), top = Math.min(start.y, end.y), bottom = Math.max(start.y, end.y);
    if (Math.abs(right - left) <= 10 || Math.abs(bottom - top) <= 10) return [];
    const sector = scene.propsRef.current.engine.getSector();
    const hits = sector.nodes.filter((node) => {
      const size = getNodeSize(node);
      return canSelectNode(node.id) && isPlayerMovableNode(node.kind, scene.propsRef.current.engine.getState(), node) && !node.disabled && node.x + size.w / 2 >= left && node.x - size.w / 2 <= right && node.y + size.h / 2 >= top && node.y - size.h / 2 <= bottom;
    }).map((node) => node.id);
    const selectable = new Set(sector.nodes.filter(node => isPlayerMovableNode(node.kind, scene.propsRef.current.engine.getState(), node) && !node.disabled).map(node => node.id));
    return boxControlSelection(hits, sector.controlGroups ?? [], start, end).ids.filter(id => selectable.has(id));
  };
  const nodePointerDown = (node: MachineNode, movable: boolean, jointMoveHandle: Container | undefined, event: FederatedPointerEvent) => {
    inputState.roadBodyPress=undefined;
    if (event.button!==0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || inputState.spaceHeld || scene.propsRef.current.placing) inputState.roadTravelClicks.clear();
    if (!canSelectNode(node.id)) { event.stopPropagation(); return; }
    if (event.button === 2 && !scene.propsRef.current.placing) { inputState.rightPress = { id: node.id, x: event.global.x, y: event.global.y, moved: false }; return; }
    if (event.button !== 0 || inputState.spaceHeld) return; event.stopPropagation();
    if (event.shiftKey && scene.propsRef.current.onCopyRecipe(node.id)) return;
    if ((event.ctrlKey || event.metaKey) && movable) { inputState.groupSelection.clear(); scene.propsRef.current.onClonePlacement(node.kind); return; }
    // The body can win Pixi hit testing over an enlarged socket. Resolve
    // nearby sockets before starting a machine move, including inside edges.
    if (event.target === jointMoveHandle) inputState.controlHover.press(node.id);
    const nearby = event.target === jointMoveHandle ? undefined : socketAt(event.global.x, event.global.y);
    if (nearby) { beginPortDrag(nearby, event); return; }
    if (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && roadTravelDestination(scene.propsRef.current.engine.getState(),node.id)) inputState.roadBodyPress={nodeId:node.id,sectorId:scene.propsRef.current.engine.getSector().id,x:event.global.x,y:event.global.y};
    else inputState.roadTravelClicks.clear();
    const sector = scene.propsRef.current.engine.getSector();
    const existing = scene.propsRef.current.selectedIds;
    const selectedIds = !movable || node.kind === 'road' || node.kind === 'fluidRoad' ? [node.id] : inputState.groupSelection.press(node.id, existing, sector.controlGroups ?? [], event.global, performance.now(), event.shiftKey, event.detail);
    scene.propsRef.current.onSelect(selectedIds, { source: 'node', individual: inputState.groupSelection.individualId === node.id, priority: inputState.groupSelection.priorityIds.length > 0 }); scene.propsRef.current.onConnectionSelect(undefined); if (!movable) { inputState.groupSelection.clear(); return; } const origins = new Map<string, { x: number; y: number }>();
    const movableIds = sector.nodes.filter((candidate) => selectedIds.includes(candidate.id) && isPlayerMovableNode(candidate.kind, scene.propsRef.current.engine.getState(), candidate) && !candidate.disabled).map((candidate) => candidate.id);
    scene.propsRef.current.engine.getSector().nodes.filter((candidate) => movableIds.includes(candidate.id)).forEach((candidate) => origins.set(candidate.id, { x: candidate.x, y: candidate.y })); inputState.dragPointer = { x: event.global.x, y: event.global.y }; inputState.drag = { ids: movableIds, anchorId: node.id, anchorSize: getNodeSize(node), start: toWorld(event.global.x, event.global.y), origins, moved: false, valid: true };
  };
  const nodePointerUp = (node: MachineNode, event: FederatedPointerEvent) => {
    if (event.button === 0 && inputState.drag?.ids.includes(node.id) && !inputState.drag.moved && getNodeModule(node.kind, node).controls.configuration === 'research') {
      scene.propsRef.current.onConfigure(node.id);
    }
    if (event.button === 2) {
      const press = inputState.rightPress; inputState.rightPress = undefined;
      if (press?.id === node.id && !press.moved && Math.hypot(event.global.x - press.x, event.global.y - press.y) <= 4) {
        inputState.panning = undefined; scene.clearTooltip();
        scene.propsRef.current.onNodeContextMenu(node.id, inputState.groupSelection.priorityIds.includes(node.id), event.shiftKey);
        event.stopPropagation();
      }
    }
  };
  const install = (app: Application, resources: PlayfieldResources) => {
    const inputResources = new PlayfieldResources(); resources.add(() => inputResources.dispose());
    const placePaste = (event: FederatedPointerEvent) => {
      const { onPaste } = scene.propsRef.current;
      if (!onPaste || event.button !== 0 || inputState.spaceHeld) return false;
      event.preventDefault();
      event.stopPropagation();
      scene.clearTooltip();
      if (event.global.y >= scene.viewport.top) onPaste(scene.pasteAnchor(event.global.x, event.global.y));
      return true;
    };
    const stageInput1 = (event: FederatedPointerEvent) => {
      if (placePaste(event)) return;
      for (let target = event.target as Container | null; target; target = target.parent) { if (target.label === 'node-control' || target.label === 'joint-move-handle') return; }
      if (!scene.propsRef.current.placing && event.button === 0 && !inputState.spaceHeld) {
        const handle = socketAt(event.global.x, event.global.y);
        if (handle) { beginPortDrag(handle, event); return; }
      }
      const active = scene.propsRef.current.placing;
      if (!active || event.button !== 0 || inputState.spaceHeld) return;
      event.preventDefault(); event.stopPropagation();
      const point = toWorld(event.global.x, event.global.y);
      scene.propsRef.current.onPlace(active, point.x, point.y, event.ctrlKey || event.metaKey || event.shiftKey);
    };
    app.stage.on('pointerdowncapture', stageInput1);
    inputResources.add(() => app.stage.off('pointerdowncapture', stageInput1));
    const stageInput2 = (event: FederatedPointerEvent) => {
      inputState.roadBodyPress=undefined; inputState.roadTravelClicks.clear();
      if (event.defaultPrevented || placePaste(event)) return; scene.clearTooltip(); if (event.button === 1 || event.button === 2 || (event.button === 0 && inputState.spaceHeld)) { inputState.panning = { x: event.global.x, y: event.global.y, cameraX: scene.camera.x, cameraY: scene.camera.y }; return; } if (event.button !== 0) return;
      const active = scene.propsRef.current.placing; const point = toWorld(event.global.x, event.global.y); if (active) { scene.propsRef.current.onPlace(active, point.x, point.y, event.ctrlKey || event.metaKey || event.shiftKey); return; }
      const baseSelection = event.shiftKey ? [...scene.propsRef.current.selectedIds] : [];
      scene.propsRef.current.onConnectionSelect(undefined); scene.propsRef.current.onSelect(baseSelection); const graphic = new Graphics(); scene.overlay.addChild(graphic); inputState.marquee = { startX: event.global.x, startY: event.global.y, graphic, baseSelection, previewIds: new Set() };
    };
    app.stage.on('pointerdown', stageInput2);
    inputResources.add(() => app.stage.off('pointerdown', stageInput2));
    const updateDragAt = (point: { x: number; y: number }) => {
      inputState.previewPoint = { x: point.x, y: point.y };
      if (inputState.connectionDrag) {
        if (Math.hypot(point.x - inputState.connectionDrag.startX, point.y - inputState.connectionDrag.startY) > 4) inputState.connectionDrag.moved = true;
        const snapped = findNearbyCompatiblePort(point.x, point.y); updateSnappedPort(snapped);
        const snappedPoint = snapped ? portScreenPoint(snapped) : undefined; if (snappedPoint) inputState.previewPoint = snappedPoint;
      }
      if (inputState.drag) { const now = toWorld(point.x, point.y); const dx = now.x - inputState.drag.start.x; const dy = now.y - inputState.drag.start.y; if (Math.abs(dx) + Math.abs(dy) > 2) { inputState.drag.moved = true; scene.clearTooltip(); }
        const sector = scene.propsRef.current.engine.getSector(); const desired = draggedNodePositions(inputState.drag.origins, inputState.drag.anchorId, { x: dx, y: dy }, scene.propsRef.current.snapToGrid && inputState.drag.moved, inputState.drag.anchorSize);
        const engine = scene.propsRef.current.engine;
        const road = inputState.drag.moved && inputState.drag.ids.length === 1 ? engine.getRoadMovePreview(inputState.drag.anchorId, desired[inputState.drag.anchorId]) : undefined;
        if (road) desired[inputState.drag.anchorId] = { x: road.node.x, y: road.node.y };
        inputState.drag.road = road?.road;
        inputState.drag.desired = desired; scene.propsRef.current.onDragPreview?.(desired); inputState.drag.valid = road?.valid ?? engine.canMoveNodesTo(desired);
        scene.previewDrag(sector, desired, inputState.drag);
      }
    };
    const stageInput3 = (event: FederatedPointerEvent) => {
      if (inputState.rightPress && Math.hypot(event.global.x - inputState.rightPress.x, event.global.y - inputState.rightPress.y) > 4) inputState.rightPress.moved = true;
      inputState.placementPointerInside = true; inputState.placementCursor = { x: event.global.x, y: event.global.y }; if (scene.propsRef.current.placing || scene.propsRef.current.onPaste) scene.clearTooltip(); inputState.previewPoint = { x: event.global.x, y: event.global.y }; if (inputState.panning) { scene.camera.x = inputState.panning.cameraX + event.global.x - inputState.panning.x; scene.camera.y = inputState.panning.cameraY + event.global.y - inputState.panning.y; scene.updateCamera(); }
      inputState.dragPointer = { x: event.global.x, y: event.global.y };
      updateDragAt(inputState.dragPointer);
      if (inputState.marquee) { const x = Math.min(inputState.marquee.startX, event.global.x); const y = Math.min(inputState.marquee.startY, event.global.y); const width = Math.abs(event.global.x - inputState.marquee.startX); const height = Math.abs(event.global.y - inputState.marquee.startY); inputState.marquee.graphic.clear().rect(x, y, width, height).fill({ color: THEME.selected, alpha: .1 }).stroke({ color: THEME.selected, width: 1, alpha: .92 }); inputState.marquee.previewIds = new Set(nodesInMarquee(inputState.marquee.startX, inputState.marquee.startY, event.global.x, event.global.y)); scene.drawMarqueeHighlights(inputState.marquee.previewIds); }
    };
    app.stage.on('pointermove', stageInput3);
    inputResources.add(() => app.stage.off('pointermove', stageInput3));
    const pointerUp = (event: { global: { x: number; y: number }; shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; button?: number }, commitInteraction = true) => {
      const roadPress=inputState.roadBodyPress; inputState.roadBodyPress=undefined;
      const roadTap=Boolean(roadPress && commitInteraction && (event.button??0)===0 && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && !inputState.spaceHeld && !inputState.drag?.moved && !inputState.connectionDrag && !inputState.panning && Math.hypot(event.global.x-roadPress.x,event.global.y-roadPress.y)<=4);
      inputState.controlHover.release();
      if (inputState.drag?.moved && commitInteraction) updateDragAt(event.global);
      if (inputState.connectionDrag) {
        const finished = inputState.connectionDrag;
        // Pointer-up can arrive after the last move sample, especially when
        // sockets are close together. Resolve against the actual release.
        const snapped = commitInteraction ? findNearbyCompatiblePort(event.global.x, event.global.y) : undefined;
        let connected = false;
        if (snapped) {
          const active = activeHandleForTarget(finished, snapped); const { output, input } = normalizedConnection(active, snapped);
          connected = scene.propsRef.current.onConnect(output.nodeId, input.nodeId, output.index, input.index, finished.replaceConnectionId);
        }
        cancelConnectionDrag();
        if (commitInteraction && finished.moved && !connected) {
          scene.rejectConnection(finished, event.global.x, event.global.y, snapped);
          let failure = { title: 'Choose a socket', detail: 'Release the cable on an input or output socket on another node. A highlighted socket shows the destination before release.' };
          if (snapped) {
            const { output, input } = normalizedConnection(activeHandleForTarget(finished, snapped), snapped);
            failure = scene.propsRef.current.engine.getConnectionFailure(output.nodeId, output.index, input.nodeId, input.index, finished.replaceConnectionId) ?? { title: 'Connection unavailable', detail: 'Choose a different socket or route, then try again.' };
          }
          scene.propsRef.current.onConnectionRejected({ ...failure, x: event.global.x, y: event.global.y });
        }
      }
      if (inputState.panning) { inputState.panning = undefined; scene.updateCamera(); } if (inputState.drag) { const finished = inputState.drag; inputState.drag = undefined; if (commitInteraction && finished.moved && finished.valid && finished.desired) { scene.propsRef.current.engine.beginMove(); if (scene.propsRef.current.engine.tryMoveNodesTo(finished.desired)) scene.propsRef.current.engine.commitMove(); } scene.propsRef.current.onDragPreview?.(undefined); scene.renderScene(); }
      if (inputState.marquee) { const finished = inputState.marquee; if (commitInteraction) { const hits = nodesInMarquee(finished.startX, finished.startY, event.global.x, event.global.y); const ids = Array.from(new Set([...finished.baseSelection, ...hits])); const priority = event.global.x < finished.startX && event.global.y < finished.startY; inputState.groupSelection.box(ids, priority); scene.propsRef.current.onSelect(ids, { source: 'box', priority, forward: event.global.x >= finished.startX && event.global.y >= finished.startY }); } scene.drawMarqueeHighlights(new Set()); finished.graphic.destroy(); inputState.marquee = undefined; }
      if (roadPress) {
        const game=scene.propsRef.current.engine.getState(), destination=roadTravelDestination(game,roadPress.nodeId);
        if (!roadTap || scene.propsRef.current.training || scene.propsRef.current.placing || !scene.propsRef.current.onTravelToSector || game.activeSectorId!==roadPress.sectorId || !destination) inputState.roadTravelClicks.clear();
        else if (inputState.roadTravelClicks.tap(`${game.activeSectorId}:${roadPress.nodeId}`,event.global,performance.now())) scene.tryRoadTravel(roadPress.nodeId, roadPress.sectorId);
      }
    };
    const stageInput4 = (event: FederatedPointerEvent) => pointerUp(event, event.global.y >= scene.viewport.top);
    app.stage.on('pointerup', stageInput4);
    inputResources.add(() => app.stage.off('pointerup', stageInput4)); const stageInput5 = (event: FederatedPointerEvent) => pointerUp(event, event.global.y >= scene.viewport.top);
    app.stage.on('pointerupoutside', stageInput5);
    inputResources.add(() => app.stage.off('pointerupoutside', stageInput5)); const stageInput6 = (event: FederatedPointerEvent) => pointerUp(event, false);
    app.stage.on('pointercancel', stageInput6);
    inputResources.add(() => app.stage.off('pointercancel', stageInput6));
    const wheel = (event: WheelEvent) => { event.preventDefault(); const rect = app.canvas.getBoundingClientRect(); const mx = event.clientX - rect.left; const my = event.clientY - rect.top; const trackpadPan = !event.ctrlKey && event.deltaMode === 0 && (Math.abs(event.deltaX) > 0 || Math.abs(event.deltaY) < 50); if (trackpadPan) { scene.camera.x -= event.deltaX; scene.camera.y -= event.deltaY; scene.updateCamera(); return; } const before = toWorld(mx, my); scene.camera.zoom *= event.deltaY < 0 ? 1.1 : .9; scene.clampCamera(); scene.camera.x = mx - before.x * scene.camera.zoom; scene.camera.y = my - before.y * scene.camera.zoom; scene.updateCamera(); };
    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    inputResources.listen(app.canvas, 'wheel', wheel, { passive: false }); inputResources.listen(app.canvas, 'contextmenu', blockContextMenu); const keyDown = (event: KeyboardEvent) => { if (event.defaultPrevented || hasOpenDialog()) return; if (event.code === 'Space' && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable))) { inputState.spaceHeld = true; event.preventDefault(); } if (event.code === 'Escape' && inputState.connectionDrag) cancelConnectionDrag(); }; const keyUp = (event: KeyboardEvent) => { if (event.code === 'Space') inputState.spaceHeld = false; };
    const cancelLostInteractions = () => {
      inputState.roadBodyPress=undefined; inputState.roadTravelClicks.clear();
      inputState.placementPointerInside = false;
      scene.syncPlacementPreview();
      inputState.controlHover.clear();
      inputState.rightPress = undefined;
      inputState.spaceHeld = false;
      scene.clearConnectionRejection();
      if (inputState.connectionDrag) cancelConnectionDrag();
      if (inputState.panning) { inputState.panning = undefined; scene.updateCamera(); }
      if (inputState.drag) { inputState.drag = undefined; scene.propsRef.current.onDragPreview?.(undefined); scene.renderScene(); }
      if (inputState.marquee) { scene.drawMarqueeHighlights(new Set()); inputState.marquee.graphic.destroy(); inputState.marquee = undefined; }
    };
    const releaseGlobalInteractions = (event: PointerEvent) => {
      if (!inputState.connectionDrag && !inputState.panning && !inputState.drag && !inputState.marquee) return;
      const rect = app.canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
      const insideCanvas = x >= 0 && y >= scene.viewport.top && x <= rect.width && y <= rect.height;
      pointerUp({ global: { x, y }, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, button: event.button }, insideCanvas);
    };
    inputResources.listen(window, 'keydown', keyDown); inputResources.listen(window, 'keyup', keyUp); inputResources.listen(window, 'pointerup', releaseGlobalInteractions); inputResources.listen(window, 'pointercancel', cancelLostInteractions); inputResources.listen(window, 'blur', cancelLostInteractions);
    const pointerEnter = (event: PointerEvent) => {
      const rect = app.canvas.getBoundingClientRect();
      inputState.placementPointerInside = true;
      inputState.placementCursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const pointerLeave = () => { inputState.controlHover.clear(); inputState.hoveredNodeId = undefined; inputState.placementPointerInside = false; scene.clearTooltip(); scene.propsRef.current.onHoverNode?.(); scene.syncPlacementPreview(); };
    inputResources.listen(app.canvas, 'pointerenter', pointerEnter); inputResources.listen(app.canvas, 'pointerleave', pointerLeave);

    return { updateDragAt };
  };
  return { toWorld, portKey, portScreenPoint, normalizedConnection, canSelectNode, socketAt, activeHandleForTarget, findNearbyCompatiblePort, updateSnappedPort, cancelConnectionDrag, beginPortDrag, nodesInMarquee, nodePointerDown, nodePointerUp, install };
}
