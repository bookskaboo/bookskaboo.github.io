import { describe, expect, it } from 'vitest';
import { cornerDiscoveryPending } from '../content/endgame';
import { getResearchProject } from '../content/research';
import { isRecipeUnlocked } from '../content/recipes';
import { worldCornerIds } from '../domain/worldGrid';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { generateSector } from './worldGeneration';
import { mapCornerMarkers } from '../ui/mapNodePresentation';

describe('corner discovery acknowledgement', () => {
  it('starts with Complex upgrade, not Shiny upgrade, and dismisses the map independently from each corner', () => {
    const engine = new GameEngine(createInitialState(41), { autosave: false });
    const game = engine.getState();
    const corners = worldCornerIds(11);
    const before = JSON.stringify(game.sectors);
    engine.acknowledgeCornerDiscovery();
    engine.acknowledgeCornerDiscovery(corners[0]);
    expect(game.endgame?.cornerMapAcknowledged).toBeUndefined();
    expect(cornerDiscoveryPending(game)).toBe(false);
    game.research.completed.push('complexCore');
    expect(cornerDiscoveryPending(game)).toBe(false);
    game.research.completed.push('finalCore');
    expect(cornerDiscoveryPending(game)).toBe(true);
    expect(corners.map(id => cornerDiscoveryPending(game, id))).toEqual([true, true, true, true]);
    engine.acknowledgeCornerDiscovery(corners[0]);
    engine.acknowledgeCornerDiscovery(corners[0]);
    engine.acknowledgeCornerDiscovery('5,5');
    expect(game.endgame?.acknowledgedCorners).toEqual([corners[0]]);
    expect(cornerDiscoveryPending(game)).toBe(true);
    engine.acknowledgeCornerDiscovery();
    expect(cornerDiscoveryPending(game)).toBe(false);
    expect(corners.map(id => cornerDiscoveryPending(game, id))).toEqual([false, true, true, true]);
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(game)))!, { autosave: false });
    expect(cornerDiscoveryPending(restored.getState())).toBe(false);
    expect(corners.map(id => cornerDiscoveryPending(restored.getState(), id))).toEqual([false, true, true, true]);
    corners.slice(1).forEach(id => restored.acknowledgeCornerDiscovery(id));
    expect(corners.some(id => cornerDiscoveryPending(restored.getState(), id))).toBe(false);
    expect(JSON.stringify(game.sectors)).toBe(before);
    expect(JSON.stringify(restored.getState().sectors)).toBe(before);
  });

  it('preserves retired milestone access without retaining a live project or requiring a new payment', () => {
    const state = createInitialState(41);
    state.research.completed = ['assembler', 'cornerComponents'];
    state.research.unlocked = ['extractor', 'assembler', 'cornerComponents'];
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(loaded.research.completed).toEqual(expect.arrayContaining(['cornerComponents', 'complexCore']));
    expect(loaded.research.unlocked).toContain('complexCore');
    expect(getResearchProject('cornerComponents')).toBeUndefined();
    for (let pair = 0; pair < 3; pair++) {
      expect(isRecipeUnlocked(`core-half-a-${pair}`, loaded.research.completed)).toBe(true);
      expect(isRecipeUnlocked(`core-half-b-${pair}`, loaded.research.completed)).toBe(true);
    }
    const engine = new GameEngine(loaded, { autosave: false });
    expect(engine.getState().researchLog?.some(event => event.projectId === 'cornerComponents')).not.toBe(true);
  });

  it('does not infer paid Final Core research from Complex Core alone when migrating pre-project saves', () => {
    const state = createInitialState(41);
    delete state.coreResearchVersion;
    state.research.completed = ['complexCore'];
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(loaded.research.completed).toContain('complexCore');
    expect(loaded.research.completed).not.toContain('finalCore');
    expect(loaded.research.completed).not.toContain('cornerComponents');
  });

  it('preserves older Shiny-earned access without granting or paying Complex upgrade', () => {
    const state=createInitialState(41);
    delete state.research.endgameUnlockVersion;
    state.research.completed.push('complexCore');
    state.research.selected='finalCore';
    state.research.contributed={'command-core':2};
    const loaded=normalizeLegacy(state)!;
    expect(loaded.research.endgameUnlockVersion).toBe(1);
    expect(loaded.research.legacyHalfRecipesUnlocked).toBe(true);
    expect(loaded.research.legacyCornerLocationsRevealed).toBe(true);
    expect(loaded.research.completed).not.toContain('finalCore');
    expect(loaded.research.selected).toBe('finalCore');
    expect(loaded.research.contributed).toEqual({'command-core':2});
    for(let pair=0;pair<3;pair++)for(const half of ['a','b'])expect(isRecipeUnlocked(`core-half-${half}-${pair}`,loaded.research.completed,loaded.research.legacyHalfRecipesUnlocked)).toBe(true);
    expect(isRecipeUnlocked('final-core',loaded.research.completed,loaded.research.legacyHalfRecipesUnlocked)).toBe(false);
    expect(normalizeLegacy(loaded)?.research).toEqual(loaded.research);
  });

  it('keeps new Shiny-stage factories locked through reload rather than treating them as legacy', () => {
    const state=createInitialState(41);
    state.research.completed.push('complexCore');
    const loaded=normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(loaded.research.endgameUnlockVersion).toBe(1);
    expect(loaded.research.legacyHalfRecipesUnlocked).toBeUndefined();
    expect(loaded.research.legacyCornerLocationsRevealed).toBeUndefined();
    expect(isRecipeUnlocked('core-half-a-0',loaded.research.completed,loaded.research.legacyHalfRecipesUnlocked)).toBe(false);
    expect(mapCornerMarkers(loaded).size).toBe(0);
  });

  it('preserves an old corner visit as map knowledge without granting half recipes or an upgrade', () => {
    const state=createInitialState(41);
    delete state.research.endgameUnlockVersion;
    const corner=generateSector(0,0,state.seed,0);
    corner.unlocked=true;corner.visited=true;state.sectors[corner.id]=corner;
    const loaded=normalizeLegacy(state)!;
    expect(loaded.research.legacyCornerLocationsRevealed).toBe(true);
    expect(loaded.research.legacyHalfRecipesUnlocked).toBeUndefined();
    expect(mapCornerMarkers(loaded).size).toBe(4);
    expect(loaded.research.completed).not.toContain('finalCore');
    expect(isRecipeUnlocked('core-half-a-0',loaded.research.completed,loaded.research.legacyHalfRecipesUnlocked)).toBe(false);
  });

  it('rejects unsupported saved endgame access metadata', () => {
    const state=createInitialState(41);
    expect(normalizeLegacy({...state,research:{...state.research,endgameUnlockVersion:2}})).toBeNull();
    expect(normalizeLegacy({...state,research:{...state.research,legacyHalfRecipesUnlocked:'yes'}})).toBeNull();
  });
});
