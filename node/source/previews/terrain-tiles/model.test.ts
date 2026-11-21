import { describe, expect, it } from 'vitest';
import { FOREST_RATE, stockExample, terrainWorld, terrainCounts, terrainCoordinate, quadrantPreferences, quadrantSummary, terrainQuadrant, quadrantEntrySites, CORNER_TERRAIN, DEFAULT_QUADRANT_WEIGHT } from './model';
import { seededCornerOrder } from '../../src/content/endgame';

describe('agreed terrain proposal specimen', () => {
  it.each([
    { size:11, grassland:31, other:30 }, { size:13, grassland:43, other:42 },
    { size:15, grassland:57, other:56 }, { size:17, grassland:73, other:72 },
    { size:19, grassland:91, other:90 }, { size:21, grassland:111, other:110 },
  ])('keeps exact quotas, Grassland Home/corners and four guaranteed entries across 1000 seeds at size $size', ({size,grassland,other}) => {
    for(let seed=0;seed<1000;seed++) {
      const world=terrainWorld(seed,size);
      expect(world).toHaveLength(size*size);
      expect(world.filter(x=>x==='grassland')).toHaveLength(grassland);
      for(const type of ['badlands','desert','rocky']) expect(world.filter(x=>x===type)).toHaveLength(other);
      for(const i of [0,size-1,Math.floor(size*size/2),size*(size-1),size*size-1]) expect(world[i]).toBe('grassland');
      for(const site of quadrantEntrySites(seed,size))expect(world[site.index]).toBe(site.terrain);
    }
  });
  it('preserves the earlier unbiased seed in comparison mode and size-independent call order', () => {
    expect(terrainWorld(2718,11,1).slice(0,11)).toEqual(['grassland','grassland','grassland','desert','grassland','rocky','desert','desert','grassland','desert','grassland']);
    const larger=terrainWorld(2718,21); terrainWorld(99,13);
    expect(terrainWorld(2718,21)).toEqual(larger);
  });
  it('follows actual seeded corner identities instead of binding terrain to compass directions', () => {
    const seen=new Set<string>();
    for(let seed=0;seed<100;seed++) {
      const preferences=quadrantPreferences(seed),order=seededCornerOrder(seed);
      expect(preferences.map(p=>p.encounter)).toEqual(order);
      expect(preferences.map(p=>p.terrain)).toEqual(order.map(type=>CORNER_TERRAIN[type]));
      seen.add(preferences.map(p=>p.terrain).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
  it('leaves the center axes neutral and excludes fixed Grassland from quadrant statistics', () => {
    for(const size of [11,21]) {
      const middle=Math.floor(size/2);
      for(let i=0;i<size;i++) {
        expect(terrainQuadrant(middle+i*size,size)).toBeNull();
        expect(terrainQuadrant(i+middle*size,size)).toBeNull();
      }
      const summaries=quadrantSummary(1,size,terrainWorld(1,size));
      expect(summaries.map(q=>q.maps)).toEqual(Array(4).fill(middle*middle-2));
      expect(summaries.map(q=>q.totalMaps)).toEqual(Array(4).fill(middle*middle));
      expect(terrainQuadrant(0,size)).toBe('nw');
      expect(terrainQuadrant(size-1,size)).toBe('ne');
      expect(terrainQuadrant(size*size-1,size)).toBe('se');
      expect(terrainQuadrant(size*(size-1),size)).toBe('sw');
    }
  });
  it.each([11,21])('increases every preferred terrain share across 1000 seeds at size %s', size => {
    const matched={badlands:[0,0,0],grassland:[0,0,0],desert:[0,0,0],rocky:[0,0,0]};
    for(let seed=0;seed<1000;seed++) {
      const base=quadrantSummary(seed,size,terrainWorld(seed,size,1),false);
      const biased=quadrantSummary(seed,size,terrainWorld(seed,size));
      for(let i=0;i<4;i++) {const tally=matched[base[i].terrain];tally[0]+=base[i].totalPreferred;tally[1]+=biased[i].totalPreferred;tally[2]+=base[i].totalMaps;}
    }
    for(const [baseline,biased,maps] of Object.values(matched)) expect(biased/maps).toBeGreaterThan(baseline/maps+.005);
  });
  it('places each first diagonal one step from serialized Home for every supported size', () => {
    for(const size of [11,13,15,17,19,21]) {
      const entries=quadrantEntrySites(2718,size);
      expect(entries.map(e=>[e.x,e.y,e.position])).toEqual([[4,4,'N1.W1'],[6,4,'N1.E1'],[6,6,'S1.E1'],[4,6,'S1.W1']]);
      expect(new Set(entries.map(e=>e.terrain)).size).toBe(4);
    }
    expect(DEFAULT_QUADRANT_WEIGHT/(DEFAULT_QUADRANT_WEIGHT+3)).toBeCloseTo(1/3);
  });
  it('keeps Home at 5,5 and larger-world boundaries in serialized coordinates', () => {
    expect(terrainCoordinate(0,11)).toEqual({x:0,y:0});
    expect(terrainCoordinate(60,11)).toEqual({x:5,y:5});
    expect(terrainCoordinate(0,21)).toEqual({x:-5,y:-5});
    expect(terrainCoordinate(220,21)).toEqual({x:5,y:5});
    expect(terrainCoordinate(440,21)).toEqual({x:15,y:15});
  });
  it('rejects unsupported sizes and invalid map indices', () => {
    for(const size of [0,10,12,23,NaN]) expect(()=>terrainWorld(1,size)).toThrow(RangeError);
    expect(()=>terrainCoordinate(-1,21)).toThrow(RangeError);
    expect(()=>terrainCoordinate(441,21)).toThrow(RangeError);
    for(const weight of [0,.9,2.1,NaN,Infinity]) expect(()=>terrainWorld(1,11,weight)).toThrow(RangeError);
    expect(terrainCounts(21)).toEqual({badlands:110,grassland:111,desert:110,rocky:110});
  });
  it('is repeatable, order-independent and varies with the seed', () => {
    const first=terrainWorld(2718); terrainWorld(99);
    expect(terrainWorld(2718)).toEqual(first);
    expect(terrainWorld(2719)).not.toEqual(first);
    expect(terrainWorld(0)).toEqual(terrainWorld(0));
    expect(terrainWorld(4294967295)).toHaveLength(121);
  });
  it('uses the corrected Badlands half-capacity and never creates absent resources', () => {
    expect(stockExample('badlands','iron',3000,false)).toBe(1500);
    expect(stockExample('badlands','forest',3000,true)).toBeNull();
    expect(stockExample('badlands','mythril',3000,false)).toBeNull();
    expect(stockExample('badlands','mythril',3000,true)).toBe(1500);
    expect(stockExample('rocky','stone',0,false)).toBe(0);
  });
  it('matches the explicit tier-four capacity and Forest-rate examples', () => {
    expect(stockExample('grassland','forest',3000,false)).toBe(3000);
    expect(stockExample('desert','forest',3000,false)).toBe(300);
    expect(stockExample('desert','copper',3000,false)).toBe(1500);
    expect(stockExample('rocky','forest',3000,false)).toBe(1500);
    expect(stockExample('rocky','mythril',3000,true)).toBe(6000);
    expect(30/FOREST_RATE.desert).toBe(300);
    expect(30/FOREST_RATE.rocky).toBe(30);
  });
});
