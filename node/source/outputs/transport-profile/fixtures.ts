import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { generateSector } from '../../src/simulation/worldGeneration';
import { tutorialNode } from '../../src/tutorials/tutorialRuntime';
import { getNodeCapabilities } from '../../src/content/nodeCapabilities';
import type { GameState, ItemId, MachineNode } from '../../src/domain/types';

export const sources = {
  shiny: 'outputs/tribute-first-playtest-2026-11-12/10-tribute-first-checkpoint.json',
  late: 'outputs/live-map-pricing-playtest-2026-11-15/10-final-checkpoint.json',
};
export const caseIds=['fresh','shiny','late','active','blocked','idle'];
export function controlled(mode:string):GameState {
  const state=createInitialState(301);
  state.isTraining=true; // Suppress rescue grants; this is an isolated transport fixture.
  state.landmarkVersion=0;delete state.landmarkLayout;
  state.research.completed=['road','warehouseLogistics'];state.research.unlocked=['road','warehouseLogistics'];
  state.borderObstructionVersion=0;state.borderObstructions=[];
  const home=state.sectors['5,5'];home.nodes=[];home.connections=[];
  const remote=generateSector(6,5,state.seed,0);remote.unlocked=true;remote.nodes=[];remote.connections=[];state.sectors[remote.id]=remote;
  const n=(kind:MachineNode['kind'],id:string,x:number,y:number,extra:Partial<MachineNode>={})=>tutorialNode(kind,id,x,y,{constructionMs:0,capacity:getNodeCapabilities(kind).defaultCapacity,...extra});
  home.nodes=[n('woodenChest','road-source',2600,600,{output:{iron:mode==='idle'?0:20}}),
    n('road','export',3532.5,600,{roadMode:'export',roadFacing:'west',pairedRoadId:'import',pairedSectorId:remote.id}),
    n('warehouse','fifo-source',800,1400,{output:mode==='idle'?{}:{iron:100,copper:100},outputQueue:mode==='idle'?[]:Array.from({length:200},(_,i)=>i%2?'copper':'iron') as ItemId[]}),
    n('warehouse','fifo-target',1600,1400,{disabled:mode==='blocked'}),
    n('woodenChest','competitor-a',800,2100,{output:{wood:mode==='idle'?0:20}}),
    n('woodenChest','competitor-b',800,2600,{output:{wood:mode==='idle'?0:20}}),
    n('woodenChest','shared-target',1600,2350,{output:mode==='blocked'?{wood:20}:{}})];
  remote.nodes=[n('road','import',67.5,600,{roadMode:'import',roadFacing:'east',pairedRoadId:'export',pairedSectorId:home.id}),
    n('woodenChest','road-target',800,600,{output:mode==='blocked'?{iron:20}:{}})];
  home.connections=[{id:'road-send',from:'road-source',to:'export',fromPort:0,toPort:0,createdAt:0},
    {id:'fifo-send',from:'fifo-source',to:'fifo-target',fromPort:0,toPort:0,createdAt:0},
    {id:'a-send',from:'competitor-a',to:'shared-target',fromPort:0,toPort:0,createdAt:0},
    {id:'b-send',from:'competitor-b',to:'shared-target',fromPort:0,toPort:0,createdAt:0}];
  remote.connections=[{id:'road-receive',from:'import',to:'road-target',fromPort:0,toPort:0,createdAt:0}];
  state.paused=false;return state;
}
export function physical(state:GameState) {
  const totals:Record<string,number>={};
  for(const sector of Object.values(state.sectors))for(const node of sector.nodes)for(const bag of [node.input,node.output])for(const [item,n]of Object.entries(bag))totals[item]=(totals[item]??0)+(n??0);
  for(const t of state.inFlightTransfers??[])if(!t.cosmeticOnly)totals[t.item]=(totals[t.item]??0)+(t.amount??1);
  return Object.fromEntries(Object.entries(totals).filter(([,n])=>n!==0).sort(([a],[b])=>a.localeCompare(b)));
}
