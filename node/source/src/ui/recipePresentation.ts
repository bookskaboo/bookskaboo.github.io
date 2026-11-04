import { ITEM_NAMES } from '../content/items';
import type { ItemId, Recipe } from '../domain/types';

export const recipeDuration = (ms: number) => ms % 1000 === 0 ? `${ms / 1000}s` : `${(ms / 1000).toFixed(1)}s`;

export function recipeTooltip(recipe: Recipe, cycleMs = recipe.cycleMs) {
  const materials = (bag: Recipe['inputs']) => (Object.entries(bag) as Array<[ItemId, number]>).map(([item, count]) => `${count} ${ITEM_NAMES[item]}`).join(' + ');
  const chance = (recipe.chanceOutputs ?? []).map(output => `+ ${output.amount} ${ITEM_NAMES[output.item]} (${Number((output.probability * 100).toFixed(2))}% independent chance)`).join(' ');
  const timing = `${recipeDuration(cycleMs)} per batch${cycleMs !== recipe.cycleMs ? ` · base ${recipeDuration(recipe.cycleMs)}` : ''}`;
  return `${materials(recipe.inputs) || 'No ingredients'} → ${materials(recipe.outputs)}${chance ? ` ${chance}` : ''}. ${timing}.`;
}
