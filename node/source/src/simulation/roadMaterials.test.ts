import { describe, expect, it } from 'vitest';
import type { MachineNode, NodeKind } from '../domain/types';
import { createInitialState, GameEngine } from './engine';
import { generateSector } from './worldGeneration';
import { BUILDABLE_NODES, isNodeUnlocked } from '../content/nodes';

const node = (id: string, kind: NodeKind, x: number, y: number, extra: Partial<MachineNode> = {}): MachineNode => ({
  id, kind, name: id, x, y, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000,
  constructedAt: 0, constructionMs: 0, ...extra,
});
function setup(fluid = false) {
  const state = createInitialState(17);
  const roadKind = fluid ? 'fluidRoad' : 'road';
  state.sectors['5,5'].nodes = [
    node('source', 'woodenChest', 700, 500),
    node('send', roadKind, 1400, 500, { roadMode: 'export', pairedSectorId: '6,5', pairedRoadId: 'receive' }),
    node('copper', 'filter', 100, 300, { filterItem: fluid ? 'water' : 'copper' }),
    node('iron', 'filter', 100, 700, { filterItem: fluid ? 'coolant' : 'iron' }),
    node('joint', 'joint', 400, 300),
  ];
  const other = generateSector(6, 5, 17); other.unlocked = true; other.connections = [];
  other.nodes = [
    node('receive', roadKind, 200, 500, { roadMode: 'import', pairedSectorId: '5,5', pairedRoadId: 'send' }),
    node('sink', 'woodenChest', 700, 500),
    node('other', 'filter', 1100, 700, { filterItem: fluid ? 'coolant' : 'iron' }),
  ];
  state.sectors[other.id] = other;
  return new GameEngine(state);
}
const advance = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds * 10; i++) engine.tick(100); };

describe('single-material road connections', () => {
  it('rejects a mixed source whether the road or material feeds are connected first', () => {
    const engine = setup();
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    const before = structuredClone(engine.getSector().connections);
    expect(engine.getRoadConnectionError('iron', 0, 'source', 0)).toContain('Copper and Iron');
    expect(engine.connectPorts('iron', 0, 'source', 0)).toBe(false);
    expect(engine.getSector().connections).toEqual(before);
    expect(engine.getRoadTransportStatus('send')?.materials).toEqual(['copper']);

    const mixed = setup();
    expect(mixed.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(mixed.connectPorts('iron', 0, 'source', 0)).toBe(true);
    expect(mixed.connectPorts('source', 0, 'send', 0)).toBe(false);
  });

  it('traces an indirect feed through routing nodes and rejects a later second feed', () => {
    const engine = setup();
    expect(engine.connectPorts('copper', 0, 'joint', 0)).toBe(true);
    expect(engine.connectPorts('joint', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.connectPorts('iron', 0, 'source', 0)).toBe(false);
    expect(engine.getRoadTransportStatus('send')?.materials).toEqual(['copper']);
  });

  it('rejects a mismatched receiving buffer and a later second feed into an empty receiver', () => {
    const engine = setup();
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    engine.switchSector('6,5');
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    expect(engine.connectPorts('other', 0, 'sink', 0)).toBe(false);

    engine.getSector().nodes.find(n => n.id === 'sink')!.output.iron = 3;
    engine.deleteConnection(engine.getSector().connections.find(c => c.from === 'receive')!.id);
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(false);
    expect(engine.getSector().nodes.find(n => n.id === 'sink')!.output.iron).toBe(3);
  });

  it('lets either side establish the material before any stock arrives', () => {
    const engine = setup();
    engine.switchSector('6,5');
    expect(engine.connectPorts('other', 0, 'sink', 0)).toBe(true);
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    engine.switchSector('5,5');
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(false);
    expect(engine.connectPorts('iron', 0, 'source', 0)).toBe(true);
  });

  it('retires Fluid Roads and rejects any new connection to one', () => {
    const engine = setup(true);
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(false); // Carts also exclude fluids.
    expect(engine.connectPorts('copper', 0, 'send', 0)).toBe(false);
    expect(engine.placeNode('fluidRoad', 2500, 500)).toBeUndefined();
    expect(BUILDABLE_NODES.some(n => n.kind === 'fluidRoad')).toBe(false);
    expect(isNodeUnlocked('fluidRoad', ['fluidRouting'])).toBe(false);
    engine.switchSector('6,5');
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(false);
  });

  it.each(['water', 'coolant', 'conductive-slurry'] as const)('rejects %s through direct and empty-buffer road feeds', (item) => {
    const engine = setup();
    engine.getSector().nodes.find(n => n.id === 'copper')!.filterItem = item;
    expect(engine.connectPorts('copper', 0, 'send', 0)).toBe(false);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(false);
    expect(engine.getConnectionFailure('copper', 0, 'source', 0)?.detail).toContain('cannot store fluids');
    engine.getSector().connections.push({ id: 'legacy-fluid', from: 'copper', to: 'source', fromPort: 0, toPort: 0, createdAt: 0 });
    engine.getSector().nodes.find(n => n.id === 'copper')!.output[item] = 4;
    advance(engine, 10);
    expect(engine.getState().sectors['6,5'].nodes.find(n => n.id === 'receive')!.output[item] ?? 0).toBe(0);
    expect(engine.getSector().nodes.find(n => n.id === 'copper')!.output[item]).toBe(4);
  });

  it.each(['copper', 'circuit-a', 'command-core'] as const)('uses the same one-item rate for %s', item => {
    const engine = setup();
    const source = engine.getSector().nodes.find(n => n.id === 'source')!;
    source.output[item] = 8;
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    const receiver = engine.getState().sectors['6,5'].nodes.find(n => n.id === 'receive')!;
    engine.switchSector('6,5');
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    const sink = engine.getSector().nodes.find(n => n.id === 'sink')!;
    engine.switchSector('5,5');
    const received = () => (sink.input[item] ?? 0) + (sink.output[item] ?? 0);
    advance(engine, 4.9); expect(received()).toBe(0);
    advance(engine, .1); expect(received()).toBe(1);
    advance(engine, 5); expect(received()).toBe(2);
    expect(receiver.input).toEqual({}); expect(receiver.output).toEqual({});
    expect(source.output[item]).toBe(6);
  });

  it('preserves fluid cargo in retired roads without dispatching it', () => {
    const engine = setup(true);
    const sender = engine.getSector().nodes.find(n => n.id === 'send')!;
    sender.input.water = 5;
    advance(engine, 15);
    expect(sender.input.water).toBe(5);
    expect(engine.getState().sectors['6,5'].nodes.find(n => n.id === 'receive')!.output.water ?? 0).toBe(0);
  });

  it('checks the receiving recipe socket without rejecting its other ingredients', () => {
    const engine = setup();
    engine.getSector().nodes.find(n => n.id === 'copper')!.filterItem = 'iron-gear';
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    engine.switchSector('6,5');
    engine.getSector().nodes.push(node('motor', 'assembler', 700, 200, { recipeId: 'motor', input: { 'copper-wire': 5 } }));
    expect(engine.connectPorts('receive', 0, 'motor', 1)).toBe(false);
    expect(engine.connectPorts('receive', 0, 'motor', 0)).toBe(true);
  });

  it('allows a producer connected to a road to consume its different recipe ingredients', () => {
    const engine = setup();
    engine.getSector().nodes = engine.getSector().nodes.map(n => n.id === 'source' ? node('source', 'smelter', 700, 500, { recipeId: 'smelt-iron', cycleMs: 3500, input: { iron: 5, charcoal: 5 } }) : n);
    engine.getSector().nodes.find(n => n.id === 'iron')!.output.iron = 3;
    engine.getSector().nodes.push(node('charcoal', 'filter', 100, 100, { filterItem: 'charcoal', output: { charcoal: 3 } }));
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.connectPorts('iron', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('charcoal', 0, 'source', 1)).toBe(true);
    engine.switchSector('6,5');
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    engine.switchSector('5,5');
    advance(engine, 15);
    const source = engine.getSector().nodes.find(n => n.id === 'source')!;
    expect(source.input.charcoal).toBeGreaterThan(2);
    const sink = engine.getState().sectors['6,5'].nodes.find(n => n.id === 'sink')!;
    expect((sink.input['iron-plate'] ?? 0) + (sink.output['iron-plate'] ?? 0)).toBeGreaterThan(0);
  });

  it('preserves legacy mixed stock, stops dispatch, and allows a Filter to drain it', () => {
    const engine = setup();
    const source = engine.getSector().nodes.find(n => n.id === 'source')!;
    source.input = { copper: 4, iron: 3 };
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(false);
    engine.getSector().connections.push({ id: 'legacy', from: 'source', to: 'send', fromPort: 0, toPort: 0, createdAt: 0 });
    engine.switchSector('6,5');
    const receiver = engine.getSector().nodes.find(n => n.id === 'receive')!;
    receiver.output = { copper: 2, iron: 2 };
    engine.getSector().nodes.push(node('drain', 'filter', 700, 200, { filterItem: 'copper' }));
    expect(engine.connectPorts('receive', 0, 'drain', 0)).toBe(true);
    advance(engine, 10);
    expect(receiver.output.iron).toBe(2);
    expect(receiver.output.copper).toBe(2);
    expect(engine.getSector().nodes.find(n => n.id === 'drain')!.filterBlocked).toBeDefined();
    const sourceNow = engine.getState().sectors['5,5'].nodes.find(n => n.id === 'source')!;
    expect((sourceNow.input.copper ?? 0) + (sourceNow.output.copper ?? 0)).toBe(4);
    expect((sourceNow.input.iron ?? 0) + (sourceNow.output.iron ?? 0)).toBe(3);
  });

  it('blocks a legacy conflicting input cable from contaminating a road-connected buffer', () => {
    const engine = setup();
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    engine.getSector().nodes.find(n => n.id === 'iron')!.output.iron = 3;
    engine.getSector().connections.push({ id: 'legacy', from: 'iron', to: 'source', fromPort: 0, toPort: 0, createdAt: 0 });
    advance(engine, 10);
    expect(engine.getSector().nodes.find(n => n.id === 'source')!.input.iron ?? 0).toBe(0);
    expect(engine.getState().sectors['6,5'].nodes.find(n => n.id === 'receive')!.output.iron ?? 0).toBe(0);
    expect(engine.getSector().nodes.find(n => n.id === 'iron')!.output.iron).toBe(3);
  });

  it('can change material after rewiring an empty pair, but not while its old cargo remains', () => {
    const engine = setup();
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    engine.deleteConnection(engine.getSector().connections.find(c => c.from === 'copper')!.id);
    const receive = engine.getState().sectors['6,5'].nodes.find(n => n.id === 'receive')!;
    receive.output.copper = 2;
    expect(engine.connectPorts('iron', 0, 'source', 0)).toBe(false);
    receive.output = {};
    expect(engine.connectPorts('iron', 0, 'source', 0)).toBe(true);
  });
});
