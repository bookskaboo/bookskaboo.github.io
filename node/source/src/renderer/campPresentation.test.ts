import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { getNodeSize, getPortAnchor, guardedDepositPosition, RESOURCE_NODE_SIZE } from '../domain/nodeGeometry';
import { footprintsOverlap } from '../domain/obstructionGeometry';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { campArtworkLayout, guardedResourceLocked, nodeStackOrder } from './campPresentation';
import { createCampNodeStatus, updateCampNodeStatus } from './campNodeStatus';
import { nodeDrawingKey, reconcileViews, type ViewIdentity } from './sceneUpdates';

describe('interior guarded camp presentation', () => {
  it('keeps the reserve above a camp rebuilt by selection or growth', () => {
    const camp = tutorialNode('monster-camp', 'camp', 0, 0, { guardedDepositId: 'reserve', campStrength: 25 });
    const reserve = tutorialNode('iron', 'reserve', 0, 0, { guardedCampId: camp.id, guardedLocked: true });
    Object.assign(reserve, guardedDepositPosition(camp, reserve));
    const sources = [camp, reserve], layer = new Container(); layer.sortableChildren = true;
    const views = new Map<string, Container>(), identities = new Map<string, ViewIdentity>();
    const render = (selected: string) => {
      reconcileViews(views, identities, new Map(sources.map(source => [source.id, { source, key: `${nodeDrawingKey(source)}:${selected === source.id}` }])), id => {
        const view = new Container(); view.zIndex = nodeStackOrder(sources.find(source => source.id === id)!); layer.addChild(view); return view;
      }, view => view.destroy({ children: true }));
      layer.sortChildren();
      expect(layer.children.at(-1)).toBe(views.get(reserve.id));
      expect(views.get(reserve.id)?.visible).toBe(true);
    };
    render(''); const originalReserve = views.get(reserve.id);
    render(camp.id); expect(views.get(reserve.id)).toBe(originalReserve);
    camp.campStrength = 100; render(camp.id); expect(views.get(reserve.id)).toBe(originalReserve);
    render(reserve.id); render(camp.id);
    layer.destroy({ children: true });
  });

  it.each([10, 25, 100])('separates art, reserve, centered input and AP card at %s%% strength', campStrength => {
    for (const family of ['goblinSettlement', 'lizardSettlement'] as const) {
      const camp = tutorialNode('monster-camp', 'camp', 0, 0, { [family]: 'camp', campStrength, obstructionMaxRadius: 600, guardedDepositId: 'reserve' });
      const art = campArtworkLayout(camp), status = createCampNodeStatus();
      const reserve = tutorialNode('iron', 'reserve', 0, 0, { guardedCampId: camp.id });
      Object.assign(reserve, guardedDepositPosition(camp, reserve));
      expect(footprintsOverlap(reserve, { ...camp, campStrength: 10 })).toBe(false);
      expect(footprintsOverlap(reserve, { ...camp, campStrength: 20 })).toBe(true);
      expect(reserve.y).toBe(camp.y);
      expect(getPortAnchor(camp, 'input', 0)).toEqual({ x: 0, y: 0 });
      expect(art.size).toBe(256);
      expect(art.x + art.size / 2).toBeLessThan(reserve.x - getNodeSize(reserve).w / 2);
      expect(art.y + art.size / 2).toBeLessThan(-12);
      expect(art.titleY + 16).toBeLessThan(art.y - art.size / 2);
      for (const scale of [1, 1.55]) {
        updateCampNodeStatus(status, camp, 0, scale);
        expect(status.root.y + 3 * scale).toBeGreaterThan(RESOURCE_NODE_SIZE.h / 2);
      }
      status.root.destroy({ children: true }); status.halo.destroy();
    }
  });

  it('keeps an unresolved guarded reserve locked without dimming ordinary reserves', () => {
    const reserve = tutorialNode('mythril', 'reserve', 0, 0, { guardedCampId: 'camp' });
    expect(guardedResourceLocked(reserve)).toBe(true);
    reserve.guardedLocked = false; expect(guardedResourceLocked(reserve)).toBe(false);
    reserve.guardedLocked = true; expect(guardedResourceLocked(reserve)).toBe(true);
    delete reserve.guardedCampId; expect(guardedResourceLocked(reserve)).toBe(false);
  });
});
