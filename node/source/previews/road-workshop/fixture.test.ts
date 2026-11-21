import { expect, it } from 'vitest';
import { createRoadWorkshop } from './fixture';
import { roadTravelDestination } from '../../src/renderer/roadNodeTravel';

it('builds nine accessible maps joined by twelve reciprocal Road pairs', () => {
  const engine=createRoadWorkshop(), game=engine.getState();
  const maps=Object.values(game.sectors).filter(s=>s.x>=4&&s.x<=6&&s.y>=4&&s.y<=6);
  expect(maps).toHaveLength(9);
  expect(maps.every(s=>s.unlocked&&s.visited)).toBe(true);
  expect(maps.flatMap(s=>s.nodes)).toHaveLength(24);
  for(const sector of maps){
    engine.switchSector(sector.id);
    for(const road of sector.nodes){
      expect(roadTravelDestination(game,road.id)).toBe(road.pairedSectorId);
      expect(engine.reverseRoad(road.id)).toBe(true);
      const pair=game.sectors[road.pairedSectorId!].nodes.find(n=>n.id===road.pairedRoadId)!;
      expect(pair.roadMode).not.toBe(road.roadMode);
    }
  }
});
