import { describe, expect, it } from 'vitest';
import { CORNER_ITEMS, CORNER_MAPS } from '../content/endgame';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { obstructionOutline } from '../domain/obstructionGeometry';
import type { MachineNode } from '../domain/types';
import { connectionPoints } from '../renderer/cableGeometry';
import { canPlaceNode, nodesOverlap } from './collisions';
import { getPortSide } from './connectionRules';
import { createInitialState, GameEngine } from './engine';
import { createCornerNodes } from './endgameRuntime';
import { generateSector, getSectorWorldSize } from './worldGeneration';

function cart(id: string, x: number, y: number): MachineNode {
  return { id, kind: 'woodenChest', name: 'Cart', x, y, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 0, constructedAt: 0, constructionMs: 0 };
}

function legacyCorner() {
  const state = createInitialState(12);
  const sector = generateSector(0, 0, state.seed);
  sector.unlocked = true;
  state.sectors[sector.id] = sector;
  state.activeSectorId = sector.id;
  const field = getSectorWorldSize(sector, []);
  const [camp, tribute] = sector.nodes;
  delete camp.cornerCampQuadrant;
  delete camp.obstructionWidth;
  delete camp.obstructionHeight;
  camp.x = field.width / 2;
  camp.y = field.height / 2;
  tribute.x = camp.x + 460;
  return { state, sector, field, camp, tribute };
}

describe('outward corner camps', () => {
  it.each(CORNER_MAPS)('fills the outward quadrant at %s and leaves its Tribute accessible', key => {
    const [x, y] = key.split(',').map(Number);
    const sector = generateSector(x, y, 12);
    const field = getSectorWorldSize(sector, []);
    const [camp, tribute] = sector.nodes;
    expect([camp.x, camp.y]).toEqual([field.width * (x === 0 ? .25 : .75), field.height * (y === 0 ? .25 : .75)]);
    expect([tribute.x, tribute.y]).toEqual([field.width / 2, field.height / 2]);
    expect(tribute.tributeCampId).toBe(camp.id);
    const { w, h } = getNodeSize(camp);
    expect(w * h).toBeGreaterThan(field.width * field.height * .23);
    expect(canPlaceNode(camp, [tribute], field)).toBe(true);
    expect(canPlaceNode(tribute, [camp], field)).toBe(true);
    expect(nodesOverlap(camp, cart('inside', camp.x, camp.y))).toBe(true);
    expect(getPortSide(camp, 'input', 0)).toBe(x === 0 ? 'east' : 'west');
    const outline = obstructionOutline(camp);
    expect(Math.min(...outline.filter((_, index) => index % 2 === 0)) + camp.x).toBeGreaterThanOrEqual(x === 0 ? 0 : field.width / 2);
    expect(Math.max(...outline.filter((_, index) => index % 2 === 1)) + camp.y).toBeLessThanOrEqual(y === 0 ? field.height / 2 : field.height);
  });

  it('keeps all three Foundry cable paths anchored to their own sockets', () => {
    const [camp] = createCornerNodes(0, 0, 12, { width: 7200, height: 4800 }, ['foundry', 'alpha', 'reclamation', 'grove']);
    const supplier = cart('supplier', 4200, camp.y);
    const nodes = new Map([camp, supplier].map(node => [node.id, node]));
    const connections = Array.from({ length: 3 }, (_, toPort) => ({ id: `feed-${toPort}`, from: supplier.id, to: camp.id, fromPort: 0, toPort, createdAt: 0 }));
    const ys = connections.map(cable => {
      const anchor = getPortAnchor(camp, 'input', cable.toPort);
      const points = connectionPoints(cable, nodes, connections)!;
      expect(points.end).toEqual({ x: camp.x + anchor.x, y: camp.y + anchor.y });
      return points.end.y;
    });
    expect(new Set(ys).size).toBe(3);
  });

  it('moves a legacy camp and linked Tribute while preserving their identity, stock, progress and cables', () => {
    const { state, sector, field, camp, tribute } = legacyCorner();
    const item = CORNER_ITEMS[camp.cornerType!];
    const sink = cart('sink', field.width / 2 + 900, field.height / 2 + 400);
    camp.cornerProgress = 5;
    tribute.output[item] = 4;
    sector.nodes.push(sink);
    const cable = { id: 'collection', from: tribute.id, to: sink.id, fromPort: 0, toPort: 0, item, createdAt: 0 };
    sector.connections.push(cable);
    const live = new GameEngine(state, { autosave: false }).getSector();
    expect(live.nodes.find(node => node.id === camp.id)).toMatchObject({ x: field.width / 4, y: field.height / 4, cornerProgress: 5, cornerType: camp.cornerType });
    expect(live.nodes.find(node => node.id === tribute.id)).toMatchObject({ x: field.width / 2, y: field.height / 2, output: { [item]: 4 }, tributeCampId: camp.id });
    expect(live.connections).toContainEqual(cable);
  });

  it('keeps the legacy positions when the new footprint would cover a machine or its cable', () => {
    const { state, sector, field, camp, tribute } = legacyCorner();
    const covered = cart('covered', field.width / 4, field.height / 4);
    sector.nodes.push(covered);
    let live = new GameEngine(state, { autosave: false }).getSector();
    expect(live.nodes.find(node => node.id === camp.id)?.x).toBe(camp.x);
    expect(live.nodes.find(node => node.id === covered.id)).toMatchObject(covered);

    const source = cart('source', 1000, 2800), sink = cart('sink', 4200, 400);
    sector.nodes = [camp, tribute, source, sink];
    const cable = { id: 'existing', from: source.id, to: sink.id, fromPort: 0, toPort: 0, createdAt: 0 };
    sector.connections.push(cable);
    live = new GameEngine(state, { autosave: false }).getSector();
    expect(live.nodes.find(node => node.id === camp.id)?.x).toBe(camp.x);
    expect(live.nodes.find(node => node.id === tribute.id)?.x).toBe(tribute.x);
    expect(live.connections).toContainEqual(cable);
  });

  it('recenters an unobstructed layout when area research expands the field', () => {
    const { state } = legacyCorner();
    const engine = new GameEngine(state, { autosave: false });
    engine.developerUnlockAllResearch();
    const sector = engine.getSector();
    const field = getSectorWorldSize(sector, engine.getState().research.completed);
    const [camp, tribute] = sector.nodes;
    expect(camp.x).toBe(field.width / 4);
    expect(tribute.x).toBe(field.width / 2);
    expect(tribute.y).toBe(field.height / 2);
  });
});
