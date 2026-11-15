import { BOT_BUILD_BY_ID } from '../content/botAssembly';
import type { ItemId, NodeKind, Recipe } from '../domain/types';

export function recipeOutputArtItem(recipe: Recipe, item: ItemId): ItemId {
  const build = BOT_BUILD_BY_ID.get(recipe.id);
  // Output stock is pooled by AP. A recipe still knows which parts it assembles.
  return build?.item === item && recipe.inputs[build.frame] && recipe.inputs[build.gun] ? build.legacyId : item;
}

export function recipeArtItem(recipe: Recipe, node: NodeKind): ItemId | undefined {
  const output = Object.keys(recipe.outputs)[0] as ItemId | undefined;
  if (output) return recipeOutputArtItem(recipe, output);
  if (node === 'recycler') return Object.keys(recipe.inputs).find(input => input !== 'water') as ItemId | undefined;
}
