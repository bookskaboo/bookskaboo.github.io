import { describe, expect, it } from 'vitest';
import { boxControlSelection, ControlGroupSelection, copyControlGroups, normalizeControlGroups, regroupControlNodes } from './controlGroups';
import type { ControlGroup, MachineNode } from './types';

const group: ControlGroup = { id: 'g', nodeIds: ['a', 'b', 'c'], color: '#4E79A7', colorName: 'Blue' };
const nodes = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, kind: 'extractor' } as MachineNode));
describe('original control group selection rules', () => {
  it('expands only down-right boxes and prioritizes only up-left boxes, retaining Shift additions', () => {
    expect(boxControlSelection(['a'], [group], {x:0,y:0}, {x:10,y:10}, ['d'])).toEqual({ids:['d','a','b','c'],priority:false});
    expect(boxControlSelection(['a'], [group], {x:10,y:10}, {x:0,y:0})).toEqual({ids:['a'],priority:true});
    expect(boxControlSelection(['a'], [group], {x:0,y:10}, {x:10,y:0})).toEqual({ids:['a'],priority:false});
  });
  it('preserves reverse-box priority while dragging a grouped member and clears it on a new selection', () => {
    const selection = new ControlGroupSelection(); selection.box(['a','d'], true);
    expect(selection.press('a',['a','d'],[group],{x:10,y:10},1000)).toEqual(['a','d']);
    selection.clear();
    expect(selection.press('a',['a'],[group],{x:10,y:10},2000)).toEqual(['a','b','c']);
  });
  it('detects the second press before movement, preserving individual mode for subsequent dragging', () => {
    const selection = new ControlGroupSelection();
    expect(selection.press('a',[],[group],{x:10,y:10},1000)).toEqual(['a','b','c']);
    expect(selection.press('a',['a','b','c'],[group],{x:12,y:11},1400)).toEqual(['a']);
    expect(selection.press('a',['a'],[group],{x:12,y:11},2200)).toEqual(['a']);
    selection.box([],false);
    expect(selection.press('a',[],[group],{x:12,y:11},3000)).toEqual(['a','b','c']);
  });
  it('does not mistake a distant or late press for a double click and adds groups with Shift', () => {
    const selection = new ControlGroupSelection();
    selection.press('a',[],[group],{x:10,y:10},1000);
    expect(selection.press('a',[],[group],{x:50,y:10},1100)).toEqual(['a','b','c']);
    expect(selection.press('a',['d'],[group],{x:50,y:10},2000,true)).toEqual(['d','a','b','c']);
    expect(selection.press('b',['a','b','c','d'],[group],{x:1,y:1},3000)).toEqual(['a','b','c','d']);
  });
  it('moves regrouped members out of previous groups and drops orphaned singletons', () => {
    const next = {...group,id:'new',nodeIds:['a','b','d']};
    expect(regroupControlNodes([group],next)).toEqual([next]);
    const remaining = regroupControlNodes([group],{...next,nodeIds:['a','d']});
    expect(remaining[0].nodeIds).toEqual(['b','c']);
  });
  it('normalizes old saves and copies complete groups into independent identities', () => {
    expect(normalizeControlGroups([{...group,nodeIds:['a','a','b','missing']},{...group,id:'invalid',nodeIds:['a','c']},null],nodes)).toEqual([{...group,nodeIds:['a','b']}]);
    expect(copyControlGroups([group],new Map([['a','aa'],['b','bb']]),()=> 'copy')).toEqual([]);
    expect(copyControlGroups([group],new Map([['a','aa'],['b','bb'],['c','cc']]),()=> 'copy')).toEqual([{...group,id:'copy',nodeIds:['aa','bb','cc']}]);
  });
});
