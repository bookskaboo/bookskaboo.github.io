import type { CameraState, MachineNode } from '../domain/types';
import { getNodeSize } from '../domain/nodeGeometry';
import { cameraViewport, type FieldViewport } from '../domain/camera';

/** Fresh games only: reserve the top navigation and bottom shortcut row. */
export function startingCamera(nodes: MachineNode[], viewport: FieldViewport): CameraState {
  if (!nodes.length) return { x: 0, y: 0, zoom: .55 };
  const left = Math.min(...nodes.map(n => n.x - getNodeSize(n).w / 2));
  const right = Math.max(...nodes.map(n => n.x + getNodeSize(n).w / 2));
  const top = Math.min(...nodes.map(n => n.y - getNodeSize(n).h / 2));
  const bottom = Math.max(...nodes.map(n => n.y + getNodeSize(n).h / 2));
  const screenTop = Math.max(110, cameraViewport(viewport).y);
  const zoom = Math.max(.25, Math.min(.65, (viewport.width - 96) / (right - left), (viewport.height - screenTop - 100) / (bottom - top)));
  return { x: 48 - left * zoom, y: screenTop - top * zoom, zoom };
}
