import { GameEngine } from '../../../src/simulation/engine';
import { saveSlot, parseSaveFile, serializeSaveFile, AUTOSAVE_KEY, SAVE_KEY } from '../../../src/persistence/saves';
import type { GameState } from '../../../src/domain/types';

const status=document.querySelector('#status')!;
const results=document.querySelector('#results')!;
const profile=document.querySelector<HTMLButtonElement>('#profile')!;
const quota=document.querySelector<HTMLButtonElement>('#quota')!;
const marker='audit.undo-save-profile';
const filler='audit.undo-save-filler';
const report:{environment:unknown;trials:unknown[];quota?:unknown}={environment:{userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,origin:location.origin},trials:[]};
const states=new Map<string,GameState>();
const check=(condition:unknown,label:string)=>{if(!condition)throw Error(label);};
const display=()=>{results.textContent=JSON.stringify(report,null,2);};
const yieldUi=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
const stats=(a:number[])=>{const s=[...a].sort((a,b)=>a-b);return{samples:s.length,medianMs:s[Math.floor(s.length/2)],p95Ms:s[Math.ceil(s.length*.95)-1],maxMs:s.at(-1)};};
const time=(fn:()=>unknown,n=30)=>{for(let i=0;i<5;i++)fn();const times=[];for(let i=0;i<n;i++){const t=performance.now();fn();times.push(performance.now()-t);}return stats(times);};
profile.onclick=async()=>{
  profile.disabled=true;
  try{
    check(localStorage.length===0,'Dedicated profiling origin is not empty; refusing to touch its storage');
    localStorage.setItem(marker,'owned disposable audit data');
    for(const id of ['fresh','shiny-playtest','late-playtest']){
      const state=await(await fetch('../'+id+'.json')).json() as GameState;states.set(id,state);
      for(let trial=0;trial<3;trial++){
        status.textContent=`Measuring ${id}, trial ${trial+1}/3`;await yieldUi();
        const engine=new GameEngine(state),current=engine.getState();
        const timings:Record<string,unknown>={clone:time(()=>structuredClone(current)),stringify:time(()=>JSON.stringify(current)),export:time(()=>serializeSaveFile(current)),import:time(()=>parseSaveFile(serializeSaveFile(current)),10)};
        const checkpoints=[],undo=[],history=()=> (engine as unknown as {history:GameState[]}).history;
        for(let i=0;i<75;i++){const t=performance.now();engine.beginMove();checkpoints.push(performance.now()-t);engine.setCamera({...engine.getSector().camera,x:i});engine.commitMove();}
        check(history().length===50,'history cap');check(history()[0].sectors[current.activeSectorId].camera.x===24,'oldest eviction');
        for(let i=0;i<50;i++){const t=performance.now();engine.undo();undo.push(performance.now()-t);}
        check(history().length===0&&engine.getSector().camera.x===24,'undo contents');
        timings.checkpoint=stats(checkpoints);timings.undo=stats(undo);
        engine.replaceState(state);
        for(let i=0;i<3;i++)saveSlot(i,engine.getState(),'Profile '+i);
        check(engine.retryAutosave(),'autosave writes');
        timings.autosave=time(()=>check(engine.retryAutosave(),'autosave writes'),10);
        timings.manualSaveFullCollection=time(()=>saveSlot(0,engine.getState(),'Profile 0'),10);
        report.trials.push({id,trial,nodes:Object.values(state.sectors).reduce((n,s)=>n+s.nodes.length,0),jsonCodeUnits:JSON.stringify(state).length,storedCodeUnits:localStorage.getItem(AUTOSAVE_KEY)!.length+localStorage.getItem(SAVE_KEY)!.length,timings,checks:{cap50:true,eviction:true,undo50:true}});display();await yieldUi();
      }
    }
    status.textContent='Browser measurements complete. Current undo behavior preserved. Storage recovery check ready.';quota.disabled=false;
  }catch(e){status.textContent='FAILED: '+String(e);throw e;}
};
quota.onclick=async()=>{
  quota.disabled=true;
  try{
    check(localStorage.getItem(marker)==='owned disposable audit data','ownership marker');
    const small=new GameEngine(states.get('fresh')!);check(small.retryAutosave(),'prior autosave');
    const engine=new GameEngine(states.get('late-playtest')!);for(let i=0;i<3;i++)saveSlot(i,engine.getState(),'Earlier '+i);
    const priorAuto=localStorage.getItem(AUTOSAVE_KEY),priorSlots=localStorage.getItem(SAVE_KEY);
    status.textContent='Filling only disposable audit storage on this dedicated origin';await yieldUi();
    let fill='',quotaError='';
    for(let step=65536;step>=1;step=Math.floor(step/2)){
      let attempts=0;
      while(fill.length+step<=12*1024*1024&&attempts++<256){try{localStorage.setItem(filler,fill+'x'.repeat(step));fill+='x'.repeat(step);}catch(e){quotaError=(e as DOMException).name;break;}}
      check(attempts<=256,'bounded quota fill');
    }
    check(quotaError==='QuotaExceededError','native quota exception required');
    const filledCodeUnits=Object.keys(localStorage).reduce((n,k)=>n+k.length+localStorage.getItem(k)!.length,0);
    engine.renameSector('Unsaved large factory','NEW');
    check(!engine.retryAutosave()&&engine.hasAutosaveFailure(),'failed autosave warning');
    check(localStorage.getItem(AUTOSAVE_KEY)===priorAuto,'prior autosave bytes survive');
    let manualError='';try{saveSlot(0,engine.getState(),'Larger changed save name');}catch(e){manualError=(e as DOMException).name;}
    check(manualError==='QuotaExceededError','native manual failure');check(localStorage.getItem(SAVE_KEY)===priorSlots,'sibling bytes survive');
    const exported=serializeSaveFile(engine.getState());const loaded=parseSaveFile(exported);
    check(loaded.state.sectors[loaded.state.activeSectorId].name==='Unsaved large factory','export recovers latest memory');
    localStorage.removeItem(filler);check(engine.retryAutosave()&&!engine.hasAutosaveFailure(),'retry clears warning');
    saveSlot(0,engine.getState(),'Recovered');
    report.quota={quotaError,manualError,filledCodeUnits,exportBytes:new TextEncoder().encode(exported).length,checks:{previousAutosavePreserved:true,manualCollectionPreserved:true,exportWhileFull:true,retryRecovered:true,manualSaveRecovered:true},cleanupKeys:[marker,AUTOSAVE_KEY,SAVE_KEY,filler]};
    for(const k of [marker,AUTOSAVE_KEY,SAVE_KEY,filler])localStorage.removeItem(k);
    check(localStorage.length===0,'all disposable storage removed');
    status.textContent='PASS: native storage exhaustion preserved earlier saves; export and Retry recovered the large factory. Disposable storage cleaned.';display();
  }catch(e){status.textContent='FAILED: '+String(e);throw e;}
};
