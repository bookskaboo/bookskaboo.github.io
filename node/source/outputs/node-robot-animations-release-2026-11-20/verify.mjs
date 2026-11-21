import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='outputs/node-robot-animations-release-2026-11-20';
const preflight=JSON.parse(readFileSync(folder+'/preflight-report.json','utf8'));
const build=JSON.parse(readFileSync(folder+'/build-manifest.json','utf8'));
const previous=JSON.parse(readFileSync('outputs/node-readouts-35-release-2026-11-20/publication-receipt.json','utf8'));
const url='https://bookskaboo.github.io/node/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=async href=>(await promisify(execFile)('curl.exe',['-fsSL','--max-time','25','-H','User-Agent: NODE-release-verification',href],{encoding:'buffer',maxBuffer:20e6})).stdout;
const deploymentCommit=process.argv[2]??preflight.commit,suffix=process.argv[2]?'metadata-':'';
const response=JSON.parse((await bytes('https://api.github.com/repos/bookskaboo/bookskaboo.github.io/actions/runs?per_page=20&verification='+Date.now())).toString());
const run=response.workflow_runs?.find(run=>run.head_sha===deploymentCommit&&/pages/i.test(run.name));
writeFileSync(folder+'/'+suffix+'pages-status.json',JSON.stringify(run??response,null,2)+'\n');
if(run?.status==='completed'&&run.conclusion!=='success')throw Error('Pages failed: '+run.conclusion);
const html=await bytes(url),expected=build.files.find(f=>f.file==='index.html');
if(run?.status!=='completed'||sha(html)!==expected.sha256){
 console.log(JSON.stringify({status:'waiting',expectedCommit:deploymentCommit,pagesStatus:run?.status??'not listed',liveScript:html.toString().match(/src="([^"]+\.js)"/)?.[1]}));process.exitCode=2;
}else{
 const required=new Map();
 for(const{file,sha256}of[...build.files,...previous.files.filter(f=>f.file!=='index.html')]){
  if(required.has(file))assert.equal(required.get(file),sha256);required.set(file,sha256);
 }
 required.delete('index.html');
 await Promise.all([...required].map(async([file,expected])=>assert.equal(sha(await bytes(url+file)),expected,'Live SHA-256 '+file)));
 const receipt={commit:preflight.commit,deploymentCommit,base:preflight.base,url,verifiedAt:new Date().toISOString(),pagesRun:{id:run.id,url:run.html_url,status:run.status,conclusion:run.conclusion},matchedRuntimeFiles:build.files.length,previousAssetsVerified:previous.files.length-1,files:build.files};
 writeFileSync(folder+'/'+suffix+'publication-receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:'verified',...receipt,files:undefined}));
}
