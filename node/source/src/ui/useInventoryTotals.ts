import { useMemo } from 'react';
import type { GameState, ItemId } from '../domain/types';

/** Preserve the inventory panel's physical-buffer totals without scanning hidden maps for a closed panel. */
export function inventoryTotals(game: Pick<GameState, 'sectors'>, visible: boolean) {
  const totals: Partial<Record<ItemId, number>> = {};
  if (!visible) return totals;
  for (const sector of Object.values(game.sectors)) for (const node of sector.nodes) {
    for (const bag of [node.input, node.output]) for (const [item, count] of Object.entries(bag)) {
      totals[item as ItemId] = (totals[item as ItemId] ?? 0) + (count ?? 0);
    }
  }
  return totals;
}

export function useInventoryTotals(game: GameState, visible: boolean) {
  return useMemo(() => inventoryTotals(game, visible), [game, game.revision, visible]);
}
