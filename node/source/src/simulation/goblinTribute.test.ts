import { describe, expect, it } from 'vitest';
import type { MachineNode } from '../domain/types';
import { getGoblinSettlementForMapTier } from '../content/goblinSettlements';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { nodesOverlap } from './collisions';

const advance = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds * 10; i++) engine.tick(100); };
const tribute = (engine: GameEngine) => engine.getSector().nodes.find(node => node.kind === 'goblinTribute');
const camp = (engine: GameEngine) => engine.getSector().nodes.find(node => node.id === 'camp')!;
function setup(tier = 1) {
  const spec = getGoblinSettlementForMapTier(tier);
  const settlement: MachineNode = { id: 'camp', kind: 'monster-camp', name: spec.name,
    goblinSettlement: spec.settlement, attackRequirement: spec.attackRequirement, campStrength: 15,
    obstructionMaxRadius: 600, x: 2400, y: 1400, rotation: 0,
    input: { 'suppression-bot': spec.attackRequirement }, output: {}, progressMs: 0,
    cycleMs: 60000, constructedAt: 0, constructionMs: 0 };
  const state = createInitialState(37);
  state.sectors['5,5'].nodes = [settlement];
  return new GameEngine(state);
}

describe('goblin tribute', () => {
  it('waits for the 10% minimum, then removes tribute when the camp grows again', () => {
    const engine = setup();
    camp(engine).campStrength = 25;
    advance(engine, 60);
    expect(camp(engine).campStrength).toBe(15);
    expect(camp(engine).suppressed).toBe(true);
    expect(tribute(engine)).toBeUndefined();
    camp(engine).input['suppression-bot'] = 3;
    advance(engine, 60);
    expect(camp(engine).campStrength).toBe(10);
    expect(tribute(engine)?.name).toBe('Tribute');
    advance(engine, 60);
    expect(camp(engine).campStrength).toBe(20);
    expect(tribute(engine)).toBeUndefined();
  });
  it.each([[1, 5], [4, 15], [9, 30]])('rewards tier %i with %i materials per five seconds only after suppression', (tier, amount) => {
    const engine = setup(tier);
    advance(engine, 59.9);
    expect(tribute(engine)).toBeUndefined();
    advance(engine, .1);
    const reward = tribute(engine)!;
    expect(reward.output).toEqual({});
    expect(reward.capacity).toBe(100);
    expect(nodesOverlap(reward, { ...camp(engine), campStrength: 100 })).toBe(false);
    advance(engine, 4.9);
    expect(reward.output).toEqual({});
    advance(engine, .1);
    expect(reward.output.iron).toBe(amount);
    expect(engine.getState().extracted?.iron).toBe(amount);
  });

  it('retains the same tribute and stockpile across successful checks, caps at 100, and loses everything on failure', () => {
    const engine = setup(9);
    advance(engine, 60);
    const reward = tribute(engine)!;
    camp(engine).input['command-suppression-bot'] = 4;
    advance(engine, 60);
    expect(tribute(engine)).toBe(reward);
    expect(reward.output.iron).toBe(100); // Partial final batch fills 90 to exactly 100.
    expect(engine.getState().extracted?.iron).toBe(100);
    expect(engine.getSector().nodes.filter(node => node.kind === 'goblinTribute')).toHaveLength(1);
    advance(engine, 60);
    expect(camp(engine).suppressed).toBe(false);
    expect(tribute(engine)).toBeUndefined();
    camp(engine).input['command-suppression-bot'] = 4;
    advance(engine, 60);
    expect(tribute(engine)?.output).toEqual({});
  });

  it('allows direct output, cleans cables and pending items on failure, and does not leave ghost deliveries', () => {
    const engine = setup();
    advance(engine, 60);
    const reward = tribute(engine)!;
    const receiver: MachineNode = { ...reward, id: 'receiver', kind: 'woodenChest', name: 'Chest', x: reward.x, y: reward.y - 400, tributeCampId: undefined };
    engine.getSector().nodes.push(receiver);
    expect(engine.connect(reward.id, receiver.id)).toBe(true);
    advance(engine, 6);
    expect((receiver.input.iron ?? 0) + (receiver.output.iron ?? 0)).toBe(5);
    const extractor = { ...receiver, id: 'extractor', kind: 'extractor' as const, x: reward.x, y: reward.y + 400 };
    engine.getSector().nodes.push(extractor);
    expect(engine.connect(reward.id, extractor.id)).toBe(false);
    const edge = engine.getSector().connections.find(connection => connection.from === reward.id)!;
    engine.getState().inFlightTransfers!.push({ id: 'pending', sectorId: engine.getSector().id, connectionId: edge.id, from: reward.id, to: receiver.id, item: 'iron', launchedAtMs: 66000, arrivesAtMs: 200000 });
    advance(engine, 54);
    expect(tribute(engine)).toBeUndefined();
    expect(engine.getSector().connections.some(connection => connection.from === reward.id || connection.to === reward.id)).toBe(false);
    expect(engine.getState().inFlightTransfers?.some(transfer => transfer.from === reward.id)).toBe(false);
  });

  it('customizes tribute, gates Mythril, and sacrifices other stored materials when changed', () => {
    const engine = setup();
    expect(engine.setGoblinTributeItem('camp', 'copper')).toBe(true);
    expect(engine.setGoblinTributeItem('camp', 'mythril')).toBe(false);
    advance(engine, 65);
    const reward = tribute(engine)!;
    expect(reward.output).toEqual({ copper: 5 });
    expect(engine.setGoblinTributeItem(reward.id, 'mythril')).toBe(false);
    expect(reward.output).toEqual({ copper: 5 });
    reward.output.stone = 2;
    expect(engine.setGoblinTributeItem(reward.id, 'stone')).toBe(true);
    expect(reward.output).toEqual({ stone: 2 });
    advance(engine, 5);
    expect(reward.output).toEqual({ stone: 7 });
    reward.output = {};
    engine.getState().research.completed.push('mithrilTools');
    expect(engine.setGoblinTributeItem('camp', 'mythril')).toBe(false);
    advance(engine, 5);
    expect(reward.output).toEqual({ stone: 5 });
    advance(engine, 45);
    expect(tribute(engine)).toBeUndefined();
    camp(engine).input['suppression-bot'] = 3;
    advance(engine, 60);
    expect(tribute(engine)?.tributeItem).toBe('stone');
    expect(tribute(engine)?.output).toEqual({});
  });

  it('allows a material change while old deliveries are in flight and leaves committed deliveries intact', () => {
    const engine = setup(); advance(engine, 65);
    const reward = tribute(engine)!;
    const receiver: MachineNode = { ...reward, id: 'receiver', kind: 'woodenChest', x: reward.x, y: reward.y - 400, input: {}, output: {}, tributeCampId: undefined };
    engine.getSector().nodes.push(receiver);
    expect(engine.connect(reward.id, receiver.id)).toBe(true);
    reward.output.iron = 4;
    const cable = engine.getSector().connections.find(c => c.from === reward.id)!;
    engine.getState().inFlightTransfers!.push({ id: 'committed', sectorId: '5,5', connectionId: cable.id, from: reward.id, to: 'receiver', item: 'iron', launchedAtMs: 65000, arrivesAtMs: 66000 });
    expect(engine.setGoblinTributeItem(reward.id, 'wood')).toBe(true);
    expect(reward.output).toEqual({});
    expect(engine.getState().inFlightTransfers?.[0].item).toBe('iron');
    advance(engine, 1);
    expect((receiver.input.iron ?? 0) + (receiver.output.iron ?? 0)).toBe(1);
  });

  it('removes premature legacy tribute on loading even while paused', () => {
    const engine = setup(); advance(engine, 60);
    const saved = structuredClone(engine.getState());
    saved.paused = true; saved.sectors['5,5'].nodes.find(n => n.id === 'camp')!.campStrength = 15;
    const loaded = new GameEngine(saved);
    expect(tribute(loaded)).toBeUndefined();
  });

  it('preserves suppression, selected material, stockpile, cycle progress and AP countdown through a v1 save', () => {
    const engine = setup();
    engine.setGoblinTributeItem('camp', 'copper');
    advance(engine, 67);
    const saved = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    const loaded = new GameEngine(saved);
    expect(camp(loaded).suppressed).toBe(true);
    expect(camp(loaded).progressMs).toBe(7000);
    expect(tribute(loaded)?.output.copper).toBe(5);
    expect(tribute(loaded)?.progressMs).toBe(2000);
    advance(loaded, 53);
    expect(tribute(loaded)).toBeUndefined();
    expect(camp(loaded).tributeItem).toBe('copper');
  });

  it('removes an orphan reward and creates nothing when a check fails', () => {
    const engine = setup();
    camp(engine).campStrength = 10;
    camp(engine).input = {};
    advance(engine, 60);
    expect(tribute(engine)).toBeUndefined();
    camp(engine).input['suppression-bot'] = 3;
    advance(engine, 60);
    expect(tribute(engine)).toBeDefined();
    engine.getSector().nodes = engine.getSector().nodes.filter(node => node.kind !== 'monster-camp');
    advance(engine, .1);
    expect(tribute(engine)).toBeUndefined();
  });
});
