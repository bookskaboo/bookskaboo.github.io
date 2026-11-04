import { worldRecipeAllowed } from './endgame';
import type { GameState, ItemId, NodeKind } from '../domain/types';
import { isNodeUnlocked } from './nodes';
import { isRecipeUnlocked, RECIPE_GROUPS } from './recipes';

/** Material access persists through production history even after stock is spent. */
export function accessibleRecipeMaterials(game: GameState): ReadonlySet<ItemId> {
  const items = new Set<ItemId>();
  const include = (bag: Partial<Record<ItemId, number>> | undefined) => {
    for (const [item, amount] of Object.entries(bag ?? {})) if ((amount ?? 0) > 0) items.add(item as ItemId);
  };
  include(game.produced); include(game.extracted); include(game.globalPool);
  for (const sector of Object.values(game.sectors)) {
    if (!sector.unlocked) continue;
    for (const node of sector.nodes) {
      include(node.input); include(node.output);
      if (node.resourceItem && (node.infiniteResource || (node.resourceRemaining ?? 0) > 0)) items.add(node.resourceItem);
    }
  }
  return items;
}

export function isRecipeAvailable(id: string, game: GameState, kind?: NodeKind) {
  if (!worldRecipeAllowed(id, game) || !isRecipeUnlocked(id, game.research.completed)) return false;
  // Configure the factory before its ingredients arrive, including recovery lines.
  const producers = kind ? [kind] : Object.keys(RECIPE_GROUPS) as NodeKind[];
  return producers.some(producer => RECIPE_GROUPS[producer]?.includes(id) && isNodeUnlocked(producer, game.research.unlocked));
}
