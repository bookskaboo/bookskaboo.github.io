import { describe, expect, it } from 'vitest';
import { isRecipeUnlocked, RECIPES } from '../content/recipes';
import { getEffectiveNodeInputFamilies } from '../content/nodes';
import type { MachineNode } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { GameEngine, createInitialState } from './engine';

const run = (engine: GameEngine, ms: number) => { for (let i = 0; i < ms; i += 100) engine.tick(100); };
function setup(recipeId: string) {
  const state = createInitialState(71);
  const refiner: MachineNode = { id: 'refiner', kind: 'refiner', name: 'Refiner', x: 1300, y: 700, rotation: 0, input: {}, output: {}, recipeId, progressMs: 0, cycleMs: RECIPES[recipeId].cycleMs, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [refiner];
  state.research.completed = ['refiner'];
  if (recipeId.startsWith('mythril-')) state.research.completed.push('mithrilTools');
  state.research.unlocked.push('refiner', 'road');
  return new GameEngine(state, { autosave: false });
}

describe('explicit Refiner material recipes', () => {
  it('hides Mythril recipes until first Dwarven Tribute production and announces the new options once', () => {
    const engine = setup('copper-gear');
    const state = engine.getState();
    const recipes = ['mythril-gear', 'mythril-wire', 'smelt-mythril'];
    recipes.forEach(id => expect(isRecipeUnlocked(id, state.research.completed)).toBe(false));
    expect(engine.setRecipe('refiner', 'mythril-gear')).toBe(false);
    const sector = structuredClone(engine.getSector());
    sector.id = '6,5'; sector.x = 6; sector.unlocked = true; sector.visited = false;
    sector.nodes = [{ ...sector.nodes[0], id: 'mythril', kind: 'mythril', recipeId: undefined, name: 'Mythril', resourceItem: 'mythril', resourceRemaining: 1000 }];
    state.sectors[sector.id] = sector;
    run(engine, 100);
    recipes.forEach(id => expect(isRecipeUnlocked(id, state.research.completed)).toBe(false));
    engine.switchSector(sector.id);
    recipes.forEach(id => expect(isRecipeUnlocked(id, state.research.completed)).toBe(false));
    state.dwarvenMythrilProduced = true; run(engine, 100);
    recipes.forEach(id => expect(isRecipeUnlocked(id, state.research.completed)).toBe(true));
    const announcements = state.researchLog!.filter(event => event.projectId === 'mithrilTools');
    expect(announcements).toHaveLength(1);
    expect(announcements[0].message).toContain('Mythril Gear and Mythril Wire in the Refiner');
    engine.switchSector('5,5'); engine.switchSector(sector.id);
    expect(state.researchLog!.filter(event => event.projectId === 'mithrilTools')).toHaveLength(1);
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    recipes.forEach(id => expect(isRecipeUnlocked(id, restored.getState().research.completed)).toBe(true));
    expect(restored.getState().researchLog!.filter(event => event.projectId === 'mithrilTools')).toHaveLength(1);
  });

  it.each(['iron-gear', 'copper-gear', 'mythril-gear', 'iron-wire', 'copper-wire', 'mythril-wire'])('produces %s only from its chosen material', recipeId => {
    const engine = setup(recipeId);
    const recipe = RECIPES[recipeId];
    const refiner = engine.getSector().nodes[0];
    const chestId = engine.placeNode('woodenChest', 1000, 700)!;
    const chest = engine.getSector().nodes.find(n => n.id === chestId)!;
    expect(engine.connect(chestId, refiner.id)).toBe(true);
    const wrongItem = recipeId.startsWith('copper') ? 'iron-plate' : 'copper-plate';
    chest.output[wrongItem] = 3;
    run(engine, 4000);
    expect(refiner.recipeId).toBe(recipeId);
    expect(refiner.input).toEqual({});
    expect(refiner.output).toEqual({});
    expect(chest.output[wrongItem]).toBe(3);
    expect(engine.getState().inFlightTransfers).toEqual([]);
    chest.output = { ...recipe.inputs };
    run(engine, 6000);
    expect(refiner.recipeId).toBe(recipeId);
    expect(refiner.output).toEqual(recipe.outputs);
    expect(getEffectiveNodeInputFamilies(refiner, [])).toEqual(Object.keys(recipe.inputs));
  });

  it('rejects a concrete wrong-material cable and disconnects it when changing material', () => {
    const engine = setup('copper-gear');
    const sourceId = engine.placeNode('refiner', 1000, 700)!;
    expect(engine.setRecipe(sourceId, 'iron-gear')).toBe(true);
    expect(engine.connect(sourceId, 'refiner')).toBe(false);
    const chestId = engine.placeNode('woodenChest', 1000, 1000)!;
    expect(engine.connect(chestId, 'refiner')).toBe(true);
    engine.getSector().connections[0].item = 'copper-plate';
    expect(engine.setRecipe('refiner', 'iron-wire')).toBe(true);
    expect(engine.getSector().connections).toEqual([]);
  });

  it('round-trips a version 1 working Copper Gear factory, including its in-progress cycle', () => {
    const engine = setup('copper-gear');
    const refiner = engine.getSector().nodes[0];
    refiner.input = { 'copper-plate': 2 };
    refiner.output = { 'copper-gear': 2 };
    refiner.progressMs = 800;
    const chestId = engine.placeNode('woodenChest', 1000, 700)!;
    expect(engine.connect(chestId, refiner.id)).toBe(true);
    engine.getSector().connections[0].item = 'copper-plate';
    const state = engine.getState();
    const restored = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(restored.version).toBe(1);
    expect(restored.sectors).toEqual(state.sectors);
    expect(restored.research).toEqual(state.research);
    const resumed = new GameEngine(restored, { autosave: false });
    run(resumed, 2300);
    expect(resumed.getSector().nodes[0]).toMatchObject({ recipeId: 'copper-gear', input: { 'copper-plate': 0 }, output: { 'copper-gear': 3 } });
  });

  it('imports the material already selected by an original-game Gear mode', () => {
    const restored = normalizeLegacy({ version: 1, nodes: [{ id: 'old', kind: 'refiner', title: 'Refiner' }], positions: { old: { x: 1000, y: 700 } }, connections: [], runtime: { research: { refinerUnlocked: true }, processors: { old: { refinerRecipe: 'gear', materialType: 'COPPER', inputs: { COPPER_PLATE: 1 }, outputs: { COPPER_GEAR: 1 }, progress: 500 } } } })!;
    expect(restored.sectors['5,5'].nodes[0]).toMatchObject({ recipeId: 'copper-gear', input: { 'copper-plate': 1 }, progressMs: 500 });
  });

  it('retains Mythril discovery from saved materials when old saves lack encounter history', () => {
    const engine = setup('mythril-wire');
    const state = engine.getState();
    state.research.completed = ['refiner'];
    delete state.reviewedProductionVersion;
    state.encounters = [];
    state.sectors['5,5'].nodes[0].input = { 'mythril-plate': 3 };
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false });
    expect(restored.getState().encounters).toContain('mythril');
    expect(isRecipeUnlocked('mythril-wire', restored.getState().research.completed)).toBe(true);
    expect(restored.getSector().nodes[0].input).toEqual({ 'mythril-plate': 3 });
    run(restored, 3000);
    expect(restored.getSector().nodes[0].output).toEqual({ 'mythril-wire': 1 });
  });
});
