import { getNodeCapabilities } from '../content/nodeCapabilities';
import { NODE_DEFINITIONS } from '../content/nodes';
import { isRecipeAvailable } from '../content/recipeAvailability';
import { RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { getEfficiencyMultiplier } from '../content/efficiency';
import type { GameState, NodeKind, Recipe } from '../domain/types';
import { modNode } from '../mods/modRules';

export const RECIPE_GUIDE_GROUPS = Object.keys(RECIPE_GROUPS)
  .filter(id => id in NODE_DEFINITIONS)
  .map(id => ({ id, node: id as NodeKind }));

export function recipeGuideGroups(game: GameState, previewRecipeId?: string) {
  return RECIPE_GUIDE_GROUPS.map(group => ({ ...group,
    recipes: RECIPE_GROUPS[group.id].filter(id => id === previewRecipeId || isRecipeAvailable(id, game, group.node))
      .map(id => RECIPES[id]).filter((recipe): recipe is Recipe => Boolean(recipe)),
  })).filter(group => group.recipes.length > 0);
}

export function recipeGuideCycle(recipe: Recipe, node: NodeKind, game: GameState) {
  return recipe.cycleMs * getEfficiencyMultiplier(getNodeCapabilities(node).efficiencyFamily, game.research.completed) * (modNode(node)?.cycleMultiplier ?? 1);
}
