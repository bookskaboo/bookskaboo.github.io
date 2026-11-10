import { describe, expect, it } from 'vitest';
import { getNodeSize, organicPolygon } from '../domain/nodeGeometry';
import { footprintsOverlap, obstructionOutline, overlapsMaximumCampRadius, segmentCrossesObstruction } from '../domain/obstructionGeometry';
import type { MachineNode } from '../domain/types';
import { getNodeDisplayDefinition } from '../content/nodes';
import { ITEM_COLORS } from '../content/items';
import { updateCampEncroachment } from './campEffects';
import { canPlaceNode, nodeInsideField, nodesOverlap } from './collisions';
import { connectionBlockedByWorld } from './connectionRules';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getSectorWorldSize } from './worldGeneration';

function node(kind: MachineNode['kind'], id: string, extra: Partial<MachineNode> = {}): MachineNode {
  return { kind, id, name: id, x: 1800, y: 1200, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0, ...extra };
}
function topVertex(obstacle: MachineNode) {
  const polygon = obstructionOutline(obstacle);
  let at = 1;
  for (let i = 3; i < polygon.length; i += 2) if (polygon[i] < polygon[at]) at = i;
  return { x: obstacle.x + polygon[at - 1], y: obstacle.y + polygon[at] };
}

describe('visible obstruction boundaries', () => {
  it.each(['lake', 'big-hole', 'monster-camp'] as const)('uses the drawn %s outline for overlap, including bodies whose centers stay outside', kind => {
    const obstacle = node(kind, 'shore', { obstructionWidth: 800, obstructionHeight: 640, obstructionRadius: 400, obstructionMaxRadius: 600, campStrength: 100 });
    expect(obstructionOutline(obstacle)).toEqual(organicPolygon(obstacle, kind === 'lake' ? 18 : kind === 'monster-camp' ? 15 : 11));
    const top = topVertex(obstacle);
    const machine = node('joint', 'machine', { x: top.x, y: top.y - 32 - 1 });
    expect(footprintsOverlap(machine, obstacle)).toBe(false);
    expect(nodesOverlap(machine, obstacle)).toBe(true); // Normal 12-unit placement gap remains explicit.
    machine.y -= 12;
    expect(canPlaceNode(machine, [obstacle], { width: 3600, height: 2400 })).toBe(true);
    machine.y = top.y - 32 + 4;
    expect(footprintsOverlap(machine, obstacle)).toBe(true);
  });

  it('allows a cable immediately outside a Lake shoreline and blocks one through it', () => {
    const lake = node('lake', 'lake', { obstructionWidth: 1024, obstructionHeight: 768 });
    const top = topVertex(lake);
    const source = node('joint', 'source', { x: 400, y: top.y - 1 });
    const target = node('joint', 'target', { x: 3200, y: source.y });
    expect(connectionBlockedByWorld(source, target, { fromPort: 0, toPort: 0 }, [source, lake, target])).toBe(false);
    source.y = target.y = lake.y;
    expect(connectionBlockedByWorld(source, target, { fromPort: 0, toPort: 0 }, [source, lake, target])).toBe(true);
    // A Lake's own outlet is allowed to cross its shoreline.
    expect(connectionBlockedByWorld(lake, target, { fromPort: 1, toPort: 0 }, [lake, target])).toBe(false);
  });

  it('does not miss small obstructions between samples on a long cable', () => {
    const hole = node('big-hole', 'tiny-hole', { x: 3333, y: 1200, obstructionRadius: 32 });
    const source = node('joint', 'source', { x: 0 }), target = node('joint', 'target', { x: 20000 });
    expect(connectionBlockedByWorld(source, target, { fromPort: 0, toPort: 0 }, [source, hole, target])).toBe(true);
  });

  it('uses the union of current camp borders and restores nodes after the border recedes', () => {
    const camp = node('monster-camp', 'camp', { campStrength: 100, obstructionMaxRadius: 600 });
    const top = topVertex(camp);
    const machine = node('joint', 'machine', { x: top.x, y: top.y - 28 });
    const other = node('monster-camp', 'other', { x: 3000, campStrength: 10, obstructionMaxRadius: 600 });
    const resource = node('iron', 'iron', { x: camp.x, y: camp.y, resourceItem: 'iron' });
    updateCampEncroachment([camp, other, machine, resource]);
    expect(machine.disabled).toBe(true);
    expect(resource.disabled).toBeUndefined();
    camp.campStrength = 10;
    updateCampEncroachment([camp, other, machine, resource]);
    expect(machine.disabled).toBe(false);
    expect(camp.disabled).toBe(false);
  });

  it('stops and refunds a transfer when camp growth crosses its cable, then resumes without deleting it', () => {
    const camp = node('monster-camp', 'camp', { campStrength: 25, obstructionMaxRadius: 600, attackRequirement: 3 });
    const cableY = topVertex(camp).y - 8;
    const supply = node('woodenChest', 'supply', { x: 400, y: cableY - 22, output: { iron: 10 } });
    const receiver = node('woodenChest', 'receiver', { x: 3200, y: cableY - 22 });
    const state = createInitialState(37); state.sectors['5,5'].nodes = [camp, supply, receiver];
    const engine = new GameEngine(state);
    expect(engine.connect('supply', 'receiver')).toBe(true);
    engine.tick(400);
    expect(engine.getState().inFlightTransfers?.length).toBeGreaterThan(0);
    const liveCamp = engine.getSector().nodes.find(n => n.id === 'camp')!;
    liveCamp.progressMs = 59900;
    engine.tick(100);
    expect(liveCamp.campStrength).toBe(35);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
    expect(engine.getSector().nodes.find(n => n.id === 'supply')!.output.iron).toBe(10);
    expect(engine.getSector().connections).toHaveLength(1);
    for (let i = 0; i < 20; i++) engine.tick(100);
    expect(engine.getSector().nodes.find(n => n.id === 'receiver')!.output.iron ?? 0).toBe(0);
    liveCamp.input['suppression-bot'] = 3; liveCamp.progressMs = 59900;
    engine.tick(100);
    expect(liveCamp.campStrength).toBe(25);
    for (let i = 0; i < 50; i++) engine.tick(100);
    const delivered = engine.getSector().nodes.find(n => n.id === 'receiver')!;
    expect((delivered.input.iron ?? 0) + (delivered.output.iron ?? 0)).toBe(10);
  });

  it('gives every generated camp room for its maximum body and keeps resources outside its full radius', () => {
    let camps = 0, dwarves = 0;
    for (const seed of [1, 7, 13, 37, 57, 99, 314, 2026, 98765, 2147483647]) {
      for (let x = 0; x < 11; x++) for (let y = 0; y < 11; y++) {
        const sector = generateSector(x, y, seed, 0);
        for (const camp of sector.nodes.filter(n => n.kind === 'monster-camp')) {
          camps++; if (camp.lizardSettlement) dwarves++;
          expect(camp.campStrength).toBe(25);
          const maximum = { ...camp, campStrength: 100 };
          expect(nodeInsideField(maximum, getSectorWorldSize(sector, []))).toBe(true);
          for (const other of sector.nodes.filter(n => n.id !== camp.id)) {
            expect(nodesOverlap(maximum, other)).toBe(false);
            if (other.resourceItem && other.kind !== 'lake') {
              expect(overlapsMaximumCampRadius(other, camp, 12)).toBe(false);
              const size = getNodeSize(other);
              const dx = Math.max(0, Math.abs(other.x - camp.x) - size.w / 2), dy = Math.max(0, Math.abs(other.y - camp.y) - size.h / 2);
              expect(Math.hypot(dx, dy)).toBeGreaterThan(612);
            }
          }
        }
      }
    }
    expect(camps).toBe(300); expect(dwarves).toBe(150);
  }, 15000);

  it('uses a larger mineral-colored humanoid Golem with open space around its silhouette', () => {
    const golem = node('resourceGolem', 'golem', { golemMineral: 'mythril' });
    expect(getNodeSize(golem)).toEqual({ w: 512, h: 768 });
    expect(getNodeDisplayDefinition(golem).accent).toBe(ITEM_COLORS.mythril);
    expect(segmentCrossesObstruction({ x: 1600, y: 1000 }, { x: 2000, y: 1000 }, golem)).toBe(true);
    // Empty space beside the head is no longer covered by an invisible ellipse.
    const besideHead = node('joint', 'near-head', { x: golem.x + 180, y: golem.y - 330 });
    expect(footprintsOverlap(golem, besideHead)).toBe(false);
    const head = node('joint', 'head', { x: golem.x, y: golem.y - 330 });
    expect(footprintsOverlap(golem, head)).toBe(true);
    const besideBody = node('joint', 'near-body', { x: golem.x + 315, y: golem.y });
    expect(footprintsOverlap(golem, besideBody, 12)).toBe(false);
    expect(nodesOverlap(golem, besideBody)).toBe(true);
  });
});
