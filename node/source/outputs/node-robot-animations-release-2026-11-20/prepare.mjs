import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync,symlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const folder=path.resolve('outputs/node-robot-animations-release-2026-11-20'),repo=path.join(folder,'repo'),source=path.join(repo,'node/source');
const git=(...args)=>execFileSync('git',['-C',repo,...args],{maxBuffer:64e6}).toString().trim();
assert.equal(git('status','--porcelain'),'');
assert.equal(git('remote','get-url','origin'),'https://github.com/bookskaboo/bookskaboo.github.io.git');
const base=git('rev-parse','HEAD');assert.equal(base,git('rev-parse','origin/main'));
const roots=['src','docs','previews','scripts'];
const rootFiles=['.gitattributes','.gitignore','AGENTS.md','CHANGELOG.md','index.html','package-lock.json','package.json','README.md','tsconfig.app.json','tsconfig.json','tsconfig.node.json','vite.config.ts','vitest.config.ts'];
for(const file of [...roots,...rootFiles])cpSync(file,path.join(source,file),{recursive:true});
// Keep concurrent unfinished Road edits out of this animation release.
writeFileSync(path.join(source,'src/simulation/engine.ts'),execFileSync('git',['-C',repo,'show',base+':node/source/src/simulation/engine.ts']));
// Follow explicit documentation/evidence paths without copying nested release repositories.
const history=JSON.parse(readFileSync('docs/changelog/entries.json','utf8'));
const evidence=new Set(history.entries.flatMap(e=>e.evidence??[]).filter(p=>p.startsWith('outputs/')&&existsSync(p)));
evidence.add('outputs/upgrades-integration/verification.json');
evidence.add('outputs/robot-upgrade-processing/verification.json');
for(const file of evidence){
  if(file.includes('/repo/')||readdirSafe(file))continue;
  mkdirSync(path.dirname(path.join(source,file)),{recursive:true});
  cpSync(file,path.join(source,file));
}
function readdirSafe(file){try{readdirSync(file);return true;}catch{return false;}}
const walk=(root,prefix='')=>readdirSync(root,{withFileTypes:true}).flatMap(e=>{const f=path.posix.join(prefix,e.name);return e.isDirectory()?walk(path.join(root,e.name),f):[f];});
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles=walk(path.join(source,'src')).map(file=>({file,sha256:hash(readFileSync(path.join(source,'src',file))),normalizedSha256:hash(Buffer.from(readFileSync(path.join(source,'src',file),'utf8').replaceAll('\r\n','\n')))}));
const sourceHistory=JSON.parse(git('show',base+':node/source/docs/changelog/entries.json'));
const existing=new Map(sourceHistory.entries.map(e=>[e.id,e]));
const newImplemented=history.entries.filter(e=>e.state==='implemented'&&e.delivery==='local'&&(!existing.has(e.id)||existing.get(e.id).delivery!=='published')).map(e=>({id:e.id,title:e.title,evidence:e.evidence??[]}));
writeFileSync(path.join(folder,'source-manifest.json'),JSON.stringify({base,scope:'Five runtime files add paid robot assembly and processing flashes. Preserve the latest live renderer and Road behavior; exclude concurrent unfinished Road reanchoring. Author previews remain separate from the main build.',sourceFiles,newImplemented,runtimeOverlay:["src/styles/upgrades.css","src/ui/ResearchPanel.tsx","src/ui/upgrades/robotArt.ts","src/ui/upgrades/robotAssembly.ts","src/ui/upgrades/RobotPortrait.tsx"]},null,2)+'\n');
console.log(JSON.stringify({base,sourceFiles:sourceFiles.length,evidence:evidence.size,newImplemented:newImplemented.filter(e=>Number(e.id.slice(5))>=610).map(e=>({id:e.id,title:e.title}))}));
