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
  it.each(['joint', 'filter', 'splitter', 'merger', 'warehouse', 'devSource', 'smelter'] as const)('rejects a direct %s feed with freight vehicle guidance', kind => {
    const engine = setup();
    engine.getSector().nodes.push(node('invalid-feed', kind, 700, 300, kind === 'smelter' ? { recipeId: 'smelt-iron' } : {}));
    expect(engine.connect('invalid-feed', 'send')).toBe(false);
    expect(engine.connectPorts('invalid-feed', 0, 'send', 0)).toBe(false);
    expect(engine.getConnectionFailure('invalid-feed', 0, 'send', 0)).toEqual({
      title: 'Freight vehicle required',
      detail: 'Connect a Cart, Truck, or Train directly to the sending Road.',
    });
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
  });

  it.each(['joint', 'filter', 'splitter', 'merger', 'warehouse', 'smelter'] as const)('rejects direct offloading to a %s with freight vehicle guidance', kind => {
    const engine = setup();
    engine.switchSector('6,5');
    engine.getSector().nodes.push(node('invalid-sink', kind, 700, 300, kind === 'smelter' ? { recipeId: 'smelt-iron' } : {}));
    expect(engine.connect('receive', 'invalid-sink')).toBe(false);
    expect(engine.connectPorts('receive', 0, 'invalid-sink', 0)).toBe(false);
    expect(engine.getConnectionFailure('receive', 0, 'invalid-sink', 0)).toEqual({
      title: 'Freight vehicle required',
      detail: 'Connect the receiving Road directly to a Cart, Truck, or Train.',
    });
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
  });

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

  it('infers Road cargo from only the Filter outlet feeding the vehicle', () => {
    const engine = setup();
    const filter = engine.getSector().nodes.find(n => n.id === 'copper')!;
    filter.output = { copper: 1, iron: 1 };
    expect(engine.setFilterItem(filter.id, 'copper', 1)).toBe(true);
    expect(engine.connectPorts(filter.id, 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.getRoadTransportStatus('send')?.materials).toEqual(['iron']);
    expect(engine.setFilterItem(filter.id, 'copper', 0)).toBe(true);
    expect(engine.getRoadTransportStatus('send')?.materials).toEqual(['copper']);
  });

  it('ships different Suppression Bot strengths together as one material', () => {
    const engine = setup();
    const filter = engine.getSector().nodes.find(n => n.id === 'copper')!;
    filter.output = { 'suppression-bot': 1, 'command-suppression-bot': 1 };
    expect(engine.setFilterItem(filter.id, 'suppression-bot', 0)).toBe(true);
    expect(engine.connectPorts(filter.id, 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.getRoadTransportStatus('send')).toMatchObject({ mixed: false, materials: ['suppression-bot'] });
    engine.switchSector('6,5');
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    const sink = engine.getSector().nodes.find(n => n.id === 'sink')!;
    engine.switchSector('5,5');
    advance(engine, 12);
    expect(sink.output).toEqual({ 'suppression-bot': 1, 'command-suppression-bot': 1 });
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

  it('offloads into a Cart that can then feed a local recipe', () => {
    const engine = setup();
    engine.getSector().nodes.find(n => n.id === 'copper')!.filterItem = 'iron-gear';
    engine.getSector().nodes.find(n => n.id === 'source')!.output['iron-gear'] = 2;
    expect(engine.connectPorts('copper', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    engine.switchSector('6,5');
    engine.getSector().nodes.push(node('motor', 'assembler', 700, 200, { recipeId: 'motor', input: { 'copper-wire': 5 } }));
    expect(engine.connectPorts('receive', 0, 'motor', 1)).toBe(false);
    expect(engine.connectPorts('receive', 0, 'motor', 0)).toBe(false);
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    expect(engine.connectPorts('sink', 0, 'motor', 0)).toBe(true);
    advance(engine, 7);
    expect(engine.getSector().nodes.find(n => n.id === 'motor')!.input['iron-gear']).toBe(1);
  });

  it('ships a producer’s output through a Cart while the producer consumes different ingredients', () => {
    const engine = setup();
    engine.getSector().nodes.push(node('producer', 'smelter', 400, 500, { recipeId: 'smelt-iron', cycleMs: 3500, input: { iron: 5, charcoal: 5 } }));
    engine.getSector().nodes.find(n => n.id === 'iron')!.output.iron = 3;
    engine.getSector().nodes.push(node('charcoal', 'filter', 100, 100, { filterItem: 'charcoal', output: { charcoal: 3 } }));
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(true);
    expect(engine.connectPorts('producer', 0, 'source', 0)).toBe(true);
    expect(engine.connectPorts('iron', 0, 'producer', 0)).toBe(true);
    expect(engine.connectPorts('charcoal', 0, 'producer', 1)).toBe(true);
    engine.switchSector('6,5');
    expect(engine.connectPorts('receive', 0, 'sink', 0)).toBe(true);
    engine.switchSector('5,5');
    advance(engine, 15);
    const producer = engine.getSector().nodes.find(n => n.id === 'producer')!;
    expect(producer.input.charcoal).toBeGreaterThan(2);
    const sink = engine.getState().sectors['6,5'].nodes.find(n => n.id === 'sink')!;
    expect((sink.input['iron-plate'] ?? 0) + (sink.output['iron-plate'] ?? 0)).toBeGreaterThan(0);
  });

  it('preserves legacy mixed stock and prevents direct offloading into a Filter', () => {
    const engine = setup();
    const source = engine.getSector().nodes.find(n => n.id === 'source')!;
    source.input = { copper: 4, iron: 3 };
    expect(engine.connectPorts('source', 0, 'send', 0)).toBe(false);
    engine.getSector().connections.push({ id: 'legacy', from: 'source', to: 'send', fromPort: 0, toPort: 0, createdAt: 0 });
    engine.switchSector('6,5');
    const receiver = engine.getSector().nodes.find(n => n.id === 'receive')!;
    receiver.output = { copper: 2, iron: 2 };
    engine.getSector().nodes.push(node('drain', 'filter', 700, 200, { filterItem: 'copper' }));
    expect(engine.connectPorts('receive', 0, 'drain', 0)).toBe(false);
    advance(engine, 10);
    expect(receiver.output.iron).toBe(2);
    expect(receiver.output.copper).toBe(2);
    expect(engine.getSector().nodes.find(n => n.id === 'drain')!.input).toEqual({});
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
