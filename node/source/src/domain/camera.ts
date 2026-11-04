import type { CameraState } from './types';

export const DEFAULT_MIN_CAMERA_ZOOM = .25;

/** Match the navigation's desktop/compact clearance, with a small field margin. */
export function cameraViewport(viewport: { width: number; height: number }) {
  const top = viewport.width <= 720 ? 82 : 94;
  return { x: 18, y: top, width: Math.max(1, viewport.width - 36), height: Math.max(1, viewport.height - top - 18) };
}

/** First-entry overview; later travel restores the sector's saved camera. */
export function sectorOverviewCamera(worldSize: { width: number; height: number }, viewport: { width: number; height: number }): CameraState {
  const usable = cameraViewport(viewport);
  const zoom = Math.min(DEFAULT_MIN_CAMERA_ZOOM, usable.width / worldSize.width, usable.height / worldSize.height);
  return {
    x: usable.x + (usable.width - worldSize.width * zoom) / 2,
    y: usable.y + (usable.height - worldSize.height * zoom) / 2,
    zoom,
  };
}

/** Keep the overview reachable without recentering an already valid saved view. */
export function clampFieldCamera(camera: CameraState, worldSize: { width: number; height: number }, viewport: { width: number; height: number }): CameraState {
  const usable = cameraViewport(viewport);
  const zoom = Math.max(sectorOverviewCamera(worldSize, viewport).zoom, Math.min(2.2, camera.zoom));
  const scaledWidth = worldSize.width * zoom;
  const scaledHeight = worldSize.height * zoom;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  return {
    zoom,
    x: scaledWidth <= usable.width + 1e-6
      ? clamp(camera.x, usable.x, usable.x + usable.width - scaledWidth)
      : clamp(camera.x, viewport.width - scaledWidth - 90, 90),
    y: scaledHeight <= usable.height + 1e-6
      ? clamp(camera.y, usable.y, usable.y + usable.height - scaledHeight)
      : clamp(camera.y, viewport.height - scaledHeight - 90, 90),
  };
}

/** Reveal more of a zoomed map while a dragged node or cable nears an edge. */
export function scrollCameraForDrag(camera: CameraState, worldSize: { width: number; height: number }, viewport: { width: number; height: number }, pointer: { x: number; y: number }, deltaMs: number): CameraState {
  const usable = cameraViewport(viewport);
  const direction = (position: number, start: number, length: number) => {
    const edge = Math.min(64, length / 4);
    if (position < start || position > start + length) return 0;
    if (position < start + edge) return -(((start + edge - position) / edge) ** 2);
    if (position > start + length - edge) return ((position - (start + length - edge)) / edge) ** 2;
    return 0;
  };
  const distance = 720 * Math.max(0, Math.min(50, deltaMs)) / 1000;
  const dx = worldSize.width * camera.zoom > usable.width ? direction(pointer.x, usable.x, usable.width) * distance : 0;
  const dy = worldSize.height * camera.zoom > usable.height ? direction(pointer.y, usable.y, usable.height) * distance : 0;
  return clampFieldCamera({ ...camera, x: camera.x - dx, y: camera.y - dy }, worldSize, viewport);
}
