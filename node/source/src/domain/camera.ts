import type { CameraState } from './types';

export const DEFAULT_MIN_CAMERA_ZOOM = .25;

export interface FieldViewport { width: number; height: number; top: number }

/** Zoom-out room for exterior controls; the playable field remains unchanged. */
export function exteriorFieldOverviewSize(worldSize: {width:number;height:number}) {
  return {width:worldSize.width*2,height:worldSize.height*2};
}

/** The drawable field starts below the toolbar, with room for the map border. */
export function cameraViewport(viewport: FieldViewport) {
  const top = viewport.top + 6;
  return { x: 18, y: top, width: Math.max(1, viewport.width - 36), height: Math.max(1, viewport.height - top - 18) };
}

/** Fit the entire field; also supplies the initial center for a newly visited map. */
export function sectorOverviewCamera(worldSize: { width: number; height: number }, viewport: FieldViewport): CameraState {
  const usable = cameraViewport(viewport);
  const zoom = Math.min(DEFAULT_MIN_CAMERA_ZOOM, usable.width / worldSize.width, usable.height / worldSize.height);
  return {
    x: usable.x + (usable.width - worldSize.width * zoom) / 2,
    y: usable.y + (usable.height - worldSize.height * zoom) / 2,
    zoom,
  };
}

/** Keep the overview reachable without recentering an already valid saved view. */
export function clampFieldCamera(camera: CameraState, worldSize: { width: number; height: number }, viewport: FieldViewport, overviewSize = worldSize): CameraState {
  const usable = cameraViewport(viewport);
  const zoom = Math.max(sectorOverviewCamera(overviewSize, viewport).zoom, Math.min(2.2, camera.zoom));
  const clampAxis = (value: number, start: number, visible: number, field: number, maxGutter: number) => {
    const opposite = start + visible - field;
    const gutter = Math.min(maxGutter, visible / 2, field / 2);
    return Math.min(Math.max(start, opposite) + gutter, Math.max(Math.min(start, opposite) - gutter, value));
  };
  return {
    zoom,
    x: clampAxis(camera.x, usable.x, usable.width, worldSize.width * zoom, 360),
    y: clampAxis(camera.y, usable.y, usable.height, worldSize.height * zoom, 300),
  };
}

/** Carry zoom between maps, retaining a visited destination's world-space center. */
export function sectorTravelCamera(zoom: number, worldSize: { width: number; height: number }, viewport: FieldViewport, savedCamera?: CameraState, overviewSize = worldSize): CameraState {
  const usable = cameraViewport(viewport);
  const base = savedCamera ?? sectorOverviewCamera(worldSize, viewport);
  const centerX = usable.x + usable.width / 2, centerY = usable.y + usable.height / 2;
  return clampFieldCamera({
    zoom,
    x: centerX - (centerX - base.x) / base.zoom * zoom,
    y: centerY - (centerY - base.y) / base.zoom * zoom,
  }, worldSize, viewport, overviewSize);
}

/** Bring a specific world point into focus at the existing zoom, within field bounds. */
export function focusedFieldCamera(zoom: number, point: {x:number;y:number}, worldSize: {width:number;height:number}, viewport: FieldViewport, overviewSize=worldSize): CameraState {
  const usable=cameraViewport(viewport);
  return clampFieldCamera({zoom,x:usable.x+usable.width/2-point.x*zoom,y:usable.y+usable.height/2-point.y*zoom},worldSize,viewport,overviewSize);
}

/** Reveal more of a zoomed map while a dragged node or cable nears an edge. */
export function scrollCameraForDrag(camera: CameraState, worldSize: { width: number; height: number }, viewport: FieldViewport, pointer: { x: number; y: number }, deltaMs: number, overviewSize = worldSize): CameraState {
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
  return clampFieldCamera({ ...camera, x: camera.x - dx, y: camera.y - dy }, worldSize, viewport, overviewSize);
}
