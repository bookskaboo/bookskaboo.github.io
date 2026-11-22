import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Application, FederatedPointerEvent } from 'pixi.js';
import { createPlayfieldInteractions, createPlayfieldInteractionState } from './playfieldInteractions';
import { PlayfieldResources } from './playfieldResources';
import type { PixiPlayfieldProps, PortView } from './playfieldTypes';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { getNodeSize } from '../domain/nodeGeometry';
import type { GameEngine } from '../simulation/engine';

class Stage {
  handlers = new Map<string, Set<(event: FederatedPointerEvent) => void>>();
  on(type: string, handler: (event: FederatedPointerEvent) => void) { const set = this.handlers.get(type) ?? new Set(); set.add(handler); this.handlers.set(type, set); }
  off(type: string, handler: (event: FederatedPointerEvent) => void) { this.handlers.get(type)?.delete(handler); }
  emit(type: string, event: FederatedPointerEvent) { this.handlers.get(type)?.forEach(handler => handler(event)); }
  get count() { return [...this.handlers.values()].reduce((n, set) => n + set.size, 0); }
}
function fixture() {
  const targetWindow = new EventTarget(); vi.stubGlobal('window', targetWindow);
  const source = tutorialNode('woodenChest', 'source', 400, 400);
  const target = tutorialNode('warehouse', 'target', 1000, 400);
  const engine = { beginMove: vi.fn(), tryMoveNodesTo: vi.fn(() => true), commitMove: vi.fn() } as unknown as GameEngine;
  const propsRef = { current: { engine, selectedIds: [], onConnect: vi.fn(() => true), onDragPreview: vi.fn(), onPlace: vi.fn(), onPaste: undefined } as unknown as PixiPlayfieldProps };
  const camera = { x: 10, y: 20, zoom: 1 };
  const ports = new Map<string, PortView>([['target:input:0', { nodeId: target.id, direction: 'input', index: 0, root: { scale: { x: 1 } } } as PortView]]);
  const scene: Parameters<typeof createPlayfieldInteractions>[1] = {
    propsRef, camera, viewport: { width: 1280, height: 720, top: 80 }, nodes: new Map([[source.id, source], [target.id, target]]), ports,
    overlay: undefined!, clearTooltip: vi.fn(), clearConnectionRejection: vi.fn(), clearConnectionPreview: vi.fn(), rejectConnection: vi.fn(),
    drawMarqueeHighlights: vi.fn(), updateCamera: vi.fn(), clampCamera: vi.fn(), renderScene: vi.fn(), syncPlacementPreview: vi.fn(),
    pasteAnchor: vi.fn(() => ({ x: 700, y: 500 })), tryRoadTravel: vi.fn(), previewDrag: vi.fn(),
  };
  const state = createPlayfieldInteractionState(), controller = createPlayfieldInteractions(state, scene), resources = new PlayfieldResources();
  const stage = new Stage(), canvas = Object.assign(new EventTarget(), { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }) });
  controller.install({ stage, canvas } as unknown as Application, resources);
  const event = (x = 800, y = 400) => ({ button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    global: { x, y }, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as FederatedPointerEvent);
  return { source, target, targetWindow, propsRef, camera, scene, state, controller, resources, stage, event, engine };
}
afterEach(() => vi.unstubAllGlobals());

describe('playfield input coordination', () => {
  it('uses current camera transforms and semantic socket indexes', () => {
    const f = fixture(), handle = { nodeId: f.target.id, direction: 'input' as const, index: 0 };
    const first = f.controller.portScreenPoint(handle)!;
    expect(f.controller.socketAt(first.x, first.y)).toMatchObject(handle);
    f.camera.zoom = 0.5; f.camera.x += 100;
    const second = f.controller.portScreenPoint(handle)!;
    expect(second).not.toEqual(first);
    expect(f.controller.socketAt(second.x, second.y)).toMatchObject(handle);
    f.resources.dispose();
  });
  it('resolves a release against current props rather than a captured connection callback', () => {
    const f = fixture(), original = f.propsRef.current.onConnect, current = vi.fn(() => true);
    f.propsRef.current = { ...f.propsRef.current, onConnect: current };
    f.state.connectionDrag = { originNodeId: f.source.id, active: { nodeId: f.source.id, direction: 'output', index: 0 }, startX: 400, startY: 400, moved: true, adaptiveJointDirection: false };
    const point = f.controller.portScreenPoint({ nodeId: f.target.id, direction: 'input', index: 0 })!;
    f.stage.emit('pointerup', f.event(point.x, point.y));
    expect(current).toHaveBeenCalledWith(f.source.id, f.target.id, 0, 0, undefined);
    expect(original).not.toHaveBeenCalled(); expect(f.state.connectionDrag).toBeUndefined();
    expect(f.scene.clearConnectionPreview).toHaveBeenCalled(); f.resources.dispose();
  });
  it('cancels drag/connection work without committing and removes stage/global listeners on dispose', () => {
    const f = fixture();
    const drag = { ids: [f.source.id], anchorId: f.source.id, anchorSize: getNodeSize(f.source), start: { x: 0, y: 0 },
      origins: new Map([[f.source.id, { x: 400, y: 400 }]]), moved: true, valid: true, desired: { [f.source.id]: { x: 500, y: 500 } } };
    f.state.drag = drag; f.stage.emit('pointercancel', f.event());
    expect(f.engine.beginMove).not.toHaveBeenCalled(); expect(f.state.drag).toBeUndefined();
    f.state.drag = drag; f.targetWindow.dispatchEvent(new Event('blur'));
    expect(f.state.drag).toBeUndefined(); expect(f.stage.count).toBe(6);
    f.resources.dispose(); expect(f.stage.count).toBe(0);
    f.state.drag = drag; f.targetWindow.dispatchEvent(new Event('blur'));
    expect(f.state.drag).toBe(drag);
  });
  it('retains paste priority ahead of node placement in capture handling', () => {
    const f = fixture(), paste = vi.fn(); f.propsRef.current = { ...f.propsRef.current, onPaste: paste, placing: 'joint' };
    f.stage.emit('pointerdowncapture', f.event());
    expect(paste).toHaveBeenCalledWith({ x: 700, y: 500 });
    expect(f.propsRef.current.onPlace).not.toHaveBeenCalled(); f.resources.dispose();
  });
});
