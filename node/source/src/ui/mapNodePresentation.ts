import { ITEM_NAMES } from '../content/items';
import { isWorldObstacle } from '../content/nodeCapabilities';
import type { LineArtId } from '../art/lineArt';
import type { GameState, ItemId, SectorState } from '../domain/types';

export const MAP_LANDMARKS = {
  camps: { label: 'Monster camps', icon: 'goblin-camp' },
  lakes: { label: 'Lakes', icon: 'lake' },
  golems: { label: 'Golems', icon: 'golem' },
} as const satisfies Record<string, { label: string; icon: LineArtId }>;

export type MapLandmark = keyof typeof MAP_LANDMARKS;

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

/** Normal play surveys a map on arrival. The dev override reveals surveys without travelling. */
function isSurveyed(game: GameState, sector: SectorState | undefined): sector is SectorState {
  return Boolean(sector?.unlocked && (game.devMapSurveysRevealed === true || sector.visited || sector.id === game.activeSectorId));
}

export function mapLandmarkSurvey(game: GameState) {
  const discovered = new Set<MapLandmark>();
  if (game.encounters?.includes('resourceGolem')) discovered.add('golems');
  const bySector = new Map<string, Set<MapLandmark>>();
  for (const sector of Object.values(game.sectors)) {
    if (!isSurveyed(game, sector)) continue;
    const landmarks = new Set<MapLandmark>();
    for (const node of sector.nodes) {
      if (node.kind === 'monster-camp' || node.kind === 'cornerChallenge') landmarks.add('camps');
      if (node.kind === 'lake') landmarks.add('lakes');
      if (node.kind === 'resourceGolem' || (node.defeated && node.infiniteResource)) landmarks.add('golems');
    }
    if (landmarks.size) bySector.set(sector.id, landmarks);
    for (const landmark of landmarks) discovered.add(landmark);
  }
  return { discovered, bySector };
}

export function mapNodeSurvey(game: GameState, id: string) {
  const sector = game.sectors[id];
  const explored = isSurveyed(game, sector);
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
