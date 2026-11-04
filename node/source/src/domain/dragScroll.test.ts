import { describe, expect, it } from 'vitest';
import { cameraViewport, clampFieldCamera, scrollCameraForDrag, sectorOverviewCamera } from './camera';

const world = { width: 4000, height: 4000 };
const viewport = { width: 1200, height: 800 };
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
});
