import { describe, expect, it } from 'vitest';
import { GameEngine, createInitialState } from './engine';
import type { ItemId, MachineNode, NodeKind, SectorState } from '../domain/types';

function setup() {
  const state = createInitialState(101);
  state.sectors['5,5'].nodes = [];
  return new GameEngine(state);
}

function node(sector: SectorState, id: string, kind: NodeKind, output: Partial<Record<ItemId, number>> = {}) {
  const result: MachineNode = { id, kind, name: id, input: {}, output, x: 500, y: 500, rotation: 0,
    constructedAt: 0, constructionMs: 0, cycleMs: 3500, progressMs: 0, processingPaused: true };
  sector.nodes.push(result);
  return result;
}

function connect(sector: SectorState, from: MachineNode, to: MachineNode, toPort = 0) {
  sector.connections.push({ id: `${from.id}>${to.id}`, from: from.id, to: to.id, fromPort: 0, toPort, createdAt: 0 });
}

describe('indexed world routing', () => {
  it('keeps the available splitter branch running when the preferred output is full', () => {
    const engine = setup(); const sector = engine.getSector();
    const splitter = node(sector, 'splitter', 'splitter', { wood: 2 });
    const full = node(sector, 'full', 'woodenChest'); full.input.wood = 20;
    const available = node(sector, 'available', 'woodenChest');
    connect(sector, splitter, full);
    connect(sector, splitter, available); sector.connections[1].fromPort = 1;
    engine.tick(400);
    expect(engine.getState().inFlightTransfers?.map((transfer) => transfer.to)).toEqual(['available']);
    expect(splitter.output.wood).toBe(1);
  });

  it('alternates water batches between both splitter outputs', () => {
    const engine = setup(); const sector = engine.getSector();
    const splitter = node(sector, 'water-splitter', 'splitter', { water: 5 });
    const first = node(sector, 'first-processor', 'hydroProcessor'); first.recipeId = 'coolant';
    const second = node(sector, 'second-processor', 'hydroProcessor'); second.recipeId = 'conductive-slurry';
    connect(sector, splitter, first);
    connect(sector, splitter, second);
    sector.connections[1].fromPort = 1;
    engine.tick(400);
    splitter.output.water = 5;
    engine.tick(400);
    expect(first.input.water).toBe(5);
    expect(second.input.water).toBe(5);
    expect(splitter.output.water).toBe(0);
  });

  it('reserves shared input capacity for every launch in the same routing pass', () => {
    const engine = setup(); const sector = engine.getSector();
    const target = node(sector, 'target', 'woodenChest'); target.input.wood = 18;
    for (let i = 0; i < 10; i++) connect(sector, node(sector, `source${i}`, 'woodenChest', { wood: 1 }), target);
    engine.tick(400);
    expect(engine.getState().inFlightTransfers).toHaveLength(2);
    engine.tick(1000);
    expect(target.input.wood).toBe(20);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
  });

  it('reserves recipe inputs independently by item', () => {
    const engine = setup(); const sector = engine.getSector();
    const target = node(sector, 'target', 'assembler'); target.recipeId = 'motor';
    target.input = { 'iron-gear': 4, 'copper-wire': 4 };
    for (let i = 0; i < 3; i++) {
      connect(sector, node(sector, `gears${i}`, 'woodenChest', { 'iron-gear': 1 }), target, 0);
      connect(sector, node(sector, `wires${i}`, 'woodenChest', { 'copper-wire': 1 }), target, 1);
    }
    engine.tick(400);
    expect(engine.getState().inFlightTransfers?.map((transfer) => transfer.item)).toEqual(['iron-gear', 'copper-wire']);
    engine.tick(1000);
    expect(target.input).toEqual({ 'iron-gear': 5, 'copper-wire': 5 });
  });

  it('locks automatic Smelter recipes and merger types as soon as an item is launched', () => {
    const engine = setup(); const sector = engine.getSector();
    const smelter = node(sector, 'smelter', 'smelter'); smelter.recipeId = 'smelt-iron';
    connect(sector, node(sector, 'copper', 'woodenChest', { copper: 1 }), smelter);
    connect(sector, node(sector, 'iron', 'woodenChest', { iron: 1 }), smelter);
    const merger = node(sector, 'merger', 'merger');
    connect(sector, node(sector, 'wood', 'woodenChest', { wood: 1 }), merger, 0);
    connect(sector, node(sector, 'stone', 'woodenChest', { stone: 1 }), merger, 1);
    engine.tick(400);
    expect(smelter.recipeId).toBe('smelt-copper');
    expect(engine.getState().inFlightTransfers?.map((transfer) => transfer.item)).toEqual(['copper', 'wood']);
    engine.tick(1000);
    expect(smelter.input).toEqual({ copper: 1 });
    // Logistics can no longer be paused; a delivered item immediately reaches its output.
    expect((merger.input.wood ?? 0) + (merger.output.wood ?? 0)).toBe(1);
  });

  it('keeps transfer reservations separate when maps reuse node identifiers', () => {
    const engine = setup(); const state = engine.getState();
    const other = structuredClone(engine.getSector()); other.id = '6,5'; other.x = 6;
    state.sectors[other.id] = other;
    for (const sector of Object.values(state.sectors)) {
      const target = node(sector, 'target', 'woodenChest'); target.input.wood = 19;
      connect(sector, node(sector, 'source', 'woodenChest', { wood: 2 }), target);
    }
    engine.tick(400);
    expect(state.inFlightTransfers).toHaveLength(2);
    engine.tick(1000);
    for (const sector of Object.values(state.sectors)) expect(sector.nodes.find((n) => n.id === 'target')?.input.wood).toBe(20);
  });

  it('refreshes routing after deleting a cable, undoing, and replacing saved state', () => {
    const engine = setup(); let sector = engine.getSector();
    const source = node(sector, 'source', 'woodenChest', { wood: 2 });
    const target = node(sector, 'target', 'woodenChest'); connect(sector, source, target);
    engine.tick(400);
    const saved = structuredClone(engine.getState());
    engine.deleteConnection(sector.connections[0].id);
    expect(source.output.wood).toBe(2);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
    engine.undo(); engine.tick(1000);
    expect(engine.getSector().nodes.find((n) => n.id === 'target')?.input.wood).toBe(1);
    engine.replaceState(saved); engine.tick(1000); sector = engine.getSector();
    expect(sector.nodes.find((n) => n.id === 'target')?.input.wood).toBe(1);
  });

  it('reuses only the active map animation list and refreshes it after state changes', () => {
    const engine = setup(); const state = engine.getState();
    const transfer = { id: 'a', sectorId: '5,5', connectionId: 'c', from: 's', to: 't', item: 'wood' as const, launchedAtMs: 0, arrivesAtMs: 1000 };
    state.inFlightTransfers = [transfer, { ...transfer, id: 'b', sectorId: '6,5' }];
    const visible = engine.getActiveTransfers();
    expect(visible.map((t) => t.id)).toEqual(['a']);
    expect(engine.getActiveTransfers()).toBe(visible);
    state.activeSectorId = '6,5';
    expect(engine.getActiveTransfers().map((t) => t.id)).toEqual(['b']);
    state.inFlightTransfers.push({ ...transfer, id: 'c', sectorId: '6,5' });
    expect(engine.getActiveTransfers().map((t) => t.id)).toEqual(['b', 'c']);
    state.inFlightTransfers = [];
    expect(engine.getActiveTransfers()).toEqual([]);
  });
});
