import { describe, expect, it, vi } from 'vitest';
import type { InFlightTransfer } from '../domain/types';
import { roadTravelPair } from '../domain/roadNavigation';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { createInitialState, GameEngine } from './engine';
import { generateSector } from './worldGeneration';

function setup() {
  const state = createInitialState(301);
  const home = state.sectors[state.activeSectorId];
  const neighbor = generateSector(6, 5, state.seed);
  neighbor.unlocked = true;
  home.nodes = []; home.connections = [];
  neighbor.nodes = []; neighbor.connections = [];
  state.sectors[neighbor.id] = neighbor;
  const engine = new GameEngine(state, { autosave: false });
  const local = engine.getSector(), remote = engine.getState().sectors[neighbor.id];
  // Add after load-time legacy cargo recovery, to exercise command handling itself.
  const road = tutorialNode('road', 'local-road', 3532.5, 600, {
    roadMode: 'export', roadFacing: 'west', pairedSectorId: remote.id, pairedRoadId: 'remote-road',
  });
  const pair = tutorialNode('road', 'remote-road', 67.5, 600, {
    roadMode: 'import', roadFacing: 'east', pairedSectorId: local.id, pairedRoadId: road.id,
  });
  local.nodes.push(road); remote.nodes.push(pair);
  return { engine, local, remote, road, pair };
}

describe('Road direction command facade contracts', () => {
  it.each(['missing-local', 'missing-sector', 'missing-pair', 'non-road-pair', 'wrong-road', 'wrong-sector'] as const)(
    'rejects %s without publication or an undo checkpoint', failure => {
      const { engine, road, pair } = setup();
      let id = road.id;
      if (failure === 'missing-local') id = 'absent';
      if (failure === 'missing-sector') road.pairedSectorId = 'absent';
      if (failure === 'missing-pair') road.pairedRoadId = 'absent';
      if (failure === 'non-road-pair') pair.kind = 'woodenChest';
      if (failure === 'wrong-road') pair.pairedRoadId = 'another-road';
      if (failure === 'wrong-sector') pair.pairedSectorId = 'another-sector';
      const before = structuredClone(engine.getState()), publish = vi.fn();
      engine.subscribe(publish);
      expect(engine.getRoadReversalError(id)).toBe(failure.startsWith('wrong-')
        ? 'The paired road endpoint belongs to another Road.' : 'The paired road endpoint is unavailable.');
      expect(engine.reverseRoad(id)).toBe(false);
      expect(engine.setRoadDirection(id, 'import')).toBe(false);
      engine.undo();
      expect(engine.getState()).toEqual(before);
      expect(publish).not.toHaveBeenCalled();
    },
  );

  it('leaves the selected direction and invalid runtime input alone without recording history', () => {
    const { engine, road } = setup(), publish = vi.fn();
    engine.subscribe(publish);
    const before = structuredClone(engine.getState());
    expect(engine.setRoadDirection(road.id, 'export')).toBe(true);
    expect(engine.setRoadDirection(road.id, 'sideways' as 'import')).toBe(false);
    engine.undo();
    expect(engine.getState()).toEqual(before);
    expect(publish).not.toHaveBeenCalled();
  });

  it('retains reversal compatibility for old pairs that cannot be used for navigation', () => {
    const { engine, road, pair, remote } = setup();
    delete pair.pairedRoadId; delete pair.pairedSectorId;
    remote.unlocked = false;
    expect(roadTravelPair(engine.getState(), road.id)).toBeUndefined();
    expect(engine.getRoadReversalError(road.id)).toBeUndefined();
    expect(engine.reverseRoad(road.id)).toBe(true);
    expect([road.roadMode, pair.roadMode]).toEqual(['import', 'export']);
  });

  it('refunds both routes before removing cables and publishes the completed pair once', () => {
    const { engine, local, remote, road, pair } = setup();
    const source = tutorialNode('extractor', 'tri-source', 1000, 600, {
      landmark: 'tri', resourceItem: 'iron', triOutput: [1, 0, 2], output: { iron: 3 },
    });
    const remoteSource = tutorialNode('refiner', 'mixed-source', 700, 600, {
      landmark: 'unknown', output: { 'simple-core': 1 }, outputQueue: ['simple-core'],
    });
    local.nodes.push(source); remote.nodes.push(remoteSource);
    local.connections = [
      { id: 'local-cable', from: source.id, to: road.id, createdAt: 0 },
      { id: 'untouched-cable', from: source.id, to: source.id, createdAt: 0 },
    ];
    remote.connections = [{ id: 'remote-cable', from: pair.id, to: remoteSource.id, createdAt: 0 }];
    road.input = { copper: 2 }; road.output = { iron: 1 }; road.progressMs = 321;
    pair.input = { stone: 4 }; pair.output = { copper: 5 }; pair.progressMs = 654;
    const cargo = (id: string, patch: Partial<InFlightTransfer> = {}): InFlightTransfer => ({
      id, sectorId: local.id, connectionId: 'untouched-cable', from: source.id, to: road.id,
      item: 'iron', launchedAtMs: 0, arrivesAtMs: 1000, ...patch,
    });
    engine.getState().inFlightTransfers = [
      cargo('keep-first'),
      cargo('local-refund', { routeConnectionIds: ['untouched-cable', 'local-cable'], amount: 2, sourcePort: 1 }),
      cargo('remote-refund-first', { sectorId: remote.id, connectionId: 'remote-cable', from: remoteSource.id, item: 'basic-core' }),
      cargo('remote-refund-second', { sectorId: remote.id, connectionId: 'remote-cable', from: remoteSource.id, item: 'automata-core' }),
      cargo('cosmetic', { connectionId: 'local-cable', cosmeticOnly: true, amount: 99 }),
      cargo('keep-last'),
    ];
    const before = structuredClone(engine.getState());
    const observations: unknown[] = [];
    engine.subscribe(() => observations.push(structuredClone({
      modes: [road.roadMode, pair.roadMode], cables: [local.connections.length, remote.connections.length],
      stock: [source.output, remoteSource.output],
    })));
    expect(engine.reverseRoad(road.id)).toBe(true);
    expect(source.triOutput).toEqual([1, 2, 2]);
    expect(source.output).toEqual({ iron: 5 });
    expect(remoteSource.outputQueue).toEqual(['basic-core', 'automata-core', 'simple-core']);
    expect(engine.getState().inFlightTransfers?.map(t => t.id)).toEqual(['keep-first', 'keep-last']);
    expect(road).toMatchObject({ input: { iron: 1 }, output: { copper: 2 }, progressMs: 0 });
    expect(pair).toMatchObject({ input: { copper: 5 }, output: { stone: 4 }, progressMs: 0 });
    expect(observations).toEqual([{
      modes: ['import', 'export'], cables: [1, 0],
      stock: [{ iron: 5 }, { 'simple-core': 1, 'basic-core': 1, 'automata-core': 1 }],
    }]);
    engine.undo();
    expect(engine.getSector().nodes).toEqual(before.sectors[local.id].nodes);
    expect(engine.getState().sectors[remote.id].connections).toEqual(before.sectors[remote.id].connections);
    expect(engine.getState().inFlightTransfers).toEqual(before.inFlightTransfers);
    expect(observations).toHaveLength(2);
    engine.undo();
    expect(observations).toHaveLength(2); // Exactly one checkpoint for the reversal.
  });

  it('reads the restored state after undo rather than the previously mutated nodes', () => {
    const { engine, road } = setup();
    engine.reverseRoad(road.id);
    engine.undo();
    const restored = engine.getSector().nodes.find(node => node.id === road.id)!;
    expect(restored).not.toBe(road);
    expect(restored.roadMode).toBe('export');
    expect(engine.reverseRoad(road.id)).toBe(true);
    expect(restored.roadMode).toBe('import');
    engine.undo();
    expect(engine.getSector().nodes.find(node => node.id === road.id)?.roadMode).toBe('export');
  });

  it('uses the replacement factory and its active endpoint without mutating the old factory', () => {
    const { engine, road, pair } = setup();
    const replacement = setup();
    replacement.engine.getState().activeSectorId = replacement.remote.id;
    engine.reverseRoad(road.id);
    const old = engine.getState(), before = structuredClone(old);
    engine.replaceState(replacement.engine.getState());
    const current = engine.getState();
    const currentPair = engine.getSector().nodes.find(node => node.id === pair.id)!;
    expect(engine.getRoadReversalError(pair.id)).toBeUndefined();
    expect(engine.reverseRoad(pair.id)).toBe(true);
    expect(currentPair.roadMode).toBe('export');
    expect(current.sectors[road.pairedSectorId!].nodes.find(node => node.id === pair.id)?.roadMode).toBe('export');
    expect(current.sectors[pair.pairedSectorId!].nodes.find(node => node.id === road.id)?.roadMode).toBe('import');
    expect(old).toEqual(before);
    engine.undo();
    expect(engine.getSector().nodes.find(node => node.id === pair.id)?.roadMode).toBe('import');
    const publish = vi.fn(); engine.subscribe(publish);
    engine.undo();
    expect(publish).not.toHaveBeenCalled(); // Replacement cleared the older factory's history.
  });
});
