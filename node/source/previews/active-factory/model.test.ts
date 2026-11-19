import { describe, expect, it } from 'vitest';
import { getNodeSize } from '../../src/domain/nodeGeometry';
import { GameEngine } from '../../src/simulation/engine';
import { getWorldFieldSize } from '../../src/simulation/worldGeneration';
import { createActiveFactory, factoryActivity, LOADS } from './model';

describe('active factory browser fixture', () => {
  it('replaces the fixture without retaining cargo or writing autosaves', () => {
    const state = createActiveFactory(300);
    state.preferences.autosaveMinutes = .001;
    const engine = new GameEngine(state, { autosave: false });
    for (let i = 0; i < 600; i++) engine.tick(100);
    expect(factoryActivity(engine.getState()).delivered).toBeGreaterThan(0);
    engine.replaceState(createActiveFactory(150));
    expect(factoryActivity(engine.getState())).toMatchObject({ nodes: 150, producers: 60, produced: 0, delivered: 0, transfers: 0 });
    engine.replaceState(createActiveFactory(300));
    for (let i = 0; i < 600; i++) engine.tick(100);
    expect(factoryActivity(engine.getState()).delivered).toBeGreaterThan(0);
  });
  it.each(LOADS)('fits %i distinct nodes on one map and keeps every final branch delivering', load => {
    const engine = new GameEngine(createActiveFactory(load), { autosave: false });
    const sector = engine.getSector();
    expect(Object.keys(engine.getState().sectors)).toHaveLength(1);
    expect(sector.nodes).toHaveLength(load);
    expect(new Set(sector.nodes.map(node => node.id)).size).toBe(load);
    const field = getWorldFieldSize(engine.getState());
    for (const node of sector.nodes) {
      const size = getNodeSize(node);
      expect(node.x - size.w / 2).toBeGreaterThanOrEqual(0);
      expect(node.x + size.w / 2).toBeLessThanOrEqual(field.width);
      expect(node.y - size.h / 2).toBeGreaterThanOrEqual(0);
      expect(node.y + size.h / 2).toBeLessThanOrEqual(field.height);
      for (const other of sector.nodes.filter(other => other.id > node.id)) {
        const otherSize = getNodeSize(other);
        expect(Math.abs(node.x - other.x) >= (size.w + otherSize.w) / 2 || Math.abs(node.y - other.y) >= (size.h + otherSize.h) / 2, `${node.id} overlaps ${other.id}`).toBe(true);
      }
    }
    let peakCargo = 0;
    for (let i = 0; i < 1200; i++) {
      engine.tick(100);
      peakCargo = Math.max(peakCargo, factoryActivity(engine.getState()).transfers);
    }
    expect(peakCargo).toBeGreaterThan(0);
    const sinks = sector.nodes.filter(node => node.id.endsWith('-sink'));
    const before = sinks.map(node => Object.values(node.output).reduce<number>((sum, amount) => sum + (amount ?? 0), 0));
    expect(before.every(amount => amount > 0)).toBe(true);
    const producedBefore = factoryActivity(engine.getState()).produced;
    for (let i = 0; i < 600; i++) engine.tick(100);
    sinks.forEach((node, index) => expect(Object.values(node.output).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)).toBeGreaterThan(before[index]));
    expect(factoryActivity(engine.getState()).produced).toBeGreaterThan(producedBefore);
    engine.togglePause();
    const paused = structuredClone(engine.getState());
    engine.tick(1000);
    expect(engine.getState()).toEqual(paused);
  }, 30000);
});
