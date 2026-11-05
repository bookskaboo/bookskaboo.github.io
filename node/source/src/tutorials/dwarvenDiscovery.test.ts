import { describe, expect, it } from 'vitest';
import { firstSpottedDwarvenCamp, DWARVEN_DISCOVERY_PROMPT } from './dwarvenDiscovery';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { tutorialNode } from './tutorialRuntime';
import { normalizeLegacy } from '../persistence/saves';
import { lessonCopy } from './tutorialDialogue';

describe('Dwarven discovery and Tribute teaching', () => {
  it('requires a spotted settlement rather than generated or merely unlocked maps', () => {
    const state = createInitialState(8), sector = generateSector(5, 1, state.seed);
    sector.nodes = [tutorialNode('monster-camp', 'dwarf', 1500, 1000, { lizardSettlement: 'camp', settlementMapTier: 4 })];
    state.sectors[sector.id] = sector;
    expect(firstSpottedDwarvenCamp(state)).toBeUndefined();
    sector.unlocked = true; expect(firstSpottedDwarvenCamp(state)).toBeUndefined();
    sector.visited = true; expect(firstSpottedDwarvenCamp(state)?.camp.id).toBe('dwarf');
    state.isTraining = true; expect(firstSpottedDwarvenCamp(state)).toBeUndefined();
  });
  it('acknowledges once per factory, survives reload/undo and resets for a fresh run', () => {
    const engine = new GameEngine(createInitialState(9), { autosave: false });
    engine.getSector().nodes.push(tutorialNode('monster-camp', 'dwarf', 1500, 1000, { lizardSettlement: 'camp', settlementMapTier: 4 }));
    engine.beginMove(); engine.commitMove();
    expect(engine.acknowledgeDwarvenDiscovery()).toBe(true);
    expect(engine.acknowledgeDwarvenDiscovery()).toBe(false);
    engine.undo(); expect(firstSpottedDwarvenCamp(engine.getState())).toBeUndefined();
    const restored = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    expect(restored.tutorialPromptsSeen).toContain(DWARVEN_DISCOVERY_PROMPT);
    expect(firstSpottedDwarvenCamp(restored)).toBeUndefined();
    expect(createInitialState(9).tutorialPromptsSeen ?? []).not.toContain(DWARVEN_DISCOVERY_PROMPT);
  });
  it('ignores Goblins and teaches the real family-specific resources and failure behavior', () => {
    const state = createInitialState(10);
    state.sectors['5,5'].nodes.push(tutorialNode('monster-camp', 'goblin', 1500, 1000));
    expect(firstSpottedDwarvenCamp(state)).toBeUndefined();
    const copy = lessonCopy('monster-camp-growth');
    expect(copy.body).toContain('10%'); expect(copy.body).toContain('Iron, Copper, Stone or Wood');
    expect(copy.body).toContain('Dwarves supply Mythril'); expect(copy.body).toContain('different Tribute amounts');
    expect(copy.body).toContain('removes its Tribute box'); expect(copy.body).toContain('preserving stored Tribute and wiring');
    expect(lessonCopy('monster-camp-suppression').body).toContain('every 60 seconds');
  });
});
