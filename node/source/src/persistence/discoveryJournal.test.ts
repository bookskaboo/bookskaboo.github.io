import { describe, expect, it, vi } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { applyExpansionRescue } from '../simulation/expansionRescue';
import { normalizeLegacy } from './saves';

describe('durable discovery journal and version 1 saves', () => {
  it('timestamps an action between ticks and excludes time spent paused', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
    try {
      const engine = new GameEngine(createInitialState(301), { autosave: false });
      engine.startRealtimeClock();
      clock.mockReturnValue(1047.25);
      engine.togglePause();
      clock.mockReturnValue(2047.25);
      engine.tickRealtime();
      expect(engine.getState().playTimeMs).toBe(0);
      expect(engine.connect('forest', 'ironExtractor')).toBe(true);
      expect(engine.getState().researchLog?.find(event => event.projectId === 'joint')?.elapsedMs).toBe(47.25);
      expect(engine.getState().discoveryTimes?.joint).toBe(47.25);
      engine.togglePause();
      clock.mockReturnValue(2110.5);
      engine.tickRealtime();
      expect(engine.getState().playTimeMs).toBe(110.5);
    } finally {
      clock.mockRestore();
    }
  });

  it('records the final emergency rescue time and retains it in a save', () => {
    const state = createInitialState(7);
    state.research.completed = ['exploration'];
    state.rescue = { resources: ['iron', 'stone'] };
    state.sectors['5,5'].nodes.find(node => node.resourceItem === 'copper')!.resourceRemaining = 0;
    state.playTimeMs = 71234.75;
    expect(applyExpansionRescue(state)).toBe(true);
    expect(state.achievements).toContain('destructive-testing');
    const restored = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(restored.achievementTimes?.['destructive-testing']).toBe(71234.75);
  });

  it('retains discoveries after production fills the short activity feed, then round-trips the factory', () => {
    const engine = new GameEngine(createInitialState(301), { autosave: false });
    expect(engine.connect('forest', 'ironExtractor')).toBe(true);
    engine.getState().research.unlocked.push('road');
    const chest = engine.placeNode('woodenChest', 1100, 650)!;
    expect(chest).toBeTruthy();
    expect(engine.connect('ironExtractor', chest)).toBe(true);
    for (let i = 0; i < 900; i++) engine.tick(100);
    const state = engine.getState();
    expect(state.events).toHaveLength(12);
    expect(state.events.every(event => event.projectId !== 'kiln')).toBe(true);
    expect(state.researchLog).toEqual(expect.arrayContaining([
      expect.objectContaining({ projectId: 'joint', elapsedMs: 0 }),
      expect.objectContaining({ projectId: 'kiln', elapsedMs: expect.any(Number) }),
    ]));
    expect(state.discoveryTimes?.kiln).toBeGreaterThan(0);
    const saved = JSON.parse(JSON.stringify(state));
    const restored = normalizeLegacy(saved)!;
    expect(restored.version).toBe(1);
    expect(restored.researchLog).toEqual(state.researchLog);
    expect(restored.discoveryTimes).toEqual(state.discoveryTimes);
    expect(restored.sectors).toEqual(state.sectors);
    expect(restored.research).toEqual(state.research);
    expect(new GameEngine(restored, { autosave: false }).getState().researchLog).toEqual(state.researchLog);
  });

  it('loads baseline version 1 saves without requiring journal fields', () => {
    const original = createInitialState(301);
    original.research.completed = ['kiln'];
    original.research.unlocked.push('kiln');
    const restored = normalizeLegacy(JSON.parse(JSON.stringify(original)))!;
    expect(restored.research.completed).toContain('kiln');
    expect(restored.sectors).toEqual(original.sectors);
    expect(restored.researchLog).toBeUndefined();
    expect(() => new GameEngine(restored, { autosave: false })).not.toThrow();
  });

  it('imports original-game discovery times and achievements', () => {
    const restored = normalizeLegacy({
      version: 1, nodes: [], positions: {}, connections: [],
      runtime: { research: { kilnUnlocked: true } },
      unlockTimes: { extractor: 0, woodenChest: 0, kiln: 12345, invalidKind: 8 },
      achievements: ['oops'], gameElapsedMs: 15000,
    })!;
    expect(restored.discoveryTimes).toEqual({ extractor: 0, woodenChest: 0, kiln: 12345 });
    expect(restored.research.completed).toContain('kiln');
    expect(restored.achievements).toEqual(['oops']);
    expect(restored.playTimeMs).toBe(15000);
  });
});
