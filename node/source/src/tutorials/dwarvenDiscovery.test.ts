import { describe, expect, it } from 'vitest';
import { firstSpottedDwarvenCamp, DWARVEN_DISCOVERY_PROMPT } from './dwarvenDiscovery';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { tutorialNode } from './tutorialRuntime';
import { normalizeLegacy } from '../persistence/saves';
import { lessonCopy } from './tutorialDialogue';

describe('Dwarven discovery and Tribute teaching', () => {
  it.each(['developerUnlockAllNodes','developerUnlockAllResearch','developerUnlockAllSectors','developerSuppressTutorialPrompts'] as const)('does not open discovery notices after %s, including after reload',action=>{
    const engine=new GameEngine(createInitialState(8),{autosave:false});engine[action]();
    engine.getSector().nodes.push(tutorialNode('monster-camp','quiet-dwarf',1500,1000,{lizardSettlement:'camp',settlementMapTier:4}));
    expect(firstSpottedDwarvenCamp(engine.getState())).toBeUndefined();
    const restored=normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    expect(firstSpottedDwarvenCamp(restored)).toBeUndefined();expect(restored.tutorialPromptsSeen??[]).not.toContain(DWARVEN_DISCOVERY_PROMPT);
  });
  it('keeps older dev-granted or Dev Source factories quiet without acknowledging discovery',()=>{
    for(const marker of ['devResearchUnlocked','devMapSurveysRevealed'] as const){
      const game=createInitialState(8);game[marker]=true;game.sectors['5,5'].visited=true;
      game.sectors['5,5'].nodes.push(tutorialNode('monster-camp','legacy-dwarf',1500,1000,{lizardSettlement:'camp'}));
      expect(firstSpottedDwarvenCamp(game)).toBeUndefined();expect(game.tutorialPromptsSeen??[]).toEqual([]);
    }
    const game=createInitialState(8);game.sectors['5,5'].visited=true;game.sectors['5,5'].nodes.push(tutorialNode('monster-camp','dwarf',1500,1000,{lizardSettlement:'camp'}));
    expect(firstSpottedDwarvenCamp(game)?.camp.id).toBe('dwarf');game.sectors['5,5'].nodes.push(tutorialNode('devSource','old-source',2000,1700));expect(firstSpottedDwarvenCamp(game)).toBeUndefined();
  });
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
  it('keeps settlement rewards a discovery while the practice teaches suppression', () => {
    const state = createInitialState(10);
    state.sectors['5,5'].nodes.push(tutorialNode('monster-camp', 'goblin', 1500, 1000));
    expect(firstSpottedDwarvenCamp(state)).toBeUndefined();
    const growth = lessonCopy('monster-camp-growth');
    expect(growth.instruction).toBe('Continued suppression may bring rewards.');
    const suppression = lessonCopy('monster-camp-suppression');
    expect(suppression.instruction).toContain('Connect the stocked Cart to the camp’s center input');
    expect([suppression, growth].flatMap(({ title, body, instruction }) => [title, body, instruction]).join(' '))
      .not.toMatch(/goblin|dwarv|tribute|mythril|10%/i);
  });
});
