import { afterEach, expect, it } from 'vitest';
import { createInitialState } from './engine';
import { sectorForState, getWorldFieldSize } from './worldGeneration';
import { borderTerrainInsets, clearsBorderTerrain } from './borderTerrainClearance';
import { setActiveModRules } from '../mods/modRules';
import { emptyMod } from '../mods/modTypes';
import { footprintsOverlap } from '../domain/obstructionGeometry';

afterEach(() => setActiveModRules());

it('keeps generated bodies clear of border artwork, including full camps and future reserves', () => {
  const kinds = new Set<string>();
  let maps = 0;
  for (const seed of [...Array.from({length:30},(_,i)=>i),615,76,260]) {
    const state = createInitialState(seed);
    const field = getWorldFieldSize(state), largest = { width: field.width * 1.5, height: field.height * 1.5 };
    for (const id of new Set(state.borderObstructions!.flatMap(edge => [edge.from, edge.to]))) {
      const [x,y] = id.split(',').map(Number), sector = sectorForState(state,x,y);
      const insets = borderTerrainInsets(state, id, largest);
      for (const node of sector.nodes) {
        kinds.add(node.kind);
        expect(clearsBorderTerrain(node,field,insets), `seed ${seed}, ${id}, ${node.kind}`).toBe(true);
        if (node.guardedCampId) {
          const camp = sector.nodes.find(n => n.id === node.guardedCampId)!;
          expect(node.y).toBe(camp.y);
          expect(footprintsOverlap(node,{...camp,campStrength:10})).toBe(false);
          expect(footprintsOverlap(node,{...camp,campStrength:20})).toBe(true);
        }
      }
      maps++;
    }
  }
  expect(maps).toBeGreaterThan(1700);
  for (const kind of ['iron','copper','forest','stoneDeposit','big-hole','lake','monster-camp','resourceGolem']) expect(kinds.has(kind)).toBe(true);
}, 60000);

it('preserves saved sectors and leaves legacy borders unreserved', () => {
  const state = createInitialState(37), edge = state.borderObstructions![0], [x,y] = edge.from.split(',').map(Number);
  const generated = sectorForState(state,x,y); generated.nodes[0].x = 1;
  state.sectors[edge.from] = generated;
  expect(sectorForState(state,x,y)).toBe(generated);
  expect(generated.nodes[0].x).toBe(1);
  state.borderObstructionVersion = 0;
  expect(borderTerrainInsets(state,edge.from,{width:3600,height:2400})).toEqual({north:0,east:0,south:0,west:0});
});

it('fails closed when a full-sized generated layout cannot fit a reservation', async () => {
  const { generateSector } = await import('./worldGeneration');
  expect(() => generateSector(7,5,37,0,[],5,2,11,1,2,undefined,{north:2400,east:0,south:0,west:0})).toThrow('No clear terrain layout');
});

it.each([[0,9,4,4,1],[2,6,2,1,4]])('fits a border-adjacent Lake without reducing its area on asymmetric fields (%i,%i,%i)', (seed,x,y,width,height) => {
  const state = createInitialState(seed), mod = emptyMod();
  mod.rules = { mapWidthMultiplier:width, mapHeightMultiplier:height }; setActiveModRules(mod);
  const field = getWorldFieldSize(state), sector = sectorForState(state,x,y), lake = sector.nodes.find(n=>n.kind==='lake')!;
  expect(lake).toBeDefined();
  const area = Math.PI*lake.obstructionWidth!*lake.obstructionHeight!/4/(field.width*field.height);
  expect(area).toBeGreaterThanOrEqual(.15); expect(area).toBeLessThanOrEqual(.25);
  expect(clearsBorderTerrain(lake,field,borderTerrainInsets(state,sector.id,{width:5400*width,height:3600*height}))).toBe(true);
});
