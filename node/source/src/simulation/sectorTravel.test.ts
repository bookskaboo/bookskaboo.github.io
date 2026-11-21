import { describe, expect, it } from 'vitest';
import { cameraViewport, clampFieldCamera, DEFAULT_MIN_CAMERA_ZOOM, sectorOverviewCamera, sectorTravelCamera } from '../domain/camera';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getSectorWorldSize, getWorldFieldSize } from './worldGeneration';

it('uses the same field at Home and every tier, expanding both dimensions only with Area Expansion', () => {
  for (const sector of [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 0, y: 0 }, { x: 15, y: 15 }]) {
    expect(getSectorWorldSize(sector, [])).toEqual({ width: 3600, height: 2400 });
    expect(getSectorWorldSize(sector, ['areaExpansion1'])).toEqual({ width: 4500, height: 3000 });
    expect(getSectorWorldSize(sector, ['areaExpansion1', 'areaExpansion2'])).toEqual({ width: 5400, height: 3600 });
  }
});

it('keeps the largest old field as a shared baseline after loading and discovering farther maps', () => {
  const state = createInitialState(9);
  delete state.fieldSizeScale;
  const outer = generateSector(10, 6, state.seed, 0);
  const machine = { ...state.sectors['5,5'].nodes[0], x: 5000, y: 3100 };
  outer.nodes = [machine];
  state.sectors[outer.id] = outer;
  const engine = new GameEngine(state, { autosave: false });
  expect(getWorldFieldSize(engine.getState())).toEqual({ width: 5760, height: 3840 });
  expect(engine.getState().sectors[outer.id].nodes).toEqual([machine]);
  const farther = engine.ensureSector(0, 0);
  engine.getState().sectors[farther.id] = farther;
  const restored = new GameEngine(engine.getState(), { autosave: false });
  expect(getWorldFieldSize(restored.getState())).toEqual({ width: 5760, height: 3840 });
  restored.getState().research.completed.push('areaExpansion1');
  expect(getWorldFieldSize(restored.getState())).toEqual({ width: 7200, height: 4800 });
});

describe('field overview and scripted sector switches', () => {
  it('centers the overview without zooming below 15% across viewport and expanded field sizes', () => {
    for (const [x, y] of [[6, 5], [8, 5], [0, 0]]) {
      for (const [width, height, top] of [[640, 720, 110], [800, 600, 132], [1280, 720, 95], [1920, 1080, 111]]) {
        for (const research of [[], ['areaExpansion2']]) {
          const world = getSectorWorldSize({ x, y }, research);
          const viewport = { width, height, top };
          const usable = cameraViewport(viewport);
          const camera = clampFieldCamera(sectorOverviewCamera(world, viewport), world, viewport);
          expect(camera.zoom).toBeGreaterThanOrEqual(DEFAULT_MIN_CAMERA_ZOOM);
          expect(camera.zoom).toBeLessThanOrEqual(.25);
          if (world.width * .15 <= usable.width && world.height * .15 <= usable.height) {
            expect(camera.x).toBeGreaterThanOrEqual(usable.x - 1e-6);
            expect(camera.y).toBeGreaterThanOrEqual(usable.y - 1e-6);
            expect(camera.x + world.width * camera.zoom).toBeLessThanOrEqual(width - 18 + 1e-6);
            expect(camera.y + world.height * camera.zoom).toBeLessThanOrEqual(height - 18 + 1e-6);
          }
          expect(camera.x + world.width / 2 * camera.zoom).toBeCloseTo(usable.x + usable.width / 2);
          expect(camera.y + world.height / 2 * camera.zoom).toBeCloseTo(usable.y + usable.height / 2);
        }
      }
    }
  });

  it('lets wheel zoom reach the fitted overview and retains valid chosen views', () => {
    const world = getSectorWorldSize({ x: 6, y: 5 }, ['areaExpansion2']);
    const viewport = { width: 1280, height: 720, top: 95 };
    const overview = sectorOverviewCamera(world, viewport);
    expect(overview.zoom).toBeGreaterThanOrEqual(DEFAULT_MIN_CAMERA_ZOOM);
    const zoomedOut = clampFieldCamera({ ...overview, zoom: .001 }, world, viewport);
    expect(zoomedOut.zoom).toBe(.15);
    expect(clampFieldCamera(zoomedOut, world, viewport)).toEqual(zoomedOut);
    const chosen = { x: 95.5, y: -7, zoom: .275 };
    expect(clampFieldCamera(chosen, world, viewport)).toEqual(chosen);
    const wideView = { x: 500, y: 200, zoom: .25 };
    expect(clampFieldCamera(wideView, world, { width: 1920, height: 1080, top: 111 })).toEqual(wideView);
  });

  it('applies the overview only on first travel, then preserves both sector cameras and saved revisits', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const homeCamera = { ...engine.getSector().camera };
    engine.getState().research.mapPoints = 1;
    expect(engine.unlockSector(6, 5)).toBe(true);
    const outpost = engine.getState().sectors['6,5'];
    expect(outpost.visited).toBeFalsy();

    const overview = sectorOverviewCamera(getSectorWorldSize(outpost, []), { width: 1280, height: 720, top: 95 });
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

describe('player travel carries the current zoom', () => {
  const viewport = { width: 1280, height: 720, top: 95 };

  it('retains zoom on first entry, revisits and travel after reloading', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    engine.getState().research.mapPoints = 1;
    expect(engine.unlockSector(6, 5)).toBe(true);
    engine.setCamera({ x: -100, y: -200, zoom: .8 });
    engine.travelToSector('6,5', viewport);
    expect(engine.getSector().visited).toBe(true);
    expect(engine.getSector().camera.zoom).toBe(.8);
    const usable = cameraViewport(viewport), camera = engine.getSector().camera;
    expect((usable.x + usable.width / 2 - camera.x) / camera.zoom).toBeCloseTo(1800);
    expect((usable.y + usable.height / 2 - camera.y) / camera.zoom).toBeCloseTo(1200);
    engine.setCamera({ ...camera, zoom: 1.2 });
    engine.travelToSector('5,5', viewport);
    expect(engine.getSector().camera.zoom).toBe(1.2);
    const restored = new GameEngine(structuredClone(engine.getState()), { autosave: false });
    restored.setCamera({ ...restored.getSector().camera, zoom: .6 });
    restored.travelToSector('6,5', viewport);
    expect(restored.getSector().camera.zoom).toBe(.6);
  });

  it('retains the destination world-space center while adopting a different zoom', () => {
    const world = { width: 3600, height: 2400 }, usable = cameraViewport(viewport);
    const saved = { x: -300, y: -400, zoom: .8 };
    const next = sectorTravelCamera(1.2, world, viewport, saved);
    expect(next.zoom).toBe(1.2);
    expect((usable.x + usable.width / 2 - next.x) / next.zoom).toBeCloseTo((usable.x + usable.width / 2 - saved.x) / saved.zoom);
    expect((usable.y + usable.height / 2 - next.y) / next.zoom).toBeCloseTo((usable.y + usable.height / 2 - saved.y) / saved.zoom);
  });

  it('leaves locked, missing and current map views unchanged', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    engine.getState().sectors['6,5'] = generateSector(6, 5, 204, 0);
    const before = structuredClone(engine.getState());
    for (const id of ['6,5', 'absent', '5,5']) engine.travelToSector(id, viewport);
    expect(engine.getState()).toEqual(before);
  });

  it('retains a valid wide view through travel with or without an exterior overview', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    engine.getState().research.mapPoints = 1;
    expect(engine.unlockSector(6, 5)).toBe(true);
    const field = getWorldFieldSize(engine.getState());
    engine.setCamera({ x: 60, y: 150, zoom: .18 });
    engine.travelToSector('6,5', viewport, { width: field.width*2, height: field.height*2 });
    expect(engine.getSector().camera.zoom).toBe(.18);
    engine.travelToSector('5,5', viewport);
    expect(engine.getSector().camera.zoom).toBe(.18);
  });

  it.each([[640, 720, 110], [1920, 1080, 111]])('keeps zoom within field bounds at %i × %i', (width, height, top) => {
    const world = { width: 5400, height: 3600 }, viewport = { width, height, top };
    for (const zoom of [.25, .8, 2.2]) {
      const next = sectorTravelCamera(zoom, world, viewport, { x: 10000, y: -10000, zoom: .5 });
      expect(next.zoom).toBe(zoom);
      expect(clampFieldCamera(next, world, viewport)).toEqual(next);
    }
  });
});
