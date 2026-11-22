import{readFileSync,writeFileSync}from'node:fs';
const out='outputs/transport-profile',report=JSON.parse(readFileSync(out+'/results.json','utf8'));
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
const category=path=>{
  if(!path.includes('tick'))return 'outside tick';
  if(path.includes('applyExpansionRescue'))return 'recovery';
  if(path.includes('obstructedConnections'))return 'obstruction checking';
  if(path.includes('roadMaterialState'))return 'Road material tracing';
  if(path.includes('reconcileQueue'))return 'queue reconciliation';
  if(path.includes('sector')||path.includes('target')||path.includes('indexTransfer'))return 'lookup indexes';
  if(path.includes('logisticsRoute'))return 'logistics route traversal';
  return 'other engine work';
};
const summary=[];
for(const id of ['fresh','shiny','late','active','blocked','idle']){
  const runs=report.results.filter(r=>r.id===id),baseline=runs.filter(r=>r.mode==='baseline'),timed=runs.filter(r=>r.mode==='attribution');
  const metrics={};for(const key of Object.keys(timed[0].metrics))metrics[key]={calls:timed[0].metrics[key].calls,selfMs:median(timed.map(r=>r.metrics[key].selfMs)),inclusiveMs:median(timed.map(r=>r.metrics[key].inclusiveMs)),queueUnits:timed[0].metrics[key].queueUnits};
  const allocation=JSON.parse(readFileSync(`${out}/${id}-0.heapprofile.json`,'utf8')),allocByCategory={},allocFrames=[];
  function visit(n,path=[]){const next=[...path,n.callFrame.functionName||'(anonymous)'];const owner=category(next);allocByCategory[owner]=(allocByCategory[owner]??0)+n.selfSize;if(n.selfSize)allocFrames.push({function:n.callFrame.functionName,bytes:n.selfSize,path:next});for(const c of n.children??[])visit(c,next);}
  visit(allocation.head);
  const cpu=JSON.parse(readFileSync(`${out}/${id}-0.cpuprofile.json`,'utf8')),nodes=new Map(cpu.nodes.map(n=>[n.id,n])),parents=new Map();
  for(const n of cpu.nodes)for(const child of n.children??[])parents.set(child,n.id);
  const cpuByCategory={},cpuFrames=[];for(const n of cpu.nodes){if(!n.hitCount)continue;const path=[];let current=n;while(current){path.unshift(current.callFrame.functionName||'(anonymous)');current=nodes.get(parents.get(current.id));}const owner=category(path);cpuByCategory[owner]=(cpuByCategory[owner]??0)+n.hitCount;cpuFrames.push({function:n.callFrame.functionName,samples:n.hitCount,path});}
  const baselineMs=baseline.map(r=>r.timing.totalMs);
  const everySecond=baseline.map(r=>({onSecond:r.tickSeries.filter((_,i)=>(i+1)%10===0),other:r.tickSeries.filter((_,i)=>(i+1)%10!==0)})).map(r=>({onSecondMedianMs:median(r.onSecond),otherMedianMs:median(r.other)}));
  summary.push({id,counts:baseline[0].counts,activity:baseline[0].activity,checks:baseline[0].checks,
    baseline:{medianRangeMs:[Math.min(...baseline.map(r=>r.timing.medianMs)),Math.max(...baseline.map(r=>r.timing.medianMs))],p95RangeMs:[Math.min(...baseline.map(r=>r.timing.p95Ms)),Math.max(...baseline.map(r=>r.timing.p95Ms))],totalMedianMs:median(baselineMs),maxMs:Math.max(...baseline.map(r=>r.timing.maxMs)),everySecond},
    attribution:{totalMedianMs:median(timed.map(r=>r.timing.totalMs)),metrics},sampledAllocation:{byCategoryBytes:allocByCategory,topFrames:allocFrames.sort((a,b)=>b.bytes-a.bytes).slice(0,20)},sampledCpu:{byCategorySamples:cpuByCategory,topFrames:cpuFrames.sort((a,b)=>b.samples-a.samples).slice(0,20)}});
}
writeFileSync(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary.map(r=>({id:r.id,counts:r.counts,baseline:r.baseline,allocationMiB:Object.fromEntries(Object.entries(r.sampledAllocation.byCategoryBytes).map(([k,v])=>[k,+(v/1048576).toFixed(2)])),cpu:r.sampledCpu.byCategorySamples,attributionMs:Object.fromEntries(Object.entries(r.attribution.metrics).filter(([k])=>/reconcileQueue|roadMaterialState|obstructedConnections|:sector|nextExpansionShortages/.test(k)).map(([k,v])=>[k,{...v,selfMs:+v.selfMs.toFixed(2),inclusiveMs:+v.inclusiveMs.toFixed(2)}]))})),null,2));
