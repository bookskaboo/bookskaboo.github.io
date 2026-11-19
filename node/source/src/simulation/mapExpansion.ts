import { SEVEN_CORES } from '../content/endgame';
import { getResearchProject, isResearchAvailable } from '../content/research';
import type { GameState, ItemId } from '../domain/types';
import { HOME_COORDINATE, isWorldGridCell, worldCornerIds, worldGridSize } from '../domain/worldGrid';
import { usesNewWorldRules } from './worldRules';

/** Only discovered generated holes restrict new purchases; paid destinations retain entry. */
export function mapExplorationBlockers(game: GameState, x: number, y: number) {
  if (!usesNewWorldRules(game) || game.sectors[`${x},${y}`]?.unlocked) return [];
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].map(([nx,ny])=>game.sectors[`${nx},${ny}`])
    .filter(sector => sector?.unlocked && (sector.visited || sector.id === game.activeSectorId)
      && sector.nodes.some(node => node.kind === 'big-hole' && node.holeOrigin === 'generated' && (node.resourceRemaining ?? 0)>0));
}

export function mapPurchaseProtected(game: GameState, destination: string) {
  return game.research.mapNodeQuote?.destination === destination && pendingMapPayment(game);
}

export function canPurchaseMap(game: GameState, x: number, y: number) {
  return isMapFrontier(game,x,y) && (mapPurchaseProtected(game,`${x},${y}`) || mapExplorationBlockers(game,x,y).length===0);
}

function mapTier(x: number, y: number) {
  return Math.abs(x - HOME_COORDINATE) + Math.abs(y - HOME_COORDINATE);
}

function priceBand(tier: number) {
  if (tier <= 6) return Math.ceil(tier / 2);
  return Math.min(tier - 3, 6);
}

export function usesDestinationMapPricing(game: GameState) {
  const override = game.mod?.research?.mapNode;
  return !game.isTraining && override?.costs === undefined && !override?.costGrowth;
}

export function isMapFrontier(game: GameState, x: number, y: number) {
  return isWorldGridCell(x, y, worldGridSize(game)) && !game.sectors[`${x},${y}`]?.unlocked &&
    [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) => game.sectors[`${nx},${ny}`]?.unlocked);
}

/** Snapshot the destination's price before any Cores are contributed. */
export function destinationMapCosts(game: GameState, x: number, y: number): Partial<Record<ItemId, number>> | undefined {
  if (!usesDestinationMapPricing(game) || !canPurchaseMap(game, x, y) ||
    !isResearchAvailable(getResearchProject('mapNode')!, game.research.completed)) return;
  const { research } = game;
  const quote = research.mapNodeQuote;
  if (quote?.destination === `${x},${y}` && quote.completion === (research.repeatableCompletions?.mapNode ?? 0)) return quote.costs;
  const band = priceBand(mapTier(x, y));
  const opened = Object.values(game.sectors).filter(sector => sector.unlocked && priceBand(mapTier(sector.x, sector.y)) === band).length;
  const amount = 5 + 5 * Math.floor(opened / (band === 1 ? 1 : 2));
  const costs: Partial<Record<ItemId, number>> = Object.fromEntries(SEVEN_CORES.slice(0, band).map(core => [core, amount]));
  if (worldCornerIds(worldGridSize(game)).includes(`${x},${y}`)) costs['command-core'] = amount + 1;
  return costs;
}

export function pendingMapPayment(game: GameState) {
  const { research } = game;
  const paid = research.selected === 'mapNode' ? research.contributed : research.projectContributions?.mapNode;
  return Object.values(paid ?? {}).some(amount => (amount ?? 0) > 0);
}

export function mapResearchNeedsDestination(game: GameState) {
  return usesDestinationMapPricing(game) && game.research.selected !== 'mapNode' &&
    !game.research.mapNodeQuote?.destination && !pendingMapPayment(game);
}
