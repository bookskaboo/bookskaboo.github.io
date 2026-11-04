import { describe, expect, it } from 'vitest';
import type { ItemId, MachineNode } from '../domain/types';
import { getLizardSettlementForMapTier } from '../content/lizardSettlements';
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
    lizardSettlement: spec.settlement, settlementMapTier: spec.mapTier, attackRequirement: spec.attackRequirement, campStrength: 25,
    obstructionMaxRadius: spec.maxRadius, x: 2400, y: 1400, rotation: 0, input: {}, output: {},
    progressMs: 0, cycleMs: 60000, constructedAt: 0, constructionMs: 0 }];
  return new GameEngine(state);
}

describe('Dwarven settlements (legacy lizard save key)', () => {
  it.each([1, 37, 98765, 2147483647])('places five of each Dwarven tier without displacing Goblins or Golems for seed %i', seed => {
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
    [4, 'medium-suppression-bot', 2, 6], [5, 'medium-suppression-bot', 4, 12],
    [6, 'medium-suppression-bot', 6, 18], [7, 'medium-suppression-bot', 10, 30],
    [8, 'heavy-suppression-bot', 6, 48], [9, 'heavy-suppression-bot', 9, 72],
  ])('uses the higher research-aligned suppression requirement at map tier %i', (tier, bot, count, ap) => {
    const engine = setup(tier);
    const node = camp(engine);
    expect(node.attackRequirement).toBe(ap);
    node.input[bot] = count;
    advance(engine, 60);
    expect(node.campStrength).toBe(15);
    expect(node.input[bot]).toBeUndefined();
    expect(reward(engine)).toBeUndefined();
    node.input[bot] = count;
    advance(engine, 60);
    expect(node.campStrength).toBe(10);
    expect(reward(engine)?.lizardSettlement).toBe(node.lizardSettlement);
    expect(getNodeDisplayDefinition(node).accentCss).toBe('#71c99a');
    advance(engine, 5);
    expect(reward(engine)?.output.mythril).toBe(tributeAmount(node));
    advance(engine, 55);
    expect(node.campStrength).toBe(20);
    expect(reward(engine)).toBeDefined();
  });

  it('offers Mythril tribute without a research gate and routes it directly without an Extractor', () => {
    const item = 'mythril';
    const engine = setup(4);
    camp(engine).campStrength = 15;
    expect(getTributeItems(engine.getState(), camp(engine))).toContain(item);
    expect(getTributeItems(engine.getState(), camp(engine))).not.toContain('water');
    expect(engine.setGoblinTributeItem('lizard', item)).toBe(true);
    camp(engine).input['heavy-suppression-bot'] = 3;
    advance(engine, 60);
    const tribute = reward(engine)!;
    const receiver: MachineNode = { ...tribute, id: 'receiver', kind: 'warehouse', x: tribute.x, y: tribute.y - 400, input: {}, output: {}, tributeCampId: undefined, lizardSettlement: undefined };
    engine.getSector().nodes.push(receiver);
    expect(engine.connect(tribute.id, receiver.id)).toBe(true);
    advance(engine, 8);
    expect((receiver.input[item] ?? 0) + (receiver.output[item] ?? 0)).toBe(1);
    expect(engine.getSector().nodes.some(node => node.kind === 'extractor')).toBe(false);
  });

  it('preserves earned Mythril stock and the box through save/load and failed upkeep', () => {
    let engine = setup(9); camp(engine).campStrength = 15;
    camp(engine).input['command-suppression-bot'] = 4;
    advance(engine, 70);
    expect(reward(engine)?.output.mythril).toBe(48);
    const id = reward(engine)!.id;
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    expect(reward(engine)?.output.mythril).toBe(48);
    advance(engine, 50);
    expect(camp(engine).suppressionRetry).toBe(true);
    expect(reward(engine)?.id).toBe(id);
    const amount = reward(engine)!.output.mythril;
    advance(engine, 10); expect(reward(engine)?.output.mythril).toBe(amount);
  });

  it('preserves Goblin material choices and their Mythril research gate', () => {
    const engine = setup(4);
    const node = camp(engine);
    delete node.lizardSettlement; node.goblinSettlement = 'camp';
    expect(getTributeItems(engine.getState(), node)).not.toContain('water');
    expect(engine.setGoblinTributeItem(node.id, 'water')).toBe(false);
    expect(getTributeItems(engine.getState(), node)).toContain('wood');
    expect(getTributeItems(engine.getState(), node)).not.toContain('mythril');
    expect(tributeAmount(node)).toBe(5);
  });

  it('renames saved Lizard camps without changing IDs, countdowns, bots or existing tribute stock', () => {
    const engine = setup(6);
    const state = engine.getState();
    const node = camp(engine);
    node.name = 'Lizard Village'; node.tributeItem = 'water'; node.campStrength = 10;
    delete node.tributeSelectionVersion;
    node.suppressed = true; node.progressMs = 12345; node.input = { 'heavy-suppression-bot': 4 };
    state.sectors['5,5'].nodes.push({ ...node, kind: 'goblinTribute', id: 'old-tribute', tributeCampId: node.id, name: 'Lizard Village Tribute', x: node.x + 1000, progressMs: 0, output: { water: 40 }, input: {} });
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!);
    expect(camp(loaded)).toMatchObject({ id: 'lizard', name: 'Dwarven Village', lizardSettlement: 'village', tributeItem: 'mythril', progressMs: 12345, input: { 'heavy-suppression-bot': 4 } });
    expect(reward(loaded)).toMatchObject({ id: 'old-tribute', name: 'Tribute', output: { water: 40 } });
    advance(loaded, 5);
    expect(reward(loaded)?.output).toEqual({ water: 40, mythril: 5 });
    expect(loaded.setGoblinTributeItem('old-tribute', 'copper')).toBe(false);
    expect(loaded.setGoblinTributeItem('old-tribute', 'copper')).toBe(false);
    const reloaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(loaded.getState())))!);
    expect(camp(reloaded).tributeItem).toBe('mythril');
  });
});
