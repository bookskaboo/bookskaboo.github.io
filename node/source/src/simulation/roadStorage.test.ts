import { describe, expect, it } from 'vitest';
import type { Connection, ItemId, MachineNode, NodeKind } from '../domain/types';
import { createInitialState, GameEngine } from './engine';
import { generateSector } from './worldGeneration';

const node = (id: string, kind: NodeKind, extra: Partial<MachineNode> = {}): MachineNode => ({
  id, kind, name: id, x: 500, y: 500, rotation: 0, input: {}, output: {}, progressMs: 0,
  cycleMs: 1000, constructedAt: 0, constructionMs: 0, ...extra,
});
const cable = (from: string, to: string, toPort = 0): Connection => ({ id: `${from}>${to}`, from, to, fromPort: 0, toPort, createdAt: 0 });
const total = (node: MachineNode, item: ItemId = 'iron') => (node.input[item] ?? 0) + (node.output[item] ?? 0);
function setup() {
  const state = createInitialState(301), home = state.sectors['5,5'];
  const remote = generateSector(6, 5, state.seed); remote.unlocked = true;
  const source = node('source', 'woodenChest', { output: { iron: 8 } });
  const sender = node('send', 'road', { roadMode: 'export', pairedSectorId: remote.id, pairedRoadId: 'receive' });
  const receiver = node('receive', 'road', { roadMode: 'import', pairedSectorId: home.id, pairedRoadId: sender.id });
  const sink = node('sink', 'woodenChest');
  home.nodes = [source, sender]; home.connections = [cable(source.id, sender.id)];
  remote.nodes = [receiver, sink]; remote.connections = [cable(receiver.id, sink.id)];
  state.sectors[remote.id] = remote;
  return { state, home, remote, source, sender, receiver, sink };
}
const advance = (engine: GameEngine, ms: number) => { for (let left = ms; left > 0;) { const step = Math.min(left, 100); engine.tick(step); left -= step; } };
const emptyRoads = (...roads: MachineNode[]) => roads.forEach(road => { expect(road.input).toEqual({}); expect(road.output).toEqual({}); expect(road.capacity).toBe(0); });
function start(fixture: ReturnType<typeof setup>) {
  const engine = new GameEngine(fixture.state, { autosave: false });
  fixture.state = engine.getState(); fixture.home = engine.getSector(); fixture.remote = fixture.state.sectors['6,5'];
  fixture.source = fixture.home.nodes.find(node => node.id === 'source')!;
  fixture.sender = fixture.home.nodes.find(node => node.id === 'send')!;
  fixture.receiver = fixture.remote.nodes.find(node => node.id === 'receive')!;
  fixture.sink = fixture.remote.nodes.find(node => node.id === 'sink')!;
  return engine;
}

describe('Roads have no internal storage', () => {
  it('leaves goods at the source when the receiving end is disconnected, then resumes at one item per check', () => {
    const fixture = setup(); fixture.remote.connections = [];
    const engine = start(fixture);
    advance(engine, 30000);
    expect(total(fixture.source)).toBe(8); expect(total(fixture.sink)).toBe(0);
    emptyRoads(fixture.sender, fixture.receiver);
    fixture.remote.connections.push(cable(fixture.receiver.id, fixture.sink.id));
    advance(engine, 4999); expect(total(fixture.sink)).toBe(0);
    advance(engine, 1); expect(total(fixture.sink)).toBe(1); expect(total(fixture.source)).toBe(7);
    emptyRoads(fixture.sender, fixture.receiver);
  });

  it('backs up at a full Cart without consuming items or accumulating catch-up trips', () => {
    const fixture = setup(); fixture.sink.output.iron = 20;
    const engine = start(fixture);
    advance(engine, 25000);
    expect(total(fixture.source)).toBe(8); expect(total(fixture.sink)).toBe(20);
    emptyRoads(fixture.sender, fixture.receiver);
    fixture.sink.output.iron!--;
    advance(engine, 5000);
    expect(total(fixture.source)).toBe(7); expect(total(fixture.sink)).toBe(20);
    advance(engine, 10000); expect(total(fixture.source)).toBe(7);
  });

  it('keeps old Joint routes idle until both vehicles are wired directly', () => {
    const fixture = setup();
    const localJoint = node('local-joint', 'joint'), remoteJoint = node('remote-joint', 'joint');
    fixture.home.nodes.push(localJoint); fixture.remote.nodes.push(remoteJoint);
    fixture.home.connections = [cable(fixture.source.id, localJoint.id), cable(localJoint.id, fixture.sender.id)];
    fixture.remote.connections = [cable(fixture.receiver.id, remoteJoint.id), cable(remoteJoint.id, fixture.sink.id)];
    const engine = start(fixture);
    advance(engine, 5000);
    expect(total(fixture.source)).toBe(8); expect(total(fixture.sink)).toBe(0);
    expect(fixture.home.connections).toHaveLength(2);
    fixture.home.connections = [cable(fixture.source.id, fixture.sender.id)];
    advance(engine, 5000);
    expect(total(fixture.source)).toBe(8); expect(total(fixture.sink)).toBe(0);
    expect(fixture.remote.connections).toHaveLength(2);
    fixture.remote.connections = [cable(fixture.receiver.id, fixture.sink.id)];
    advance(engine, 5000);
    expect(total(fixture.source)).toBe(7); expect(total(fixture.sink)).toBe(1);
    emptyRoads(fixture.sender, fixture.receiver);
    expect(total(fixture.home.nodes.find(node => node.id === localJoint.id)!)).toBe(0);
    expect(total(fixture.remote.nodes.find(node => node.id === remoteJoint.id)!)).toBe(0);
    const pulses = fixture.state.inFlightTransfers!;
    expect(pulses).toHaveLength(2);
    expect(pulses.every(pulse => pulse.cosmeticOnly)).toBe(true);
    expect(pulses.map(pulse => pulse.connectionId)).toEqual(['source>send', 'receive>sink']);
  });

  it('reserves receiving space for actual in-flight items but not decorative pulses', () => {
    const fixture = setup(); fixture.sink.output.iron = 19;
    fixture.remote.nodes.push(node('other-source', 'filter', { filterItem: 'iron' }));
    const other = cable('other-source', fixture.sink.id); fixture.remote.connections.push(other);
    fixture.state.inFlightTransfers = [{ id: 'reserved', sectorId: fixture.remote.id, connectionId: other.id,
      from: 'other-source', to: fixture.sink.id, item: 'iron', launchedAtMs: 0, arrivesAtMs: 20000 }];
    const engine = start(fixture);
    advance(engine, 5000); expect(total(fixture.source)).toBe(8); expect(total(fixture.sink)).toBe(19);
    fixture.state.inFlightTransfers![0].cosmeticOnly = true;
    advance(engine, 5000); expect(total(fixture.source)).toBe(7); expect(total(fixture.sink)).toBe(20);
    emptyRoads(fixture.sender, fixture.receiver);
  });

  it('leaves an old direct Dev Source feed idle', () => {
    const fixture = setup(); fixture.source.kind = 'devSource'; fixture.source.output = {};
    const engine = start(fixture);
    advance(engine, 5000);
    expect(fixture.sink.input.iron).toBeUndefined();
    expect(fixture.source.input).toEqual({}); expect(fixture.source.output).toEqual({});
    emptyRoads(fixture.sender, fixture.receiver);
  });

  it('recovers legacy Road stock without unloading into an old Warehouse connection', () => {
    const fixture = setup(); fixture.sink.kind = 'warehouse'; fixture.receiver.output.iron = 3;
    start(fixture);
    expect(total(fixture.source)).toBe(11);
    expect(total(fixture.sink)).toBe(0);
    emptyRoads(fixture.sender, fixture.receiver);
  });

  it('returns old stored cargo to connected Carts and preserves overflow in the shared pool on load', () => {
    const fixture = setup(); fixture.source.output.iron = 19; fixture.sink.output.iron = 19;
    fixture.sender.input.iron = 4; fixture.receiver.output.iron = 3;
    const engine = start(fixture);
    emptyRoads(fixture.sender, fixture.receiver);
    expect(total(fixture.source)).toBe(20); expect(total(fixture.sink)).toBe(20);
    expect(fixture.state.globalPool?.iron).toBe(5);
    const saved = structuredClone(engine.getState());
    const loaded = new GameEngine(saved, { autosave: false });
    expect(loaded.getState()).toEqual(saved);
    expect(loaded.getState().globalPool?.iron).toBe(5);
  });

  it('refunds old deliveries to a Road before removing its storage', () => {
    const fixture = setup(); fixture.source.output.iron = 7;
    fixture.state.inFlightTransfers = [{ id: 'old-delivery', sectorId: fixture.home.id,
      connectionId: fixture.home.connections[0].id, from: fixture.source.id, to: fixture.sender.id,
      item: 'iron', launchedAtMs: 0, arrivesAtMs: 1000 }];
    start(fixture);
    expect(total(fixture.source)).toBe(8); expect(fixture.state.inFlightTransfers).toEqual([]);
    emptyRoads(fixture.sender, fixture.receiver);
  });

  it('reverses without moving stock until the new sender and receiver are rewired', () => {
    const fixture = setup(); const engine = start(fixture);
    advance(engine, 5000);
    expect(engine.setRoadDirection(fixture.sender.id, 'import')).toBe(true);
    advance(engine, 5000); expect(total(fixture.source)).toBe(7); expect(total(fixture.sink)).toBe(1);
    fixture.home.connections = [cable(fixture.sender.id, fixture.source.id)];
    fixture.remote.connections = [cable(fixture.sink.id, fixture.receiver.id)];
    advance(engine, 5000); expect(total(fixture.source)).toBe(8); expect(total(fixture.sink)).toBe(0);
    emptyRoads(fixture.sender, fixture.receiver);
  });
});
