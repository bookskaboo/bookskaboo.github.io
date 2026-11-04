// Abstract progression simulator for proposed tiers 1–6, not the live game engine.
// Whole research items, recipe-derived steady production rates, overlapping build work.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { displayText } from './item-display.mjs';
const d = JSON.parse(readFileSync('outputs/progression/core-design.json', 'utf8'));
const waste = JSON.parse(readFileSync('outputs/progression/waste-design.json', 'utf8'));
const cores = ['simple-core','basic-core','automata-core','hydro-core','shiny-core','command-core'];
const tierNames = ['Simple','Basic','Automata','Hydro','Shiny','Complex'];
const recipes = d.recipes;
const balance = d.balanceRevision;
const merge = (a,b,k=1) => { for (const [id,n] of Object.entries(b)) a[id]=(a[id]??0)+n*k; };
function work(item, amount=1) {
  const r=recipes[item], out={};
  if(!r) return { [item==='water'?'lake-intake':`extract:${item}`]:amount*(item==='water'?.25:5) };
  const n=amount/r.primaryAmount; out[item]=n*r.seconds;
  for(const [id,q] of Object.entries(r.inputs)) merge(out,work(id,n*q));
  return out;
}
const bills=cores.map(c=>work(c));
function factory(tier,rate) {
  const total={}; for(let i=0;i<tier;i++)merge(total,bills[i]);
  const machines=Object.fromEntries(Object.entries(total).map(([id,sec])=>[id,Math.ceil(sec*rate/60-1e-9)]));
  const actualRate=Math.min(...Object.entries(total).map(([id,sec])=>60*machines[id]/sec));
  return { machines, actualRate, machinesCount:Object.values(machines).reduce((a,b)=>a+b,0) };
}
const projects=[];
for(const line of readFileSync('src/content/research.ts','utf8').split('\n')) {
  const m=line.match(/id: '([^']+)', name: '([^']+)'/);if(!m||line.includes('repeatable: true'))continue;
  const helper=line.match(/costs: (simple|basic|mixed)\((\d+)\)/);
  const explicit=line.match(/costs: \{ 'simple-core': (\d+), 'basic-core': (\d+) \}/);
  if(!helper&&!explicit)continue;
  const tier=helper?{simple:1,basic:2,mixed:3}[helper[1]]:2;
  const each=balance?.existingResearchEach[m[1]]??+(helper?helper[2]:explicit[1]);
  if(explicit)assert.equal(+explicit[1],+explicit[2]);
  const prereq=line.match(/prerequisite: '([^']+)'/);
  projects.push({id:m[1],name:m[2],tier,each,kind:['assembler','exploration','road','automataCore','treePlanter','miningDrill'].includes(m[1])?'unlock':'improvement',deps:prereq?[prereq[1]]:[]});
}
const nameId=Object.fromEntries(projects.map(p=>[p.name,p.id]));
for(const p of d.research)nameId[p.name]=p.name;
const mainDeps={
  Hydrochemistry:['Automata Core','Basic Electricity'], 'Hydraulic Assembly':['Hydrochemistry'],
  'Fluid Routing':['Hydraulic Assembly'], 'Sealed Robotics':['Hydraulic Assembly','Suppression Bot'],
  'Ore Separation':['Fluid Routing'], 'Mineral Recovery':['Ore Separation'], 'Pressure Systems':['Ore Separation'],
  'Heavy Robotics':['Sealed Robotics','Ore Separation'], 'Precision Control':['Ore Separation','Mineral Recovery'],
  'Autonomous Logistics':['Precision Control'], 'Command Robotics':['Precision Control','Heavy Robotics'],
  'High Pressure Intakes':['Pressure Systems','Precision Control'],
  'Endgame Theory':['Autonomous Logistics','Command Robotics','Mineral Regeneration','Precision Control'],
};
for(const p of d.research) {
  const deps=mainDeps[p.name]??d.frameworkResearch.find(f=>f.name===p.name)?.prerequisites;
  assert.ok(deps,`Missing prerequisites: ${p.name}`);
  projects.push({id:p.name,name:p.name,tier:p.tier,each:p.each,kind:p.pricingClass==='unlock'?'unlock':'improvement',deps:deps.map(n=>nameId[n]??({'Basic Electricity':'basicElectricity','Suppression Bot':'suppressionBot','Tree Planter':'treePlanter'}[n]??n))});
}
const byId=new Map(projects.map(p=>[p.id,p]));
const milestones=new Set(['kiln','smelter','refiner','researchCenter','basicElectricity','suppressionBot']);
for(const p of projects)for(const id of p.deps)assert.ok(byId.has(id)||milestones.has(id),`Unknown dependency ${id}`);
assert.equal(projects.reduce((sum,p)=>sum+p.each*p.tier,0),d.recalculation.totalCoreItems);
const path=['assembler','exploration','road','automataCore','Hydrochemistry','Hydraulic Assembly','Fluid Routing','Ore Separation','Mineral Recovery','Precision Control','Sealed Robotics','Heavy Robotics','Mineral Regeneration','Autonomous Logistics','Command Robotics','Endgame Theory'];
const pathRank=new Map(path.map((id,i)=>[id,i]));
const requiredForTier=[null,'assembler','automataCore','Hydraulic Assembly','Ore Separation','Precision Control'];
const profiles=[
 {id:'maximum',name:'Theoretical maximum throughput',rates:[60,60,66.667,66.667,75,75],plan:[30,45,60,120,180,240],place:1,connect:.4,debug:.05,uptime:1},
 {id:'efficient',name:'Experienced / efficient',rates:[8,8,8,6,5,4],plan:[60,90,180,300,420,600],place:3,connect:1,debug:.15,uptime:.95},
 {id:'first',name:'First playthrough',rates:[4,3,2,2,1.5,1],plan:[120,180,360,600,900,1200],place:7,connect:2.5,debug:.35,uptime:.85},
 {id:'explore',name:'Exploratory / low throughput',rates:[2,1.5,1,1,.75,.5],plan:[180,300,600,900,1500,1800],place:10,connect:4,debug:.6,uptime:.75},
];
// PRNG and duration variability are repeatable scenario assumptions, not playtest data.
let seed=0x6c6f6769;
const rng=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
export const resetSimulationSeed=value=>{seed=value>>>0;};
const variation=()=>.75+(rng()+rng())*.25;
export function simulate(profile,{random=false,policy='capability-first',speedScale=1,rateScale=1,necessaryOnly=false,researchScale=1,encounters=false,discoverySeconds=0,prebuildLimit=.25}={}) {
  const required=new Set();
  function requireProject(id){if(required.has(id))return;required.add(id);for(const dep of byId.get(id)?.deps??[])if(byId.has(dep))requireProject(dep);}
  requireProject('Endgame Theory');
  requireProject('road');requireProject('assembler');
  const activeProjects=(necessaryOnly?projects.filter(p=>required.has(p.id)):projects).map(p=>({...p,each:p.tier>=3?Math.ceil(p.each*researchScale):p.each}));
  const totalDemand=cores.map((_,i)=>activeProjects.reduce((n,p)=>n+(p.tier>i?p.each:0),0));
  const builds=[];let previous={};
  for(let tier=1;tier<=6;tier++) {
    const f=factory(tier,profile.rates[tier-1]*rateScale);
    const added=Object.entries(f.machines).reduce((n,[id,count])=>n+Math.max(0,count-(previous[id]??0)),0);
    const support=Math.ceil(added*.5), connections=Math.ceil((added+support)*1.5);
    const duration=(profile.pairSeconds!==undefined?((added+support)*profile.pairSeconds+Math.max(0,connections-added-support)*profile.extraConnectionSeconds):(profile.plan[tier-1]+(added+support)*profile.place+connections*profile.connect)*(1+profile.debug))*speedScale*(random?variation():1);
    const availableActionFraction=profile.pairSeconds!==undefined?1:Math.max(0,1-profile.plan[tier-1]*(1+profile.debug)*speedScale/duration);
    builds.push({tier,...f,addedMachines:added,addedSupport:support,connections:Math.ceil(connections),duration,start:null,first:null,stable:null,readyForNext:null,wait:0,prebuiltSeconds:0,explorationPauseSeconds:0,prebuildCapSeconds:duration*availableActionFraction*prebuildLimit});
    previous=f.machines;
  }
  const done=new Map(), credit=new Map(), buffers=Array(6).fill(0), raw={}, coreProduced=Array(6).fill(0);
  let time=0,tier=1,operating=0,active=null,labProgress=0,labRunning=0,checkpoint=null,allFixed=null,choiceDirty=true;
  const dt=.5, limit=96*3600, completions=[], switches=[];
  const discoveries=[], found=new Set();let trip=null,explorationSeconds=0,preparationSeconds=0;
  // Optional Sorting Station is skipped: Precision Control already grants a fallback,
  // and this abstract model has no measured benefit for an extra scouting trip.
  const encounterWaves=[{id:'lake-and-fabricator',tier:3},{id:'mithril',tier:4}];
  const uptime=profile.uptime*(random?(.95+rng()*.05):1);
  builds[0].start=0;
  const can=(p)=>p.tier<=operating&&p.deps.every(id=>byId.has(id)?done.has(id):((id==='basicElectricity'||id==='suppressionBot')?operating>=3:operating>=1));
  while(time<limit) {
    if(encounters&&!trip){const wave=encounterWaves.find(w=>operating>=w.tier&&!found.has(w.id));if(wave)trip={...wave,start:time,end:time+discoverySeconds};}
    if(trip&&time>=trip.end){found.add(trip.id);discoveries.push({...trip,completed:time});trip=null;}
    const exploring=Boolean(trip);
    const b=builds[tier-1];
    if(exploring){explorationSeconds+=dt;if(b.stable===null)b.explorationPauseSeconds+=dt;}
    const elapsed=time-b.start-b.explorationPauseSeconds+b.prebuiltSeconds;
    const fraction=Math.min(1,Math.max(0,elapsed/b.duration));
    const toolsReady=!encounters||tier<4||(tier===4?found.has('lake-and-fabricator'):found.has('mithril'));
    if(b.first===null&&fraction>=.55&&toolsReady){b.first=time;operating=tier;choiceDirty=true;}
    if(b.stable===null&&fraction>=1){b.stable=time;b.readyForNext=time;}
    // Older factory operates throughout construction. New tier commissions at 55%;
    // delivered rate ramps from 35% to 100% of its recipe-derived steady capacity.
    if(operating>0){
      const ob=builds[operating-1];
      const f=operating===tier?Math.min(1,.35+.65*Math.max(0,(fraction-.55)/.45)):1;
      const produced=ob.actualRate/60*uptime*f*dt;
      for(let i=0;i<operating;i++) {const amount=Math.min(produced,Math.max(0,250-buffers[i]),necessaryOnly?Math.max(0,totalDemand[i]-coreProduced[i]):Infinity);buffers[i]+=amount;coreProduced[i]+=amount;}
    }
    if(choiceDirty||!active){
    const eligible=activeProjects.filter(p=>!done.has(p.id)&&can(p));
    const rank=p=>pathRank.has(p.id)?pathRank.get(p.id):100+p.tier*10+p.each/1000;
    eligible.sort((a,b)=>policy==='cheap-first'?(a.each-b.each||rank(a)-rank(b)):(rank(a)-rank(b)));
    const desired=eligible[0];
    if(!active||done.has(active.id)||(policy==='capability-first'&&desired&&pathRank.has(desired.id)&&!pathRank.has(active.id))){
      if(active&&desired&&active.id!==desired.id)switches.push({time,from:active.id,to:desired.id});
      active=desired??null;labProgress=0;
    }
    choiceDirty=false;
    }
    const labCycle=done.has('Research Center 2')?.8:done.has('researchCenter1')?.9:1;
    if(active&&cores.slice(0,active.tier).every((_,i)=>buffers[i]>=1-1e-7)){
      labProgress+=dt;labRunning+=dt;
      while(active&&labProgress+1e-9>=labCycle&&cores.slice(0,active.tier).every((_,i)=>buffers[i]>=1-1e-7)){
        for(let i=0;i<active.tier;i++)buffers[i]=Math.max(0,buffers[i]-1);
        labProgress-=labCycle;
        credit.set(active.id,(credit.get(active.id)??0)+1);
        if(credit.get(active.id)===active.each){
          done.set(active.id,time);completions.push({id:active.id,time,tier:active.tier,kind:active.kind});
          if(active.id==='Endgame Theory'&&checkpoint===null)checkpoint=time;
          active=null;labProgress=0;choiceDirty=true;
        }
      }
    }else labProgress=0;
    if(b.stable!==null){
      const nextGate=tier<6?requiredForTier[tier]: 'Endgame Theory';
      if(done.has(nextGate)){
        if(tier<6){tier++;builds[tier-1].start=time;}
      }else {
        const next=builds[tier];
        const canPrepare=encounters&&!exploring&&next&&tier>=3&&(tier===3?found.has('lake-and-fabricator'):found.has('mithril'));
        if(canPrepare&&next.prebuiltSeconds<next.prebuildCapSeconds){const work=Math.min(dt,next.prebuildCapSeconds-next.prebuiltSeconds);next.prebuiltSeconds+=work;preparationSeconds+=work;b.wait+=dt-work;}
        else if(!exploring)b.wait+=dt;
      }
    }
    if(done.size===activeProjects.length&&allFixed===null)allFixed=time;
    if(allFixed!==null&&builds[5].stable!==null)break;
    time+=dt;
  }
  for(let i=0;i<6;i++)merge(raw,expandRaw(cores[i]),coreProduced[i]);
  for(const b of builds){
    b.researchDuringBuild=completions.filter(c=>b.start!==null&&c.time>b.start&&c.time<=(b.stable??time));
    b.olderTierImprovements=b.researchDuringBuild.filter(c=>c.kind==='improvement'&&c.tier<b.tier).length;
    b.estimatedActiveNodes=Math.ceil(b.machinesCount*1.5)+1;
  }
  const final=builds[5];
  return {profile:profile.id,policy,checkpointSeconds:checkpoint,allFixedSeconds:allFixed,
    forcedWaitSeconds:builds.reduce((n,b)=>n+b.wait,0),labActiveSeconds:labRunning,builds,
    maxProductionAndSupportNodes:final.estimatedActiveNodes,
    meanWasteTreatmentNodesAtTier6Rate:waste.tier6AtPoint8Seconds.treatment.reduce((n,r)=>{
      const recipe=waste.recovery.find(x=>x.name===r.name);
      return n+Math.ceil(r.meanPerSecond*final.actualRate/75*recipe.seconds/recipe.inputs[r.item]-1e-9);
    },0),
    mapEquivalentsAt60Nodes:Math.ceil(final.estimatedActiveNodes/60),
    exceeds6540NodeBudget:final.estimatedActiveNodes>6540,coreProduced,remainingCores:buffers,raw,completions,switches,
    completedProjects:done.size,totalProjects:activeProjects.length,truncated:allFixed===null,uptime,
    necessaryOnly,encounters,discoverySeconds,prebuildLimit,discoveries,explorationSeconds,preparationSeconds,
    selectedResearch:activeProjects.map(p=>({id:p.id,tier:p.tier,each:p.each}))};
}
function expandRaw(id,n=1){const r=recipes[id];if(!r)return{[id]:n};const out={};for(const[k,v]of Object.entries(r.inputs))merge(out,expandRaw(k,n*v/r.primaryAmount));return out;}
if(!process.argv.includes('--library')) {
const baselines=profiles.map(p=>simulate(p));
const cheapFirst=profiles.map(p=>simulate(p,{policy:'cheap-first'}));
const trialsPerProfile=50;
const percentile=(a,p)=>{const b=a.filter(v=>v!==null).sort((x,y)=>x-y);return b[Math.floor((b.length-1)*p)]??null;};
const distributions=profiles.map(p=>{
 const runs=Array.from({length:trialsPerProfile},()=>simulate(p,{random:true}));
 return{profile:p.id,trials:trialsPerProfile,truncated:runs.filter(r=>r.truncated).length,
  checkpoint:[.1,.5,.9].map(q=>percentile(runs.map(r=>r.checkpointSeconds),q)),
  allFixed:[.1,.5,.9].map(q=>percentile(runs.map(r=>r.allFixedSeconds),q)),
  forcedWait:[.1,.5,.9].map(q=>percentile(runs.map(r=>r.forcedWaitSeconds),q))};
});
const efficient=profiles.find(p=>p.id==='efficient');
const sensitivities=[.5,1,2].flatMap(rateScale=>[.5,1,1.5].map(speedScale=>{
 const r=simulate(efficient,{rateScale,speedScale});return{rateScale,buildTimeScale:speedScale,checkpointSeconds:r.checkpointSeconds,forcedWaitSeconds:r.forcedWaitSeconds,nodes:r.maxProductionAndSupportNodes};
}));
for(const run of [...baselines,...cheapFirst]){
 assert.ok(!run.truncated,`${run.profile} did not complete`);
 for(const c of run.completions){const p=byId.get(c.id);for(const dep of p.deps)if(byId.has(dep))assert.ok(run.completions.some(x=>x.id===dep&&x.time<=c.time),`Prerequisite ${dep}`);}
 assert.ok(run.coreProduced.every(n=>n>=0));
 for(let i=0;i<6;i++){
   const consumed=run.completions.reduce((n,c)=>n+(byId.get(c.id).tier>i?byId.get(c.id).each:0),0);
   assert.ok(Math.abs(run.coreProduced[i]-consumed-run.remainingCores[i])<1e-6,`Core conservation ${cores[i]}`);
 }
}
const output={status:'Abstract design simulation; player timings are assumptions, not measured playtest predictions',
 seed:'0x6c6f6769',timestepSeconds:.5,profiles,baselines,cheapFirst,distributions,sensitivities,
 assumptions:[
 'Build time = planning + new machine/support placements + 1.5 connections per placed node, multiplied by troubleshooting allowance. Rates, action times and planning times are explicit profile inputs, not derived human behavior.',
 'Factory capacity is derived from live/proposed recipe work with five-second extraction, unupgraded production, four-water/s intakes and integer machines. Each unlocked core stream is made at the same delivered rate. Nested core ingredients are already included.',
 'At 55% of building work the new tier commissions, ramping from 35% to full target production by completion. The older tier keeps producing during earlier construction. Constant uptime factors approximate delivery losses. Startup pipeline latency is abstracted into commissioning, not independently simulated.',
 '250-item buffers per core, synchronized whole-set consumption, one Research Center, paid prerequisite graph and Lab 1/2 speed changes. Capability-first can interrupt optional upgrades, preserving item contributions but restarting partial tick progress; it is a simulated queue policy, not a live automation feature.',
 'Forced waiting = time after modeled useful building/troubleshooting work is exhausted while the next-tier gate remains incomplete. Remaining optional upgrades do not count as useful new logistics problems. Unmodeled alternate tasks could reduce actual forced waiting.',
 'Maximum profile targets sustained lab supply, but research can finish before construction does. All-fixed completion can occur earlier than finishing tier-6 construction; report both separately. A fast checkpoint does not prove sustained maximum throughput.',
 'Resources, road access, renewal and combat supply are assumed available. No finite deposits, adjacency, map research costs, land clearing, power budget, transport queues or explicit waste stalls. Waste treatment is only a separate capacity estimate, not a timing simulation.',
 '50 seeded duration/uptime variations per profile are sensitivity bands, not confidence intervals for real players. Tier 7 gameplay and the 20–30 hour endgame goal are outside scope.',
 ],checks:['Paid research catalog reconciles to core-design total','All baseline/queue runs complete within 96 hours','Every paid prerequisite finishes before dependent research','Integer synchronized core consumption; no negative buffers']};
writeFileSync('outputs/progression/player-simulation.json',JSON.stringify(output,null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const fmt=s=>s===null?'unfinished':`${(s/60).toFixed(1)} min`;
const table=(heads,rows)=>`<div class="scroll"><table><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Player progression simulation</title><style>body{font:16px/1.6 system-ui;background:#111923;color:#e8edf4;max-width:1250px;margin:40px auto;padding:0 24px}h2{margin-top:40px}a{color:#88d9ff}.scroll{overflow:auto}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #3c4a5c}th{background:#243548}table{border-collapse:collapse;width:100%;font-size:14px}.note{padding:18px;border-left:4px solid #e7b962;background:#263039}li{margin-bottom:12px}</style>
<h1>Player progression simulation through tier 6</h1><p class="note">Concrete outputs from an abstract production/research model, using assumed player action times. These are scenario results, not measured playthrough predictions. New core systems remain proposals. Map access, finite supply and waste stalls are not simulated.</p>
<h2>Baseline results with capability priority</h2>${table(['Profile','Tier 6 unlocked','Endgame Theory','All fixed research','Tier 6 build stable','Forced waiting','Factory nodes / maps*'],baselines.map(r=>[profiles.find(p=>p.id===r.profile).name,fmt(r.builds[5].start),fmt(r.checkpointSeconds),fmt(r.allFixedSeconds),fmt(r.builds[5].stable),fmt(r.forcedWaitSeconds),`${r.maxProductionAndSupportNodes} / ${r.mapEquivalentsAt60Nodes}${r.exceeds6540NodeBudget?' — over 6,540-node budget':''}`]))}
<p>*Recipe-derived unupgraded production plus assumed 50% support. Excludes source nodes, combat, power/renewal and waste treatment. Map counts are capacity equivalents, not validated geographic requirements.</p>
<p class="note">Current design-only revision: the experienced baseline reaches Endgame Theory in ${fmt(baselines[1].checkpointSeconds)}, with ${fmt(baselines[1].forcedWaitSeconds)} of modeled forced waiting; all fixed research takes ${fmt(baselines[1].allFixedSeconds)}. The maximum-throughput profile uses ${baselines[0].maxProductionAndSupportNodes} production/support nodes before waste infrastructure and finishes stable tier-6 construction in ${fmt(baselines[0].builds[5].stable)}. These scenario results do not validate finite supply, world-map coverage or full-game timings.</p><p><a href="speedrun.html">Separate necessary-research-only speedrun model and one-hour candidate</a></p>
<h2>Inputs that drive the results</h2>${table(['Profile','Sets/min by tier 1–6','Planning seconds by tier','Place / connect seconds','Troubleshooting / uptime'],profiles.map(p=>[p.name,p.rates.join(' / '),p.plan.join(' / '),`${p.place} / ${p.connect}`,`${p.debug*100}% / ${p.uptime*100}%`]))}
<h2>Tier timelines</h2>${baselines.map(r=>`<h3>${esc(profiles.find(p=>p.id===r.profile).name)}</h3>${table(['Tier','Available / build starts','First working production','Stable production','Wait after stable','Research finished while building','Older-tier improvements'],r.builds.map(b=>[`${b.tier} ${tierNames[b.tier-1]}`,fmt(b.start),fmt(b.first),fmt(b.stable),fmt(b.wait),b.researchDuringBuild.length,b.olderTierImprovements]))}`).join('')}
<h2>Queue comparison</h2><p>Cheap-first keeps the cheapest selected project until complete; capability-first prioritizes the access path and can interrupt optional work. Both preserve research contributions.</p>${table(['Profile','Capability-first checkpoint / waiting','Cheap-first checkpoint / waiting'],baselines.map((r,i)=>[profiles[i].name,`${fmt(r.checkpointSeconds)} / ${fmt(r.forcedWaitSeconds)}`,`${fmt(cheapFirst[i].checkpointSeconds)} / ${fmt(cheapFirst[i].forcedWaitSeconds)}`]))}
<h2>Seeded sensitivity bands</h2><p>50 runs per profile vary each build duration by up to ±25% with a triangular distribution and vary delivery uptime by up to 5% below its baseline. Columns show 10th / median / 90th percentiles; these are not statistical estimates of real player populations.</p>${table(['Profile','Endgame Theory','All fixed research','Forced waiting','Truncated'],distributions.map(r=>[profiles.find(p=>p.id===r.profile).name,r.checkpoint.map(fmt).join(' / '),r.allFixed.map(fmt).join(' / '),r.forcedWait.map(fmt).join(' / '),r.truncated]))}
<h2>Experienced profile sensitivity</h2>${table(['Core production target multiplier','Build time multiplier','Endgame Theory','Forced waiting','Factory nodes'],sensitivities.map(r=>[r.rateScale,r.buildTimeScale,fmt(r.checkpointSeconds),fmt(r.forcedWaitSeconds),r.nodes]))}
<h2>How to interpret the result</h2><p>Check the gap between stable production and access to the next problem. If research finishes too early, optional work can fill the construction period. If a ready factory waits, reduce the complete mandatory path, shift selected improvements to earlier cores, or provide useful parallel work. Increasing production reduces research time but requires more machines and construction. Do not tune costs to these assumed human durations without playtests.</p><ul>${output.assumptions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p><a href="waste-design.html">Tier 6 waste proposal</a> · <a href="benchmarks.html">Reference game comparison</a></p></html>`;
writeFileSync('outputs/progression/player-simulation.html',displayText(html));
console.log(JSON.stringify({baselines:baselines.map(r=>({profile:r.profile,tier6:fmt(r.builds[5].start),checkpoint:fmt(r.checkpointSeconds),fixed:fmt(r.allFixedSeconds),stable:fmt(r.builds[5].stable),waiting:fmt(r.forcedWaitSeconds),nodes:r.maxProductionAndSupportNodes,olderImprovements:r.builds.map(b=>b.olderTierImprovements)})),distributions},null,2));
}
