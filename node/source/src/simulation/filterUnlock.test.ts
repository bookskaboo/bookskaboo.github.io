import { afterEach, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import { activateMod, BASE_MOD_CONTENT } from '../mods/modContent';
import { emptyMod } from '../mods/modTypes';
import { parseSaveFile, serializeSaveFile } from '../persistence/saves';
import { tutorialNode } from '../tutorials/tutorialRuntime';
afterEach(() => activateMod());

it('unlocks Filter and Waste Bin on the final Precision Control payment without another project', () => {
  const state=createInitialState(82);
  state.sectors['5,5'].nodes=[tutorialNode('researchCenter','lab',1000,1000,{input:{'simple-core':1,'basic-core':1,'automata-core':1,'hydro-core':1,'shiny-core':1}})];
  state.sectors['5,5'].connections=[];
  state.research.completed=['kiln','smelter','refiner','researchCenter','assembler','exploration','fabricatorTools','oreSeparation','basicCore','automataCore','hydroCore','shinyCore'];
  state.research.unlocked=[...state.research.completed];
  const engine=new GameEngine(state,{autosave:false}),research=engine.getState().research;
  expect(isNodeUnlocked('filter',research.unlocked)).toBe(false);
  expect(engine.queueResearch('precisionControl')).toBe('added');
  const costs=getResearchCostsForState(getResearchProject('precisionControl')!,research);
  research.contributed=Object.fromEntries(Object.entries(costs).map(([item,cost])=>[item,cost!-1]));
  for(let i=0;i<49;i++)engine.tick(100);
  expect(isNodeUnlocked('filter',research.unlocked)).toBe(false);
  engine.tick(100);
  expect(research.completed).toContain('precisionControl');expect(research.completed).toContain('sortingTools');
  expect(isNodeUnlocked('filter',research.unlocked)).toBe(true);expect(isNodeUnlocked('wasteHopper',research.unlocked)).toBe(true);
  expect(getResearchProject('sortingTools')!.unlock).toContain('Filter');
  expect(getResearchProject('precisionControl')!.description).toContain('Filter');
  expect(engine.placeNode('filter',2000,500)).toBeTruthy();
  const loaded=new GameEngine(parseSaveFile(serializeSaveFile(engine.getState())).state,{autosave:false});
  expect(isNodeUnlocked('filter',loaded.getState().research.unlocked)).toBe(true);
});

it('keeps existing pre-unlock Filters, stock, configuration and routing intact on load', () => {
  const state=createInitialState(82),sector=state.sectors['5,5'];
  sector.nodes=[tutorialNode('woodenChest','source',400,400,{output:{wood:2}}),tutorialNode('filter','filter',700,400,{filterItem:'wood'}),tutorialNode('woodenChest','target',1000,400)];
  sector.connections=[{id:'in',from:'source',to:'filter',fromPort:0,toPort:0,createdAt:0},{id:'out',from:'filter',to:'target',fromPort:0,toPort:0,createdAt:0}];
  const engine=new GameEngine(parseSaveFile(serializeSaveFile(state)).state,{autosave:false});
  expect(isNodeUnlocked('filter',engine.getState().research.unlocked)).toBe(false);
  expect(engine.getSector().nodes.some(node=>node.id==='filter')).toBe(true);
  expect(engine.setFilterItem('filter','wood',0)).toBe(true);
  for(let i=0;i<25;i++)engine.tick(100);
  const target=engine.getSector().nodes.find(node=>node.id==='target')!;
  expect((target.input.wood??0)+(target.output.wood??0)).toBe(2);
  expect(engine.getSector().connections).toHaveLength(2);
  expect(engine.getState().research.completed).not.toContain('sortingTools');
});

it('keeps the applied-mod base catalog separate from vanilla unlocks', () => {
  activateMod();expect(NODE_DEFINITIONS.filter.unlockResearch).toBe('sortingTools');
  expect(BASE_MOD_CONTENT.nodes.filter.unlockResearch).toBeUndefined();
  expect(BASE_MOD_CONTENT.research.find(project=>project.id==='sortingTools')!.unlock).toBe('Unlocks the Waste Bin.');
  const mod=emptyMod();
  activateMod(mod);expect(NODE_DEFINITIONS.filter.unlockResearch).toBeUndefined();
  const customMod=emptyMod();customMod.nodes.filter={unlockResearch:'oreSeparation'};
  activateMod(customMod);expect(NODE_DEFINITIONS.filter.unlockResearch).toBe('oreSeparation');
  activateMod();expect(NODE_DEFINITIONS.filter.unlockResearch).toBe('sortingTools');
});
