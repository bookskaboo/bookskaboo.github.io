import type { GameState } from '../domain/types';

export const DWARVEN_DISCOVERY_PROMPT = 'dwarven-camp-discovered';
export function firstSpottedDwarvenCamp(game: GameState) {
  if (game.isTraining || game.tutorialPromptsSeen?.includes(DWARVEN_DISCOVERY_PROMPT)) return;
  const sectors = [game.sectors[game.activeSectorId], ...Object.values(game.sectors).filter(s => s.id !== game.activeSectorId)];
  for (const sector of sectors) if (sector?.unlocked && sector.visited) {
    const camp = sector.nodes.find(node => node.kind === 'monster-camp' && node.lizardSettlement);
    if (camp) return { camp, sector };
  }
}
