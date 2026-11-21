import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { normalizeLegacy } from '../persistence/saves';
import { isTutorialUnlocked, nextTutorialInvitation, availableTutorials } from './tutorialUnlocks';
import { tutorialNode } from './tutorialRuntime';

describe('progressive tutorial unlocks', () => {
  it('hides Expansion and Monster Camps initially and adds Expansion after Control Groups', () => {
    const game = createInitialState(101);
    expect(availableTutorials(game)).toEqual(['basic', 'logistics', 'control-groups']);
    expect(nextTutorialInvitation(game)).toBeUndefined();
    game.research.selected = 'exploration';
    game.research.completed.push('road', 'suppressionBot');
    expect(availableTutorials(game)).toEqual(['basic', 'logistics', 'control-groups']);
    game.research.completed.push('exploration');
    expect(availableTutorials(game)).toEqual(['basic', 'logistics', 'control-groups', 'expansion']);
    expect(nextTutorialInvitation(game)).toBe('expansion');
  });
  it('does not reveal camps from unexplored maps or from research alone', () => {
    const game = createInitialState(101);
    const outpost = generateSector(4, 5, game.seed, 0);
    outpost.nodes = [tutorialNode('monster-camp', 'camp', 1000, 1000)];
    outpost.visited = false; outpost.unlocked = false;
    game.sectors[outpost.id] = outpost;
    game.research.completed.push('suppressionBot');
    expect(isTutorialUnlocked('monster-camps', game)).toBe(false);
    outpost.unlocked = true;
    expect(isTutorialUnlocked('monster-camps', game)).toBe(false);
    outpost.visited = true;
    expect(isTutorialUnlocked('monster-camps', game)).toBe(true);
    expect(nextTutorialInvitation(game)).toBe('monster-camps');
  });
  it('unlocks the camp tutorial on actual discovery and keeps it unlocked after the camp is gone', () => {
    const game = createInitialState(101);
    game.research.completed.push('exploration'); game.research.mapPoints = 1;
    const outpost = generateSector(4, 5, game.seed, 0);
    outpost.nodes = [tutorialNode('monster-camp', 'camp', 1000, 1000)];
    outpost.visited = false; outpost.unlocked = false; game.sectors[outpost.id] = outpost;
    const engine = new GameEngine(game, { autosave: false });
    engine.acknowledgeTutorialInvitation('expansion');
    expect(engine.unlockSector(4, 5)).toBe(true);
    expect(isTutorialUnlocked('monster-camps', engine.getState())).toBe(false);
    engine.switchSector('4,5');
    expect(engine.getState().encounters).toContain('monster-camp');
    expect(nextTutorialInvitation(engine.getState())).toBe('monster-camps');
    engine.getSector().nodes = [];
    expect(isTutorialUnlocked('monster-camps', engine.getState())).toBe(true);
    expect(availableTutorials(engine.getState())).toEqual(['basic', 'logistics', 'control-groups', 'expansion', 'monster-camps']);
  });
  it('queues and acknowledges each invitation once without changing research or factory contents', () => {
    const engine = new GameEngine(createInitialState(101), { autosave: false });
    expect(engine.acknowledgeTutorialInvitation('expansion')).toBe(false);
    expect(engine.acknowledgeTutorialInvitation('monster-camps')).toBe(false);
    const game = engine.getState();
    game.research.completed.push('exploration'); (game.encounters??=[]).push('monster-camp');
    const research = structuredClone(game.research), sectors = structuredClone(game.sectors);
    expect(nextTutorialInvitation(game)).toBe('expansion');
    expect(engine.acknowledgeTutorialInvitation('expansion')).toBe(true);
    expect(engine.acknowledgeTutorialInvitation('expansion')).toBe(false);
    expect(nextTutorialInvitation(game)).toBe('monster-camps');
    expect(engine.acknowledgeTutorialInvitation('monster-camps')).toBe(true);
    expect(nextTutorialInvitation(game)).toBeUndefined();
    expect(game.research).toEqual(research); expect(game.sectors).toEqual(sectors);
    const restored = normalizeLegacy(JSON.parse(JSON.stringify(game)))!;
    expect(restored.tutorialPromptsSeen).toEqual(['expansion', 'monster-camps']);
    expect(nextTutorialInvitation(restored)).toBeUndefined();
    expect(isTutorialUnlocked('expansion', restored)).toBe(true);
    expect(isTutorialUnlocked('monster-camps', restored)).toBe(true);
  });
  it('keeps acknowledged invitations dismissed when an unrelated factory edit is undone', () => {
    const engine = new GameEngine(createInitialState(101), { autosave: false });
    const game = engine.getState(); game.research.completed.push('exploration');
    engine.beginMove(); engine.commitMove();
    engine.acknowledgeTutorialInvitation('expansion'); engine.undo();
    expect(nextTutorialInvitation(engine.getState())).toBeUndefined();
  });
  it('offers pending invitations for older saves with no invitation history', () => {
    const game = createInitialState(101);
    game.research.completed.push('exploration'); delete game.tutorialPromptsSeen;
    expect(nextTutorialInvitation(normalizeLegacy(game)!)).toBe('expansion');
    game.tutorialPromptsSeen = ['expansion']; (game.encounters ??= []).push('monster-camp');
    expect(nextTutorialInvitation(normalizeLegacy(game)!)).toBe('monster-camps');
  });
  it('keeps Dev-unlocked Expansion available without an invitation, including after reloading', () => {
    const engine = new GameEngine(createInitialState(101), { autosave: false });
    engine.developerUnlockAllResearch();
    const restored = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    expect(availableTutorials(restored)).toContain('expansion');
    expect(nextTutorialInvitation(restored)).toBeUndefined();
    restored.encounters!.push('monster-camp');
    expect(nextTutorialInvitation(restored)).toBeUndefined();

    engine.undo();
    const game = engine.getState();
    expect(game.devResearchUnlocked).toBeUndefined();
    game.research.completed.push('exploration');
    expect(nextTutorialInvitation(game)).toBeUndefined();
    expect(game.devTutorialPromptsSuppressed).toBe(true);
    expect(game.tutorialPromptsSeen??[]).toEqual([]);
  });
  it.each(['developerUnlockAllNodes','developerUnlockAllResearch','developerUnlockAllSectors','developerSuppressTutorialPrompts'] as const)('keeps automatic prompts quiet after %s while leaving manual lessons available',action=>{
    const engine=new GameEngine(createInitialState(101),{autosave:false});
    engine[action]();const game=engine.getState();game.research.completed.push('exploration');(game.encounters??=[]).push('monster-camp');
    expect(nextTutorialInvitation(game)).toBeUndefined();expect(availableTutorials(game)).toContain('expansion');expect(availableTutorials(game)).toContain('monster-camps');
    const restored=normalizeLegacy(JSON.parse(JSON.stringify(game)))!;expect(nextTutorialInvitation(restored)).toBeUndefined();expect(restored.tutorialPromptsSeen??[]).toEqual([]);
    expect(nextTutorialInvitation({...createInitialState(101),research:game.research,encounters:['monster-camp']})).toBe('expansion');
  });
  it.each(['devResearchUnlocked','devMapSurveysRevealed'] as const)('silences older debug saves with %s and no new marker',marker=>{
    const game=createInitialState(101);game[marker]=true;game.research.completed.push('exploration');(game.encounters??=[]).push('monster-camp');
    expect(game.devTutorialPromptsSuppressed).toBeUndefined();expect(nextTutorialInvitation(normalizeLegacy(game)!)).toBeUndefined();
  });
  it('keeps Dev Source factories quiet, including after placement undo, without changing ordinary factories',()=>{
    const engine=new GameEngine(createInitialState(101),{autosave:false});expect(engine.placeNode('devSource',2000,1700)).toBeTruthy();
    engine.undo();const game=engine.getState();game.research.completed.push('exploration');expect(nextTutorialInvitation(game)).toBeUndefined();
    const legacy=createInitialState(101);legacy.research.completed.push('exploration');legacy.sectors['5,5'].nodes.push(tutorialNode('devSource','legacy-dev',2000,1700));
    expect(nextTutorialInvitation(legacy)).toBeUndefined();
  });
});
