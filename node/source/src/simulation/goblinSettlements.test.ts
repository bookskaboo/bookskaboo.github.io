import { describe, expect, it } from 'vitest';
import { getGoblinSettlementForMapTier } from '../content/goblinSettlements';
import { BOT_STRENGTH } from '../content/progression';
import type { ItemId, MachineNode } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { generateSector, sectorDistance } from './worldGeneration';
import { nodesOverlap } from './collisions';

function settlement(tier: number): MachineNode {
  const spec = getGoblinSettlementForMapTier(tier);
  return { id: 'settlement', kind: 'monster-camp', name: spec.name, goblinSettlement: spec.settlement,
    attackRequirement: spec.attackRequirement, obstructionMaxRadius: spec.maxRadius, campStrength: 25,
    x: 2400, y: 1400, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 60000, constructedAt: 0, constructionMs: 0 };
}

describe('goblin settlements', () => {
  it.each([1, 37, 98765, 2147483647])('spawns exactly five of each subtype across seed %i', (seed) => {
    const counts = { camp: 0, village: 0, kingdom: 0 };
    const tierCounts = Array(11).fill(0);
    for (let x = 0; x < 11; x++) for (let y = 0; y < 11; y++) {
      const sector = generateSector(x, y, seed, 0);
      const camps = sector.nodes.filter((node) => node.kind === 'monster-camp' && !node.lizardSettlement);
      expect(camps.length).toBeLessThanOrEqual(1);
      for (const camp of camps) {
        const tier = sectorDistance(x, y);
        counts[camp.goblinSettlement!]++;
        tierCounts[tier]++;
        const spec = getGoblinSettlementForMapTier(tier);
        expect(camp.name).toBe(spec.name);
        expect(camp.attackRequirement).toBe(spec.attackRequirement);
        expect(camp.campStrength).toBe(25);
        expect(sector.nodes.filter(other => other.id !== camp.id).some(other => nodesOverlap(camp, other))).toBe(false);
        expect(generateSector(x, y, seed, 0).nodes.find((n) => n.id === camp.id)).toEqual(camp);
      }
    }
    expect(counts).toEqual({ camp: 5, village: 5, kingdom: 5 });
    expect(tierCounts).toEqual([0, 1, 2, 2, 2, 2, 1, 2, 2, 1, 0]);
    expect(generateSector(6, 5, seed, 0).nodes.some(n => n.kind === 'monster-camp')).toBe(false);
    expect(generateSector(7, 5, seed, 0).nodes.some(n => n.kind === 'monster-camp')).toBe(false);
  });

  it.each<[number, ItemId, number]>([
    [1, 'suppression-bot', 3], [4, 'medium-suppression-bot', 3],
    [5, 'heavy-suppression-bot', 2], [6, 'heavy-suppression-bot', 3],
    [7, 'command-suppression-bot', 2], [8, 'command-suppression-bot', 3], [9, 'command-suppression-bot', 4],
  ])('suppresses tier %i with its research-aligned bot supply', (tier, item, count) => {
    const state = createInitialState(37);
    const camp = settlement(tier);
    expect(count * BOT_STRENGTH[item]!).toBe(camp.attackRequirement);
    camp.input[item] = count;
    state.sectors['5,5'].nodes = [camp];
    const engine = new GameEngine(state);
    for (let i = 0; i < 59; i++) engine.tick(1000);
    expect(engine.getSector().nodes[0].campStrength).toBe(25);
    engine.tick(1000);
    expect(engine.getSector().nodes[0].campStrength).toBe(15);
    expect(engine.getSector().nodes[0].input[item]).toBeUndefined();
    for (let i = 0; i < 60; i++) engine.tick(1000);
    expect(engine.getSector().nodes[0].campStrength).toBe(25);
  });

  it('can deliver enough weaker bots for a kingdom through its input buffer', () => {
    const state = createInitialState(37);
    const camp = settlement(9);
    const chest: MachineNode = { ...settlement(1), id: 'supply', kind: 'woodenChest', name: 'Chest', x: 500, input: {}, output: { 'suppression-bot': 80 } };
    state.sectors['5,5'].nodes = [chest, camp];
    const engine = new GameEngine(state);
    expect(engine.connect(chest.id, camp.id)).toBe(true);
    for (let i = 0; i < 600; i++) engine.tick(100);
    const result = engine.getSector().nodes.find(n => n.id === camp.id)!;
    expect(result.campStrength).toBe(15);
    expect(result.input['suppression-bot']).toBeUndefined();
  });

  it('grows below the AP threshold and consumes mixed excess supply without banking it', () => {
    const state = createInitialState(37);
    const camp = settlement(9);
    camp.input['command-suppression-bot'] = 3;
    camp.input['heavy-suppression-bot'] = 2; // 76 AP against 80 required.
    state.sectors['5,5'].nodes = [camp];
    const engine = new GameEngine(state);
    for (let i = 0; i < 60; i++) engine.tick(1000);
    const current = engine.getSector().nodes[0];
    expect(current.campStrength).toBe(35);
    expect(current.input).toEqual({});
    current.input['command-suppression-bot'] = 4;
    current.input['heavy-suppression-bot'] = 1; // 88 AP, including excess.
    engine.getState().research.completed.push('commandRobotics');
    for (let i = 0; i < 60; i++) engine.tick(1000);
    expect(current.campStrength).toBe(25);
    expect(current.input).toEqual({});
    expect(current.attackRequirement).toBe(80);
  });

  it('preserves new settlement metadata and legacy camp state through version one save round trips', () => {
    const state = createInitialState(37);
    const oldCamp = settlement(1);
    delete oldCamp.goblinSettlement;
    oldCamp.id = 'legacy'; oldCamp.attackRequirement = 7; oldCamp.progressMs = 12345;
    oldCamp.input['suppression-bot'] = 4;
    state.sectors['5,5'].nodes = [oldCamp, { ...settlement(4), id: 'village' }, { ...settlement(9), id: 'kingdom' }];
    state.sectors['5,5'].connections = [{ id: 'saved-cable', from: 'village', to: 'kingdom', createdAt: 1 }];
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    const engine = new GameEngine(loaded);
    const saved = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    expect(saved.version).toBe(1);
    expect(saved.sectors['5,5'].nodes).toEqual(state.sectors['5,5'].nodes);
    expect(saved.sectors['5,5'].connections).toEqual(state.sectors['5,5'].connections);
  });
});
