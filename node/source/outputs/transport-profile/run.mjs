import {readFileSync,writeFileSync,readdirSync}from'node:fs';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import{cpus}from'node:os';
import assert from'node:assert/strict';
const out='outputs/transport-profile',cases=['fresh','shiny','late','active','blocked','idle'];
const files={};const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else files[p]=hash(p);}}
walk('src');for(const p of ['outputs/tribute-first-playtest-2026-11-12/10-tribute-first-checkpoint.json','outputs/live-map-pricing-playtest-2026-11-15/10-final-checkpoint.json'])files[p]=hash(p);
writeFileSync(out+'/source-fingerprints.json',JSON.stringify(files,null,2));
const results=[];
for(const id of cases){
  for(const mode of ['baseline','attribution','cpu','allocation']){
    const repeats=mode==='baseline'||mode==='attribution'?3:1;
    for(let trial=0;trial<repeats;trial++){
      const bundle=mode==='attribution'?'instrumented':'baseline';
      const r=spawnSync(process.execPath,[out+'/'+bundle+'/worker.mjs',id,mode,String(trial)],{encoding:'utf8',timeout:60000});
      assert.equal(r.status,0,`${id}/${mode}: ${r.stderr}`);const data=JSON.parse(r.stdout);results.push(data);
      process.stdout.write(`${id}/${mode}/${trial}: median ${data.timing.medianMs.toFixed(3)} ms\n`);
    }
  }
  const all=results.filter(r=>r.id===id);assert.ok(all.every(r=>r.finalDigest===all[0].finalDigest),id+' profiler changed outcome');
  writeFileSync(out+'/results-partial.json',JSON.stringify(results,null,2));
}
const changed=Object.keys(files).filter(p=>hash(p)!==files[p]);assert.deepEqual(changed,[]);
writeFileSync(out+'/results.json',JSON.stringify({date:new Date().toISOString(),runtime:process.version,cpu:cpus()[0]?.model,platform:process.platform,sourceAndArchiveFiles:Object.keys(files).length,unchanged:true,matchingBaselineAndProfiledStates:true,results},null,2)+'\n');
