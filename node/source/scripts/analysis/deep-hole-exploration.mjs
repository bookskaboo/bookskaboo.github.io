// Offline graph/budget experiment. Never loads or changes player saves or game rules.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const count = Number(process.env.HOLE_SIM_SEEDS ?? 2000);
assert(Number.isInteger(count) && count > 0);
const output = resolve(root, process.env.HOLE_SIM_OUTPUT ?? 'outputs/deep-hole-exploration-2026-11-18');
const N = 121, HOME = 60;
const xy = id => [id % 11, Math.floor(id / 11)];
const key = id => xy(id).join(',');
const index = key => { const [x, y] = key.split(',').map(Number); return y * 11 + x; };
const distance = (a, b = HOME) => { const [x, y] = xy(a), [u, v] = xy(b); return Math.abs(x-u) + Math.abs(y-v); };
const neighbors = Array.from({ length: N }, (_, id) => {
  const [x,y] = xy(id);
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([u,v]) => u>=0 && u<11 && v>=0 && v<11).map(([u,v]) => v*11+u);
});
const corners = [0,10,120,110];
const randomFor = seed => { let n=seed>>>0; return () => { n+=0x6d2b79f5; let t=n; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
const shuffle = (xs, random) => { xs=[...xs]; for(let i=xs.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [xs[i],xs[j]]=[xs[j],xs[i]]; } return xs; };

function allocate(weights, total) {
  const sum=weights.reduce((a,b)=>a+b,0), exact=weights.map(w=>w/sum*total), bills=exact.map(Math.floor);
  const order=weights.map((_,i)=>i).sort((a,b)=>(exact[b]-bills[b])-(exact[a]-bills[a]) || a-b);
  for(let i=0,left=total-bills.reduce((a,b)=>a+b,0);i<left;i++) bills[order[i]]++;
  assert.equal(bills.reduce((a,b)=>a+b,0),total);
  return bills;
}
function makeWorld(seed, layout, equalAreas=false) {
  const hole=new Uint8Array(N), costs=new Int32Array(N), holeCounts=new Uint8Array(N);
  const reserved=new Set([...layout.lakes,...layout.clear,...layout.camps,...layout.lizards,...layout.golems.keys()]);
  for(let id=0;id<N;id++) {
    if(id===HOME || corners.includes(id) || reserved.has(key(id))) continue;
    hole[id]=1;
    // Candidate-size distribution is an analysis assumption, not adopted geometry.
    // Reuse the current generator's five radius weights, normalized by area.
    const tier=distance(id), pool=Math.round(1650*(1+7*(tier-1)/8));
    const random=randomFor(seed ^ Math.imul(id+1,0x6e624eb7));
    const weights=shuffle([.75,.875,1,1.125,1.25],random).map(w=>equalAreas?1:w*w);
    const bills=allocate(weights,pool), selected=shuffle([0,1,2,3,4],random).slice(0,1+Math.floor(random()*5));
    costs[id]=selected.reduce((sum,i)=>sum+bills[i],0); holeCounts[id]=selected.length;
  }
  const dwarves=[...layout.lizards].map(index).sort((a,b)=>distance(a)-distance(b)||a-b);
  const dwarf=dwarves[0]; // Fixed nearest-tier target, not selected using hidden clearing costs.
  const required=[...corners,62,dwarf]; // E2 Lake, one Dwarven Mythril source.
  const extended=[...required,...layout.golems.keys()].map(v=>typeof v==='string'?index(v):v);
  return {seed,hole,costs,holeCounts,required,extended,golems:[...layout.golems.keys()].map(index),dwarves,lakes:[...layout.lakes].map(index)};
}
function reachable(opened,a,b) {
  if(!opened[a]||!opened[b]) return Infinity;
  const ds=new Int16Array(N).fill(-1),queue=[a]; ds[a]=0;
  for(let q=0;q<queue.length;q++) { const v=queue[q]; if(v===b)return ds[v]; for(const n of neighbors[v])if(opened[n]&&ds[n]<0){ds[n]=ds[v]+1;queue.push(n);} }
  return Infinity;
}
function noInteractionOracle(world) {
  // Exact non-hole connected component: a discovered hole cannot be used to
  // discover its far side under the all-approaches rule. Visit holes last.
  const opened=new Uint8Array(N),queue=[HOME];opened[HOME]=1;
  for(let q=0;q<queue.length;q++)for(const n of neighbors[queue[q]])if(!world.hole[n]&&!opened[n]){opened[n]=1;queue.push(n);}
  return {nonHoleMaps:queue.length,allCorners:Number(corners.every(id=>opened[id])),cornerCount:corners.filter(id=>opened[id]).length,allTargets:Number(world.required.every(id=>opened[id])),lake:Number(opened[62]),anyDwarf:Number(world.dwarves.some(id=>opened[id]))};
}
function ignore(world,seed,mode,alternate=false,forcedHomeAfter=Infinity) {
  const random=randomFor(seed), opened=new Uint8Array(N); opened[HOME]=1;
  const active=new Uint8Array(N), discovery=[];
  while(true) {
    if(discovery.length>=forcedHomeAfter) active[HOME]=1;
    const frontier=[];
    for(let id=0;id<N;id++) {
      if(opened[id]) continue;
      const from=neighbors[id].filter(n=>opened[n]);
      if(!from.length)continue;
      const allowed=alternate ? from.some(n=>!active[n]) : !neighbors[id].some(n=>active[n]);
      if(allowed)frontier.push(id);
    }
    if(!frontier.length)break;
    let choices=frontier;
    if(mode==='near') { const d=Math.min(...frontier.map(id=>distance(id))); choices=frontier.filter(id=>distance(id)===d); }
    const id=choices[Math.floor(random()*choices.length)]; opened[id]=1; active[id]=world.hole[id]; discovery.push(id);
  }
  const allCorners=corners.every(id=>opened[id]), cornerCount=corners.filter(id=>opened[id]).length;
  const routes=corners.map(id=>reachable(opened,HOME,id));
  return {opened:discovery.length+1,cornerCount,allCorners:Number(allCorners),allTargets:Number(world.required.every(id=>opened[id])),lake:Number(opened[62]),anyDwarf:Number(world.dwarves.some(id=>opened[id])),golems:world.golems.filter(id=>opened[id]).length,holeMaps:discovery.filter(id=>world.hole[id]).length,blocked:N-discovery.length-1,meanCornerDetour:allCorners?routes.reduce((a,b)=>a+b,0)/4-10:null,discovery};
}
const edgeKey=(a,b)=>a<b?a*N+b:b*N+a;
function corridor(world,targets,orderSeed,oracle,priority='stone') {
  const random=randomFor(orderSeed), visited=new Uint8Array(N);visited[HOME]=1;
  const cleared=new Uint8Array(N), edges=new Set(), steps=[], clearEvents=[];
  let stone=0,holes=0,stoneBalance=0,minStoneBalance=0,localShortfall=0,importMaps=0;
  const order=shuffle(targets,random);
  for(const target of order) {
    const path=[HOME];
    if(oracle) {
      // DAG: every edge increases distance from Home and decreases distance to target.
      // Thus each terminal's logistics route is exactly its Manhattan lower bound.
      const labels=Array(N), previous=new Int16Array(N).fill(-1); labels[HOME]=[0,0,0];
      const candidates=Array.from({length:N},(_,i)=>i).filter(i=>distance(i)+distance(i,target)===distance(target)).sort((a,b)=>distance(a)-distance(b)||a-b);
      for(const a of candidates)if(labels[a])for(const b of neighbors[a]) {
        if(distance(b)!==distance(a)+1 || distance(b,target)!==distance(a,target)-1)continue;
        const charge=cleared[b]?0:world.costs[b], road=Number(!edges.has(edgeKey(a,b))), cell=Number(!visited[b]);
        const delta=priority==='roads'?[road,charge,cell]:[charge,cell,road];
        const next=labels[a].map((v,i)=>v+delta[i]);
        const better=!labels[b] || next[0]<labels[b][0] || next[0]===labels[b][0]&&(next[1]<labels[b][1] || next[1]===labels[b][1]&&next[2]<labels[b][2]);
        if(better){labels[b]=next;previous[b]=a;}
      }
      const reverse=[];for(let v=target;v!==HOME;v=previous[v]){assert(v>=0);reverse.push(v);}path.push(...reverse.reverse());
    } else {
      while(path.at(-1)!==target) { const a=path.at(-1),choices=neighbors[a].filter(b=>distance(b,target)===distance(a,target)-1); path.push(choices[Math.floor(random()*choices.length)]); }
    }
    for(let i=1;i<path.length;i++) {
      const a=path[i-1],b=path[i];
      if(!visited[b]) {
        // Pay every discovered unfinished neighboring hole map before exploring b.
        for(const h of neighbors[b])if(visited[h]&&world.hole[h]&&!cleared[h]) {
          cleared[h]=1;stone+=world.costs[h];holes+=world.holeCounts[h];clearEvents.push(h);
          const shortfall=Math.max(0,world.costs[h]-(1000+500*distance(h)));
          localShortfall+=shortfall;if(shortfall)importMaps++;
          stoneBalance-=world.costs[h];minStoneBalance=Math.min(minStoneBalance,stoneBalance);
        }
        assert(!neighbors[b].some(h=>visited[h]&&world.hole[h]&&!cleared[h]));
        assert(neighbors[b].some(h=>visited[h]));visited[b]=1;steps.push(b);
        if(!corners.includes(b))stoneBalance+=1000+500*distance(b);
      }
      edges.add(edgeKey(a,b));
    }
  }
  assert(targets.every(id=>visited[id]));
  for(const t of targets)assert.equal(reachable(visited,HOME,t),distance(t));
  // A new hole entered immediately before rejoining an explored route may stay
  // unfinished: the rule restricts further discovery, not existing travel.
  const unfilledDiscovered=Array.from(visited).filter((v,i)=>v&&world.hole[i]&&!cleared[i]).length;
  // Exact destination band pricing, assuming one initial free map point, then quotes.
  const band=t=>t<=6?Math.ceil(t/2):Math.min(t-3,6), openedBands=[1,0,0,0,0,0,0];
  const coreCosts=[5,5,0,0,0,0];
  steps.forEach((id,i)=>{const b=band(distance(id));if(i>0){const amount=5+5*Math.floor(openedBands[b]/(b===1?1:2));for(let c=0;c<b;c++)coreCosts[c]+=amount;if(corners.includes(id))coreCosts[5]++;}openedBands[b]++;});
  return {stone,holeMaps:clearEvents.length,holes,unfilledDiscovered,localShortfall,importMaps,minimumGrossStoneBalance:minStoneBalance,negativeGrossStonePrefix:Number(minStoneBalance<0),opened:steps.length+1,roadEdges:edges.size,coreCosts,order,steps,clearEvents};
}
function bestOracle(world,targets,seed,priority='stone') {
  let best;
  for(let i=0;i<24;i++) {
    const run=corridor(world,targets,seed^Math.imul(i+1,0x45d9f3b),true,priority);
    if(!best || (priority==='roads' ? run.roadEdges<best.roadEdges || run.roadEdges===best.roadEdges&&run.stone<best.stone : run.stone<best.stone || run.stone===best.stone&&run.roadEdges<best.roadEdges))best=run;
  }
  return best;
}
function online(world,seed,adaptive,extended=false,routeOrders=16) {
  const random=randomFor(seed),visited=new Uint8Array(N),cleared=new Uint8Array(N);visited[HOME]=1;
  const steps=[],clearEvents=[],targets=[HOME],lakeSet=new Set(world.lakes),dwarfSet=new Set(world.dwarves),golemSet=new Set(world.golems);
  let stone=0,holes=0,localShortfall=0,stoneBalance=0,minStoneBalance=0,importMaps=0,lake,dwarf;
  const foundGolems=new Set();
  // Only revealed state is consulted by the decision rules below.
  const knownBlockers=b=>neighbors[b].filter(h=>visited[h]&&world.hole[h]&&!cleared[h]);
  const charge=b=>knownBlockers(b).reduce((s,h)=>s+world.costs[h],0);
  const reveal=b=>{
    assert(!visited[b]&&neighbors[b].some(a=>visited[a]));
    for(const h of knownBlockers(b)){
      cleared[h]=1;clearEvents.push(h);stone+=world.costs[h];holes+=world.holeCounts[h];
      const deficit=Math.max(0,world.costs[h]-(1000+500*distance(h)));localShortfall+=deficit;if(deficit)importMaps++;
      stoneBalance-=world.costs[h];minStoneBalance=Math.min(minStoneBalance,stoneBalance);
    }
    assert(!knownBlockers(b).length);visited[b]=1;steps.push(b);
    if(!corners.includes(b))stoneBalance+=1000+500*distance(b);
    // Hidden terrain and encounter identities become available only here.
    if(lake===undefined&&lakeSet.has(b))lake=b;
    if(dwarf===undefined&&dwarfSet.has(b))dwarf=b;
    if(golemSet.has(b))foundGolems.add(b);
  };
  const search=(done,cap,forceNear=false)=>{
    for(let guard=0;!done();guard++){
      assert(guard<N);
      const frontier=shuffle(Array.from({length:N},(_,i)=>i).filter(i=>!visited[i]&&distance(i)<=cap&&neighbors[i].some(n=>visited[n])),random);
      assert(frontier.length);
      // Direct search examines nearer maps first. Adaptive search avoids known
      // bills before paying, with no estimate of an unrevealed cell's contents.
      frontier.sort((a,b)=>adaptive&&!forceNear?charge(a)-charge(b)||distance(a)-distance(b):distance(a)-distance(b)||charge(a)-charge(b));
      reveal(frontier[0]);
    }
  };
  search(()=>lake!==undefined,3);targets.push(lake);
  search(()=>dwarf!==undefined,6);targets.push(dwarf);
  for(const target of shuffle(corners,random)) {
    if(!adaptive){
      let a=HOME;
      while(a!==target){const choices=neighbors[a].filter(b=>distance(b,target)===distance(a,target)-1),b=choices[Math.floor(random()*choices.length)];if(!visited[b])reveal(b);a=b;}
    } else {
      for(let guard=0;!visited[target];guard++) {
        assert(guard<N);
        const labels=Array(N),previous=new Int16Array(N).fill(-1);labels[HOME]=[0,0];
        const cells=shuffle(Array.from({length:N},(_,i)=>i).filter(i=>distance(i)+distance(i,target)===distance(target)),random).sort((a,b)=>distance(a)-distance(b));
        for(const a of cells)if(labels[a])for(const b of neighbors[a]) {
          if(distance(b)!==distance(a)+1||distance(b,target)!==distance(a,target)-1)continue;
          const next=[labels[a][0]+(visited[b]?0:charge(b)),labels[a][1]+Number(!visited[b])];
          if(!labels[b]||next[0]<labels[b][0]||next[0]===labels[b][0]&&next[1]<labels[b][1]){labels[b]=next;previous[b]=a;}
        }
        const path=[];for(let b=target;b!==HOME;b=previous[b]){assert(b>=0);path.push(b);}path.reverse();
        reveal(path.find(b=>!visited[b]));
      }
    }
    assert.equal(reachable(visited,HOME,target),10);targets.push(target);
  }
  // No hidden Golem coordinates guide this search: survey nearer unknown cells.
  if(extended){search(()=>foundGolems.size===4,10,true);targets.push(...foundGolems);}
  // Build a shared network of shortest routes on the now-known map. Trying
  // orders improves sharing; it is not a globally optimal Steiner certificate.
  const ds=new Int16Array(N).fill(-1),queue=[HOME];ds[HOME]=0;
  for(let q=0;q<queue.length;q++)for(const n of neighbors[queue[q]])if(visited[n]&&ds[n]<0){ds[n]=ds[queue[q]]+1;queue.push(n);}
  let roadEdges=Infinity;
  for(let attempt=0;attempt<routeOrders;attempt++) {
    const edges=new Set();
    for(const t of shuffle(targets.slice(1),random)) {
      const costs=Array(N).fill(Infinity),previous=new Int16Array(N).fill(-1);costs[HOME]=0;
      for(const a of queue)for(const b of neighbors[a])if(visited[b]&&ds[b]===ds[a]+1){const cost=costs[a]+Number(!edges.has(edgeKey(a,b)));if(cost<costs[b]){costs[b]=cost;previous[b]=a;}}
      for(let b=t;b!==HOME;b=previous[b]){assert(b>=0);edges.add(edgeKey(b,previous[b]));}
    }
    roadEdges=Math.min(roadEdges,edges.size);
  }
  const band=t=>t<=6?Math.ceil(t/2):Math.min(t-3,6),openedBands=[1,0,0,0,0,0,0],coreCosts=[5,5,0,0,0,0];
  steps.forEach((id,i)=>{const b=band(distance(id));if(i>0){const amount=5+5*Math.floor(openedBands[b]/(b===1?1:2));for(let c=0;c<b;c++)coreCosts[c]+=amount;if(corners.includes(id))coreCosts[5]++;}openedBands[b]++;});
  return {stone,holeMaps:clearEvents.length,holes,localShortfall,importMaps,minimumGrossStoneBalance:minStoneBalance,negativeGrossStonePrefix:Number(minStoneBalance<0),opened:steps.length+1,roadEdges,extraSurveyMaps:steps.length+1-(roadEdges+1),lakeTier:distance(lake),dwarfTier:distance(dwarf),allCorners:1,coreCosts,steps,clearEvents,targets};
}
function summarize(rows) {
  const result={runs:rows.length};
  for(const field of Object.keys(rows[0])) {
    const xs=rows.map(r=>r[field]).filter(v=>typeof v==='number'&&Number.isFinite(v)).sort((a,b)=>a-b);
    if(!xs.length)continue;
    const q=p=>xs[Math.floor((xs.length-1)*p)];
    result[field]={n:xs.length,min:xs[0],p10:q(.1),median:q(.5),p90:q(.9),max:xs.at(-1),mean:xs.reduce((a,b)=>a+b,0)/xs.length};
  }
  if(rows[0].coreCosts)result.coreCosts=rows[0].coreCosts.map((_,i)=>summarize(rows.map(r=>({amount:r.coreCosts[i]}))).amount);
  return result;
}

export { makeWorld, online, ignore, summarize, randomFor, shuffle, distance };

export function createLayoutAnalysisServer() {
  return createServer({root,configFile:false,logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:{ignored:['**/*']}},appType:'custom',plugins:[{name:'analysis-only-layout-export',enforce:'pre',transform(code,id){if(id.split('?')[0].replaceAll('\\','/').endsWith('/src/simulation/worldGeneration.ts'))return code+'\nexport { buildMapLayout as analysisMapLayout };\n';}}]});
}

export async function runAnalysis() {
// Validate critical semantics on handcrafted maps before sampling.
const blank={hole:new Uint8Array(N),costs:new Int32Array(N),holeCounts:new Uint8Array(N),required:corners,golems:[],dwarves:[]};
assert.equal(ignore(blank,1,'near').opened,N);
const homeHole={...blank,hole:new Uint8Array(N)};homeHole.hole[HOME]=1;
assert.equal(ignore(homeHole,1,'near',false,0).opened,1);
const ring={...blank,hole:new Uint8Array(N)};neighbors[HOME].forEach(id=>ring.hole[id]=1);
assert.equal(ignore(ring,1,'near').opened,5);
assert.equal(allocate([1,1,1,1,1],1650)[0],330);
for(let t=1;t<=9;t++)assert.equal(allocate([.75**2,.875**2,1,1.125**2,1.25**2],Math.round(1650*(1+7*(t-1)/8))).reduce((a,b)=>a+b,0),Math.round(1650*(1+7*(t-1)/8)));

const server=await createLayoutAnalysisServer();
try {
  const {analysisMapLayout,generateSector}=await server.ssrLoadModule('/src/simulation/worldGeneration.ts');
  const rows={ignoreNear:[],ignoreRandom:[],noInteractionOracle:[],alternateRule:[],blindRequired:[],oracleRequired:[],roadsRequired:[],blindExtended:[],oracleExtended:[],equalAreaOracle:[],homeDepletionAfterOne:[],onlineDirect:[],onlineAdaptive:[],onlineExtended:[],onlineEqualArea:[]};
  const worlds=[], examples=[];
  for(let i=0;i<count;i++) {
    const seed=(0x4e4f4445+Math.imul(i,0x9e3779b9))>>>0,layout=analysisMapLayout(seed,5,true,11),world=makeWorld(seed,layout);
    if(i<3)for(const id of [49,59,61,71,62,0,world.golems[0],...Array.from(world.hole).flatMap((v,id)=>v?[id]:[]).slice(0,4)]) {
      const [x,y]=xy(id),actual=generateSector(x,y,seed,0,[],5,2,11,1);
      assert.equal(actual.nodes.some(node=>node.kind==='big-hole'),Boolean(world.hole[id]),`Actual terrain mismatch at ${key(id)}, seed ${seed}`);
    }
    worlds.push({seed,holeMaps:world.hole.reduce((a,b)=>a+b,0),fullClearStone:world.costs.reduce((a,b)=>a+b,0),fullClearHoles:world.holeCounts.reduce((a,b)=>a+b,0)});
    rows.noInteractionOracle.push(noInteractionOracle(world));
    for(let rep=0;rep<4;rep++) {
      const s=seed^Math.imul(rep+1,0x632be5ab);
      rows.ignoreNear.push(ignore(world,s,'near'));
      rows.ignoreRandom.push(ignore(world,s,'random'));
      rows.alternateRule.push(ignore(world,s,'near',true));
      rows.homeDepletionAfterOne.push(ignore(world,s,'near',false,1));
      rows.blindRequired.push(corridor(world,world.required,s,false));
      rows.blindExtended.push(corridor(world,world.extended,s,false));
      rows.onlineDirect.push(online(world,s,false));
      rows.onlineAdaptive.push(online(world,s,true));
      rows.onlineExtended.push(online(world,s,true,true));
    }
    const oracle=bestOracle(world,world.required,seed);
    rows.oracleRequired.push(oracle);
    rows.roadsRequired.push(bestOracle(world,world.required,seed,'roads'));
    rows.oracleExtended.push(bestOracle(world,world.extended,seed));
    rows.equalAreaOracle.push(bestOracle(makeWorld(seed,layout,true),world.required,seed));
    rows.onlineEqualArea.push(online(makeWorld(seed,layout,true),seed^0x632be5ab,true));
    if(i<3)examples.push({seed,holes:Array.from(world.hole).flatMap((v,id)=>v?[{id:key(id),cost:world.costs[id],holes:world.holeCounts[id]}]:[]),required:world.required.map(key),oracle,ignore:rows.ignoreNear.at(-1),onlineDirect:rows.onlineDirect.at(-1),onlineAdaptive:rows.onlineAdaptive.at(-1)});
    if((i+1)%250===0)console.log(`Simulated ${i+1}/${count} world seeds`);
  }
  // No-interaction order variability is measured within each common seed.
  const orderSpread=[];for(let i=0;i<count;i++){const r=rows.ignoreNear.slice(i*4,i*4+4),adaptive=rows.onlineAdaptive.slice(i*4,i*4+4);orderSpread.push({openedRange:Math.max(...r.map(x=>x.opened))-Math.min(...r.map(x=>x.opened)),cornerRange:Math.max(...r.map(x=>x.cornerCount))-Math.min(...r.map(x=>x.cornerCount)),adaptiveStoneRange:Math.max(...adaptive.map(x=>x.stone))-Math.min(...adaptive.map(x=>x.stone))});}
  const paired=rows.onlineAdaptive.map((r,i)=>({stoneSaved:rows.onlineDirect[i].stone-r.stone,moreMaps:r.opened-rows.onlineDirect[i].opened,moreRoads:r.roadEdges-rows.onlineDirect[i].roadEdges,cheaper:Number(r.stone<rows.onlineDirect[i].stone),moreExpensive:Number(r.stone>rows.onlineDirect[i].stone)}));
  const costs=rows.oracleRequired.map(r=>r.stone), p50=[...costs].sort((a,b)=>a-b)[Math.floor(count/2)];
  const medianIndex=costs.indexOf(p50),medianSeed=worlds[medianIndex].seed;
  const source=await readFile(resolve(root,'src/simulation/worldGeneration.ts'));
  const result={schema:2,seeds:count,ordersPerSeed:4,oracleOrdersTried:24,sourceSha256:createHash('sha256').update(source).digest('hex'),assumptions:['Standard 11x11 base-game layout version 2, Golems at tier 5; no mods.','Actual world-layout selection loaded from game source; private export appended only in the in-memory analysis module.','Proposed five-candidate pool: uniform count 1..5, uniform subset, area-weighted integer bills. Radius weights .75,.875,1,1.125,1.25 are an analysis assumption; equal-area sensitivity also run.','Every newly opened map is visited immediately. Discovered unfinished hole maps block unexplored orthogonal neighbors from all approaches. Existing explored maps and Roads remain available.','No resource depletion in the main experiment; one explicit Home depletion stress case is separate.','Road edges are adjacent-map links, not local cables. Clearing does not remove map nodes.','PRIMARY online policies know only revealed terrain and costs. They search for a Lake at reachable tiers <=3 and a Dwarven source at tiers <=6, then approach the four known corner coordinates. They do not know encounter locations, hidden bills or the seed layout. Extended play searches nearer unknown cells until finding all four Golems. Endpoint access does not prove factory completion.','Direct online play searches nearer frontier first, then commits to random monotone corner routes. Adaptive online play avoids known clearing bills during source search, then replans shortest corner paths using revealed blocker costs, with unknown terrain priced at zero. Both clear all discovered neighboring blockers before each newly opened cell.','After surveying, both online policies share shortest routes on the revealed map, trying 16 terminal orders. Every corner route achieves its exact 10-hop Manhattan lower bound. Total shared network optimization is heuristic, not a certified global Steiner optimum.','SUPPLEMENTARY oracle/legacy corridor policies know source locations, and oracle also knows hidden terrain/budgets; excluded from the main recommendation after the user specified no distribution knowledge.','Affordability, factory production, local routing, travel/UI overhead, Core unlock timing and wall-clock completion are not simulated. No save injection or accelerated game run.','Gross Stone availability assumes every opened ordinary map reserve is accessible, with no factory consumption or mining loss. It is an optimistic accounting screen only; guarded camp access and infinite Golem production are excluded.','Core item bags assume one initial Exploration purchase (5 Simple + 5 Basic), one free destination and subsequent current destination quotes; omitted from progression timing.'],worlds:summarize(worlds),policies:Object.fromEntries(Object.entries(rows).map(([name,r])=>[name,summarize(r)])),withinSeedOrderSpread:summarize(orderSpread),pairedOnlineComparison:summarize(paired),examples,medianOracle:{seed:medianSeed,...rows.oracleRequired[medianIndex]},rawWorlds:worlds};
  await mkdir(output,{recursive:true});await writeFile(resolve(output,'results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({seeds:count,worlds:result.worlds,policies:result.policies,orderSpread:result.withinSeedOrderSpread,medianOracle:result.medianOracle},null,2));
} finally {await server.close();}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runAnalysis();
