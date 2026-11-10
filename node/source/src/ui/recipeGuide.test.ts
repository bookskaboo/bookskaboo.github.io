import { describe, expect, it } from 'vitest';
import { createTutorialState } from '../tutorials/tutorialRuntime';
import { RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { recipeGuideGroups, getRecipeGuideGroups, recipeGuideCycle } from './recipeGuide';

describe('recipe guide catalog', () => {
  it('covers every production recipe group using the live catalog', () => {
    expect(getRecipeGuideGroups().map(group => group.id).sort()).toEqual(Object.keys(RECIPE_GROUPS).sort());
    const game = createTutorialState('basic');
    for (const group of getRecipeGuideGroups()) {
      for (const id of RECIPE_GROUPS[group.id]) {
        expect(recipeGuideGroups(game, id).find(candidate => candidate.id === group.id)?.recipes.some(recipe => recipe.id === id), `${group.id}: ${id}`).toBe(true);
      }
    }
  });
  it('requires machine unlocks while preserving explicit research and ingredient previews', () => {
    const game = createTutorialState('basic');
    expect(recipeGuideGroups(game).flatMap(group => group.recipes).some(recipe => recipe.id === 'motor')).toBe(false);
    const preview = recipeGuideGroups(game, 'motor').flatMap(group => group.recipes).find(recipe => recipe.id === 'motor');
    expect(preview?.inputs).toEqual(RECIPES.motor.inputs);
    game.research.completed.push('assembler');
    game.research.unlocked.push('assembler');
    expect(recipeGuideGroups(game).flatMap(group => group.recipes).some(recipe => recipe.id === 'motor')).toBe(true);
    expect(recipeGuideGroups(game, 'assemble-bot-f1-g1').find(group => group.node === 'botPlant')?.recipes[0].name).toBe('Suppression Bot 1 AP');
  });
  it('shows the same upgraded cycle duration as the production machine', () => {
    const game = createTutorialState('basic');
    expect(recipeGuideCycle(RECIPES['copper-gear'], 'refiner', game)).toBe(RECIPES['copper-gear'].cycleMs);
    game.research.completed.push('refiner2');
    expect(recipeGuideCycle(RECIPES['copper-gear'], 'refiner', game)).toBe(RECIPES['copper-gear'].cycleMs * .8);
  });
});
