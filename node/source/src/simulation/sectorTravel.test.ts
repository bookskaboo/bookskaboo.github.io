import { describe, expect, it } from 'vitest';
import { cameraViewport, clampFieldCamera, DEFAULT_MIN_CAMERA_ZOOM, sectorOverviewCamera } from '../domain/camera';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getSectorWorldSize } from './worldGeneration';

describe('first-entry sector overview', () => {
  it('fits the whole field below navigation at the furthest zoom across viewport and expanded field sizes', () => {
    for (const [x, y] of [[6, 5], [8, 5], [0, 0]]) {
      for (const [width, height] of [[640, 720], [800, 600], [1280, 720], [1920, 1080]]) {
        for (const research of [[], ['areaExpansion2']]) {
          const world = getSectorWorldSize({ x, y }, research);
          const viewport = { width, height };
          const usable = cameraViewport(viewport);
          const camera = clampFieldCamera(sectorOverviewCamera(world, viewport), world, viewport);
          expect(camera.zoom).toBeLessThanOrEqual(DEFAULT_MIN_CAMERA_ZOOM);
          expect(camera.x).toBeGreaterThanOrEqual(usable.x - 1e-6);
          expect(camera.y).toBeGreaterThanOrEqual(usable.y - 1e-6);
          expect(camera.x + world.width * camera.zoom).toBeLessThanOrEqual(width - 18 + 1e-6);
          expect(camera.y + world.height * camera.zoom).toBeLessThanOrEqual(height - 18 + 1e-6);
          expect(camera.x + world.width / 2 * camera.zoom).toBeCloseTo(usable.x + usable.width / 2);
          expect(camera.y + world.height / 2 * camera.zoom).toBeCloseTo(usable.y + usable.height / 2);
        }
      }
    }
  });

  it('lets wheel zoom reach the fitted overview and retains valid chosen views', () => {
    const world = getSectorWorldSize({ x: 6, y: 5 }, []);
    const viewport = { width: 1280, height: 720 };
    const overview = sectorOverviewCamera(world, viewport);
    expect(overview.zoom).toBeLessThan(DEFAULT_MIN_CAMERA_ZOOM);
    const zoomedOut = clampFieldCamera({ ...overview, zoom: .001 }, world, viewport);
    expect(zoomedOut.zoom).toBe(overview.zoom);
    expect(zoomedOut.y).toBeCloseTo(overview.y);
    const chosen = { x: 95.5, y: -7, zoom: .275 };
    expect(clampFieldCamera(chosen, world, viewport)).toEqual(chosen);
    const wideView = { x: 500, y: 200, zoom: .25 };
    expect(clampFieldCamera(wideView, world, { width: 1920, height: 1080 })).toEqual(wideView);
  });

  it('applies the overview only on first travel, then preserves both sector cameras and saved revisits', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const homeCamera = { ...engine.getSector().camera };
    engine.getState().research.mapPoints = 1;
    expect(engine.unlockSector(6, 5)).toBe(true);
    const outpost = engine.getState().sectors['6,5'];
    expect(outpost.visited).toBeFalsy();

    const overview = sectorOverviewCamera(getSectorWorldSize(outpost, []), { width: 1280, height: 720 });
    engine.switchSector(outpost.id, overview);
    expect(outpost.camera).toEqual(overview);
    expect(outpost.visited).toBe(true);

    const chosen = { x: -210, y: -120, zoom: .8 };
    engine.setCamera(chosen);
    engine.switchSector('5,5', overview);
    expect(engine.getSector().camera).toEqual(homeCamera);
    engine.switchSector(outpost.id, overview);
    expect(engine.getSector().camera).toEqual(chosen);

    const restored = new GameEngine(structuredClone(engine.getState()), { autosave: false });
    restored.switchSector('5,5', overview);
    restored.switchSector(outpost.id, overview);
    expect(restored.getSector().camera).toEqual(chosen);
  });

  it('retains authored tutorial views when travel supplies no overview', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const outpost = generateSector(6, 5, 204, 0);
    outpost.unlocked = true;
    outpost.camera = { x: 40, y: 100, zoom: .5 };
    engine.getState().sectors[outpost.id] = outpost;
    engine.switchSector(outpost.id);
    expect(engine.getSector().camera).toEqual({ x: 40, y: 100, zoom: .5 });
  });

  it('cannot change the active sector or camera by travelling to a locked map', () => {
    const state = createInitialState(204);
    state.sectors['6,5'] = generateSector(6, 5, 204, 0);
    const engine = new GameEngine(state, { autosave: false });
    const camera = { ...engine.getSector().camera };
    engine.switchSector('6,5', { x: 0, y: 0, zoom: DEFAULT_MIN_CAMERA_ZOOM });
    expect(engine.getSector().id).toBe('5,5');
    expect(engine.getSector().camera).toEqual(camera);
  });

  it('preserves an unlocked legacy map camera when the save predates visit tracking', () => {
    const state = createInitialState(204);
    delete state.progressionVersion;
    const outpost = generateSector(6, 5, 204, 0);
    outpost.unlocked = true;
    outpost.camera = { x: -123, y: -456, zoom: .72 };
    state.sectors[outpost.id] = outpost;
    const engine = new GameEngine(state, { autosave: false });
    engine.switchSector(outpost.id, { x: 0, y: 0, zoom: DEFAULT_MIN_CAMERA_ZOOM });
    expect(engine.getSector().camera).toEqual({ x: -123, y: -456, zoom: .72 });
  });
});
