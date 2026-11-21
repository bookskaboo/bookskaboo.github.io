import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const folder=path.resolve('outputs/node-upgrades-release-2026-11-20'),repo=path.join(folder,'repo'),source=path.join(repo,'node/source');
const git=(...args)=>execFileSync('git',['-C',repo,'-c','core.safecrlf=false',...args],{maxBuffer:128e6});
const ref=(...args)=>git(...args).toString().trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(readFileSync(path.join(folder,'source-manifest.json'),'utf8'));
assert.equal(ref('rev-parse','HEAD'),manifest.base);assert.equal(ref('rev-parse','origin/main'),manifest.base);
for(const entry of manifest.sourceFiles)assert.equal(hash(readFileSync(path.join(source,'src',entry.file))),entry.sha256,entry.file+' changed after snapshot');
const walk=(root,prefix='')=>readdirSync(root,{withFileTypes:true}).flatMap(e=>{const f=path.posix.join(prefix,e.name);return e.isDirectory()?walk(path.join(root,e.name),f):[f];});
const passed=file=>{const text=readFileSync(path.join(folder,file),'utf8');assert.ok(!/Tests\s+\d+ failed/.test(text));const n=text.match(/Tests\s+(\d+) passed/);assert.ok(n,file);return Number(n[1]);};
const tests={workspace:passed('workspace-tests.log'),candidate:passed('candidate-tests.log')};
for(const file of ['workspace-build.log','candidate-build.log'])assert.match(readFileSync(path.join(folder,file),'utf8'),/built in/);
assert.match(readFileSync(path.join(folder,'candidate-docs.log'),'utf8'),/Verified 6 system catalogs/);
assert.match(readFileSync(path.join(folder,'candidate-changelog.log'),'utf8'),/pass 6/);
const dist=path.join(source,'dist'),files=walk(dist).map(file=>({file,sha256:hash(readFileSync(path.join(dist,file)))}));
assert.equal(files.length,11);assert.ok(files.filter(f=>f.file!=='index.html').every(f=>f.file.startsWith('assets/upgrades-20261120/')));
cpSync(dist,path.join(repo,'node'),{recursive:true});
for(const file of ref('diff','--name-only','--diff-filter=D').split('\n').filter(Boolean)){
  assert.ok(file.startsWith('node/source/dist/'),file);
  const target=path.resolve(repo,file);assert.ok(target.startsWith(source+path.sep));mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,git('show',manifest.base+':'+file));
}
writeFileSync(path.join(folder,'build-manifest.json'),JSON.stringify({base:manifest.base,files,tests,scope:manifest.scope},null,2)+'\n');
// Preserve the exact tested snapshot and verification inputs with its published source.
const evidence=path.join(source,'outputs/node-upgrades-release-2026-11-20');mkdirSync(evidence,{recursive:true});
for(const file of ['source-manifest.json','build-manifest.json','workspace-tests.log','workspace-build.log','candidate-tests.log','candidate-build.log','candidate-docs.log','candidate-changelog.log'])cpSync(path.join(folder,file),path.join(evidence,file));
git('add','-A','--','node');
git('add','-f','--',...files.map(f=>'node/source/dist/'+f.file),...walk(evidence).filter(f=>f.endsWith('.log')).map(f=>'node/source/outputs/node-upgrades-release-2026-11-20/'+f));
const changes=ref('diff','--cached','--name-only').split('\n').filter(Boolean);
assert.ok(changes.length&&changes.every(f=>f.startsWith('node/')));assert.equal(ref('diff','--cached','--name-only','--diff-filter=D'),'');
git('-c','user.name=Codex','-c','user.email=codex@users.noreply.github.com','-c','commit.gpgsign=false','commit','-m','Publish Upgrades character progression and queued research');
const commit=ref('rev-parse','HEAD');assert.equal(ref('rev-parse',commit+'^'),manifest.base);
for(const{file,sha256}of files)for(const prefix of ['node/','node/source/dist/'])assert.equal(hash(git('cat-file','blob',commit+':'+prefix+file)),sha256,prefix+file);
for(const entry of manifest.sourceFiles)assert.equal(hash(Buffer.from(git('cat-file','blob',commit+':node/source/src/'+entry.file).toString().replaceAll('\r\n','\n'))),entry.normalizedSha256,entry.file);
let retained=0;
for(const line of ref('ls-tree','-r',manifest.base,'--','node/assets').split('\n').filter(Boolean)){
 const [meta,file]=line.split('\t'),blob=meta.split(' ')[2];assert.equal(ref('rev-parse',commit+':'+file),blob,file);retained++;
}
assert.equal(ref('status','--porcelain'),'');
const report={commit,base:manifest.base,destination:'https://github.com/bookskaboo/bookskaboo.github.io.git refs/heads/main',onlyNodeChanged:true,canFastForward:true,worktreeClean:true,previousRuntimeAssetsRetained:retained,runtimeFiles:files.length,sourceFiles:manifest.sourceFiles.length,changedFiles:changes.length,tests,checkedAt:new Date().toISOString()};
writeFileSync(path.join(folder,'preflight-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
