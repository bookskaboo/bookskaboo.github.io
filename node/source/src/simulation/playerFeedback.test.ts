import { expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import type { PlayerFeedback } from '../domain/playerFeedback';
import { getResearchCostsForState, getResearchProject } from '../content/research';
function fixture() {
  const state = createInitialState(214); state.sectors['5,5'].nodes = []; state.sectors['5,5'].connections = [];
  state.research.unlocked.push('kiln', 'autonomousLogistics', 'researchCenter');
  state.hasCreatedConnection = true;
  state.research.completed = ['kiln','smelter','refiner','researchCenter','assembler','exploration','basicCore'];
  const engine = new GameEngine(state, { autosave: false }), events: PlayerFeedback[] = [];
  engine.subscribeFeedback(event => events.push(event)); return { engine, events };
}
it('emits committed actions once, keeps drag previews/failed/no-op commands silent and isolates feedback failures', () => {
  const { engine, events } = fixture(); engine.subscribeFeedback(() => { throw Error('Audio unavailable'); });
  const kiln = engine.placeNode('kiln', 400, 400)!, storage = engine.placeNode('storage', 800, 400)!;
  expect(kiln && storage).toBeTruthy(); expect(events.map(event => event.type === 'cue' && event.cue)).toEqual(['place','place']);
  events.length = 0; expect(engine.connect(kiln, storage)).toBe(true); expect(events).toEqual([{type:'cue',cue:'connect'}]);
  events.length = 0; engine.beginMove(); expect(engine.tryMoveNodesTo({ [kiln]: { x:450,y:400 } })).toBe(true); engine.tick(1000); expect(events).toEqual([]);
  engine.commitMove(); expect(events).toEqual([{type:'cue',cue:'move'}]); events.length = 0;
  engine.beginMove(); engine.commitMove(); engine.setRecipe(kiln, engine.getSector().nodes.find(node => node.id === kiln)!.recipeId!); engine.placeNode('kiln', -1000, -1000); expect(events).toEqual([]);
  engine.deleteNodes([kiln]); expect(events).toEqual([{type:'cue',cue:'delete'}]); events.length = 0;
  engine.replaceState(engine.getState()); expect(events).toEqual([{type:'reset'}]);
});
it('sounds new lab completion without replaying stored milestones or normal production', () => {
  const { engine, events } = fixture(); const lab = engine.placeNode('researchCenter', 1000, 1000)!;
  const node = engine.getSector().nodes.find(node => node.id === lab)!; node.constructedAt = 0; node.constructionMs = 0;
  node.input = {'simple-core':5,'basic-core':5}; events.length = 0;
  engine.queueResearch('extractor2'); engine.queueResearch('extractor2');
  const costs = getResearchCostsForState(getResearchProject('extractor2')!, engine.getState().research);
  engine.getState().research.contributed = Object.fromEntries(Object.entries(costs).map(([item,cost]) => [item,cost!-1]));
  for(let i=0;i<51;i++)engine.tick(100);
  expect(events[0]).toEqual({type:'cue',cue:'queue'});
  expect(engine.getState().research.completed).toContain('extractor2');
  expect(events.slice(1).every(event => event.type === 'cue' && event.cue === 'complete')).toBe(true);
  expect(events.length).toBeGreaterThan(1);
  events.length = 0; engine.replaceState(engine.getState()); for(let i=0;i<10;i++)engine.tick(100);
  expect(events).toEqual([{type:'reset'}]);
});
it('sounds a successful map activation once and ignores an unavailable repeat', () => {
  const {engine,events}=fixture();engine.getState().research.mapPoints=1;
  expect(engine.unlockSector(6,5)).toBe(true);
  expect(events).toEqual([{type:'cue',cue:'unlock'}]);events.length=0;
  expect(engine.unlockSector(6,5)).toBe(false);expect(events).toEqual([]);
});
