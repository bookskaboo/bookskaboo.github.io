import { describe, expect, it } from 'vitest';
import type { ItemId } from '../domain/types';
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
function botCart(engine: GameEngine, stock: Partial<Record<ItemId, number>> = {}) {
  const cart = tutorialNode('woodenChest', 'supply', 500, 1300, { output: stock });
  engine.getSector().nodes.push(cart);
  return cart;
}

describe('camp check feedback', () => {
  it.each([false, true])('delivers and counts every bot tier on one cable with dwarven = %s', dwarven => {
    const { engine, node } = fixture(dwarven);
    const cart = botCart(engine);
    expect(engine.connect(cart.id, node.id)).toBe(true);
    const arrivals = [
      ['suppression-bot', 1], ['medium-suppression-bot', 4],
      ['heavy-suppression-bot', 12], ['command-suppression-bot', 36],
    ] as const;
    for (const [bot, suppliedAp] of arrivals) {
      cart.input[bot] = 1;
      advance(engine, 2000);
      expect(node.input[bot]).toBe(1);
      expect(campStatus(node).suppliedAp).toBe(suppliedAp);
    }
    advance(engine, 52000);
    expect(node.campLastCheck).toMatchObject({ passed: true, suppliedAp: 36, requiredAp: dwarven ? 6 : 3 });
    expect(node.input).toEqual(dwarven
      ? { 'suppression-bot': 1, 'medium-suppression-bot': 1, 'command-suppression-bot': 1 }
      : { 'suppression-bot': 1, 'heavy-suppression-bot': 1, 'command-suppression-bot': 1 });
    expect(campStatus(node).suppliedAp).toBe(dwarven ? 30 : 33);
  });

  it('rejects non-bot cargo at the camp input', () => {
    const { engine, node } = fixture();
    const cart = botCart(engine, { 'iron-plate': 1 });
    expect(engine.connect(cart.id, node.id)).toBe(false);
    expect(cart.output).toEqual({ 'iron-plate': 1 });
    expect(campStatus(node).suppliedAp).toBe(0);
  });

  it('feeds two bot production lines into the same camp through a Cart', () => {
    const { engine, node } = fixture();
    node.attackRequirement = 9;
    const cart = botCart(engine);
    const small = tutorialNode('assembler', 'small', 180, 970, {
      recipeId: 'suppression-bot', output: { 'suppression-bot': 1 },
    });
    const heavy = tutorialNode('advancedAssembler', 'heavy', 180, 1630, {
      recipeId: 'heavy-suppression-bot', output: { 'heavy-suppression-bot': 1 },
    });
    engine.getSector().nodes.push(small, heavy);
    expect(engine.connect(small.id, cart.id)).toBe(true);
    expect(engine.connect(heavy.id, cart.id)).toBe(true);
    expect(engine.connect(cart.id, node.id)).toBe(true);
    advance(engine, 60000);
    expect(node.campLastCheck).toEqual({ passed: true, atMs: 60000, suppliedAp: 9, requiredAp: 9 });
    expect(node.input).toEqual({});
  });

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
  it('keeps Dwarven bots after a shortfall and retries when the next bot arrives', () => {
    const { engine, node } = fixture(true);
    const cart = botCart(engine, { 'suppression-bot': 1, 'medium-suppression-bot': 1 });
    expect(engine.connect(cart.id, node.id)).toBe(true);
    advance(engine, 60000);
    expect(node.campLastCheck).toMatchObject({ passed: false, suppliedAp: 4, requiredAp: 6 });
    expect(node.input).toEqual({ 'suppression-bot': 1, 'medium-suppression-bot': 1 });
    cart.input['heavy-suppression-bot'] = 1;
    advance(engine, 2000);
    const retryAt = node.campLastCheck!.atMs;
    expect(retryAt).toBeGreaterThan(60000);
    expect(retryAt).toBeLessThan(62000);
    expect(node.campLastCheck).toMatchObject({ passed: true, suppliedAp: 12, requiredAp: 6 });
    expect(node.suppressionCredit).toBe(2);
    expect(campStatus(node)).toMatchObject({ result: 'passed', suppliedAp: 6, secondsRemaining: 60 });
    advance(engine, retryAt + 60000 - engine.getState().playTimeMs);
    expect(node.campLastCheck).toEqual({ passed: true, atMs: retryAt + 60000, suppliedAp: 6, requiredAp: 6 });
    expect(campStatus(node).suppliedAp).toBe(0);
  });
  it('does not invent a previous result for legacy camps and clamps visual interpolation', () => {
    const { node } = fixture(); node.suppressed = false; node.progressMs = 59900;
    expect(campStatus(node, 500)).toMatchObject({ result: 'pending', fraction: 1, secondsRemaining: 0 });
  });
});
