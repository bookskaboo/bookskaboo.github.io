import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { Session } from 'node:inspector';
import assert from 'node:assert/strict';
import { GameEngine,createInitialState } from '../../src/simulation/engine';
import { normalizeLegacy } from '../../src/persistence/saves';
import { controlled,physical,sources } from './fixtures';
import type { GameState,ItemId } from '../../src/domain/types';

const [id,mode,trial]=process.argv.slice(2);const out='outputs/transport-profile';
let now=1795300000000,uuid=0,rng=1243;
Date.now=()=>now;
crypto.randomUUID=()=>`00000000-0000-4000-8000-${String(++uuid).padStart(12,'0')}`;
Math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
const metrics:Record<string,{calls:number,inclusiveMs:number,selfMs:number,queueUnits:number}>={};
let enabled=false;const stack:{name:string,start:number,children:number}[]=[];
(globalThis as any).__transportProbe={enter(name:string,volume:number){if(!enabled)return null;const m=metrics[name]??=( {calls:0,inclusiveMs:0,selfMs:0,queueUnits:0});m.calls++;m.queueUnits+=volume;const span={name,start:performance.now(),children:0};stack.push(span);return span;},exit(span:any){if(!span)return;assert.equal(stack.pop(),span);const elapsed=performance.now()-span.start;const m=metrics[span.name];m.inclusiveMs+=elapsed;m.selfMs+=elapsed-span.children;if(stack.length)stack.at(-1)!.children+=elapsed;}};
const initial=id in sources?normalizeLegacy(JSON.parse(readFileSync((sources as any)[id],'utf8'))):id==='fresh'?createInitialState(10):controlled(id);
assert.ok(initial);initial.paused=false;
const engine=new GameEngine(initial,{autosave:false});
const get=()=>engine.getState();
const counts={sectors:Object.keys(get().sectors).length,nodes:Object.values(get().sectors).reduce((n,s)=>n+s.nodes.length,0),connections:Object.values(get().sectors).reduce((n,s)=>n+s.connections.length,0),roads:Object.values(get().sectors).flatMap(s=>s.nodes).filter(n=>n.kind==='road').length,pausedNodes:Object.values(get().sectors).flatMap(s=>s.nodes).filter(n=>n.processingPaused||n.disabled).length};
const isControlled=['active','blocked','idle'].includes(id),before=physical(get());
const fifo:ItemId[]=[];let maxReserved=0;
function validate(){if(!isControlled)return;
  const state=get(),h=state.sectors['5,5'];
  for(const sector of Object.values(state.sectors))for(const node of sector.nodes){
    const present=Object.values(node.input).concat(Object.values(node.output)).reduce<number>((a,b)=>a+(b??0),0);
    const pending=(state.inFlightTransfers??[]).filter(t=>!t.cosmeticOnly&&t.sectorId===sector.id&&t.to===node.id).reduce((n,t)=>n+(t.amount??1),0);
    if(node.id==='shared-target'){maxReserved=Math.max(maxReserved,present+pending);assert.ok(present+pending<=20,'reservation overfill');}
    if(node.kind==='road'){assert.deepEqual(node.input,{});assert.deepEqual(node.output,{});}
  }
  assert.deepEqual(physical(state),before,'material conservation');
}
const step=()=>{const prior=new Set((get().inFlightTransfers??[]).map(t=>t.id));now+=100;engine.tick(100);if(isControlled){for(const t of get().inFlightTransfers??[])if(!t.cosmeticOnly&&t.from==='fifo-source'&&!prior.has(t.id))for(let i=0;i<(t.amount??1);i++)fifo.push(t.item);validate();}};
for(let i=0;i<50;i++)step(); // 5 simulated seconds warmup, no accelerated tick delta.
const session=new Session();const post=(method:string,params:any={})=>new Promise<any>((resolve,reject)=>session.post(method as any,params,(e,r)=>e?reject(e):resolve(r)));
if(mode==='allocation'){session.connect();await post('HeapProfiler.startSampling',{samplingInterval:16384,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});}
if(mode==='cpu'){session.connect();await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});await post('Profiler.start');}
enabled=mode==='attribution';
const tickTimes=[];
// Exclude validation/observer bookkeeping from pristine tick timings; the checks
// still execute after every tick and all modes exercise identical state changes.
for(let i=0;i<300;i++){
  const prior=isControlled?new Set((get().inFlightTransfers??[]).map(t=>t.id)):null;
  now+=100;const t=performance.now();engine.tick(100);tickTimes.push(performance.now()-t);
  if(isControlled){for(const cargo of get().inFlightTransfers??[])if(!cargo.cosmeticOnly&&cargo.from==='fifo-source'&&!prior!.has(cargo.id))for(let k=0;k<(cargo.amount??1);k++)fifo.push(cargo.item);validate();}
}
enabled=false;
if(mode==='allocation'){const r=await post('HeapProfiler.stopSampling');writeFileSync(`${out}/${id}-${trial}.heapprofile.json`,JSON.stringify(r.profile));session.disconnect();}
if(mode==='cpu'){const r=await post('Profiler.stop');writeFileSync(`${out}/${id}-${trial}.cpuprofile.json`,JSON.stringify(r.profile));session.disconnect();}
if(isControlled){const state=get();if(id==='active'){
  const remote=state.sectors['6,5'].nodes.find(n=>n.id==='road-target')!;
  assert.ok((remote.input.iron??0)+(remote.output.iron??0)>0,'Road sink delivered');assert.ok(fifo.length>20,'FIFO active throughout window');
  assert.deepEqual(fifo,Array.from({length:fifo.length},(_,i)=>i%2?'copper':'iron'));
  const target=state.sectors['5,5'].nodes.find(n=>n.id==='fifo-target')!;
  const received=[...(target.outputQueue??[]),...(target.inputQueue??[])];
  assert.ok(received.length>20,'FIFO sink delivered');assert.deepEqual(received,fifo.slice(0,received.length),'FIFO receiver order');
  assert.equal(maxReserved,20,'competing sources exercised full reservation');
}else assert.equal(fifo.length,0,'blocked/idle queue emitted');}
const sorted=[...tickTimes].sort((a,b)=>a-b),state=get();
const digest=createHash('sha256').update(JSON.stringify(state)).digest('hex');
console.log(JSON.stringify({id,mode,trial:Number(trial),counts,ticks:300,warmupTicks:50,timing:{medianMs:sorted[150],p95Ms:sorted[284],maxMs:sorted.at(-1),totalMs:tickTimes.reduce((a,b)=>a+b,0)},tickSeries:tickTimes,metrics,finalDigest:digest,checks:isControlled?{conservation:true,fifoOrder:true,roadsHoldNoStock:true,reservedCapacity:true,maxReserved,fifoLaunched:fifo.length}:null,activity:{inFlight:state.inFlightTransfers?.length??0,playTimeMs:state.playTimeMs,producedDelta:Object.entries(state.produced??{}).reduce((n,[k,v])=>n+v-(initial.produced?.[k]??0),0)}}));
