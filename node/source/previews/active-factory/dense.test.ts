import { describe, expect, it } from 'vitest';
import { getNodeSize } from '../../src/domain/nodeGeometry';
import { GameEngine } from '../../src/simulation/engine';
import { getWorldFieldSize } from '../../src/simulation/worldGeneration';
import { createDenseFactory, DENSE_LOADS, factoryActivity } from './model';

describe('dense routed factory', () => {
  it('uses valid ports and material routes for each production recipe', () => {
    const state = createDenseFactory(600), sector = state.sectors[state.activeSectorId];
    sector.nodes = sector.nodes.filter(node => Number(node.id.split('-')[1]) < 4);
    const ids = new Set(sector.nodes.map(node => node.id));
    sector.connections = sector.connections.filter(edge => ids.has(edge.from) && ids.has(edge.to));
    const engine = new GameEngine(state, { autosave: false });
    for (const edge of engine.getSector().connections) {
      expect(engine.getConnectionFailure(edge.from, edge.fromPort ?? 0, edge.to, edge.toPort ?? 0, edge.id), edge.id).toBeUndefined();
    }
  });

  it.each(DENSE_LOADS)('fits %i nodes without overlap and uses every routing outlet', load => {
    const engine = new GameEngine(createDenseFactory(load), { autosave: false });
    const sector = engine.getSector(), field = getWorldFieldSize(engine.getState());
    expect(Object.keys(engine.getState().sectors)).toHaveLength(1);
    expect(sector.nodes).toHaveLength(load);
    expect(new Set(sector.nodes.map(node => node.id)).size).toBe(load);
    const activity = factoryActivity(engine.getState());
    expect(activity.producers).toBe(load * 3 / 20);
    expect(activity.splitters).toBe(load * 7 / 20);
    expect(activity.mergers).toBe(load * 7 / 20);
    const bounds = sector.nodes.map(node => {
      const { w, h } = getNodeSize(node);
      return { id: node.id, left: node.x - w / 2, right: node.x + w / 2, top: node.y - h / 2, bottom: node.y + h / 2 };
    }).sort((a, b) => a.left - b.left);
    const overlaps: string[] = [];
    for (const [index, box] of bounds.entries()) {
      expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(field.width);
      expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(field.height);
      for (let next = index + 1; next < bounds.length && bounds[next].left < box.right; next++) {
        const other = bounds[next];
        if (other.top < box.bottom && other.bottom > box.top) overlaps.push(`${box.id}/${other.id}`);
      }
    }
    expect(overlaps).toEqual([]);
    const used = new Set<string>();
    let sawProgress = false, peakCargo = 0;
    for (let tick = 0; tick < 1200; tick++) {
      engine.tick(100);
      for (const cargo of engine.getState().inFlightTransfers ?? []) {
        if (cargo.cosmeticOnly) continue;
        for (const id of cargo.routeConnectionIds ?? [cargo.connectionId]) used.add(id);
      }
      peakCargo = Math.max(peakCargo, factoryActivity(engine.getState()).transfers);
      sawProgress ||= sector.nodes.some(node => node.recipeId && node.progressMs > 0 && node.progressMs < node.cycleMs);
    }
    expect(sawProgress).toBe(true); expect(peakCargo).toBeGreaterThan(0);
    const nodes = new Map(sector.nodes.map(node => [node.id, node]));
    const routing = sector.connections.filter(edge => ['splitter', 'merger'].includes(nodes.get(edge.from)!.kind) || ['splitter', 'merger'].includes(nodes.get(edge.to)!.kind));
    expect(routing.filter(edge => !used.has(edge.id)).map(edge => edge.id)).toEqual([]);
    const sinks = sector.nodes.filter(node => node.id.endsWith('-sink'));
    const total = (node: typeof sector.nodes[number]) => Object.values(node.output).reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
    const before = sinks.map(total);
    expect(before.every(amount => amount > 0)).toBe(true);
    for (let tick = 0; tick < 600; tick++) engine.tick(100);
    sinks.forEach((node, index) => expect(total(node)).toBeGreaterThan(before[index]));
  }, 60000);
});
