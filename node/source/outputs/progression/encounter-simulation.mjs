import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import { displayText } from './item-display.mjs';
process.argv.push('--library');
const {simulate,resetSimulationSeed}=await import('./player-simulation.mjs');
const previous=JSON.parse(readFileSync('outputs/progression/player-simulation.json','utf8'));
const speed=JSON.parse(readFileSync('outputs/progression/speedrun-results.json','utf8'));
const endpoint=r=>Math.max(r.checkpointSeconds??Infinity,r.builds[5].stable??Infinity);
const speedProfile={id:'speedrunner',name:'Necessary-only speedrunner',rates:speed.candidate.best.rates,plan:[0,0,0,0,0,0],place:0,connect:0,debug:0,uptime:1,pairSeconds:5,extraConnectionSeconds:2.5};
const summarize=r=>({profile:r.profile,endpointSeconds:endpoint(r),endgameTheorySeconds:r.checkpointSeconds,tier6StableSeconds:r.builds[5].stable,
 allFixedSeconds:r.allFixedSeconds,waitingSeconds:r.forcedWaitSeconds,preparationSeconds:r.preparationSeconds,
 explorationSeconds:r.explorationSeconds,researchItems:r.selectedResearch.reduce((n,p)=>n+p.each*p.tier,0),
 placedNodes:r.builds.reduce((n,b)=>n+b.addedMachines+b.addedSupport,0),
 discoveries:r.discoveries,tiers:r.builds.map(b=>({tier:b.tier,start:b.start,first:b.first,stable:b.stable,waitingSeconds:b.wait,prebuiltSeconds:b.prebuiltSeconds})),
 rates:r.rates});
function check(r){
 assert.ok(!r.truncated&&Number.isFinite(endpoint(r)),'Complete route');
 const paid=new Map(r.completions.map(p=>[p.id,p.time]));
 for(let i=0;i<6;i++){
  const consumed=r.selectedResearch.reduce((n,p)=>n+(p.tier>i?p.each:0),0);
  assert.ok(Math.abs(r.coreProduced[i]-consumed-r.remainingCores[i])<1e-6,'Core conservation');
 }
 for(const b of r.builds){
  assert.ok(b.prebuiltSeconds<=b.prebuildCapSeconds+1e-7,'Preparation cap');
  const actual=Math.max(0,b.stable-b.start)+b.prebuiltSeconds-b.explorationPauseSeconds;
  assert.ok(Math.abs(actual-b.duration)<=1.1,'One worker: no duplicated placement time');
 }
 if(r.encounters){
  const found=new Map(r.discoveries.map(e=>[e.id,e.completed]));
  assert.ok(r.builds[3].first>=found.get('lake-and-fabricator'),'Hydro tools discovered before production');
  assert.ok(r.builds[4].first>=found.get('mithril'),'Mythril tools discovered before production');
 }
 assert.ok(paid.has('Endgame Theory'));
}
const cases=[{id:'before',encounters:false,discoverySeconds:0},{id:'instant',encounters:true,discoverySeconds:0},{id:'nearby',encounters:true,discoverySeconds:60},{id:'delayed',encounters:true,discoverySeconds:180}];
const general=previous.profiles.map(profile=>({profile:profile.name,runs:cases.map(c=>{
 const r=simulate(profile,c);check(r);return{case:c.id,...summarize(r)};
})}));
const speedFixed=cases.map(c=>{const r=simulate(speedProfile,{...c,necessaryOnly:true,researchScale:speed.candidate.researchScale});check(r);return{case:c.id,...summarize(r)};});
const noPrep=simulate(speedProfile,{necessaryOnly:true,researchScale:speed.candidate.researchScale,encounters:true,discoverySeconds:0,prebuildLimit:0});check(noPrep);
assert.equal(endpoint(noPrep),speedFixed[0].endpointSeconds,'Discovery alone does not reduce research costs');
const grid=[.25,.5,.75,1,1.5,2,3,4,6,8,12];
function optimize(discoverySeconds,researchScale=speed.candidate.researchScale,encounters=true){
 const evaluate=rates=>simulate({...speedProfile,rates},{encounters,discoverySeconds,necessaryOnly:true,researchScale});
 let best=evaluate(speedProfile.rates);best.rates=speedProfile.rates;
 for(const rate of grid){const rates=Array(6).fill(rate),r=evaluate(rates);if(endpoint(r)<endpoint(best)){best=r;best.rates=rates;}}
 for(let pass=0;pass<3;pass++){
  let changed=false;
  for(let tier=0;tier<6;tier++)for(const rate of grid){const rates=[...best.rates];rates[tier]=rate;const r=evaluate(rates);if(endpoint(r)<endpoint(best)-.1){best=r;best.rates=rates;changed=true;}}
  if(!changed)break;
 }
 check(best);return{discoverySeconds,researchScale,...summarize(best)};
}
const optimized=[0,60,180].map(n=>optimize(n));
const optimizedControl=optimize(0,speed.candidate.researchScale,false);
assert.ok(optimizedControl.endpointSeconds<=speedFixed[0].endpointSeconds+.5,'Matched optimization control');
const cheapOptimized=optimize(60,1);
const percentile=(a,q)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*q)];
const paired=previous.profiles.map(profile=>{
 const before=[],after=[];
 for(let i=0;i<50;i++){
  const seed=0x454e4300+i*7919;
  resetSimulationSeed(seed);const a=simulate(profile,{random:true});check(a);
  resetSimulationSeed(seed);const b=simulate(profile,{random:true,encounters:true,discoverySeconds:60});check(b);
  before.push(a);after.push(b);
 }
 return{profile:profile.name,pairedRuns:50,beforeEndpoint:[.1,.5,.9].map(q=>percentile(before.map(endpoint),q)),afterEndpoint:[.1,.5,.9].map(q=>percentile(after.map(endpoint),q)),
  beforeWaiting:[.1,.5,.9].map(q=>percentile(before.map(r=>r.forcedWaitSeconds),q)),afterWaiting:[.1,.5,.9].map(q=>percentile(after.map(r=>r.forcedWaitSeconds),q))};
});
const output={status:'Conditional encounter/scheduling simulation, not a world-map or calibrated human-play simulation',general,speedFixed,optimized,optimizedControl,cheapOptimized,paired,
 assumptions:[
 'Required discovery waves become eligible at first working Automata production (Lake + Fabricator, assumed co-located/one scouting wave), then first working Hydro production (Mythril). This is a scheduling proxy, not a generated-world route.',
 'Each wave takes 0, 60 or 180 seconds of active scouting, with two required waves total. Scouting pauses the single player’s current construction while production and research continue. An encounter is credited at the end of its wave.',
 'Optional Sorting Station scouting is skipped because Precision Control supplies the fallback and this model cannot value earlier waste routing.',
 'When current construction is finished but next-tier research is pending, a discovered machine set allows preparation of up to 25% of the next tier’s placement/connection work. Existing profile planning time is excluded from that cap. This fraction is a sensitivity assumption, not a node-by-node layout.',
 'One worker performs scouting, current construction or future preparation. Preparation is subtracted from subsequent construction, never counted as parallel labor. New cores cannot be produced before paid access and required discoveries.',
 'Counts, core quantities, recipe work, paid prerequisites and the five-second speedrunner action assumption stay unchanged between matched before/after runs. The optimized cases rerun the same rate-grid search without retuning prices to force one hour.',
 'Endpoint means Endgame Theory and stable planned tier-6 construction. General all-fixed research is reported separately. Sensitivity percentiles come from 50 matched seeds per profile, not player population statistics.',
 'Finite deposits, actual map access/research costs, adjacency, source placement, combat, power, recipe-pipeline timing and explicit waste/transport queues remain excluded. No complete playable one-hour route is claimed.'
 ],checks:['Core conservation','Required discoveries before commissioning','Single-worker placement budget','Preparation work capped','Zero-cost/no-preparation control matches previous timing','Paid route completes']};
writeFileSync('outputs/progression/encounter-simulation.json',JSON.stringify(output,null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const fmt=s=>{const n=Math.round(s);return `${Math.floor(n/60)}m ${n%60}s`;};
const table=(heads,rows)=>`<div class="scroll"><table><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table></div>`;
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Encounter unlock simulation results</title><style>body{font:16px/1.6 system-ui;max-width:1200px;margin:40px auto;padding:0 24px;background:#111923;color:#e8edf4}h2{margin-top:40px}a{color:#8cdeff}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #405065}th{background:#223347}.note{padding:18px;background:#28343c;border-left:4px solid #82d4b8}li{margin-bottom:12px}</style><h1>Encounter unlock simulation results</h1><p class="note">Encounter tools enable earlier preparation, but do not remove core-recipe research. Discovery has an active labor cost. This experiment separates reduced idle time from slower travel and compares the same prices before and after.</p>
<h2>One-hour candidate with the same factory</h2><p>Same ${speedFixed[0].placedNodes}-node plan, research costs and production rates. Only encounter timing and preparation change. Two required discovery waves are modeled; optional Sorting Station scouting is skipped.</p>${table(['Discovery case','Finish tier 6','Forced waiting','Future construction prepared','Active scouting'],speedFixed.map(r=>[r.case,fmt(r.endpointSeconds),fmt(r.waitingSeconds),fmt(r.preparationSeconds),fmt(r.explorationSeconds)]))}
<h2>Reoptimized necessary-only speedrun</h2><p>Same candidate prices, rerunning the rate-grid search. These timings were not retuned to one hour.</p>${table(['Seconds per discovery wave','Finish','Waiting','Placed nodes','Sets/min by tier'],optimized.map(r=>[r.discoverySeconds,fmt(r.endpointSeconds),fmt(r.waitingSeconds),r.placedNodes,r.rates.join(' / ')]))}
<p>At general low-wait prices, the separately optimized necessary-only route with nearby discoveries finishes in ${fmt(cheapOptimized.endpointSeconds)} with ${fmt(cheapOptimized.waitingSeconds)} waiting. The one-hour cost candidate is a separate scenario.</p>
<h2>General profiles</h2><p>Endpoint includes both Endgame Theory and stable tier-6 construction. Optional fixed research may continue afterward.</p>${table(['Profile','Before: finish / wait','Instant discoveries: finish / wait','Nearby, 1m per wave: finish / wait','Delayed, 3m per wave: finish / wait'],general.map(p=>[p.profile,...p.runs.map(r=>`${fmt(r.endpointSeconds)} / ${fmt(r.waitingSeconds)}`)]))}
<h2>Remaining speedrun bottleneck</h2>${table(['Tier','Before waiting','Nearby encounter waiting','Preparation credited'],speedFixed[0].tiers.map((b,i)=>[b.tier,fmt(b.waitingSeconds),fmt(speedFixed[2].tiers[i].waitingSeconds),fmt(speedFixed[2].tiers[i].prebuiltSeconds)]))}
<p>Most remaining idle time is after the tier-6 factory is already built, waiting for final core-funded research. Encounter access does not accelerate that production or lower its core bill. Further reductions need a smaller final access requirement, a different factory rate or useful endpoint tasks; more encounters alone cannot remove it.</p>
<h2>Matched duration/uptime sensitivity</h2><p>50 paired seeds for each profile; 10th / median / 90th percentiles. Nearby discoveries use 60 seconds per wave. These are scenario sensitivity bands, not measured player confidence intervals.</p>${table(['Profile','Before finish','After finish','Before waiting','After waiting'],paired.map(r=>[r.profile,r.beforeEndpoint.map(fmt).join(' / '),r.afterEndpoint.map(fmt).join(' / '),r.beforeWaiting.map(fmt).join(' / '),r.afterWaiting.map(fmt).join(' / ')]))}
<h2>Assumptions and checks</h2><ul>${output.assumptions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>Checks passed: ${output.checks.map(esc).join('; ')}.</p><p><a href="encounter-unlocks.html">Encounter design</a> · <a href="speedrun.html">Previous speedrun model</a> · <a href="player-simulation.html">General model</a></p></html>`;
writeFileSync('outputs/progression/encounter-simulation.html',displayText(html));
console.log(JSON.stringify({speedFixed:speedFixed.map(r=>({case:r.case,end:fmt(r.endpointSeconds),wait:fmt(r.waitingSeconds),prep:fmt(r.preparationSeconds)})),optimized:optimized.map(r=>({delay:r.discoverySeconds,end:fmt(r.endpointSeconds),wait:fmt(r.waitingSeconds),nodes:r.placedNodes,rates:r.rates})),general:general.map(p=>({profile:p.profile,runs:p.runs.map(r=>({case:r.case,end:fmt(r.endpointSeconds),wait:fmt(r.waitingSeconds)}))}))},null,2));
