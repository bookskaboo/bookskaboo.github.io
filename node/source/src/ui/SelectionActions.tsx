import type { CameraState, MachineNode } from '../domain/types';
import { getNodeSize } from '../domain/nodeGeometry';
import { canDeleteNode } from '../renderer/playfieldNodeState';
import type { ViewportSize } from './responsiveLayout';

export function selectionScreenBounds(nodes: readonly MachineNode[], camera: CameraState) {
  if (nodes.length < 2) return undefined;
  const boxes = nodes.map(node => {
    const { w, h } = getNodeSize(node);
    return { left: (node.x - w / 2) * camera.zoom + camera.x, right: (node.x + w / 2) * camera.zoom + camera.x, top: (node.y - h / 2) * camera.zoom + camera.y, bottom: (node.y + h / 2) * camera.zoom + camera.y };
  });
  return { left: Math.min(...boxes.map(box => box.left)) - 8, right: Math.max(...boxes.map(box => box.right)) + 8, top: Math.min(...boxes.map(box => box.top)) - 8, bottom: Math.max(...boxes.map(box => box.bottom)) + 8 };
}

export function SelectionActions({ nodes, camera, viewport, dockHeight, onDelete }: { nodes: MachineNode[]; camera: CameraState; viewport: ViewportSize; dockHeight: number; onDelete(): void }) {
  const bounds = selectionScreenBounds(nodes, camera);
  if (!bounds) return null;
  const count = nodes.filter(canDeleteNode).length;
  const x = Math.max(32, Math.min(viewport.width - 32, bounds.right));
  const y = Math.max(viewport.width <= 720 ? 100 : 104, Math.min(viewport.height - dockHeight - 28, bounds.top));
  return <div className="selected-nodes-actions" style={{ left: bounds.left, top: bounds.top, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top }}>
    <button type="button" className="selection-delete-button" disabled={!count} aria-label={`Delete ${count} selected node${count === 1 ? '' : 's'}`} style={{ left: x - bounds.left, top: y - bounds.top }}
      data-tooltip="Delete selected nodes" data-tooltip-detail={count ? `Delete ${count} selected nodes and their attached cables. One decision, several vacancies.` : 'This selection cannot be deleted.'}
      onPointerDown={event => { event.preventDefault(); event.stopPropagation(); }} onClick={event => { event.stopPropagation(); onDelete(); }}>
      <svg viewBox="0 0 18 20" width="15" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5h14M6 5V2h6v3M4 5l1 13h8l1-13M7 8v7M11 8v7" /></svg><span>{count}</span>
    </button>
  </div>;
}
