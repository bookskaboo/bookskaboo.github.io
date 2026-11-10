import { describe, expect, it } from 'vitest';
import { cameraViewport, clampFieldCamera, scrollCameraForDrag, sectorOverviewCamera } from './camera';

const world = { width: 4000, height: 4000 };
const viewport = { width: 1200, height: 800, top: 94 };
const camera = { x: -800, y: -800, zoom: 1 };
const usable = cameraViewport(viewport);
const middle = { x: 600, y: 400 };

describe('drag edge scrolling', () => {
  it('leaves the camera still away from edges and when the entire map fits', () => {
    expect(scrollCameraForDrag(camera, world, viewport, middle, 16)).toEqual(camera);
    const overview = sectorOverviewCamera(world, viewport);
    expect(scrollCameraForDrag(overview, world, viewport, { x: usable.x + 1, y: usable.y + 1 }, 16)).toEqual(overview);
  });

  it.each([
    ['left', { x: usable.x + 1, y: 400 }, 'x', 1],
    ['right', { x: usable.x + usable.width - 1, y: 400 }, 'x', -1],
    ['top', { x: 600, y: usable.y + 1 }, 'y', 1],
    ['bottom', { x: 600, y: usable.y + usable.height - 1 }, 'y', -1],
  ] as const)('reveals more map toward the %s edge', (_, pointer, axis, sign) => {
    const next = scrollCameraForDrag(camera, world, viewport, pointer, 16);
    expect(Math.sign(next[axis] - camera[axis])).toBe(sign);
    expect(next.zoom).toBe(camera.zoom);
  });

  it('speeds up nearer an edge and uses elapsed frame time', () => {
    const near = { x: usable.x + usable.width - 1, y: 400 };
    const far = { ...near, x: near.x - 40 };
    expect(Math.abs(scrollCameraForDrag(camera, world, viewport, near, 16).x - camera.x))
      .toBeGreaterThan(Math.abs(scrollCameraForDrag(camera, world, viewport, far, 16).x - camera.x));
    const once = scrollCameraForDrag(camera, world, viewport, near, 32);
    const twice = scrollCameraForDrag(scrollCameraForDrag(camera, world, viewport, near, 16), world, viewport, near, 16);
    expect(once.x).toBeCloseTo(twice.x);
  });

  it('stops at map limits and ignores pointers outside the usable field', () => {
    const limit = clampFieldCamera({ x: -10000, y: -10000, zoom: 1 }, world, viewport);
    expect(scrollCameraForDrag(limit, world, viewport, { x: usable.x + usable.width - 1, y: usable.y + usable.height - 1 }, 16)).toEqual(limit);
    expect(scrollCameraForDrag(camera, world, viewport, { x: -10, y: -10 }, 16)).toEqual(camera);
  });

  it.each([84, 132])('pans past the top map border below a %ipx toolbar clearance at maximum zoom', (top) => {
    const layout = { ...viewport, top };
    const limit = clampFieldCamera({ ...camera, y: 10000, zoom: 2.2 }, world, layout);
    const pointer = { x: middle.x, y: top + 7 };
    expect(limit.y).toBe(top + 6 + 300);
    const approaching = { ...limit, y: limit.y - 10 };
    expect(scrollCameraForDrag(approaching, world, layout, pointer, 50)).toEqual(limit);
    expect(scrollCameraForDrag(approaching, world, layout, { ...pointer, y: top - 1 }, 50)).toEqual(approaching);
  });

  it.each([.25, 1, 2.2])('allows a gutter beyond every wall at %s zoom', (zoom) => {
    const field = { width: 1200, height: 960 };
    const upper = clampFieldCamera({ x: 10000, y: 10000, zoom }, field, viewport);
    const lower = clampFieldCamera({ x: -10000, y: -10000, zoom }, field, viewport);
    expect(upper.x).toBeGreaterThan(usable.x + 100);
    expect(upper.y).toBeGreaterThan(usable.y + 100);
    expect(lower.x + field.width * zoom).toBeLessThan(usable.x + usable.width - 100);
    expect(lower.y + field.height * zoom).toBeLessThan(usable.y + usable.height - 100);
    expect(upper.x).toBeLessThan(usable.x + usable.width);
    expect(upper.y).toBeLessThan(usable.y + usable.height);
    expect(lower.x + field.width * zoom).toBeGreaterThan(usable.x);
    expect(lower.y + field.height * zoom).toBeGreaterThan(usable.y);
  });

  it('can zoom out to fit the field and its Road preview when given a larger overview', () => {
    const field = { width: 3600, height: 2600 };
    const overview = { width: 5448, height: 3948 };
    const requested = { ...camera, zoom: .001 };
    const normal = clampFieldCamera(requested, field, viewport);
    const withPreview = clampFieldCamera(requested, field, viewport, overview);
    expect(withPreview.zoom).toBeLessThan(normal.zoom);
    expect(overview.width * withPreview.zoom).toBeLessThanOrEqual(usable.width);
    expect(overview.height * withPreview.zoom).toBeLessThanOrEqual(usable.height);
  });
});
