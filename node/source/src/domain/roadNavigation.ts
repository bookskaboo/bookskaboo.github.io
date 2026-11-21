import { getNodeCapabilities } from '../content/nodeCapabilities';
import type { GameState } from './types';

/** Both endpoints must describe the same Road across an unlocked adjacent border. */
export function roadTravelPair(game: GameState, nodeId: string) {
  const sector=game.sectors[game.activeSectorId], road=sector?.nodes.find(node=>node.id===nodeId);
  if(!road || !getNodeCapabilities(road.kind)?.pairedSectorPlacement || !road.pairedSectorId || !road.pairedRoadId) return;
  const target=game.sectors[road.pairedSectorId];
  if(!target?.unlocked || Math.abs(target.x-sector.x)+Math.abs(target.y-sector.y)!==1) return;
  const partner=target.nodes.find(node=>node.id===road.pairedRoadId);
  if(!partner || !getNodeCapabilities(partner.kind)?.pairedSectorPlacement || partner.pairedSectorId!==sector.id || partner.pairedRoadId!==road.id) return;
  return { sector:target, road:partner };
}

export function roadTravelDestination(game: GameState, nodeId: string) {
  return roadTravelPair(game,nodeId)?.sector.id;
}
