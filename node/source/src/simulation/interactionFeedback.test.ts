import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { generateSector } from './worldGeneration';
import { tutorialNode } from '../tutorials/tutorialRuntime';

describe('playtest interaction feedback and road validation', () => {
  it('names the actual obstruction and incompatible material without changing the factory', () => {
    const state = createInitialState(1);
    const sector = state.sectors['5,5'];
    sector.nodes = [tutorialNode('forest', 'forest', 400, 500), tutorialNode('extractor', 'extractor', 1600, 500), tutorialNode('lake', 'lake', 1000, 500, { name: 'Lake', obstructionWidth: 600, obstructionHeight: 500 })];
    sector.connections = [];
    const engine = new GameEngine(state);
    const before = structuredClone(engine.getState());
    expect(engine.getConnectionFailure('forest', 0, 'extractor', 0)).toMatchObject({ title: 'Blocked by Lake' });
    expect(engine.getState()).toEqual(before);
    expect(engine.connectPorts('forest', 0, 'extractor', 0)).toBe(false);
    engine.getSector().nodes.push(tutorialNode('refiner', 'gear', 500, 1000, { recipeId: 'copper-gear' }), tutorialNode('hydroProcessor', 'hydro', 1400, 1000, { recipeId: 'coolant' }));
    expect(engine.getConnectionFailure('gear', 0, 'hydro', 0)).toMatchObject({ title: 'Incompatible socket', detail: expect.stringContaining('Water') });
  });

  it('uses the channel limit in both preview and placement, then explains adjacent clearance', () => {
    const state = createInitialState(1), sector = state.sectors['5,5'];
    const other = generateSector(6, 5, 1); other.unlocked = true; other.nodes = []; other.connections = [];
    state.sectors[other.id] = other;
    sector.nodes = [tutorialNode('road', 'existing', 3532.5, 600, { roadMode: 'export', pairedSectorId: '6,5' })]; sector.connections = [];
    const engine = new GameEngine(state);
    expect(engine.getNodePlacementPreview('road', 3590, 1400)?.valid).toBe(false);
    expect(engine.getNodePlacementError('road', 3590, 1400)).toContain('1 Roads per map face');
    expect(engine.placeNode('road', 3590, 1400)).toBeUndefined();
    engine.getSector().nodes = [];
    engine.getState().sectors['6,5'].nodes.push(tutorialNode('woodenChest', 'blocking', 67.5, 1400));
    expect(engine.getNodePlacementPreview('road', 3590, 1400)?.valid).toBe(false);
    expect(engine.getNodePlacementError('road', 3590, 1400)).toContain('adjacent map 6,5');
    engine.getState().sectors['6,5'].nodes = [];
    expect(engine.getNodePlacementPreview('road', 3590, 1400)?.valid).toBe(true);
    expect(engine.placeNode('road', 3590, 1400)).toBeTruthy();
  });

  it('reverses a legacy Road without requiring another face slot or losing items', () => {
    const state = createInitialState(1), sector = state.sectors['5,5'];
    const other = generateSector(6, 5, 1); other.unlocked = true; other.connections = [];
    state.sectors[other.id] = other;
    sector.nodes = [tutorialNode('road', 'receive', 3532.5, 600, { roadMode: 'import', pairedSectorId: '6,5', pairedRoadId: 'send', output: { copper: 3 } }), tutorialNode('road', 'existing', 3532.5, 1000, { roadMode: 'export', pairedSectorId: '6,5' })];
    sector.connections = [{ id: 'keep', from: 'receive', to: 'sink', createdAt: 0 }];
    other.nodes = [tutorialNode('road', 'send', 67.5, 600, { roadMode: 'export', pairedSectorId: '5,5', pairedRoadId: 'receive' })];
    const engine = new GameEngine(state);
    expect(engine.reverseRoad('receive')).toBe(true);
    expect(engine.getSector().nodes[0]).toMatchObject({ roadMode: 'export', input: {}, output: {} });
    expect(engine.getState().globalPool?.copper).toBe(3);
  });
});
