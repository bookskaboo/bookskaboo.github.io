import { seededCornerOrder } from './endgame';
import { describe, expect, it } from 'vitest';
import { createTutorialState, tutorialNode, basicTutorialRefinerRecipe } from '../tutorials/tutorialRuntime';
import { createInitialState, GameEngine } from '../simulation/engine';
import { NODE_DEFINITIONS } from './nodes';
import { RECIPES, RECIPE_GROUPS } from './recipes';
import type { NodeKind } from '../domain/types';
import { accessibleRecipeMaterials, isRecipeAvailable } from './recipeAvailability';
import { recipeGuideGroups } from '../ui/recipeGuide';

const catalog = Object.entries(RECIPE_GROUPS).flatMap(([kind, ids]) => ids.map(id => ({ kind: kind as NodeKind, id })));

describe('recipe availability in normal progression', () => {
  it.each(catalog)('$kind: $id can be configured after its unlocks with no ingredient stock or history', ({ kind, id }) => {
    const game = createInitialState(71);
    if(id.match(/^core-half-[ab]-\d$/))game.endgame={version:1,cornerOrder:seededCornerOrder(game.seed),pairIndex:Number(id.at(-1))};
    game.sectors[game.activeSectorId].nodes = [];
    game.produced = {}; game.extracted = {}; game.globalPool = {};
    game.research.completed = []; game.research.unlocked = [];
    expect(isRecipeAvailable(id, game, kind)).toBe(false);
    const machineResearch = NODE_DEFINITIONS[kind].unlockResearch!;
    game.research.completed.push(machineResearch);
    game.research.unlocked.push(machineResearch);
    const recipeResearch = RECIPES[id].unlockResearch ?? (id === 'automata-core' ? 'automataCore' : ['robot-frame', 'robot-gun', 'suppression-bot'].includes(id) ? 'suppressionBot' : undefined);
    if (recipeResearch && recipeResearch !== machineResearch) {
      expect(isRecipeAvailable(id, game, kind)).toBe(false);
      game.research.completed.push(recipeResearch);
      game.research.unlocked.push(recipeResearch);
    }
    expect(accessibleRecipeMaterials(game).size).toBe(0);
    expect(isRecipeAvailable(id, game, kind)).toBe(true);
    expect(recipeGuideGroups(game).find(group => group.node === kind)?.recipes.map(recipe => recipe.id)).toContain(id);
    const machine = tutorialNode(kind, 'machine', 1300, 700);
    game.sectors[game.activeSectorId].nodes.push(machine);
    const engine = new GameEngine(game, { autosave: false });
    expect(engine.setRecipe(machine.id, id)).toBe(true);
    expect(engine.getSector().nodes.find(node => node.id === machine.id)?.recipeId).toBe(id);
    engine.tick(100);
    expect(engine.getSector().nodes.find(node => node.id === machine.id)?.output).toEqual({});
  });

  it('does not expose undiscovered Mythril through stock or another unlocked machine', () => {
    const game = createInitialState(71);
    game.research.completed = ['refiner', 'smelter'];
    game.research.unlocked = [...game.research.completed];
    game.produced = { 'mythril-plate': 5, mythril: 5, charcoal: 5 };
    for (const id of ['mythril-gear', 'mythril-wire', 'smelt-mythril']) expect(isRecipeAvailable(id, game)).toBe(false);
    game.research.completed.push('mithrilTools');
    for (const id of ['mythril-gear', 'mythril-wire', 'smelt-mythril']) expect(isRecipeAvailable(id, game)).toBe(true);
    expect(isRecipeAvailable('iron-gear', game, 'advancedAssembler')).toBe(false);
    expect(isRecipeAvailable('iron-gear', game, 'refiner')).toBe(true);
    expect(isRecipeAvailable('missing-recipe', game)).toBe(false);
    expect(isRecipeAvailable('charcoal', game, 'refiner')).toBe(false);
  });

  it('keeps material shortage information after stock has been spent', () => {
    const game = createTutorialState('basic');
    game.produced = { 'copper-gear': 1 };
    expect(accessibleRecipeMaterials(game).has('copper-gear')).toBe(true);
    expect(accessibleRecipeMaterials(game).has('coolant')).toBe(false);
  });

  it('keeps each Basics Refiner tied to its intended recipe when reopened later', () => {
    const gear = tutorialNode('refiner', 'gear', 0, 0);
    const core = tutorialNode('refiner', 'core', 0, 0);
    expect(basicTutorialRefinerRecipe(gear, [gear, core])).toBe('copper-gear');
    expect(basicTutorialRefinerRecipe(core, [gear, core])).toBe('simple-core');
    gear.recipeId = 'iron-wire';
    expect(basicTutorialRefinerRecipe(gear, [gear, core])).toBe('copper-gear');
    expect(basicTutorialRefinerRecipe(tutorialNode('kiln', 'kiln', 0, 0), [gear, core])).toBeUndefined();
  });
});
