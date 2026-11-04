import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import type { ItemId, MachineNode } from '../domain/types';
import { getPortAnchor } from '../domain/nodeGeometry';

/** Keep each material attached to its semantic socket when the visual order changes. */
export function inputBufferRows(node: MachineNode) {
  const capabilities = getNodeCapabilities(node.kind);
  const recipe = RECIPES[node.recipeId ?? ''];
  const items: ItemId[] = recipe ? Object.keys(recipe.inputs) as ItemId[]
    : capabilities.behavior === 'generator' ? ['charcoal'] : capabilities.behavior === 'planter' ? ['wood', 'iron-plate', 'stone'] : [];
  const families = getEffectiveNodeInputFamilies(node, []);
  return items.map((item, index) => {
    const matched = families.findIndex(family => family === item || (family === 'METAL' && ['iron', 'copper', 'mythril'].includes(item)));
    const port = matched >= 0 ? matched : index;
    return { item, amount: node.input[item] ?? 0, capacity: capabilities.inputCapacity ?? 5,
      // Socket centers sit 25px below the header; start the boxes 8px below it.
      y: getPortAnchor(node, 'input', port).y - 17 };
  });
}
