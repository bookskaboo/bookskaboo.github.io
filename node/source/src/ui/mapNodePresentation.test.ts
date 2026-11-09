import { describe, expect, it } from 'vitest';
import { defeatResourceGolem } from '../content/resourceGolems';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { mapLandmarkSurvey, mapNodeName, mapNodePosition, mapNodeResourceSummary, mapNodeSurvey } from './mapNodePresentation';

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
  it('reveals all map contents with the dev tool without recording visits or discoveries', () => {
    const engine = new GameEngine(createInitialState(301), { autosave: false });
    const game = engine.getState();
    const outpost = generateSector(7, 5, game.seed, 0);
    outpost.unlocked = true;
    game.sectors[outpost.id] = outpost;
    const encounters = [...game.encounters!];
    expect(mapNodeSurvey(game, outpost.id).explored).toBe(false);

    engine.developerUnlockAllSectors();
    expect(Object.values(game.sectors).filter(sector => sector.unlocked)).toHaveLength(121);
    expect(game.activeSectorId).toBe('5,5');
    expect(game.encounters).toEqual(encounters);
    expect(game.research.completed).not.toContain('exploration');
    expect(outpost.visited).toBeFalsy();
    expect(mapNodeSurvey(game, outpost.id).obstructions).toContainEqual({ name: 'Lake', count: 1 });
    expect(mapNodeResourceSummary(game, outpost.id)).toContain('Water ∞');
    expect(mapLandmarkSurvey(game).discovered).toEqual(new Set(['camps', 'lakes', 'golems']));

    const restored = new GameEngine(normalizeLegacy(game)!, { autosave: false });
    expect(mapNodeSurvey(restored.getState(), outpost.id).explored).toBe(true);
    const firstView = { x: 25, y: 120, zoom: .18 };
    restored.switchSector(outpost.id, firstView);
    expect(restored.getSector().camera).toEqual(firstView);

    engine.undo();
    expect(engine.getState().sectors[outpost.id].unlocked).toBe(true);
    expect(mapNodeSurvey(engine.getState(), outpost.id).explored).toBe(false);
  });

  it('reveals each filter and its locations only after those maps are visited', () => {
    const game = createInitialState(301);
    const base = game.sectors['5,5'].nodes[0];
    const camp = generateSector(5, 4, game.seed, 0);
    const lake = generateSector(6, 5, game.seed, 0);
    const golem = generateSector(5, 6, game.seed, 0);
    const otherCamp = generateSector(4, 5, game.seed, 0);
    const corner = generateSector(0, 0, game.seed, 0);
    camp.nodes = [{ ...base, id: 'camp', kind: 'monster-camp' }];
    lake.nodes = [{ ...base, id: 'lake', kind: 'lake' }];
    golem.nodes = [{ ...base, id: 'golem', kind: 'resourceGolem', golemMineral: 'iron' }];
    otherCamp.nodes = [{ ...base, id: 'other-camp', kind: 'monster-camp' }];
    for (const sector of [camp, lake, golem, otherCamp, corner]) {
      game.sectors[sector.id] = sector;
      sector.unlocked = true;
      sector.visited = false;
    }
    expect(mapLandmarkSurvey(game)).toEqual({ discovered: new Set(), bySector: new Map() });

    const engine = new GameEngine(game, { autosave: false });
    engine.switchSector(camp.id);
    expect(mapLandmarkSurvey(engine.getState())).toEqual({ discovered: new Set(['camps']), bySector: new Map([[camp.id, new Set(['camps'])]]) });
    for (const sector of [lake, golem, corner]) engine.switchSector(sector.id);
    const survey = mapLandmarkSurvey(engine.getState());
    expect(survey.discovered).toEqual(new Set(['camps', 'lakes', 'golems']));
    expect(survey.bySector).toEqual(new Map([
      [camp.id, new Set(['camps'])], [lake.id, new Set(['lakes'])], [golem.id, new Set(['golems'])], [corner.id, new Set(['camps'])],
    ]));
  });

  it('removes a Golem marker after it becomes a reserve while retaining the discovered filter', () => {
    const game = createInitialState(301);
    const home = game.sectors[game.activeSectorId];
    const golem = { ...home.nodes[0], id: 'golem', kind: 'resourceGolem' as const, golemMineral: 'iron' as const };
    home.nodes = [golem];
    const engine = new GameEngine(game, { autosave: false });
    expect(mapLandmarkSurvey(engine.getState()).bySector.get(home.id)).toEqual(new Set(['golems']));
    defeatResourceGolem(engine.getSector().nodes[0]);
    expect(mapLandmarkSurvey(engine.getState())).toEqual({ discovered: new Set(['golems']), bySector: new Map() });
  });

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
