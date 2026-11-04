// Necessary-research-only route, with the user's five-second node+connection action.
import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { displayText } from './item-display.mjs';
process.argv.push('--library');
const {simulate}=await import('./player-simulation.mjs');
const base={id:'speedrunner',name:'Speedrunner',plan:[0,0,0,0,0,0],place:0,connect:0,debug:0,uptime:1,pairSeconds:5,extraConnectionSeconds:2.5};
const evaluate=(rates,researchScale=1)=>{
 const run=simulate({...base,rates},{necessaryOnly:true,researchScale});
 assert.ok(!run.truncated&&run.checkpointSeconds!==null&&run.builds[5].stable!==null,`Incomplete candidate route ${rates}/${researchScale}: ${run.completedProjects}; buffers ${run.remainingCores}`);
 const end=Math.max(run.checkpointSeconds,run.builds[5].stable);
 return {...run,rates,elapsedSeconds:end,placementSeconds:run.builds.reduce((n,b)=>n+b.duration,0),
  totalPlacedNodes:run.builds.reduce((n,b)=>n+b.addedMachines+b.addedSupport,0),
  totalConnections:run.builds.reduce((n,b)=>n+b.connections,0)};
};
const grid=[.25,.5,.75,1,1.5,2,3,4,6,8,12];
function optimize(researchScale){
const seeds=grid.map(rate=>evaluate(Array(6).fill(rate),researchScale));
let best=seeds.reduce((a,b)=>a.elapsedSeconds<b.elapsedSeconds?a:b);
for(let pass=0;pass<3;pass++){
 let changed=false;
 for(let tier=0;tier<6;tier++)for(const rate of grid){
  const rates=[...best.rates];rates[tier]=rate;const run=evaluate(rates,researchScale);
  if(run.elapsedSeconds<best.elapsedSeconds-.1){best=run;changed=true;}
 }
 if(!changed)break;
}
return {researchScale,best,seeds};
}
const sweep=[1,2,4,8,16,32].map(optimize);
const near=sweep.reduce((a,b)=>Math.abs(a.best.elapsedSeconds-3600)<Math.abs(b.best.elapsedSeconds-3600)?a:b);
const fine=[];
for(let scale=Math.max(1,near.researchScale/2);scale<=near.researchScale*1.5;scale++)if(!sweep.some(s=>s.researchScale===scale))fine.push(optimize(scale));
const candidate=[...sweep,...fine].reduce((a,b)=>Math.abs(a.best.elapsedSeconds-3600)<Math.abs(b.best.elapsedSeconds-3600)?a:b);
const {best,seeds}=sweep[0];
assert.ok(best.selectedResearch.every(p=>p.each>0));
const c=candidate.best;
const inputs=JSON.parse(readFileSync('outputs/progression/player-simulation.json','utf8'));
const crossProfiles=inputs.profiles.map(p=>{
 const run=simulate(p,{necessaryOnly:true,researchScale:candidate.researchScale});
 return {profile:p.name,endpointSeconds:run.checkpointSeconds,forcedWaitSeconds:run.forcedWaitSeconds};
});
const stock=Array(6).fill(0);
for(const p of c.selectedResearch)for(let i=0;i<p.tier;i++)stock[i]+=p.each;
for(let i=0;i<6;i++)assert.ok(Math.abs(c.coreProduced[i]-stock[i])<1e-6,'Only necessary cores produced');
writeFileSync('outputs/progression/speedrun-one-hour-candidate.json',JSON.stringify({status:'Sensitivity candidate only; not adopted into general balance or live gameplay',targetSeconds:3600,researchScale:candidate.researchScale,research:c.selectedResearch,productionRatesPerMinute:c.rates,placementSecondsPerNodeAndFirstConnection:5,additionalConnectionSeconds:2.5,expectedSeconds:c.elapsedSeconds,forcedWaitSeconds:c.forcedWaitSeconds,crossProfiles},null,2));
writeFileSync('outputs/progression/speedrun-results.json',JSON.stringify({status:'Necessary-route optimization; one-hour scaled-cost candidate is sensitivity only, not adopted costs. Excludes exploration, finite supply, combat and waste stalls',assumption:'5 seconds for one node plus its first connection; 2.5 seconds per additional connection. No planning time. 50% support-node allowance and 1.5 connections per total node.',method:'Uniform-rate sweep followed by three coordinate-descent passes across six tier rates; grid-local optimum, not proof of global optimality',best,candidate,costSweep:[...sweep,...fine].map(s=>({scale:s.researchScale,endMinutes:s.best.elapsedSeconds/60,waitMinutes:s.best.forcedWaitSeconds/60,nodes:s.best.totalPlacedNodes})),seeds:seeds.map(r=>({rate:r.rates[0],elapsedSeconds:r.elapsedSeconds,nodes:r.totalPlacedNodes}))},null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const time=s=>{const n=Math.round(s);return `${Math.floor(n/60)}m ${n%60}s`;};
const table=(heads,rows)=>`<div class="scroll"><table><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table></div>`;
const tiers=['Simple','Basic','Automata','Hydro','Shiny','Complex'];
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>One hour speedrun model</title><style>body{font:16px/1.6 system-ui;max-width:1200px;margin:40px auto;padding:0 24px;background:#111923;color:#e8edf4}h2{margin-top:40px}a{color:#8cdeff}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #405065}th{background:#223347}.note{background:#283239;border-left:4px solid #e8b760;padding:18px}li{margin-bottom:12px}</style>
<h1>Necessary research speedrun to the end of tier 6</h1><p class="note">Five seconds places one node and its first connection. Additional connections take an assumed 2.5 seconds. The one-hour candidate finishes in <strong>${time(c.elapsedSeconds)}</strong>, using <strong>${c.totalPlacedNodes} placed nodes and ${c.totalConnections} connections</strong>, with <strong>${time(c.forcedWaitSeconds)} of waiting</strong>. It is a separate candidate, not adopted general prices or a verified live-game speedrun.</p>
<h2>Endpoint and search</h2><p>Finish Endgame Theory and the planned tier-6 factory. Select only its paid prerequisite closure plus Assembler and Road for production/map logistics: ${c.selectedResearch.length} paid projects, no optional efficiency or convenience research. Useful core outputs are produced only up to the route's remaining requirements, with zero discretionary surplus. This route does not sustain maximum lab throughput.</p><p>Search: eleven target rates per tier, uniform-rate starts and three coordinate-descent passes, then a search over research-cost multipliers. This is a grid-local result, not proof of a globally optimal route. Reuse is counted for matching operations; more flexible machine repurposing or build ordering could improve it.</p>
${table(['Scenario','Finish','Placed nodes','Connections','Placement work','Waiting'],[["Current general proposal",time(best.elapsedSeconds),best.totalPlacedNodes,best.totalConnections,time(best.placementSeconds),time(best.forcedWaitSeconds)],["One-hour cost candidate",time(c.elapsedSeconds),c.totalPlacedNodes,c.totalConnections,time(c.placementSeconds),time(c.forcedWaitSeconds)]])}
<h2>One-hour candidate timeline</h2>${table(['Tier','New nodes placed','Connection actions','Build starts','Working production','Build complete','Wait after build','Core sets/min target'],c.builds.map((b,i)=>[`${b.tier} ${tiers[i]}`,b.addedMachines+b.addedSupport,b.connections,time(b.start),time(b.first),time(b.stable),time(b.wait),c.rates[i]]))}
<h2>Necessary research and core quantities</h2><p>The candidate multiplies only tier-3-and-later access costs by ${candidate.researchScale}; early Assembler, Exploration, Road and Automata access retain the general revision's prices. Every cost is the same quantity of each core through its listed highest type. No artificial unlock timer is added.</p>
${table(['Research','Highest required core','Each required core'],c.selectedResearch.map(p=>[p.id,tiers[p.tier-1],p.each]))}
${table(['Core','Required physical research items'],stock.map((n,i)=>[tiers[i],n]))}
<h2>Production machine plan by tier</h2><p>Counts below are operating recipe machines, Extractors and Lake Intakes at each tier's target rate. The timeline counts cumulative new placements plus a 50% support allowance; it can exceed the final operating count because earlier capacity may be left idle.</p>${c.builds.map(b=>`<details><summary>${tiers[b.tier-1]}: ${b.machinesCount} production machines, ${b.addedSupport} new support nodes</summary>${table(['Operation','Machines'],Object.entries(b.machines))}</details>`).join('')}
<h2>Resource bill for required research</h2>${table(['Raw resource','Amount (average recipe batches)'],Object.entries(c.raw).map(([id,n])=>[id,n.toFixed(2)]))}
<p>Includes nested ingredients once. Excludes waste treatment, power, combat, map-research materials and finite-deposit replacement. Whole batch rounding can add small surpluses.</p>
<h2>What happens to other players with these higher costs</h2>${table(['Assumed profile','Endgame Theory','Forced waiting'],crossProfiles.map(r=>[r.profile,time(r.endpointSeconds),time(r.forcedWaitSeconds)]))}
<p class="note">Cost increases alone reach the one-hour speedrun target but conflict with the earlier no-wait goal for slower factories. Keep this candidate separate until map access, resource renewal and real logistics tasks are included. Those could supply meaningful work instead of research waiting; their time has not been invented here.</p>
<h2>Limits of the model</h2><ul><li>Five-second node-plus-first-connection actions are the user's assumption; extra-connection cost, 50% support and 1.5 connections/node are modeling assumptions.</li><li>No planning, mistakes, travel, map adjacency, source-node placement, finite ore, camp suppression or explicit waste transport/stalls. Resource access and delivery uptime are assumed sufficient.</li><li>Production is a recipe-work capacity model with integer machines. Commissioning at 55% of placement and ramping production is an abstraction, not a simulated build order or recipe pipeline.</li><li>No optional upgrades are bought. Core yields, five-second Extractors and recipe costs are unchanged between the general and one-hour cases; only required research counts change.</li><li>The one-hour target is separate from the three-hour full-throughput checklist and the tier-7 20–30-hour endgame target.</li></ul><p><a href="player-simulation.html">General progression scenarios</a> · <a href="waste-design.html">Waste proposal</a></p></html>`;
writeFileSync('outputs/progression/speedrun.html',displayText(html.replace('<h1>Necessary research speedrun to the end of tier 6</h1>','<h1>Necessary research speedrun to the end of tier 6</h1><p><a href="core-recipes.html">Current independent core recipes</a> · <a href="encounter-simulation.html">Encounter simulation</a>. This page is the control without early preparation.</p>')));
console.log(JSON.stringify({oneHourCandidate:{scale:candidate.researchScale,end:candidate.best.elapsedSeconds/60,wait:candidate.best.forcedWaitSeconds/60,nodes:candidate.best.totalPlacedNodes,connections:candidate.best.totalConnections,rates:candidate.best.rates},costSweep:sweep.map(s=>({scale:s.researchScale,end:s.best.elapsedSeconds/60,wait:s.best.forcedWaitSeconds/60,nodes:s.best.totalPlacedNodes}))}));
console.log(JSON.stringify({rates:best.rates,endMinutes:best.elapsedSeconds/60,placementMinutes:best.placementSeconds/60,waitingMinutes:best.forcedWaitSeconds/60,totalNodes:best.totalPlacedNodes,connections:best.totalConnections,research:best.selectedResearch,tiers:best.builds.map(b=>({tier:b.tier,start:b.start/60,first:b.first/60,stable:b.stable/60,wait:b.wait/60,nodes:b.addedMachines+b.addedSupport}))},null,2));
