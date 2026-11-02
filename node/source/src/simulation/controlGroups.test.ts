import { describe, expect, it } from 'vitest';
import { GameEngine, createInitialState } from './engine';
import { normalizeLegacy } from '../persistence/saves';
import { createTutorialState, CONTROL_GROUP_NODE_IDS, lessonSatisfied } from '../tutorials/tutorialRuntime';

const setup = () => new GameEngine(createTutorialState('control-groups'), {autosave:false});
const color = '#4E79A7';
describe('persistent control groups', () => {
  it('requires two distinct eligible members and a palette color', () => {
    const engine = setup(); const [a,b] = CONTROL_GROUP_NODE_IDS;
    expect(engine.createControlGroup([a,a],color)).toBeUndefined();
    expect(engine.createControlGroup([a,'missing'],color)).toBeUndefined();
    expect(engine.createControlGroup([a,b],'invalid')).toBeUndefined();
    expect(engine.getSector().controlGroups).toEqual([]);
  });
  it('keeps relative positions and cables on a group move, and supports undo', () => {
    const engine=setup(); const ids=CONTROL_GROUP_NODE_IDS; const group=engine.createControlGroup(ids,color)!;
    const origins=engine.getSector().nodes.map(node=>({x:node.x,y:node.y}));
    const connections=structuredClone(engine.getSector().connections);
    engine.beginMove(); expect(engine.tryMoveNodesTo(Object.fromEntries(engine.getSector().nodes.map(node=>[node.id,{x:node.x+100,y:node.y+100}])))).toBe(true); engine.commitMove();
    expect(engine.getSector().nodes.map(node=>({x:node.x,y:node.y}))).toEqual(origins.map(p=>({x:p.x+100,y:p.y+100})));
    expect(engine.getSector().connections).toEqual(connections);
    engine.undo(); expect(engine.getSector().nodes.map(node=>({x:node.x,y:node.y}))).toEqual(origins);
    expect(engine.getSector().controlGroups?.[0].id).toBe(group.id);
  });
  it('retains membership when moving one member and disbands without altering the factory', () => {
    const engine=setup(); const group=engine.createControlGroup(CONTROL_GROUP_NODE_IDS,color)!;
    const member=engine.getSector().nodes[0]; expect(engine.tryMoveNodesTo({[member.id]:{x:member.x,y:member.y+80}})).toBe(true);
    expect(engine.getSector().controlGroups?.[0].nodeIds).toEqual(CONTROL_GROUP_NODE_IDS);
    const nodes=structuredClone(engine.getSector().nodes); const links=structuredClone(engine.getSector().connections);
    expect(engine.disbandControlGroup(group.id)).toBe(true);
    expect(engine.getSector().nodes).toEqual(nodes); expect(engine.getSector().connections).toEqual(links);
    engine.undo(); expect(engine.getSector().controlGroups?.[0]).toEqual(group);
  });
  it('copies complete groups, prunes deleted members, and roundtrips through saved games', () => {
    const engine=setup(); const ids=CONTROL_GROUP_NODE_IDS; const group=engine.createControlGroup(ids,color)!;
    const copies=engine.duplicateNodes(ids); expect(copies).toHaveLength(3);
    expect(engine.getSector().controlGroups).toHaveLength(2);
    const copy=engine.getSector().controlGroups![1]; expect(copy.nodeIds).toEqual(copies); expect(copy.id).not.toBe(group.id);
    engine.deleteNodes([ids[0]]); expect(engine.getSector().controlGroups?.[0].nodeIds).toEqual(ids.slice(1));
    const restored=new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    expect(restored.getSector().controlGroups).toEqual(engine.getSector().controlGroups);
    restored.deleteNodes([ids[1]]); expect(restored.getSector().controlGroups).toHaveLength(1);
  });
  it('imports original-game factory groups and leaves ungrouped saves loadable', () => {
    const original={version:1,activeMapSector:'5,5',nodes:[{id:'a',kind:'extractor'},{id:'b',kind:'extractor'}],positions:{a:{x:500,y:400},b:{x:900,y:400}},connections:[],controlGroups:[{id:'old',nodeIds:['a','b'],color,colorName:'Blue'}],runtime:{research:{}}};
    const restored=normalizeLegacy(original)!;
    expect(restored.sectors['5,5'].controlGroups).toEqual(original.controlGroups);
    expect(new GameEngine(createInitialState(1)).getSector().controlGroups).toEqual([]);
  });
  it('requires actual group selection and movement to complete tutorial tasks', () => {
    const engine=setup(); const ids=CONTROL_GROUP_NODE_IDS;
    expect(lessonSatisfied('control-group-select',engine.getState(),null,undefined,{selectedIds:ids})).toBe(true);
    expect(lessonSatisfied('control-group-create',engine.getState(),null)).toBe(false);
    engine.createControlGroup(ids,color); expect(lessonSatisfied('control-group-create',engine.getState(),null)).toBe(true);
    expect(lessonSatisfied('control-group-double-click',engine.getState(),null,undefined,{selectedIds:[ids[0]],selectionInfo:{source:'node',individual:true}})).toBe(true);
    expect(lessonSatisfied('control-group-select-reverse',engine.getState(),null,undefined,{selectedIds:ids,selectionInfo:{source:'box',priority:true}})).toBe(false);
    expect(lessonSatisfied('control-group-select-reverse',engine.getState(),null,undefined,{selectedIds:[ids[0]],selectionInfo:{source:'box',priority:true}})).toBe(true);
  });
});
