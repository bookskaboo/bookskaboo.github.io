// Calibrate the proposed count of hole-bearing maps, not holes within a map.
// Imports the existing no-foreknowledge policies without running the old study.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLayoutAnalysisServer, makeWorld, online, ignore, summarize, randomFor, shuffle, distance } from './deep-hole-exploration.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const count=Number(process.env.HOLE_DENSITY_SEEDS??384),offset=Number(process.env.HOLE_DENSITY_OFFSET??0),orders=Number(process.env.HOLE_DENSITY_ORDERS??4);
const counts=(process.env.HOLE_DENSITY_COUNTS??'24,26,28,30,32,34,49').split(',').map(Number);
const focusWeights=(process.env.HOLE_DENSITY_WEIGHTS??process.env.HOLE_DENSITY_TIER5_WEIGHTS??'1').split(',').map(Number);
const weightTiers=(process.env.HOLE_DENSITY_FOCUS_TIERS??'5').split(',').map(Number);
const scenarioInputs=process.env.HOLE_DENSITY_SCENARIOS?JSON.parse(process.env.HOLE_DENSITY_SCENARIOS):counts.flatMap(n=>focusWeights.map(weight=>({n,weight})));
const scenarios=scenarioInputs.map(({n,weight})=>({n,weight,key:weight===1?String(n):`${n}-tier${weightTiers.join('_')}x${weight}`}));
const routeOrders=Number(process.env.HOLE_DENSITY_ROUTE_ORDERS??1);
const label=process.env.HOLE_DENSITY_LABEL??'scan';
assert(Number.isInteger(count)&&count>0&&Number.isInteger(offset)&&offset>=0&&Number.isInteger(orders)&&orders>0);
assert(counts.every(n=>Number.isInteger(n)&&n>=0&&n<=49));
assert(focusWeights.every(w=>Number.isFinite(w)&&w>0));
assert(weightTiers.every(t=>Number.isInteger(t)&&t>=0&&t<=10));
assert(Number.isInteger(routeOrders)&&routeOrders>0);
assert(scenarios.every(s=>Number.isInteger(s.n)&&s.n>=0&&s.n<=49&&Number.isFinite(s.weight)&&s.weight>0));
assert.equal(new Set(scenarios.map(s=>s.key)).size,scenarios.length);
const output=resolve(root,'outputs/deep-hole-exploration-2026-11-19');

function thin(world,keep,focusWeight=1) {
  const next={...world,hole:new Uint8Array(world.hole),costs:new Int32Array(world.costs),holeCounts:new Uint8Array(world.holeCounts)};
  const eligible=Array.from(world.hole).flatMap((v,i)=>v?[i]:[]);
  const random=randomFor(world.seed^0x384d5048);
  const ranked=focusWeight===1?shuffle(eligible,random):eligible.map(id=>({id,priority:-Math.log(Math.max(Number.EPSILON,random()))/(weightTiers.includes(distance(id))?focusWeight:1)})).sort((a,b)=>a.priority-b.priority).map(v=>v.id);
  const selected=new Set(ranked.slice(0,keep));
  for(const id of eligible)if(!selected.has(id)){next.hole[id]=0;next.costs[id]=0;next.holeCounts[id]=0;}
  assert.equal(next.hole.reduce((a,b)=>a+b,0),Math.min(keep,eligible.length));
  for(let id=0;id<121;id++) {
    assert(!next.hole[id]||world.hole[id]);
    if(next.hole[id]){assert.equal(next.costs[id],world.costs[id]);assert.equal(next.holeCounts[id],world.holeCounts[id]);}
  }
  return next;
}
const server=await createLayoutAnalysisServer();
try {
  const {analysisMapLayout}=await server.ssrLoadModule('/src/simulation/worldGeneration.ts');
  const data=Object.fromEntries(scenarios.map(s=>[s.key,{direct:[],adaptive:[],allGolems:[],ignore:[],worlds:[],tierCounts:Array.from({length:11},()=>[]),rows:[]} ]));
  for(let i=0;i<count;i++) {
    const seed=(0x4e4f4445+Math.imul(offset+i,0x9e3779b9))>>>0,layout=analysisMapLayout(seed,5,true,11),base=makeWorld(seed,layout);
    for(const {n,weight,key} of scenarios) {
      // n=49 is the historical baseline, which can have either 49 or 50 maps.
      const w=n===49?base:thin(base,n,weight),d=data[key];
      d.worlds.push({holeMaps:w.hole.reduce((a,b)=>a+b,0),holes:w.holeCounts.reduce((a,b)=>a+b,0),stone:w.costs.reduce((a,b)=>a+b,0)});
      for(let tier=0;tier<=10;tier++)d.tierCounts[tier].push({maps:Array.from(w.hole).filter((v,id)=>v&&distance(id)===tier).length});
      for(let rep=0;rep<orders;rep++) {
        const decisionSeed=seed^Math.imul(rep+1,0x632be5ab);
        const direct=online(w,decisionSeed,false,false,routeOrders),adaptive=online(w,decisionSeed,true,false,routeOrders),allGolems=online(w,decisionSeed,true,true,routeOrders),untouched=ignore(w,decisionSeed,'near');
        d.direct.push(direct);d.adaptive.push(adaptive);d.allGolems.push(allGolems);d.ignore.push(untouched);
        d.rows.push({seed,rep,direct:direct.holeMaps,adaptive:adaptive.holeMaps,allGolems:allGolems.holeMaps,directStone:direct.stone,adaptiveStone:adaptive.stone,allGolemsStone:allGolems.stone});
        if(i===0&&rep===0&&n!==49){
          const full=online(w,decisionSeed,true,false,16);
          assert.equal(full.holeMaps,adaptive.holeMaps);assert.equal(full.stone,adaptive.stone);assert.deepEqual(full.steps,adaptive.steps);
        }
      }
    }
    if((i+1)%128===0)console.log(`Density ${label}: ${i+1}/${count} seeds`);
  }
  const targets={direct:10,adaptive:5,allGolems:15};
  const summaries=Object.fromEntries(scenarios.map(({n,weight,key})=>{
    const d=data[key],policies=Object.fromEntries(['direct','adaptive','allGolems','ignore'].map(p=>[p,summarize(d[p])]));
    const error=Object.fromEntries(Object.entries(targets).map(([p,t])=>[p,policies[p].holeMaps.median-t]));
    return[key,{holeMapQuota:n,focusWeight:weight,weightTiers,worlds:summarize(d.worlds),tierCounts:d.tierCounts.map(rows=>summarize(rows).maps),policies,medianError:error,absoluteMedianError:Object.values(error).reduce((a,b)=>a+Math.abs(b),0),squaredRelativeMedianError:Object.entries(error).reduce((a,[p,e])=>a+(e/targets[p])**2,0),rows:d.rows}];
  }));
  const source=await readFile(resolve(root,'src/simulation/worldGeneration.ts'));
  const result={schema:1,label,seeds:count,seedOffset:offset,ordersPerSeed:orders,routeOrders,targets,sourceSha256:createHash('sha256').update(source).digest('hex'),method:'Fixed quota: select exactly N of the actual 49-50 eligible hole maps. Weight 1 uses a uniform independent seeded shuffle; other weights use exponential priority races with the specified weight on focus tiers and all other tiers at weight 1. Selected map budgets/counts unchanged. Omitted hole maps become ordinary clear resource maps. N=49 represents the unthinned baseline. Same seeds and choices paired across scenarios.',limitations:['No terrain distribution knowledge, hidden source locations or hidden bills guide player policies.','Immediate visits after purchases; advance purchases and grandfathered started quotes are not exploited.','Gate uses generated holes only. Existing map access remains available.','Existing reserved Lakes, camps, Golems, clear outposts and corners are unchanged.','Each retained hole map still gets 1-5 holes with the agreed candidate-size/budget model.','Targets are medians, not per-world guarantees. Route-network sharing is heuristic; all four corner paths retain exact 10-hop length.','Graph/budget estimate, not a factory affordability, physical routing, timing or victory run.'],scenarios:summaries};
  await mkdir(output,{recursive:true});await writeFile(resolve(output,label+'.json'),JSON.stringify(result,null,2)+'\n');
  for(const {key} of scenarios){const d=summaries[key];console.log(JSON.stringify({scenario:key,error:d.absoluteMedianError,policies:Object.fromEntries(['direct','adaptive','allGolems'].map(p=>[p,d.policies[p].holeMaps])),worldHoles:d.worlds.holes}));}
} finally {await server.close();}
