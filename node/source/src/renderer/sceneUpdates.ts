import type { CameraState, MachineNode } from '../domain/types';
import { getNodeSize } from '../domain/nodeGeometry';
import type { FieldViewport } from '../domain/camera';

export interface ViewIdentity { key: string; source: unknown }
export interface RendererDiagnostics {
  nodesCreated: number; nodesDestroyed: number; particleObjectsCreated: number;
  visibleNodes: number; totalNodes: number; activeParticles: number; pooledParticles: number;
}

/** Retain object identity unless its drawing or event-handler source changes. */
export function reconcileViews<T>(views: Map<string, T>, identities: Map<string, ViewIdentity>, next: Map<string, ViewIdentity>, create: (id: string) => T | undefined, dispose: (view: T, id: string) => void) {
  for (const [id, view] of views) {
    const previous = identities.get(id), current = next.get(id);
    if (current && previous?.key === current.key && previous.source === current.source) continue;
    dispose(view, id); views.delete(id); identities.delete(id);
  }
  for (const [id, identity] of next) {
    if (views.has(id)) continue;
    const view = create(id);
    if (view) { views.set(id, view); identities.set(id, identity); }
  }
}

/** Mutable stock and progress do not change a node's static drawing. */
export function nodeDrawingKey(node: MachineNode) {
  return [node.kind, node.name, node.recipeId, node.rotation, node.tributeItem, node.tributeCampId, node.golemMineral,
    node.filterItem, node.filterOutputPort, node.roadMode, node.roadFacing, node.inputPortOrder?.join('.'),
    node.outputPortOrder?.join('.'), node.outputRowOffset, node.connectorsMirrored, node.disabled, node.protected,
    node.campStrength, node.obstructionRadius, node.obstructionMaxRadius, node.obstructionWidth, node.obstructionHeight,
    node.infiniteResource, node.resourceItem, node.cornerType, node.cornerCampQuadrant].join(':');
}

export interface CableBounds { left: number; right: number; top: number; bottom: number }
export function boundsOnScreen(bounds: CableBounds, camera: CameraState, viewport: FieldViewport) {
  return camera.x + bounds.right * camera.zoom >= -40 && camera.x + bounds.left * camera.zoom <= viewport.width + 40
    && camera.y + bounds.bottom * camera.zoom >= viewport.top - 40 && camera.y + bounds.top * camera.zoom <= viewport.height + 40;
}

export function nodeOnScreen(node: MachineNode, camera: CameraState, viewport: FieldViewport, position: Pick<MachineNode, 'x' | 'y'> = node) {
  const size = getNodeSize(node);
  // Screen-space padding retains sockets, labels, arrival glows and drag handles.
  const padding = 100;
  const x = camera.x + position.x * camera.zoom, y = camera.y + position.y * camera.zoom;
  return x + size.w * camera.zoom / 2 >= -padding && x - size.w * camera.zoom / 2 <= viewport.width + padding
    && y + size.h * camera.zoom / 2 >= viewport.top - padding && y - size.h * camera.zoom / 2 <= viewport.height + padding;
}

export function showNodeDetails(zoom: number, important: boolean) { return important || zoom >= .4; }

/** Honor display density without forcing a 4x pixel workload on 1x displays. */
export function playfieldResolution(pixelRatio: number) { return Math.min(2, Math.max(1, pixelRatio || 1)); }
