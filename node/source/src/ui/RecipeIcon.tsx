import { recipeArtItem } from '../art/recipeArt';
import type { NodeKind, Recipe } from '../domain/types';
import { MaterialIcon } from './MaterialIcon';

export function RecipeIcon({ recipe, node }: { recipe: Recipe; node: NodeKind }) {
  return <MaterialIcon item={recipeArtItem(recipe, node)} fallback={node} />;
}
