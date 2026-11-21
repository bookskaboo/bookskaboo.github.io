/** Seeded terrain distribution, shared by new worlds and the author review. */
import { DEFAULT_WORLD_GRID_SIZE, WORLD_GRID_SIZES, isWorldGridSize, worldGridBounds } from '../domain/worldGrid';
import { CORNER_NAMES, seededCornerOrder, type CornerType } from '../content/endgame';
export const WORLD_SIZES = WORLD_GRID_SIZES;
export const TERRAINS = ['badlands', 'grassland', 'desert', 'rocky'] as const;
export type Terrain = typeof TERRAINS[number];
export type Resource = 'forest' | 'stone' | 'copper' | 'iron' | 'mythril';
export const NAMES: Record<Terrain, string> = { badlands: 'Badlands', grassland: 'Grassland', desert: 'Desert', rocky: 'Rocky' };
export const CAP: Record<Terrain, { forest: number; mineral: number }> = {
  badlands: { forest: 0, mineral: .5 }, grassland: { forest: 1, mineral: 1 },
  desert: { forest: .1, mineral: .5 }, rocky: { forest: .5, mineral: 2 },
};
export const FOREST_RATE: Record<Terrain, number> = { badlands: 0, grassland: 1, desert: .1, rocky: 1 };
export const QUADRANTS = ['nw', 'ne', 'se', 'sw'] as const;
export type Quadrant = typeof QUADRANTS[number];
export const QUADRANT_NAMES: Record<Quadrant, string> = { nw:'Northwest', ne:'Northeast', se:'Southeast', sw:'Southwest' };
export const CORNER_TERRAIN: Record<CornerType, Terrain> = { alpha:'badlands', grove:'grassland', reclamation:'desert', foundry:'rocky' };
export const DEFAULT_QUADRANT_WEIGHT = 1.5;
export const QUADRANT_ENTRY_NAMES: Record<Quadrant,string> = { nw:'N1.W1',ne:'N1.E1',se:'S1.E1',sw:'S1.W1' };
export function quadrantPreferences(seed: number, order: readonly CornerType[] = seededCornerOrder(seed)) {
  return QUADRANTS.map((quadrant,i)=>({quadrant,encounter:order[i],name:CORNER_NAMES[order[i]],terrain:CORNER_TERRAIN[order[i]]}));
}
export function terrainQuadrant(index: number, size: number): Quadrant | null {
  const middle=Math.floor(size/2),col=index%size,row=Math.floor(index/size);
  if(col===middle||row===middle)return null;
  return row<middle ? (col<middle?'nw':'ne') : (col<middle?'sw':'se');
}
export function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
export function stockExample(terrain: Terrain, resource: Resource, baseline: number, dwarven: boolean) {
  if (resource === 'mythril' && !dwarven) return null;
  if (resource === 'forest' && terrain === 'badlands') return null;
  return Math.round(baseline * CAP[terrain][resource === 'forest' ? 'forest' : 'mineral']);
}
export function terrainCounts(size = DEFAULT_WORLD_GRID_SIZE): Record<Terrain, number> {
  if (!isWorldGridSize(size)) throw new RangeError('Use a supported odd world size from 11 through 21.');
  const quarter = Math.floor(size * size / 4);
  return { badlands: quarter, grassland: quarter + 1, desert: quarter, rocky: quarter };
}
export function fixedGrasslandIndices(size = DEFAULT_WORLD_GRID_SIZE) {
  terrainCounts(size);
  return [0, size - 1, Math.floor(size * size / 2), size * (size - 1), size * size - 1];
}
export function terrainCoordinate(index: number, size = DEFAULT_WORLD_GRID_SIZE) {
  terrainCounts(size);
  if (!Number.isInteger(index) || index < 0 || index >= size * size) throw new RangeError('Map index is outside the world.');
  const { min } = worldGridBounds(size);
  return { x: min + index % size, y: min + Math.floor(index / size) };
}
export function quadrantEntrySites(seed: number, size = DEFAULT_WORLD_GRID_SIZE, order: readonly CornerType[] = seededCornerOrder(seed)) {
  terrainCounts(size);
  const center=Math.floor(size*size/2),indices=[center-size-1,center-size+1,center+size+1,center+size-1];
  return quadrantPreferences(seed, order).map((p,i)=>({...p,index:indices[i],...terrainCoordinate(indices[i],size),position:QUADRANT_ENTRY_NAMES[p.quadrant]}));
}
export function fixedTerrainSites(seed: number, size = DEFAULT_WORLD_GRID_SIZE, includeEntries = true, order: readonly CornerType[] = seededCornerOrder(seed)) {
  const center=Math.floor(size*size/2);
  const base=fixedGrasslandIndices(size).map(index=>({index,terrain:'grassland' as Terrain,kind:index===center?'home':'corner',...terrainCoordinate(index,size)}));
  return includeEntries?[...base,...quadrantEntrySites(seed,size,order).map(site=>({...site,kind:'quadrant-entry'}))]:base;
}
/** Adopted planning distribution. Independent of gameplay RNG; runtime version 1. */
export function terrainWorld(seed: number, size = DEFAULT_WORLD_GRID_SIZE, quadrantWeight = DEFAULT_QUADRANT_WEIGHT, guaranteeEntries = quadrantWeight!==1, order: readonly CornerType[] = seededCornerOrder(seed)): Terrain[] {
  const counts = terrainCounts(size);
  if (!Number.isFinite(quadrantWeight) || quadrantWeight<1 || quadrantWeight>2) throw new RangeError('Use a quadrant placement weight from 1 through 2.');
  const fixed = new Map<number,Terrain>(fixedTerrainSites(seed,size,guaranteeEntries,order).map(site=>[site.index,site.terrain]));
  if(quadrantWeight!==1||guaranteeEntries) {
    // Shuffle placement order so quota exhaustion cannot favor one compass direction.
    const positions=Array.from({length:size*size},(_,i)=>i).filter(i=>!fixed.has(i));
    const placementRandom=randomFrom(seed ^ 0x51424941);
    for(let i=positions.length-1;i>0;i--) {const j=Math.floor(placementRandom()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
    const remaining={...counts};
    for(const terrain of fixed.values())remaining[terrain]--;
    const preferences=Object.fromEntries(quadrantPreferences(seed,order).map(p=>[p.quadrant,p.terrain])) as Record<Quadrant,Terrain>;
    const world=Array<Terrain>(size*size).fill('grassland');
    for(const [index,terrain] of fixed)world[index]=terrain;
    for(const index of positions) {
      const quadrant=terrainQuadrant(index,size),preferred=quadrant?preferences[quadrant]:null;
      const weights=TERRAINS.map(t=>remaining[t]*(t===preferred?quadrantWeight:1));
      let draw=placementRandom()*weights.reduce((sum,w)=>sum+w,0),chosen:Terrain|undefined;
      for(let i=0;i<TERRAINS.length;i++) {draw-=weights[i];if(draw<0){chosen=TERRAINS[i];break;}}
      if(!chosen) chosen=[...TERRAINS].reverse().find(t=>remaining[t]>0)!;
      world[index]=chosen;remaining[chosen]--;
    }
    return world;
  }
  // Retain the exact earlier unbiased specimen for comparison.
  const bag = TERRAINS.flatMap(kind => Array<Terrain>(counts[kind] - (kind === 'grassland' ? 5 : 0)).fill(kind));
  const random = randomFrom(seed ^ 0x54494c45);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  let cursor = 0;
  return Array.from({ length: size * size }, (_, i) => fixed.has(i) ? 'grassland' : bag[cursor++]);
}

export function quadrantSummary(seed: number, size: number, world: Terrain[], guaranteeEntries = true) {
  const fixed=new Set(fixedGrasslandIndices(size));
  const entries=quadrantEntrySites(seed,size);
  if(guaranteeEntries)for(const entry of entries)fixed.add(entry.index);
  return quadrantPreferences(seed).map(preference=>{
    const all=world.map((_,i)=>i).filter(i=>terrainQuadrant(i,size)===preference.quadrant);
    const indices=all.filter(i=>!fixed.has(i));
    return {...preference,maps:indices.length,preferred:indices.filter(i=>world[i]===preference.terrain).length,totalMaps:all.length,totalPreferred:all.filter(i=>world[i]===preference.terrain).length,guaranteedEntry:guaranteeEntries?entries.find(e=>e.quadrant===preference.quadrant):null};
  });
}
