import { describe, expect, it } from 'vitest';
import type { ItemId, MachineNode } from '../domain/types';
import { getLizardSettlementForMapTier } from '../content/lizardSettlements';
import { getGoblinSettlementForMapTier } from '../content/goblinSettlements';
import { getNodeDisplayDefinition } from '../content/nodes';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { generateSector, sectorDistance } from './worldGeneration';
import { nodesOverlap } from './collisions';
import { getTributeItems, tributeAmount } from './goblinTribute';

const advance = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds * 10; i++) engine.tick(100); };
const reward = (engine: GameEngine) => engine.getSector().nodes.find(node => node.kind === 'goblinTribute');
const camp = (engine: GameEngine) => engine.getSector().nodes.find(node => node.id === 'lizard')!;
function setup(tier: number) {
  const spec = getLizardSettlementForMapTier(tier);
  const state = createInitialState(37);
  state.sectors['5,5'].nodes = [{ id: 'lizard', kind: 'monster-camp', name: spec.name,
    lizardSettlement: spec.settlement, attackRequirement: spec.attackRequirement, campStrength: 25,
    obstructionMaxRadius: spec.maxRadius, x: 2400, y: 1400, rotation: 0, input: {}, output: {},
    progressMs: 0, cycleMs: 60000, constructedAt: 0, constructionMs: 0 }];
  return new GameEngine(state);
}

describe('Lizard settlements', () => {
  it.each([1, 37, 98765, 2147483647])('places five of each Lizard tier without displacing Goblins or Golems for seed %i', seed => {
    const counts = { camp: 0, village: 0, kingdom: 0 };
    const tierCounts = Array(11).fill(0);
    const occupied = new Set<string>();
    let goblins = 0, golems = 0;
    for (let x = 0; x < 11; x++) for (let y = 0; y < 11; y++) {
      const sector = generateSector(x, y, seed, 0);
      goblins += sector.nodes.filter(node => node.kind === 'monster-camp' && !node.lizardSettlement).length;
      golems += sector.nodes.filter(node => node.kind === 'resourceGolem').length;
      for (const node of sector.nodes.filter(node => node.kind === 'monster-camp' && node.lizardSettlement)) {
        expect(occupied.has(sector.id)).toBe(false); occupied.add(sector.id);
        const tier = sectorDistance(x, y);
        const spec = getLizardSettlementForMapTier(tier);
        counts[node.lizardSettlement!]++; tierCounts[tier]++;
        expect(node.name).toBe(spec.name);
        expect(node.attackRequirement).toBe(spec.attackRequirement);
        expect(node.goblinSettlement).toBeUndefined();
        expect(node.campStrength).toBe(25);
        expect(sector.nodes.some(other => other.kind === 'resourceGolem' || (other.kind === 'monster-camp' && other.id !== node.id))).toBe(false);
        expect(sector.nodes.filter(other => other.id !== node.id).some(other => nodesOverlap(node, other))).toBe(false);
        expect(generateSector(x, y, seed, 0).nodes.find(other => other.id === node.id)).toEqual(node);
      }
    }
    expect(counts).toEqual({ camp: 5, village: 5, kingdom: 5 });
    expect(tierCounts).toEqual([0, 0, 0, 0, 2, 3, 2, 3, 2, 3, 0]);
    expect(occupied.size).toBe(15);
    expect(goblins).toBe(15); expect(golems).toBe(4);
  });

  it.each<[number, ItemId, number, number]>([
    [4, 'heavy-suppression-bot', 3, 24], [5, 'heavy-suppression-bot', 5, 40],
    [6, 'command-suppression-bot', 3, 60], [7, 'command-suppression-bot', 4, 80],
    [8, 'command-suppression-bot', 6, 120], [9, 'command-suppression-bot', 8, 160],
  ])('uses the higher research-aligned suppression requirement at map tier %i', (tier, bot, count, ap) => {
    const engine = setup(tier);
    const node = camp(engine);
    expect(node.attackRequirement).toBe(ap);
    expect(ap).toBeGreaterThan(getGoblinSettlementForMapTier(tier).attackRequirement);
    expect(tributeAmount(node)).toBeGreaterThan(getGoblinSettlementForMapTier(tier).tributePerCycle);
    node.input[bot] = count;
    advance(engine, 60);
    expect(node.campStrength).toBe(15);
    expect(node.input[bot]).toBeUndefined();
    expect(reward(engine)?.lizardSettlement).toBe(node.lizardSettlement);
    expect(getNodeDisplayDefinition(node).accentCss).toBe('#71c99a');
    advance(engine, 5);
    expect(reward(engine)?.output.iron).toBe(tributeAmount(node));
    advance(engine, 55);
    expect(node.campStrength).toBe(25);
    expect(reward(engine)).toBeUndefined();
  });

  it.each(['wood', 'water'] as const)('offers %s tribute and routes it directly without an Extractor', item => {
    const engine = setup(4);
    expect(getTributeItems(engine.getState(), camp(engine))).toContain(item);
    expect(engine.setGoblinTributeItem('lizard', item)).toBe(true);
    camp(engine).input['heavy-suppression-bot'] = 3;
    advance(engine, 60);
    const tribute = reward(engine)!;
    const receiver: MachineNode = { ...tribute, id: 'receiver', kind: item === 'water' ? 'fluidStorage' : 'warehouse', x: tribute.x, y: tribute.y - 400, input: {}, output: {}, tributeCampId: undefined, lizardSettlement: undefined };
    engine.getSector().nodes.push(receiver);
    expect(engine.connect(tribute.id, receiver.id)).toBe(true);
    advance(engine, 8);
    expect((receiver.input[item] ?? 0) + (receiver.output[item] ?? 0)).toBe(20);
    expect(engine.getSector().nodes.some(node => node.kind === 'extractor')).toBe(false);
  });

  it('preserves a 100-item water stockpile and countdown through saves, then destroys it on a failed check', () => {
    let engine = setup(9);
    expect(engine.setGoblinTributeItem('lizard', 'water')).toBe(true);
    expect(engine.setGoblinTributeItem('lizard', 'mythril')).toBe(false);
    camp(engine).input['command-suppression-bot'] = 8;
    advance(engine, 70);
    expect(reward(engine)?.output.water).toBe(100);
    expect(engine.getState().extracted?.water).toBe(100);
    const stockpileId = reward(engine)!.id;
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    expect(camp(engine).lizardSettlement).toBe('kingdom');
    expect(camp(engine).progressMs).toBe(10000);
    expect(reward(engine)?.output.water).toBe(100);
    camp(engine).input['command-suppression-bot'] = 8;
    advance(engine, 50);
    expect(reward(engine)?.id).toBe(stockpileId);
    expect(reward(engine)?.output.water).toBe(100);
    advance(engine, 60);
    expect(reward(engine)).toBeUndefined();
    expect(camp(engine).tributeItem).toBe('water');
    camp(engine).input['command-suppression-bot'] = 8;
    advance(engine, 60);
    expect(reward(engine)?.output).toEqual({});
    expect(reward(engine)?.tributeItem).toBe('water');
  });

  it('keeps Water exclusive to Lizard tribute while preserving legacy Goblin choices', () => {
    const engine = setup(4);
    const node = camp(engine);
    delete node.lizardSettlement; node.goblinSettlement = 'camp';
    expect(getTributeItems(engine.getState(), node)).not.toContain('water');
    expect(engine.setGoblinTributeItem(node.id, 'water')).toBe(false);
    expect(getTributeItems(engine.getState(), node)).toContain('wood');
    expect(tributeAmount(node)).toBe(5);
  });
});
