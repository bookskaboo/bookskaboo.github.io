import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { RoadTravelClicks, roadTravelDestination } from './roadNodeTravel';

function fixture() {
  const state = createInitialState(301);
  state.borderObstructions = [];
  state.research.unlocked.push('road'); state.research.completed = ['road'];
  const home = state.sectors['5,5']; home.nodes = []; home.connections = [];
  const neighbor = generateSector(6, 5, state.seed, 0);
  neighbor.unlocked = true; neighbor.nodes = []; neighbor.connections = [];
  state.sectors[neighbor.id] = neighbor;
  const engine = new GameEngine(state, { autosave: false });
  const id = engine.placeNode('road', 3590, 1200)!;
  expect(id).toBeTruthy();
  return { engine, id, road: engine.getSector().nodes.find(n => n.id === id)!, neighbor: engine.getState().sectors[neighbor.id] };
}

describe('Road endpoint navigation', () => {
  it('travels in both directions without changing the pair, cargo, or saved cameras', () => {
    const { engine, id, road, neighbor } = fixture();
    const pair = structuredClone([road, neighbor.nodes[0]]);
    const camera = { x: 20, y: -40, zoom: .8 }; engine.setCamera(camera);
    expect(roadTravelDestination(engine.getState(), id)).toBe(neighbor.id);
    engine.switchSector(roadTravelDestination(engine.getState(), id)!);
    expect(neighbor.visited).toBe(true);
    expect(roadTravelDestination(engine.getState(), road.pairedRoadId!)).toBe('5,5');
    engine.switchSector(roadTravelDestination(engine.getState(), road.pairedRoadId!)!);
    expect(engine.getSector().camera).toEqual(camera);
    expect([road, neighbor.nodes[0]]).toEqual(pair);
    engine.reverseRoad(id);
    expect(roadTravelDestination(engine.getState(), id)).toBe(neighbor.id);
  });

  it.each(['missing', 'locked', 'distant', 'unpaired', 'wrong-kind'] as const)('rejects a %s destination', reason => {
    const { engine, id, road, neighbor } = fixture();
    if (reason === 'missing') delete engine.getState().sectors[neighbor.id];
    if (reason === 'locked') neighbor.unlocked = false;
    if (reason === 'distant') neighbor.x += 1;
    if (reason === 'unpaired') neighbor.nodes[0].pairedRoadId = 'another-road';
    if (reason === 'wrong-kind') road.kind = 'extractor';
    expect(roadTravelDestination(engine.getState(), id)).toBeUndefined();
    expect(roadTravelDestination(engine.getState(), 'absent')).toBeUndefined();
  });
});

describe('Road double-click tracking across selection redraws', () => {
  it('accepts a nearby second body click on the same stable map/node ID and consumes the pair', () => {
    const clicks = new RoadTravelClicks();
    expect(clicks.tap('5,5:road', { x: 100, y: 100 }, 10)).toBe(false);
    expect(clicks.tap('5,5:road', { x: 102, y: 99 }, 200)).toBe(true);
    expect(clicks.tap('5,5:road', { x: 102, y: 99 }, 250)).toBe(false);
  });

  it('does not combine different endpoints, slow clicks, movement, or canceled interactions', () => {
    const clicks = new RoadTravelClicks(), point = { x: 100, y: 100 };
    clicks.tap('5,5:road', point, 0);
    expect(clicks.tap('6,5:road', point, 100)).toBe(false);
    expect(clicks.tap('6,5:road', point, 501)).toBe(false);
    expect(clicks.tap('6,5:road', { x: 108, y: 100 }, 600)).toBe(false);
    clicks.clear();
    expect(clicks.tap('6,5:road', point, 650)).toBe(false);
  });
});
