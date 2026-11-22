// Synthetic audit fixtures. Uses only in-memory storage; never opens browser saves.
import { it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import * as saves from '../../src/persistence/saves';
import { RESEARCH_PROJECTS, getResearchCostsForState, getResearchProject } from '../../src/content/research';
import { emptyMod } from '../../src/mods/modTypes';
import { vehiclePayload } from '../../src/content/cartUpgrades';
import { modRule } from '../../src/mods/modRules';
import { RECIPES } from '../../src/content/recipes';
import { nextExpansionShortages } from '../../src/simulation/expansionRescue';
import { simulateUnknownDevice } from '../../src/simulation/landmarkRuntime';
import { takeOutput } from '../../src/simulation/mixedOutput';
import { sectorForState } from '../../src/simulation/worldGeneration';

const root=resolve(import.meta.dirname,'../..');
const results=[];
it('records isolated audit edge cases',()=>{
  const advance=(e,ms)=>{for(let t=0;t<ms;t+=100)e.tick(Math.min(100,ms-t));};
  const node=(kind,id,x=1000,y=1000)=>({id,kind,name:kind,x,y,rotation:0,input:{},output:{},cycleMs:1000,progressMs:0,constructedAt:0,constructionMs:0});
  const fixture=()=>{const state=createInitialState(81);state.sectors['5,5'].nodes=[];state.sectors['5,5'].connections=[];return state;};
  const memory=new Map();
  globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k),clear:()=>memory.clear()};
  const run=(id,fn)=>{try{results.push({id,...fn()});}catch(error){results.push({id,error:String(error),stack:error.stack});}console.log(id,JSON.stringify(results.at(-1)));};

  run('SAVE-01',()=>{
    const valid=fixture(),broken=structuredClone(valid);broken.research.completed={};
    memory.set(saves.SAVE_KEY,JSON.stringify([{state:valid,name:'Valid A'},{state:broken,name:'Malformed B'},{state:valid,name:'Valid C'}]));
    const before=saves.readSlots().map(s=>s?.name??null);
    saves.saveSlot(0,valid,'New A');
    const after=JSON.parse(memory.get(saves.SAVE_KEY)).map(s=>s?.name??null);
    return {before,after,confirmed:before.every(s=>s===null)&&after[2]===null};
  });
  run('TEMPLATE-01',()=>{
    const state=fixture();state.research.completed=['factoryTemplates','miningDrill'];state.research.unlocked=['extractor','factoryTemplates','miningDrill'];
    const drill={...node('miningDrill','paid-drill'),miningTarget:'iron',miningProgress:19};state.sectors['5,5'].nodes=[drill];
    const e=new GameEngine(state,{autosave:false});
    const saved=e.saveFactoryTemplate('Paid drill',['paid-drill']);
    const placed=e.placeFactoryTemplate(0,1700,1000);
    const duplicate=e.getSector().nodes.find(n=>n.id!=='paid-drill');
    const copiedProgress=duplicate?.miningProgress;
    if(duplicate){duplicate.constructedAt=0;duplicate.input.motor=1;advance(e,1000);}
    return {saved,placed,copiedProgress,result:duplicate&&{kind:duplicate.kind,resourceRemaining:duplicate.resourceRemaining,motorsRemaining:duplicate.input.motor??0},confirmed:copiedProgress===19&&duplicate?.resourceRemaining===1000};
  });
  run('ROAD-01',()=>{
    const state=fixture();state.research.completed=['trains','victory'];state.research.repeatableCompletions.trainFreightCapacity=2;
    const e=new GameEngine(state,{autosave:false});
    const shown=12*vehiclePayload(e.getState().research.completed);
    const actual=60000/modRule('roadTransferMs')*vehiclePayload(e.getState().research.completed,2);
    e.applyMod({...emptyMod(),rules:{roadTransferMs:2000}});
    const modActual=60000/modRule('roadTransferMs')*vehiclePayload(e.getState().research.completed,2);
    return {shown,actual,modActual,confirmed:shown===48&&actual===72&&modActual===180};
  });
  run('SAVE-02',()=>{
    const state=fixture();state.preferences.autosaveMinutes=1;
    const e=new GameEngine(state);
    globalThis.localStorage.setItem=()=>{throw new Error('QuotaExceededError: synthetic full storage');};
    let error;
    try{advance(e,60000);}catch(e){error=String(e);}
    globalThis.localStorage.setItem=(k,v)=>memory.set(k,String(v));
    return {error,playTimeMs:e.getState().playTimeMs,confirmed:Boolean(error?.includes('QuotaExceededError'))};
  });
  run('BUILD-01',()=>{
    const costs=RESEARCH_PROJECTS.filter(p=>p.costs&&Object.values(p.costs).some(q=>!Number.isFinite(q)||q<0));
    return {invalidResearchCosts:costs.map(p=>p.id),confirmed:costs.length>0};
  });
  run('GENERATOR-01',()=>{
    const generated=readFileSync(resolve(import.meta.dirname,'historical-generated.ts'),'utf8');
    const catalog=JSON.parse(generated.match(/export const LATE_RECIPES = ([\s\S]*?) satisfies/)[1]);
    const gates=['hydro-core','shiny-core','command-core'].map(id=>({id,generated:catalog[id].unlockResearch,live:RECIPES[id].unlockResearch}));
    return {gates,confirmed:gates.every(g=>g.generated!==g.live),note:'Only the audit copy of the compiler was executed; its write target was redirected to the evidence directory.'};
  });
  run('RESCUE-01',()=>{
    const state=createInitialState(81);state.research.completed=['refiner','assembler','basicCore','exploration','road'];state.research.unlocked=[...state.research.completed];
    const destination=state.landmarkLayout.find(e=>e.sector.nodes.some(n=>n.landmark==='unknown')).sector;
    let x=5,y=5;
    const open=()=>{const sector=sectorForState(state,x,y);sector.unlocked=true;sector.visited=true;state.sectors[sector.id]=sector;};
    while(x!==destination.x){x+=Math.sign(destination.x-x);open();}
    while(y!==destination.y){y+=Math.sign(destination.y-y);open();}
    state.research.repeatableCompletions.mapNode=Object.keys(state.sectors).length-1;
    for(const sector of Object.values(state.sectors))for(const n of sector.nodes)if(n.resourceItem)n.resourceRemaining=0;
    const device=state.sectors[destination.id].nodes.find(n=>n.landmark==='unknown');
    const quote=getResearchCostsForState(getResearchProject('mapNode'),state.research);
    const bank={...node('warehouse','seed-cores'),output:Object.fromEntries(Object.keys(quote).map(i=>[i,1]))};
    state.sectors[destination.id].nodes.push(bank);
    const claimedShortages=nextExpansionShortages(state);
    let cycles=0;
    for(const [core,required]of Object.entries(quote))while(bank.output[core]<required){
      bank.output[core]--;device.input[core]=(device.input[core]??0)+1;(device.inputQueue??=[]).push(core);
      for(let tick=0;tick<5;tick++)simulateUnknownDevice(state,device,1000);
      const moved=Math.min(2,device.output[core]??0);takeOutput(device,core,moved);bank.output[core]+=moved;cycles++;
      if(cycles>1000)throw new Error('Fixture route did not progress.');
    }
    return {claimedShortages,deviceSector:destination.id,openedMaps:Object.keys(state.sectors).length,quote,finalCoreStock:bank.output,cycles,confirmed:claimedShortages.includes('copper')&&Object.entries(quote).every(([i,n])=>bank.output[i]>=n),note:'Synthetic exhausted-world stock at the actual seeded tier-8 device with an open Home path and eight paid maps. Ordinary five-second cycles; explicit stock handoffs model the permitted vehicle feedback route.'};
  });
  run('PERF-01',()=>{
    const state=fixture();state.sectors['5,5'].nodes=Array.from({length:2400},(_,i)=>node('joint',`joint-${i}`));
    const e=new GameEngine(state,{autosave:false});const cloneMs=[],cloneBytes=Buffer.byteLength(JSON.stringify(e.getState()));
    for(let i=0;i<10;i++){const start=performance.now();structuredClone(e.getState());cloneMs.push(performance.now()-start);}
    return {syntheticNodes:2400,serializedBytes:cloneBytes,cloneMs,meanCloneMs:cloneMs.reduce((a,b)=>a+b,0)/cloneMs.length,historyLimit:50,note:'Node timings only; conservative empty routing fixture; no browser FPS claim.'};
  });
  run('PERF-02',()=>{
    const state=fixture();state.sectors['5,5'].nodes=Array.from({length:2400},(_,i)=>node('joint',`joint-${i}`));
    memory.set(saves.AUTOSAVE_KEY,JSON.stringify(state));
    const readMs=[];
    for(let i=0;i<10;i++){const start=performance.now();saves.readAutosave();readMs.push(performance.now()-start);}
    return {syntheticNodes:2400,readMs,meanReadMs:readMs.reduce((a,b)=>a+b,0)/readMs.length,note:'In-memory storage; measures parsing and normalization only. SavePanel calls this on each render.'};
  });
  const path=resolve(import.meta.dirname,'reproductions.json');writeFileSync(path,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
  for(const id of ['SAVE-01','TEMPLATE-01','ROAD-01','SAVE-02','RESCUE-01','GENERATOR-01'])expect(results.find(r=>r.id===id)?.confirmed,id).toBe(true);
  expect(results.find(r=>r.id==='BUILD-01')?.confirmed).toBe(false);
},30000);
