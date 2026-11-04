import { describe, expect, it } from 'vitest';
import type { MachineNode, NodeKind } from '../domain/types';
import { createInitialState, GameEngine } from './engine';

function setup() {
  const state = createInitialState(81);
  state.sectors[state.activeSectorId].nodes = [];
  const engine = new GameEngine(state, { autosave: false });
  const sector = engine.getSector();
  const add = (kind: NodeKind, id: string, extra: Partial<MachineNode> = {}) => {
    const node: MachineNode = {
      id, kind, name: id, x: 300 + sector.nodes.length * 350, y: 500,
      rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 5000,
      constructedAt: 0, constructionMs: 0, ...extra,
    };
    sector.nodes.push(node);
    return node;
  };
  const iron = add('iron', 'iron', { resourceItem: 'iron', resourceRemaining: 1000, resourceCapacity: 1000 });
  const copper = add('copper', 'copper', { resourceItem: 'copper', resourceRemaining: 1000, resourceCapacity: 1000 });
  const extractor = add('extractor', 'extractor');
  return { engine, sector, add, iron, copper, extractor };
}

describe('Extractor storage when its resource changes', () => {
  it.each(['connect', 'connectPorts'] as const)('clears a full old buffer immediately through %s, even while paused', method => {
    const { engine, iron, copper, extractor } = setup();
    expect(engine.connect(iron.id, extractor.id)).toBe(true);
    extractor.output.iron = 5;
    extractor.progressMs = 2000;
    engine.getState().paused = true;

    const connected = method === 'connect'
      ? engine.connect(copper.id, extractor.id)
      : engine.connectPorts(copper.id, 0, extractor.id, 0);
    expect(connected).toBe(true);
    expect(extractor.output).toEqual({});
    expect(extractor.progressMs).toBe(0);

    engine.getState().paused = false;
    for (let second = 0; second < 5; second++) engine.tick(1000);
    expect(extractor.output).toEqual({ copper: 1 });
    expect(engine.getState().extracted).toEqual({ copper: 1 });
  });

  it('keeps stock when disconnected and when reconnected to the same material', () => {
    const { engine, sector, add, iron, extractor } = setup();
    expect(engine.connect(iron.id, extractor.id)).toBe(true);
    extractor.output.iron = 5;
    extractor.progressMs = 1800;
    engine.deleteConnection(sector.connections[0].id);
    expect(extractor.output).toEqual({ iron: 5 });
    const otherIron = add('iron', 'other-iron', { resourceItem: 'iron', resourceRemaining: 500, resourceCapacity: 1000 });
    expect(engine.connect(otherIron.id, extractor.id)).toBe(true);
    expect(extractor.output).toEqual({ iron: 5 });
    expect(extractor.progressMs).toBe(1800);
  });

  it('only discards stock that differs from the new resource', () => {
    const { engine, copper, extractor } = setup();
    extractor.output = { iron: 4, copper: 1 };
    expect(engine.connect(copper.id, extractor.id)).toBe(true);
    expect(extractor.output).toEqual({ copper: 1 });
  });

  it('handles upstream Joint rewiring and restores the stock when undone', () => {
    const { engine, sector, add, iron, copper, extractor } = setup();
    const joint = add('joint', 'joint');
    expect(engine.connect(iron.id, joint.id)).toBe(true);
    expect(engine.connect(joint.id, extractor.id)).toBe(true);
    extractor.output.iron = 5;
    extractor.progressMs = 2300;
    const before = structuredClone(sector);

    expect(engine.connect(copper.id, joint.id)).toBe(true);
    expect(extractor.output).toEqual({});
    engine.undo();
    expect(engine.getSector()).toEqual(before);
  });

  it('does not discard stock for a rejected input connection', () => {
    const { engine, add, extractor } = setup();
    const lake = add('lake', 'lake', { resourceItem: 'water', resourceRemaining: 1000 });
    extractor.output.iron = 5;
    extractor.progressMs = 2000;
    expect(engine.connect(lake.id, extractor.id)).toBe(false);
    expect(extractor.output).toEqual({ iron: 5 });
    expect(extractor.progressMs).toBe(2000);
  });

  it('cleans incompatible stock in an older saved factory before checking capacity', () => {
    const { engine, sector, copper, extractor } = setup();
    sector.connections.push({ id: 'saved-cable', from: copper.id, to: extractor.id, fromPort: 0, toPort: 0, createdAt: 0 });
    extractor.output = { iron: 4, copper: 1 };
    extractor.progressMs = 4000;
    const loaded = new GameEngine(engine.getState(), { autosave: false });
    loaded.tick(1);
    expect(loaded.getSector().nodes.find(node => node.id === extractor.id)).toMatchObject({ output: { copper: 1 }, progressMs: 1 });
  });
});
