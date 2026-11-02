import type { CameraState, MachineNode } from '../domain/types';
import { getNodeSize } from '../domain/nodeGeometry';

/** Fresh games only: reserve the top navigation and bottom shortcut row. */
export function startingCamera(nodes: MachineNode[], width: number, height: number): CameraState {
  if (!nodes.length) return { x: 0, y: 0, zoom: .55 };
  const left = Math.min(...nodes.map(n => n.x - getNodeSize(n).w / 2));
  const right = Math.max(...nodes.map(n => n.x + getNodeSize(n).w / 2));
  const top = Math.min(...nodes.map(n => n.y - getNodeSize(n).h / 2));
  const bottom = Math.max(...nodes.map(n => n.y + getNodeSize(n).h / 2));
  const zoom = Math.max(.25, Math.min(.65, (width - 96) / (right - left), (height - 210) / (bottom - top)));
  return { x: 48 - left * zoom, y: 110 - top * zoom, zoom };
}
