import { afterEach, expect, it } from 'vitest';
import { seededCornerOrder } from '../content/endgame';
import { getResearchProject, getResearchCosts, mapNodePricingPhaseForState, remainingMapNodePurchases } from '../content/research';
import { worldCornerIds, worldGridSize } from '../domain/worldGrid';
import { normalizeLegacy } from '../persistence/saves';
import { createInitialState, GameEngine } from '../simulation/engine';
import { getSectorWorldSize } from '../simulation/worldGeneration';
import { activateMod } from './modContent';
import { exportModText, readModTextFile } from './modSharing';
import { emptyMod } from './modTypes';
import { validateMod } from './modValidation';

afterEach(() => activateMod());

it('accepts odd map sizes through a selected preset and saves the factory’s chosen grid', async () => {
  const engine = new GameEngine(createInitialState(82), { autosave: false });
  expect(worldGridSize(engine.getState())).toBe(11);
  expect(remainingMapNodePurchases(engine.getState())).toBe(120);
  const mod = emptyMod();
  mod.rules.worldGridSize = 15;
  mod.profiles = { maps: { selected: 'mod-outer-world', entries: { 'mod-outer-world': { name: 'Outer world', rules: { worldGridSize: 21 } } } } };
  engine.applyMod(await readModTextFile(new Blob([exportModText(mod)])));
  expect(worldGridSize(engine.getState())).toBe(21);
  expect(remainingMapNodePurchases(engine.getState())).toBe(440);
  expect(engine.getSector().id).toBe('5,5');
  engine.undo();
  expect(worldGridSize(engine.getState())).toBe(11);

  engine.applyMod(mod);
  engine.getState().research.mapPoints = 11;
  for (let x = 4; x >= -5; x--) expect(engine.unlockSector(x, 5)).toBe(true);
  expect(engine.unlockSector(-6, 5)).toBe(false);
  engine.switchSector('-5,5');
  expect(engine.getSector().id).toBe('-5,5');
  expect(() => engine.applyMod({ ...emptyMod(), rules: { worldGridSize: 11 } })).toThrow(/before opening/);
  expect(engine.getState().mod).toEqual(mod);
  engine.applyMod();
  const restored = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
  expect(restored.mod).toBeUndefined();
  expect(worldGridSize(restored)).toBe(21);
  expect(restored.activeSectorId).toBe('-5,5');
  expect(restored.sectors['-5,5'].nodes.length).toBeGreaterThan(0);
  for (const invalid of [9, 12, 20.5, 23]) {
    expect(() => validateMod({ ...emptyMod(), rules: { worldGridSize: invalid } })).toThrow(/World map size/);
  }
});

it('generates and reveals all 441 sectors with seeded camps at the four outer corners', () => {
  const engine = new GameEngine(createInitialState(82), { autosave: false });
  const mod = emptyMod();
  mod.rules.worldGridSize = 21;
  mod.nodes.forest = { worldSpawn: { minTier: 19, maxTier: 19, chance: 1 } };
  engine.applyMod(mod);
  engine.developerUnlockAllSectors();
  const state = engine.getState();
  const sectors = Object.values(state.sectors);
  expect(sectors).toHaveLength(441);
  expect(sectors.every(sector => sector.unlocked)).toBe(true);
  expect(state.devMapSurveysRevealed).toBe(true);
  expect(remainingMapNodePurchases(state)).toBe(0);
  expect(sectors.filter(sector => sector.nodes.some(node => node.kind === 'cornerChallenge')).map(sector => sector.id).sort()).toEqual(worldCornerIds(21).sort());
  expect(sectors.flatMap(sector => sector.nodes).filter(node => node.kind === 'resourceGolem')).toHaveLength(4);
  expect(state.sectors['0,0'].nodes.some(node => node.resourceItem === 'iron')).toBe(true);
  expect(state.sectors['-5,-4'].nodes.some(node => node.kind === 'forest' && node.id.startsWith('mod-spawn-'))).toBe(true);
  const order = seededCornerOrder(state.seed);
  for (const [index, id] of worldCornerIds(21).entries()) {
    const sector = state.sectors[id];
    const field = getSectorWorldSize(sector, state.research.completed);
    const [camp, tribute] = sector.nodes;
    expect(sector.nodes).toHaveLength(2);
    expect(camp.cornerType).toBe(order[index]);
    expect(camp.cornerCampQuadrant).toBe(['northwest', 'northeast', 'southeast', 'southwest'][index]);
    expect(tribute).toMatchObject({ x: field.width / 2, y: field.height / 2, tributeCampId: camp.id });
  }
});

it('starts and ramps a newly unlocked Map Node core tier after the standard map limit', () => {
  const { research } = createInitialState(82);
  research.completed = ['refiner', 'assembler'];
  research.repeatableCompletions = { mapNode: 130 };
  research.mapNodePricingPhase = { tier: 1, startedAt: 0 };
  const phase = mapNodePricingPhaseForState(research);
  const project = getResearchProject('mapNode')!;
  expect(phase).toEqual({ tier: 2, startedAt: 130 });
  expect(getResearchCosts(project, 130, research.completed, phase)).toEqual({ 'simple-core': 5, 'basic-core': 5 });
  expect(getResearchCosts(project, 139, research.completed, phase)).toEqual({ 'simple-core': 10, 'basic-core': 10 });
});
