import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getSectorWorldSize } from './worldGeneration';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { normalizeLegacy } from '../persistence/saves';

function setup(x = 6, y = 5) {
  const state = createInitialState(301);
  state.research.unlocked.push('road'); state.research.completed.push('road');
  state.sectors['5,5'].nodes = []; state.sectors['5,5'].connections = [];
  const neighbor = generateSector(x, y, state.seed, 0); neighbor.unlocked = true; neighbor.nodes = []; neighbor.connections = [];
  state.sectors[neighbor.id] = neighbor;
  const engine = new GameEngine(state, { autosave: false });
  return { engine, home: engine.getSector(), neighbor: engine.getState().sectors[neighbor.id] };
}
function pairedRoads(engine: GameEngine) {
  const id = engine.placeNode('road', 3590, 600)!;
  const road = engine.getSector().nodes.find(node => node.id === id)!;
  const pair = engine.getState().sectors[road.pairedSectorId!].nodes.find(node => node.id === road.pairedRoadId)!;
  road.constructionMs = 0; pair.constructionMs = 0;
  return { road, pair };
}
const advance = (engine: GameEngine, ms: number) => { while (ms > 0) { const step = Math.min(100, ms); engine.tick(step); ms -= step; } };

describe('paired Road placement and one-way flow', () => {
  it.each([[4, 5], [6, 5], [5, 4], [5, 6]])('places reciprocal endpoints on facing edges toward map %i,%i', (x, y) => {
    const { engine, home, neighbor } = setup(x, y);
    const localField = getSectorWorldSize(home, []), remoteField = getSectorWorldSize(neighbor, []);
    const point = x === 4 ? { x: 10, y: 600 } : x === 6 ? { x: localField.width - 10, y: 600 } : y === 4 ? { x: 600, y: 10 } : { x: 600, y: localField.height - 10 };
    const before = structuredClone(engine.getState());
    expect(engine.getNodePlacementPreview('road', point.x, point.y)?.valid).toBe(true);
    expect(engine.getState()).toEqual(before);
    const id = engine.placeNode('road', point.x, point.y)!;
    expect(home.nodes).toHaveLength(1); expect(neighbor.nodes).toHaveLength(1);
    const local = home.nodes[0], remote = neighbor.nodes[0];
    expect(local).toMatchObject({ id, pairedRoadId: remote.id, pairedSectorId: neighbor.id, roadMode: 'export' });
    expect(remote).toMatchObject({ pairedRoadId: id, pairedSectorId: home.id, roadMode: 'import' });
    if (x !== 5) {
      expect(local.x).toBe(x < 5 ? 67.5 : localField.width - 67.5);
      expect(remote.x).toBe(x < 5 ? remoteField.width - 67.5 : 67.5);
      expect(remote.y).toBe(local.y);
    } else {
      expect(local.y).toBe(y < 5 ? 67.5 : localField.height - 67.5);
      expect(remote.y).toBe(y < 5 ? remoteField.height - 67.5 : 67.5);
      expect(remote.x).toBe(local.x);
    }
  });

  it.each(['local-blocked', 'remote-blocked', 'remote-face-full', 'locked-neighbor'] as const)('creates neither endpoint when %s', obstruction => {
    const { engine, home, neighbor } = setup();
    if (obstruction === 'local-blocked') home.nodes.push(tutorialNode('woodenChest', 'blocker', 3532.5, 600));
    if (obstruction === 'remote-blocked') neighbor.nodes.push(tutorialNode('woodenChest', 'blocker', 67.5, 600));
    if (obstruction === 'remote-face-full') neighbor.nodes.push(tutorialNode('road', 'existing', 67.5, 1200, { roadMode: 'import', pairedSectorId: home.id }));
    if (obstruction === 'locked-neighbor') neighbor.unlocked = false;
    const before = structuredClone(engine.getState());
    expect(engine.getNodePlacementPreview('road', 3590, 600)?.valid).toBe(false);
    expect(engine.placeNode('road', 3590, 600)).toBeUndefined();
    expect(engine.getState()).toEqual(before);
  });

  it('sets the entire pair from either endpoint, retains stock, and leaves the selected direction alone', () => {
    const { engine, home, neighbor } = setup(); const { road, pair } = pairedRoads(engine);
    const cart = tutorialNode('woodenChest', 'cart', 1200, 600, { output: { iron: 3 } });
    const remoteCart = tutorialNode('woodenChest', 'remote-cart', 700, 600, { output: { copper: 7 } });
    home.nodes.push(cart); neighbor.nodes.push(remoteCart);
    home.connections = [{ id: 'local-cable', from: 'cart', to: road.id, createdAt: 0 }];
    neighbor.connections = [{ id: 'remote-cable', from: pair.id, to: remoteCart.id, createdAt: 0 }];
    const before = structuredClone(engine.getState());
    expect(engine.setRoadDirection(road.id, 'export')).toBe(true);
    expect(engine.getState()).toEqual(before);
    expect(engine.setRoadDirection(road.id, 'import')).toBe(true);
    expect(road).toMatchObject({ roadMode: 'import', input: {}, output: {} });
    expect(pair).toMatchObject({ roadMode: 'export', input: {}, output: {} });
    expect(cart.output).toEqual({ iron: 3 }); expect(remoteCart.output).toEqual({ copper: 7 });
    expect(home.connections).toEqual([]); expect(neighbor.connections).toEqual([]);
    expect(home.nodes).toHaveLength(2); expect(neighbor.nodes).toHaveLength(2);
    engine.switchSector(neighbor.id);
    expect(engine.setRoadDirection(pair.id, 'import')).toBe(true);
    expect(road).toMatchObject({ roadMode: 'export', input: {}, output: {} });
    expect(pair).toMatchObject({ roadMode: 'import', input: {}, output: {} });
    expect(cart.output).toEqual({ iron: 3 }); expect(remoteCart.output).toEqual({ copper: 7 });
    const saved = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(saved.getSector().nodes[0].roadMode).toBe('import');
    expect(saved.getState().sectors[home.id].nodes[0].roadMode).toBe('export');
  });

  it('dispatches only from the sending endpoint and blocks malformed bidirectional export pairs', () => {
    const { engine, home, neighbor } = setup(); const { road, pair } = pairedRoads(engine);
    const cart = tutorialNode('woodenChest', 'cart', 1200, 600, { output: { iron: 3 } });
    const remoteCart = tutorialNode('woodenChest', 'remote-cart', 700, 600, { output: { iron: 4 } });
    home.nodes.push(cart); neighbor.nodes.push(remoteCart);
    expect(engine.connectPorts(cart.id, 0, road.id, 0)).toBe(true);
    engine.switchSector(neighbor.id); expect(engine.connectPorts(pair.id, 0, remoteCart.id, 0)).toBe(true); engine.switchSector(home.id);
    advance(engine, 5000);
    expect((remoteCart.input.iron ?? 0) + (remoteCart.output.iron ?? 0)).toBe(5); expect(cart.output.iron).toBe(2);
    expect(road.input).toEqual({}); expect(road.output).toEqual({}); expect(pair.input).toEqual({}); expect(pair.output).toEqual({});
    pair.roadMode = 'export';
    const before = [cart.output.iron, (remoteCart.input.iron ?? 0) + (remoteCart.output.iron ?? 0)];
    advance(engine, 5000);
    expect([cart.output.iron, (remoteCart.input.iron ?? 0) + (remoteCart.output.iron ?? 0)]).toEqual(before);
    expect(engine.setRoadDirection(road.id, 'export')).toBe(true);
    expect(pair.roadMode).toBe('import');
  });

  it('rejects a missing or mismatched counterpart without modifying the factory', () => {
    const { engine } = setup(); const { road, pair } = pairedRoads(engine);
    pair.pairedRoadId = 'other-road';
    const before = structuredClone(engine.getState());
    expect(engine.setRoadDirection(road.id, 'import')).toBe(false);
    expect(engine.getState()).toEqual(before);
    road.input.iron = 2;
    advance(engine, 5000);
    expect(road.input.iron).toBe(2);
    expect(pair.output.iron ?? 0).toBe(0);
  });

  it('does not jump to a different unlocked face when the chosen neighbor is locked', () => {
    const { engine, home, neighbor } = setup(4, 5); // Only the west neighbor is unlocked.
    expect(engine.getNodePlacementPreview('road', 3590, 600)?.valid).toBe(false);
    expect(engine.placeNode('road', 3590, 600)).toBeUndefined();
    expect(home.nodes).toEqual([]); expect(neighbor.nodes).toEqual([]);
  });
});
