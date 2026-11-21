import type { GameState, MachineNode } from '../domain/types';
import { CAP, FOREST_RATE, TERRAINS, fixedTerrainSites, terrainCoordinate, terrainCounts, terrainWorld, type Terrain } from '../domain/mapTerrain';
import { seededCornerOrder } from '../content/endgame';
import { worldGridSize } from '../domain/worldGrid';
import { modNode } from '../mods/modRules';

export function generateMapTerrains(seed: number, size = 11, order = seededCornerOrder(seed)): Record<string, Terrain> {
  return Object.fromEntries(terrainWorld(seed, size, 1.5, true, order).map((terrain, index) => {
    const { x, y } = terrainCoordinate(index, size);
    return [`${x},${y}`, terrain];
  }));
}
export function mapTerrain(state: GameState, id: string): Terrain | undefined {
  return state.mapTerrainVersion === 1 ? state.mapTerrains?.[id] : undefined;
}
/** Information is revealed on first visit, independently of purchase or developer surveys. */
export function revealedMapTerrain(state: GameState, id: string) {
  return id === state.activeSectorId || state.sectors[id]?.visited ? mapTerrain(state, id) : undefined;
}
export function forestTerrainRate(state: GameState, id: string) {
  const terrain = mapTerrain(state, id);
  return terrain ? FOREST_RATE[terrain] : 1;
}
/** Called exactly once on newly generated reserves, after mod baseline capacities. */
export function applyMapTerrain(nodes: MachineNode[], terrain?: Terrain): MachineNode[] {
  if (!terrain) return nodes;
  const isForest = (node: MachineNode) => node.kind === 'forest' || modNode(node.kind)?.template === 'forest';
  return nodes.filter(node => terrain !== 'badlands' || !isForest(node)).map(node => {
    if (node.infiniteResource || node.kind === 'lake' || node.resourceCapacity === undefined) return node;
    const forest = isForest(node);
    if (!forest && !['stone', 'copper', 'iron', 'mythril'].includes(node.resourceItem ?? '')) return node;
    const factor = CAP[terrain][forest ? 'forest' : 'mineral'];
    return { ...node, resourceCapacity: Math.round(node.resourceCapacity * factor),
      resourceRemaining: Math.round((node.resourceRemaining ?? node.resourceCapacity) * factor) };
  });
}
/** Never opt a legacy save in or rebuild an opted-in layout on load. */
export function normalizeMapTerrains(state: GameState) {
  if (state.mapTerrainVersion === undefined || state.mapTerrainVersion === 0) {
    state.mapTerrainVersion = 0;
    delete state.mapTerrains;
    return;
  }
  const size = worldGridSize(state), value = state.mapTerrains;
  if (state.mapTerrainVersion !== 1 || !value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== size * size) throw Error('Invalid saved map terrain layout.');
  for (let i = 0; i < size * size; i++) {
    const { x, y } = terrainCoordinate(i, size);
    if (!TERRAINS.includes(value[`${x},${y}`])) throw Error('Invalid saved map terrain layout.');
  }
  const expected = terrainCounts(size);
  for (const terrain of TERRAINS) if (Object.values(value).filter(t => t === terrain).length !== expected[terrain]) throw Error('Invalid saved terrain totals.');
  for (const site of fixedTerrainSites(state.seed,size,true,state.endgame?.cornerOrder)) {
    if (value[`${site.x},${site.y}`] !== site.terrain) throw Error('Invalid saved fixed terrain site.');
  }
}
