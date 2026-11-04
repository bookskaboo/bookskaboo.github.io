import { ITEM_NAMES } from '../content/items';
import { isWorldObstacle } from '../content/nodeCapabilities';
import type { GameState, ItemId, SectorState } from '../domain/types';

/** Display coordinates relative to Home; serialized sector IDs remain unchanged. */
export function mapNodePosition(x: number, y: number) {
  const vertical = y < 5 ? `N${5 - y}` : y > 5 ? `S${y - 5}` : '';
  const horizontal = x < 5 ? `W${5 - x}` : x > 5 ? `E${x - 5}` : '';
  return [vertical, horizontal].filter(Boolean).join('.') || 'H';
}

export function mapNodeName(sector: SectorState) {
  const generic = ['Unnamed Node', `Sector ${sector.x}.${sector.y}`, `Map ${sector.x}.${sector.y}`].includes(sector.name);
  return generic ? mapNodePosition(sector.x, sector.y) : sector.name;
}

/** Unlocking permits travel; the survey becomes visible after actually visiting. */
export function mapNodeSurvey(game: GameState, id: string) {
  const sector = game.sectors[id];
  const explored = Boolean(sector?.unlocked && (sector.visited || id === game.activeSectorId));
  const resources = new Map<ItemId, number>();
  const obstructions = new Map<string, number>();
  if (explored) for (const node of sector.nodes) {
    if (node.resourceItem) {
      const remaining = node.infiniteResource || node.kind === 'lake' ? Infinity : node.resourceRemaining ?? 0;
      resources.set(node.resourceItem, (resources.get(node.resourceItem) ?? 0) + remaining);
    }
    if (isWorldObstacle(node.kind)) obstructions.set(node.name, (obstructions.get(node.name) ?? 0) + 1);
  }
  return {
    explored,
    resources: [...resources].map(([item, remaining]) => ({ item, remaining })),
    obstructions: [...obstructions].map(([name, count]) => ({ name, count })),
  };
}

export function mapNodeResourceSummary(game: GameState, id: string) {
  const survey = mapNodeSurvey(game, id);
  if (!survey.explored) return 'Map Node Unexplored';
  return survey.resources.map(({ item, remaining }) => `${ITEM_NAMES[item]} ${Math.floor(remaining).toLocaleString()}`).join(' · ') || 'No mapped resources';
}
