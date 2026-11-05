import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { campStatus } from './campStatus';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { normalizeLegacy } from '../persistence/saves';

function fixture(dwarven = false) {
  const state = createInitialState(202);
  state.sectors['5,5'].nodes = [tutorialNode('monster-camp', 'camp', 1700, 1300, { attackRequirement: dwarven ? 6 : 3, cycleMs: 60000, progressMs: 0, campStrength: 25, ...(dwarven ? { lizardSettlement: 'camp' as const, settlementMapTier: 4 } : {}) })];
  const engine = new GameEngine(state, { autosave: false });
  return { engine, node: engine.getSector().nodes[0] };
}
const advance = (engine: GameEngine, ms: number) => { for (let t = 0; t < ms; t += 100) engine.tick(Math.min(100, ms - t)); };

describe('camp check feedback', () => {
  it('fills toward the real sixty-second check and starts neutral', () => {
    const { engine, node } = fixture();
    expect(campStatus(node)).toMatchObject({ result: 'pending', suppliedAp: 0, requiredAp: 3, fraction: 0, secondsRemaining: 60 });
    advance(engine, 30000);
    expect(campStatus(node)).toMatchObject({ fraction: .5, secondsRemaining: 30, result: 'pending' });
    advance(engine, 29900); expect(node.campLastCheck).toBeUndefined();
    advance(engine, 100);
    expect(node.campLastCheck).toEqual({ passed: false, atMs: 60000, suppliedAp: 0, requiredAp: 3 });
    expect(campStatus(node)).toMatchObject({ fraction: 0, secondsRemaining: 60, result: 'failed', color: 0xff6878 });
  });
  it('retains red/green until the next check, independently of newly arriving AP', () => {
    const { engine, node } = fixture(); advance(engine, 60000);
    node.input['suppression-bot'] = 3;
    expect(campStatus(node)).toMatchObject({ suppliedAp: 3, result: 'failed' });
    advance(engine, 59900); expect(campStatus(node).result).toBe('failed');
    advance(engine, 100);
    expect(campStatus(node)).toMatchObject({ suppliedAp: 0, result: 'passed', color: 0x65e69b });
    expect(node.campLastCheck?.suppliedAp).toBe(3);
    advance(engine, 59900); expect(campStatus(node).result).toBe('passed');
    advance(engine, 100); expect(campStatus(node).result).toBe('failed');
  });
  it('persists the actual result and freezes the timer while paused', () => {
    const { engine, node } = fixture(); advance(engine, 61000);
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(restored.getSector().nodes[0].campLastCheck).toEqual(node.campLastCheck);
    restored.getState().paused = true;
    advance(restored, 5000);
    expect(campStatus(restored.getSector().nodes[0])).toMatchObject({ result: 'failed', secondsRemaining: 59 });
  });
  it('uses retained Dwarven AP and updates an immediate retry as an actual check', () => {
    const { engine, node } = fixture(true); advance(engine, 60000);
    node.suppressionCredit = 2; node.input['medium-suppression-bot'] = 2;
    expect(campStatus(node).suppliedAp).toBe(8);
    advance(engine, 100);
    expect(node.campLastCheck).toMatchObject({ passed: true, suppliedAp: 8, requiredAp: 6 });
    expect(campStatus(node)).toMatchObject({ result: 'passed', suppliedAp: 2, fraction: 0, secondsRemaining: 60 });
  });
  it('does not invent a previous result for legacy camps and clamps visual interpolation', () => {
    const { node } = fixture(); node.suppressed = false; node.progressMs = 59900;
    expect(campStatus(node, 500)).toMatchObject({ result: 'pending', fraction: 1, secondsRemaining: 0 });
  });
});
