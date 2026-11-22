// One-off audit measurement. Not a game benchmark command or normal test fixture.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { normalizeLegacy, saveSlot, serializeSaveFile, parseSaveFile, AUTOSAVE_KEY, SAVE_KEY } from '../../src/persistence/saves';

const out = 'outputs/undo-save-profile';
const cases = [
  { id: 'fresh', source: null },
  { id: 'shiny-playtest', source: 'outputs/tribute-first-playtest-2026-11-12/10-tribute-first-checkpoint.json' },
  { id: 'late-playtest', source: 'outputs/live-map-pricing-playtest-2026-11-15/10-final-checkpoint.json' },
];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const fingerprints = () => {
  const files: Record<string,string> = {};
  const walk=(dir:string)=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else files[p]=hash(readFileSync(p,'utf8'));}};
  walk('src');
  for(const c of cases) if(c.source) files[c.source]=hash(readFileSync(c.source,'utf8'));
  return files;
};
const gc = () => { assert.equal(typeof global.gc, 'function'); for(let i=0;i<3;i++) global.gc!(); };
const stats = (values:number[]) => { const s=[...values].sort((a,b)=>a-b); return {samples:values.length,medianMs:s[Math.floor(s.length/2)],p95Ms:s[Math.ceil(s.length*.95)-1],maxMs:s.at(-1)}; };
const measure = (fn:()=>unknown) => {for(let i=0;i<5;i++) fn();const times=[];for(let i=0;i<30;i++){const t=performance.now();fn();times.push(performance.now()-t);}return stats(times);};

if(process.argv[2]==='worker') {
  const spec=cases.find(c=>c.id===process.argv[3])!;
  const initial=spec.source?normalizeLegacy(JSON.parse(readFileSync(spec.source,'utf8'))):createInitialState(10);
  assert.ok(initial,'Current loader must accept archived fixture');
  const engine=new GameEngine(initial);
  const state=engine.getState();
  const json=JSON.stringify(state), sectors=Object.values(state.sectors);
  const memory = new Map<string,string>();
  let reject=false;
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{if(reject)throw new DOMException('Audit storage failure','QuotaExceededError');memory.set(k,String(v));},removeItem:(k:string)=>memory.delete(k)}});
  const timings={clone:measure(()=>structuredClone(state)),stringify:measure(()=>JSON.stringify(state)),export:measure(()=>serializeSaveFile(state)),import:measure(()=>parseSaveFile(serializeSaveFile(state)))};
  // Exercise the real command checkpoint path with a changing camera, no simulation.
  const historyOf=()=> (engine as unknown as {history:typeof state[]}).history;
  gc();const baseline=process.memoryUsage().heapUsed;
  const retention=[];const checkpoints=[];
  for(let i=0;i<75;i++) {
    const t=performance.now();engine.beginMove();checkpoints.push(performance.now()-t);
    engine.setCamera({...engine.getSector().camera,x:i});engine.commitMove();
    if([1,10,25,50,75].includes(i+1)){gc();retention.push({commands:i+1,retained:historyOf().length,heapDeltaBytes:process.memoryUsage().heapUsed-baseline});}
  }
  assert.equal(historyOf().length,50);
  assert.equal(historyOf()[0].sectors[state.activeSectorId].camera.x,24);
  assert.notEqual(historyOf()[0].sectors,state.sectors);
  assert.notEqual(historyOf()[0].sectors[state.activeSectorId].nodes[0],state.sectors[state.activeSectorId].nodes[0]);
  const undoTimes=[];
  for(let i=0;i<50;i++){const t=performance.now();engine.undo();undoTimes.push(performance.now()-t);}
  assert.equal(historyOf().length,0);assert.equal(engine.getSector().camera.x,24);
  const restored=engine.getState();engine.undo();assert.equal(engine.getState(),restored);
  gc();const afterUndoDeltaBytes=process.memoryUsage().heapUsed-baseline;
  const retainedBeforeReplace=historyOf().length;engine.beginMove();engine.replaceState(initial);assert.equal(historyOf().length,0);
  // Large source data, real writers/readers, deterministic quota exception.
  engine.retryAutosave();saveSlot(0,engine.getState(),'Earlier factory');
  const priorAuto=memory.get(AUTOSAVE_KEY),priorSlots=memory.get(SAVE_KEY);
  engine.renameSector('Unsaved progress','NEW');reject=true;
  assert.equal(engine.retryAutosave(),false);assert.equal(engine.hasAutosaveFailure(),true);
  assert.equal(memory.get(AUTOSAVE_KEY),priorAuto);
  assert.throws(()=>saveSlot(1,engine.getState(),'Blocked copy'));
  assert.equal(memory.get(SAVE_KEY),priorSlots);
  const exported=serializeSaveFile(engine.getState());
  assert.equal(parseSaveFile(exported).state.sectors[engine.getState().activeSectorId].name,'Unsaved progress');
  reject=false;assert.equal(engine.retryAutosave(),true);assert.equal(engine.hasAutosaveFailure(),false);
  for(let i=0;i<3;i++) saveSlot(i,engine.getState(),'Profile '+i);
  const result={id:spec.id,source:spec.source,sourceHash:spec.source?hash(readFileSync(spec.source,'utf8')):null,
    counts:{sectors:sectors.length,unlocked:sectors.filter(s=>s.unlocked).length,nodes:sectors.reduce((n,s)=>n+s.nodes.length,0),connections:sectors.reduce((n,s)=>n+s.connections.length,0)},
    bytes:{jsonUtf8:Buffer.byteLength(json),jsonCodeUnits:json.length,estimatedUtf16Value:json.length*2,threeSlotsPlusAutosaveCodeUnits:[...memory.values()].reduce((n,v)=>n+v.length,0)},
    timings:{...timings,checkpoint:stats(checkpoints),undo:stats(undoTimes)},retention,afterUndoDeltaBytes,
    checks:{cappedAt50:true,oldestEvicted:true,snapshotsIndependent:true,undoExhausted:true,replaceClearedHistory:true,failedWritesPreservedBytes:true,exportWhileFull:true,retryRecovered:true}};
  if(process.argv[4]==='0')writeFileSync(out+'/'+spec.id+'.json',json);
  console.log(JSON.stringify(result));
} else {
  mkdirSync(out,{recursive:true});const before=fingerprints();const trials=[];
  for(const spec of cases)for(let trial=0;trial<3;trial++){
    const run=spawnSync(process.execPath,['--expose-gc',process.argv[1],'worker',spec.id,String(trial)],{encoding:'utf8',timeout:60000});
    assert.equal(run.status,0,run.stderr);trials.push({...JSON.parse(run.stdout),trial});
  }
  const after=fingerprints();assert.deepEqual(after,before);
  const report={createdAt:new Date().toISOString(),runtime:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,cpu:cpus()[0]?.model,method:'Three fresh Node processes per factory; five warmups and thirty samples per operation; 75 real beginMove checkpoints; three explicit GCs before heap readings. Heap delta is retained Node V8 heap, not browser total memory. No simulation or active campaign access.',fingerprints:before,unchangedSourceAndArchives:true,trials};
  writeFileSync(out+'/node-results.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(trials.map(r=>({id:r.id,trial:r.trial,nodes:r.counts.nodes,bytes:r.bytes.jsonUtf8,clone:r.timings.clone.medianMs,historyMiB:r.retention.find((x:any)=>x.commands===50).heapDeltaBytes/1048576})),null,2));
}
