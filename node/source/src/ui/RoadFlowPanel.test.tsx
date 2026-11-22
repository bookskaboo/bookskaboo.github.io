import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import type { MachineNode, NodeKind } from '../domain/types';
import { emptyMod } from '../mods/modTypes';
import { activateMod } from '../mods/modContent';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { RoadFlowPanel } from './RoadFlowPanel';

afterEach(() => activateMod(undefined));

function fixture(stage: string, rank = 0, interval?: number, profileInterval?: number) {
  const game = createInitialState(33);
  game.worldRulesVersion = 1;
  game.research.completed = ['road', ...(stage === 'Cart' ? [] : stage === 'Truck' ? ['trucks'] : ['trucks', 'trains'])];
  game.research.unlocked = [...game.research.completed];
  game.research.repeatableCompletions = { trainFreightCapacity: rank };
  if (interval !== undefined || profileInterval !== undefined) {
    game.mod = emptyMod();
    if (interval !== undefined) game.mod.rules.roadTransferMs = interval;
    if (profileInterval !== undefined) game.mod.profiles = { connections: {
      selected: 'mod-freight', entries: { 'mod-freight': { name: 'Freight timing', rules: { roadTransferMs: profileInterval } } },
    } };
  }
  const machine = (kind: NodeKind, id: string, x: number): MachineNode => ({
    id, kind, name: id, x, y: 600, rotation: 0, input: {}, output: {}, progressMs: 0,
    cycleMs: 1000, constructedAt: 0, constructionMs: 0,
  });
  const home = game.sectors['5,5'], remote = generateSector(6, 5, game.seed);
  remote.unlocked = true; game.sectors[remote.id] = remote;
  const source = machine('woodenChest', 'source', 2900), sink = machine('woodenChest', 'sink', 700);
  const send = machine('road', 'send', 3532.5), receive = machine('road', 'receive', 67.5);
  source.output.iron = 20;
  Object.assign(send, { roadMode: 'export', roadFacing: 'west', pairedSectorId: remote.id, pairedRoadId: receive.id });
  Object.assign(receive, { roadMode: 'import', roadFacing: 'east', pairedSectorId: home.id, pairedRoadId: send.id });
  home.nodes = [source, send]; remote.nodes = [receive, sink];
  home.connections = [{ id: 'feed', from: source.id, to: send.id, createdAt: 0 }];
  remote.connections = [{ id: 'exit', from: receive.id, to: sink.id, createdAt: 0 }];
  const engine = new GameEngine(game, { autosave: false });
  const current = engine.getState();
  return { engine, game: current,
    send: current.sectors[home.id].nodes.find(n => n.id === send.id)!,
    receive: current.sectors[remote.id].nodes.find(n => n.id === receive.id)!,
    source: current.sectors[home.id].nodes.find(n => n.id === source.id)!,
    sink: current.sectors[remote.id].nodes.find(n => n.id === sink.id)!,
  };
}
function render(f: ReturnType<typeof fixture>) {
  return renderToStaticMarkup(<RoadFlowPanel node={f.send} game={f.game} engine={f.engine} onClose={() => {}} />);
}
function expectRate(html: string, rate: number) {
  expect(html).toContain(`aria-label="Maximum transfer rate: ${rate} items per minute"`);
  expect(html).toContain(`Maximum transfer rate: ${rate} items / minute`);
  expect(html).toContain('Actual delivery depends on available stock and receiver space.');
}
const advance = (engine: GameEngine, ms: number) => {
  while (ms > 0) { const step = Math.min(100, ms); engine.tick(step); ms -= step; }
};

describe('Road maximum transfer rate', () => {
  it.each([
    ['Cart', 0, 12], ['Truck', 0, 24], ['Train', 0, 48], ['Train', 1, 60],
    ['Train', 2, 72], ['Train', 7, 132], ['Cart', 2, 12], ['Truck', 2, 24],
  ] as const)('presents %s at freight rank %s as %s/minute', (stage, rank, expected) => {
    expectRate(render(fixture(stage, rank)), expected);
  });
  it.each([
    ['Train', 2, 2000, 180], ['Truck', 0, 10000, 12], ['Train', 2, 7000, 51.43],
    ['Train', 2, 100, 3600], ['Train', 2, 600000, 0.6],
  ] as const)('uses a %s rank %s mod interval of %s ms', (stage, rank, interval, expected) => {
    expectRate(render(fixture(stage, rank, interval)), expected);
  });
  it('uses selected connection-profile timing ahead of the base mod rule', () => {
    const f = fixture('Train', 2, 10000, 2000);
    expectRate(render(f), 180);
    advance(f.engine, 1900); expect(f.source.output.iron).toBe(20);
    advance(f.engine, 100); expect(f.source.output.iron).toBe(14);
    expect((f.sink.input.iron ?? 0) + (f.sink.output.iron ?? 0)).toBe(6);
  });
  it('ignores unselected profile timing and restores base timing on factory replacement', () => {
    const f = fixture('Train', 2, undefined, 2000);
    f.game.mod!.profiles!.connections!.selected = undefined;
    f.engine.replaceState(f.game);
    f.game = f.engine.getState();
    expectRate(render(f), 72);
    expectRate(render(fixture('Cart')), 12);
  });
  it.each([
    ['Cart', 0, 5000, 1, 12], ['Truck', 0, 5000, 2, 24], ['Train', 0, 5000, 4, 48],
    ['Train', 2, 5000, 6, 72], ['Train', 2, 2000, 6, 180],
  ] as const)('agrees with real %s rank %s dispatch at %s ms', (stage, rank, interval, payload, rate) => {
    const f = fixture(stage, rank, interval === 5000 ? undefined : interval);
    expectRate(render(f), rate);
    advance(f.engine, interval - 100); expect(f.source.output.iron).toBe(20);
    advance(f.engine, 100);
    expect(f.source.output.iron).toBe(20 - payload);
    expect((f.sink.input.iron ?? 0) + (f.sink.output.iron ?? 0)).toBe(payload);
    expect(f.send.output).toEqual({}); expect(f.receive.output).toEqual({});
  });
  it.each(['empty-source', 'full-receiver'] as const)('keeps capacity distinct from observed delivery for %s', blocked => {
    const f = fixture('Train', 2);
    if (blocked === 'empty-source') f.source.output = {};
    else f.sink.output.iron = f.sink.capacity;
    const before = structuredClone([f.source.input, f.source.output, f.sink.input, f.sink.output]);
    advance(f.engine, 5000);
    expect([f.source.input, f.source.output, f.sink.input, f.sink.output]).toEqual(before);
    expectRate(render(f), 72);
  });
  it('shows the same capacity at the receiving endpoint without modifying stock', () => {
    const f = fixture('Train', 2, 2000);
    f.engine.switchSector(f.send.pairedSectorId!);
    const before = structuredClone(f.engine.getState());
    expectRate(renderToStaticMarkup(<RoadFlowPanel node={f.receive} game={f.game} engine={f.engine} onClose={() => {}} />), 180);
    expect(f.engine.getState()).toEqual(before);
  });
});
