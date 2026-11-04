import { describe, expect, it } from 'vitest';
import { getResearchProject, isResearchAvailable } from '../content/research';
import { generateSector } from './worldGeneration';
import { createInitialState, GameEngine } from './engine';

function setup(upgrades: string[] = []) {
  const state = createInitialState(301);
  state.research.unlocked.push('road');
  state.research.completed = ['road', ...upgrades];
  state.sectors['5,5'].nodes = []; state.sectors['5,5'].connections = [];
  for (const x of [4, 6]) {
    const neighbor = generateSector(x, 5, state.seed, 0); neighbor.unlocked = true; neighbor.nodes = []; neighbor.connections = [];
    state.sectors[neighbor.id] = neighbor;
  }
  return new GameEngine(state, { autosave: false });
}

describe('Road capacity per map face', () => {
  it.each([[[], 1], [['roadChannels1'], 2], [['roadChannels1', 'roadChannels2'], 3]] as const)('uses upgrades %j to permit %i slots per face', (upgrades, limit) => {
    const engine = setup([...upgrades]);
    for (let i = 0; i < limit; i++) expect(engine.placeNode('road', 3590, 300 + i * 400)).toBeTruthy();
    expect(engine.getNodePlacementPreview('road', 3590, 1700)?.valid).toBe(false);
    expect(engine.getNodePlacementError('road', 3590, 1700)).toContain(`${limit} Roads per map face`);
    expect(engine.placeNode('road', 3590, 1700)).toBeUndefined();
    expect(engine.placeNode('road', 10, 1700)).toBeTruthy(); // Opposite face has its own limit.
  });

  it('counts incoming endpoints too, permits reversal, and frees a slot when a pair is removed', () => {
    const engine = setup();
    const first = engine.placeNode('road', 3590, 300)!;
    const receiving = engine.getState().sectors['6,5'].nodes[0];
    engine.switchSector('6,5');
    expect(engine.placeNode('road', 10, 1000)).toBeUndefined();
    expect(engine.reverseRoad(receiving.id)).toBe(true);
    expect(engine.getSector().nodes[0].roadMode).toBe('export');
    expect(engine.placeNode('road', 10, 1000)).toBeUndefined();
    engine.switchSector('5,5');
    engine.deleteNodes([first]);
    expect(engine.getState().sectors['6,5'].nodes).toHaveLength(0);
    expect(engine.placeNode('road', 3590, 1000)).toBeTruthy();
  });

  it('requires each earlier Road upgrade and increasing Core access', () => {
    const secondSlot = getResearchProject('roadChannels1')!;
    const thirdSlot = getResearchProject('roadChannels2')!;
    expect(Object.keys(secondSlot.costs)).toEqual(['simple-core', 'basic-core', 'automata-core', 'hydro-core']);
    expect(Object.keys(thirdSlot.costs)).toEqual(['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core']);
    expect(isResearchAvailable(secondSlot, ['road'])).toBe(false);
    expect(isResearchAvailable(secondSlot, ['road', 'hydraulicAssembly'])).toBe(true);
    expect(isResearchAvailable(thirdSlot, ['road', 'oreSeparation'])).toBe(false);
    expect(isResearchAvailable(thirdSlot, ['roadChannels1', 'oreSeparation'])).toBe(true);
  });
});
