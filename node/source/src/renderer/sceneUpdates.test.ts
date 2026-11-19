import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../simulation/engine';
import type { MachineNode } from '../domain/types';
import { boundsOnScreen, nodeDrawingKey, nodeOnScreen, playfieldResolution, reconcileViews, showNodeDetails, type ViewIdentity } from './sceneUpdates';
import { buildCurveMotionPath, curvePoint, buildTransferMotionPath } from './cableGeometry';

const node = (id = 'a', x = 500): MachineNode => ({ id, kind: 'smelter', name: 'Smelter', x, y: 500, rotation: 0, recipeId: 'smelt-iron', input: {}, output: {}, progressMs: 0, cycleMs: 6000, constructedAt: 0, constructionMs: 0 });

describe('retained factory drawing', () => {
  it('retains unrelated objects through selection, movement, deletion and load replacement', () => {
    const sources = [node('a'), node('b', 900)];
    const views = new Map<string, object>(), identities = new Map<string, ViewIdentity>();
    const create = vi.fn(() => ({})), destroy = vi.fn();
    const next = (selected = '') => new Map(sources.map(source => [source.id, { source, key: `${nodeDrawingKey(source)}:${source.id === selected}` }]));
    reconcileViews(views, identities, next(), create, destroy);
    const originalA = views.get('a'), originalB = views.get('b');
    sources[0].x += 100; sources[0].input.iron = 4; sources[0].progressMs = 3200;
    reconcileViews(views, identities, next(), create, destroy);
    expect(views.get('a')).toBe(originalA); expect(views.get('b')).toBe(originalB);
    reconcileViews(views, identities, next('a'), create, destroy);
    expect(views.get('a')).not.toBe(originalA); expect(views.get('b')).toBe(originalB);
    sources.splice(0, 1);
    reconcileViews(views, identities, next(), create, destroy);
    expect(views.has('a')).toBe(false); expect(views.get('b')).toBe(originalB);
    sources[0] = structuredClone(sources[0]);
    reconcileViews(views, identities, next(), create, destroy);
    expect(views.get('b')).not.toBe(originalB);
    expect(destroy).toHaveBeenCalledTimes(3);
  });

  it('invalidates static drawing for socket arrangement and camp size, without invalidating for stock', () => {
    const source = node(), initial = nodeDrawingKey(source);
    source.output['iron-plate'] = 3;
    expect(nodeDrawingKey(source)).toBe(initial);
    source.connectorsMirrored = true;
    expect(nodeDrawingKey(source)).not.toBe(initial);
    source.connectorsMirrored = false; source.campStrength = 20;
    expect(nodeDrawingKey(source)).not.toBe(initial);
  });

  it('rechecks visibility and detail as the camera or a dragged group moves', () => {
    const source = node(), viewport = { width: 1200, height: 800, top: 120 };
    expect(nodeOnScreen(source, { x: 0, y: 0, zoom: 1 }, viewport)).toBe(true);
    expect(nodeOnScreen(source, { x: -3000, y: 0, zoom: 1 }, viewport)).toBe(false);
    expect(nodeOnScreen(source, { x: -3000, y: 0, zoom: 1 }, viewport, { x: 3500, y: 500 })).toBe(true);
    expect(nodeOnScreen(source, { x: 0, y: 0, zoom: .2 }, viewport)).toBe(true);
    expect(showNodeDetails(.2, false)).toBe(false);
    expect(showNodeDetails(.2, true)).toBe(true);
    expect(showNodeDetails(.6, false)).toBe(true);
    // Cables crossing the viewport remain visible even with both endpoints outside.
    expect(boundsOnScreen({ left: -500, right: 2000, top: 300, bottom: 600 }, { x: 0, y: 0, zoom: 1 }, viewport)).toBe(true);
    expect(boundsOnScreen({ left: -500, right: -200, top: 300, bottom: 600 }, { x: 0, y: 0, zoom: 1 }, viewport)).toBe(false);
  });

  it('preserves the curve while resampling after endpoint and connector changes', () => {
    const from = node(), to = node('b', 1400), cable = { id: 'cable', from: from.id, to: to.id, fromPort: 0, toPort: 0, createdAt: 0 };
    const nodes = new Map([[from.id, from], [to.id, to]]), cables = [cable];
    const before = buildCurveMotionPath(cable, nodes, cables);
    before.forEach((sample, index) => {
      const reference = curvePoint(cable, nodes, cables, index / 40)!;
      expect(sample.x).toBeCloseTo(reference.x, 10); expect(sample.y).toBeCloseTo(reference.y, 10);
    });
    to.x += 300; to.y += 400; to.connectorsMirrored = true;
    const after = buildCurveMotionPath(cable, nodes, cables);
    expect(after.at(-1)).not.toEqual(before.at(-1));
    expect(after.at(-1)!.distance).toBeGreaterThan(0);
    const transfer = { id: 'cargo', connectionId: cable.id, from: from.id, to: to.id, sectorId: createInitialState(1).activeSectorId, item: 'iron-plate' as const, launchedAtMs: 10, arrivesAtMs: 1010 };
    expect(buildTransferMotionPath(transfer, nodes, cables).path).toEqual(after);
    expect(transfer.arrivesAtMs).toBe(1010);
  });

  it('uses native display density within a bounded pixel budget', () => {
    expect([1, 1.5, 2, 3].map(playfieldResolution)).toEqual([1, 1.5, 2, 2]);
  });
});
