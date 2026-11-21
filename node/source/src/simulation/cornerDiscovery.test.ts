import { describe, expect, it } from 'vitest';
import { cornerDiscoveryPending } from '../content/endgame';
import { getResearchProject } from '../content/research';
import { isRecipeUnlocked } from '../content/recipes';
import { worldCornerIds } from '../domain/worldGrid';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';

describe('corner discovery acknowledgement', () => {
  it('starts only with Complex Core research and dismisses the map independently from each corner', () => {
    const engine = new GameEngine(createInitialState(41), { autosave: false });
    const game = engine.getState();
    const corners = worldCornerIds(11);
    const before = JSON.stringify(game.sectors);
    engine.acknowledgeCornerDiscovery();
    engine.acknowledgeCornerDiscovery(corners[0]);
    expect(game.endgame?.cornerMapAcknowledged).toBeUndefined();
    expect(cornerDiscoveryPending(game)).toBe(false);
    game.research.completed.push('complexCore');
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
});
