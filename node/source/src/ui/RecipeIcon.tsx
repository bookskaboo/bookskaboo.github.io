import { BOT_BUILD_BY_ID } from '../content/botAssembly';
import type { ItemId, NodeKind, Recipe } from '../domain/types';
import { MaterialIcon } from './MaterialIcon';

export function recipeOutputArtItem(recipe: Recipe, item: ItemId): ItemId {
  const build = BOT_BUILD_BY_ID.get(recipe.id);
  // Output stock is pooled by AP. A recipe still knows which parts it assembles.
  return build?.item === item && recipe.inputs[build.frame] && recipe.inputs[build.gun] ? build.legacyId : item;
}

export function RecipeIcon({ recipe, node }: { recipe: Recipe; node: NodeKind }) {
  const output = Object.keys(recipe.outputs)[0] as ItemId | undefined;
  const disposalInput = node === 'recycler' ? Object.keys(recipe.inputs).find(input => input !== 'water') as ItemId | undefined : undefined;
  return <MaterialIcon item={output ? recipeOutputArtItem(recipe, output) : disposalInput} fallback={node} />;
}
