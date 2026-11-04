import type { ItemId, NodeKind, Recipe } from '../domain/types';
import { IconGlyph, NodeIcon } from './NodeIcon';

/** Common products retain their material color and a recognizable product shape. */
export function RecipeIcon({ recipe, node }: { recipe: Recipe; node: NodeKind }) {
  const item = Object.keys(recipe.outputs)[0] as ItemId;
  if (item?.endsWith('-gear')) return <IconGlyph icon="cog" />;
  const shape = item?.endsWith('-wire') ? <><path d="M5 6c0-4 14-4 14 0v12c0 4-14 4-14 0Z" /><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 10c0 4 14 4 14 0M5 14c0 4 14 4 14 0" /></>
    : item?.endsWith('-plate') ? <><path d="m3 9 12-6 6 5-12 6Z" /><path d="m3 9 1 6 5 5 12-6V8M9 14v6" /></>
    : item?.endsWith('-core') ? <><path d="m12 2 9 5v10l-9 5-9-5V7Z" /><circle cx="12" cy="12" r="4" /><path d="M12 2v6M21 17l-6-3M3 17l6-3" /></>
    : undefined;
  return shape ? <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shape}</svg> : <NodeIcon kind={node} />;
}
