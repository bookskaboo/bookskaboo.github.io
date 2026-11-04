import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { mapNodeName, mapNodePosition, mapNodeResourceSummary, mapNodeSurvey } from './mapNodePresentation';

describe('Home-relative map positions', () => {
  it('uses dotted compass directions with the vertical offset first and H for Home', () => {
    for (const [x, y, expected] of [[5, 5, 'H'], [5, 4, 'N1'], [4, 5, 'W1'], [6, 5, 'E1'], [5, 6, 'S1'], [4, 4, 'N1.W1'], [6, 4, 'N1.E1'], [4, 6, 'S1.W1'], [10, 10, 'S5.E5']] as const) {
      expect(mapNodePosition(x, y)).toBe(expected);
    }
  });

  it('gives unnamed maps compass names while retaining player names and serialized positions', () => {
    const sector = generateSector(4, 4, 301, 0);
    expect(mapNodeName(sector)).toBe('N1.W1');
    expect(mapNodeName({ ...sector, name: 'Copper outpost' })).toBe('Copper outpost');
    expect(sector.id).toBe('4,4');
    expect(sector.name).toBe('Unnamed Node');
  });
});

describe('map exploration surveys', () => {
  it('hides generated resources and obstructions until an unlocked map is visited', () => {
    const game = createInitialState(301);
    const outpost = generateSector(6, 5, game.seed, 0);
    game.sectors[outpost.id] = outpost;
    expect(outpost.nodes.some(node => node.resourceItem)).toBe(true);
    for (const unlocked of [false, true]) {
      outpost.unlocked = unlocked;
      expect(mapNodeSurvey(game, outpost.id)).toEqual({ explored: false, resources: [], obstructions: [] });
      expect(mapNodeResourceSummary(game, outpost.id)).toBe('Map Node Unexplored');
    }
    const engine = new GameEngine(game, { autosave: false });
    engine.switchSector(outpost.id);
    expect(mapNodeSurvey(engine.getState(), outpost.id).resources.length).toBeGreaterThan(0);
    engine.switchSector('5,5');
    expect(mapNodeSurvey(engine.getState(), outpost.id).explored).toBe(true);
  });

  it('totals repeated deposits and lists the current world obstructions separately from player machines', () => {
    const game = createInitialState(301);
    const home = game.sectors['5,5'];
    const base = home.nodes[0];
    home.nodes = [
      { ...base, id: 'iron-a', kind: 'iron', name: 'Iron', resourceItem: 'iron', resourceRemaining: 300 },
      { ...base, id: 'iron-b', kind: 'iron', name: 'Iron', resourceItem: 'iron', resourceRemaining: 200 },
      { ...base, id: 'hole-a', kind: 'big-hole', name: 'Deep Hole', resourceItem: undefined },
      { ...base, id: 'hole-b', kind: 'big-hole', name: 'Deep Hole', resourceItem: undefined },
      { ...base, id: 'camp', kind: 'monster-camp', name: 'Dwarven Camp', resourceItem: undefined },
      { ...base, id: 'lake', kind: 'lake', name: 'Lake', resourceItem: 'water', resourceRemaining: undefined },
      { ...base, id: 'machine', kind: 'extractor', name: 'Extractor', resourceItem: undefined },
    ];
    expect(mapNodeSurvey(game, home.id)).toEqual({ explored: true, resources: [{ item: 'iron', remaining: 500 }, { item: 'water', remaining: Infinity }], obstructions: [{ name: 'Deep Hole', count: 2 }, { name: 'Dwarven Camp', count: 1 }, { name: 'Lake', count: 1 }] });
    expect(mapNodeResourceSummary(game, home.id)).toBe('Iron 500 · Water ∞');
  });
});
