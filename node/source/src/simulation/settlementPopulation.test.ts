import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameState, SectorState } from '../domain/types';
import { worldGridBounds } from '../domain/worldGrid';
import { normalizeLegacy, saveSlot, readSlots, copySaveToSlot, readAutosave, AUTOSAVE_KEY } from '../persistence/saves';
import { activateMod } from '../mods/modContent';
import { emptyMod } from '../mods/modTypes';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getEncounterLayoutVersion, sectorDistance, sectorForState } from './worldGeneration';

type LayoutVersion = NonNullable<GameState['encounterLayoutVersion']>;
const bands: Record<string, number[]> = {
  'goblin-camp': [1, 2, 3], 'goblin-village': [4, 5, 6], 'goblin-kingdom': [7, 8, 9],
  'dwarven-camp': [4, 5], 'dwarven-village': [6, 7], 'dwarven-kingdom': [8, 9],
};
const world = (seed: number, version: LayoutVersion, size = 11) => {
  const sectors: SectorState[] = [], { min, max } = worldGridBounds(size);
  for (let y = min; y <= max; y++) for (let x = min; x <= max; x++) {
    sectors.push(generateSector(x, y, seed, 0, [], 5, version, size, 1, 2));
  }
  return sectors;
};
const settlements = (sectors: SectorState[]) => sectors.flatMap(sector => sector.nodes
  .filter(node => node.kind === 'monster-camp')
  .map(node => ({ sector, node, tier: sectorDistance(sector.x, sector.y), key: `${node.lizardSettlement ? 'dwarven' : 'goblin'}-${node.lizardSettlement ?? node.goblinSettlement}` })));
const layout = (sectors: SectorState[]) => sectors.map(s => [s.id, s.nodes.filter(n =>
  ['monster-camp', 'lake', 'resourceGolem', 'big-hole', 'cornerChallenge'].includes(n.kind))
  .map(n => [n.id, n.kind, n.goblinSettlement, n.lizardSettlement, n.golemMineral])]);

afterEach(() => { activateMod(); vi.unstubAllGlobals(); });

describe('retained thirty-settlement layout', () => {
  it.each([1, 7, 37, 99, 98765, 2147483647])('retains five of every faction/level and guarded reserves for seed %i', seed => {
    const fresh = createInitialState(seed);
    expect(fresh.encounterLayoutVersion).toBe(2);
    const sectors = world(seed, 2).map(s => s.id === '5,5' ? s : sectorForState(fresh, s.x, s.y)), camps = settlements(sectors);
    expect(camps).toHaveLength(30);
    expect(new Set(camps.map(c => c.sector.id)).size).toBe(30);
    for (const [key, range] of Object.entries(bands)) {
      const pair = camps.filter(c => c.key === key);
      expect(pair).toHaveLength(5);
      for (const { tier } of pair) expect(range).toContain(tier);
    }
    for (const { node, sector } of camps) {
      const deposit = sector.nodes.find(n => n.guardedCampId === node.id)!;
      expect(deposit).toMatchObject({ x: node.x, y: node.y, guardedLocked: true });
      expect(sector.nodes.some(n => ['lake', 'resourceGolem', 'big-hole', 'cornerChallenge'].includes(n.kind))).toBe(false);
    }
    expect(sectors.filter(s => s.nodes.some(n => n.kind === 'resourceGolem'))).toHaveLength(4);
    expect(sectors.filter(s => s.nodes.some(n => n.kind === 'cornerChallenge'))).toHaveLength(4);
    expect(sectors.filter(s => s.nodes.some(n => n.kind === 'big-hole'))).toHaveLength(28);
    expect(sectors.find(s => s.id === '6,5')!.nodes.some(n => ['monster-camp', 'lake', 'big-hole'].includes(n.kind))).toBe(false);
    expect(sectors.find(s => s.id === '7,5')!.nodes.some(n => n.kind === 'lake')).toBe(true);
    // Interleave other versions/seeds to exercise both encounter and hole-mask caches.
    world(seed + 1, 2);
    expect(layout(world(seed, 2))).toEqual(layout(sectors));
  });

  it.each([13, 21])('keeps the thirty-settlement quota on an unmodified %i-square grid', size => {
    const camps = settlements(world(37, 2, size));
    expect(camps).toHaveLength(30);
    for (const key of Object.keys(bands)) expect(camps.filter(c => c.key === key)).toHaveLength(5);
  });

  it.each([1, 2] as const)('retains the thirty-settlement distribution for saved layout %i', version => {
    const state = createInitialState(37); state.encounterLayoutVersion = version;
    const expected = world(state.seed, version);
    const campCounts = settlements(expected);
    expect(campCounts).toHaveLength(30);
    for (const key of Object.keys(bands)) expect(campCounts.filter(c => c.key === key)).toHaveLength(5);
    const visited = expected.find(s => s.nodes.some(n => n.kind === 'monster-camp'))!;
    visited.unlocked = true; visited.visited = true; state.sectors[visited.id] = visited;
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!, { autosave: false }).getState();
    expect(restored.encounterLayoutVersion).toBe(version);
    const later = expected.map(s => sectorForState(restored, s.x, s.y));
    expect(layout(later)).toEqual(layout(expected));
  });

  it('keeps new games and unmarked imports on the original layout versions', () => {
    const fresh = createInitialState(37); expect(fresh.encounterLayoutVersion).toBe(2);
    const homeOnly = structuredClone(fresh); delete homeOnly.encounterLayoutVersion;
    expect(getEncounterLayoutVersion(homeOnly)).toBe(2);
    expect(new GameEngine(normalizeLegacy(homeOnly)!).getState().encounterLayoutVersion).toBe(2);
    const explored = structuredClone(homeOnly), sector = generateSector(5, 4, 37, 0, [], 5, 1);
    sector.unlocked = true; explored.sectors[sector.id] = sector;
    expect(new GameEngine(normalizeLegacy(explored)!).getState().encounterLayoutVersion).toBe(1);
  });

  it.each([1, 2] as const)('persists layout %i through slots, copies, autosave, mods, undo and later exploration', version => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    const state = createInitialState(37); state.encounterLayoutVersion = version;
    saveSlot(0, state); copySaveToSlot(1, readSlots()[0]!);
    const saved = readSlots()[1]!.state; expect(saved.encounterLayoutVersion).toBe(version);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saved)); expect(readAutosave()!.state.encounterLayoutVersion).toBe(version);
    const engine = new GameEngine(saved, { autosave: false });
    engine.applyMod(emptyMod()); expect(engine.getState().encounterLayoutVersion).toBe(version);
    engine.applyMod(undefined); expect(engine.getState().encounterLayoutVersion).toBe(version);
    engine.undo(); expect(engine.getState().encounterLayoutVersion).toBe(version);
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false }).getState();
    expect(loaded.encounterLayoutVersion).toBe(version);
    expect(layout(world(37, version))).toEqual(layout(world(37, version).map(s => sectorForState(loaded, s.x, s.y))));
  });
});
