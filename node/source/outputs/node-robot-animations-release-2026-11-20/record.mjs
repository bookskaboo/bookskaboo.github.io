import assert from 'node:assert/strict';
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const folder='outputs/node-robot-animations-release-2026-11-20',source=folder+'/repo/node/source';
const receipt=JSON.parse(readFileSync(folder+'/publication-receipt.json','utf8'));
const preflight=JSON.parse(readFileSync(folder+'/preflight-report.json','utf8'));
assert.equal(receipt.pagesRun.conclusion,'success');assert.equal(receipt.matchedRuntimeFiles,11);
const historyPath='docs/changelog/entries.json',current=JSON.parse(readFileSync(historyPath,'utf8'));
const id='NODE-'+String(Math.max(...current.entries.map(e=>Number(e.id.slice(5))))+1).padStart(4,'0'),releaseId=receipt.commit.slice(0,7);
const entry={id,date:'2026-11-20',dateBasis:'chat',kind:'added',state:'implemented',delivery:'published',publishedBy:releaseId,
 title:'Publish robot upgrade assembly and Core-processing flashes',
 summary:'Release all seven gradual robot transformations. Upcoming parts flash during actual Core-set processing and become solid immediately when consumed.',
 details:[
  `Fast-forward live main from ${receipt.base} to ${receipt.commit}, changing only node/. Publish five runtime source changes and matching /node/ build. Preserve all ${preflight.previousRuntimeAssetsRetained} previous runtime assets and place the ten new assets in assets/robot-upgrades-20261120.`,
  'Permanent assembly follows paid character-upgrade contributions, including parked payments. Active, ready Research Center cycles preview the next synchronized set by alternating only affected sections once per 1.2 seconds. Consuming that set commits its hardware immediately. Disabled/paused/waiting labs, game/research pause and unrelated projects suppress the unpaid preview. Reduced motion hides the unpaid flash. Keep existing finished artwork, portrait bounds, saved progress, research bills and simulation rules.',
  'Keep the latest published 35% readouts/overview renderer and existing Road behavior. A concurrent unfinished Road reanchoring edit was detected during the snapshot; restore only the release copy of engine.ts from the current live base, then rebuild and rerun the isolated suite. Preserve the workspace Road work untouched. Author controls and proposal documents remain separate from main gameplay.',
  'Publish the matching author animation gallery and current system/style references as source, with prior 81-check processing-preview evidence. Only the final processing-flash version is released; the superseded local 620 ms post-payment animation remains a historical record.'
 ],topics:['Research','Interface','Art','Publishing','Documentation'],sources:['local-code'],
 evidence:['src/ui/upgrades/RobotPortrait.tsx','src/ui/upgrades/robotAssembly.ts','src/ui/upgrades/robotArt.ts','src/ui/ResearchPanel.tsx','src/styles/upgrades.css','previews/status-page/robotAssembly.test.tsx','docs/systems/research.md','outputs/robot-upgrade-processing/verification.json','outputs/robot-upgrade-animations/art-comparison.json',folder+'/publication-receipt.json',folder+'/preflight-report.json',folder+'/build-manifest.json',folder+'/source-manifest.json',folder+'/workspace-tests.log',folder+'/candidate-tests.log',folder+'/candidate-build.log'],
 validation:`Workspace passed ${preflight.tests.workspace} tests with two existing skips and its site build. The final frozen release passed ${preflight.tests.candidate} tests with one existing skip, site build, six system catalogs, links across 39 system documents and all six history checks. Repeated isolated tests/build after excluding the concurrent Road edit. Preflight verified exactly five runtime source changes, all ${preflight.sourceFiles} source hashes, committed runtime/source build bytes, a clean fast-forward, only node/ changes and every old runtime asset blob unchanged. GitHub Pages run ${receipt.pagesRun.id} succeeded; normal live HTML and all ten new runtime assets matched SHA-256, plus ten preceding-build assets. Earlier browser evidence covers all seven preview transforms, complementary flash states, paused retained hardware, immediate solid completion, desktop/mobile and keyboard controls; all eight static SVGs match the previously published art. No new sustained campaign run, grants, save injection, existing player-tab reload or operating-system reduced-motion toggle. Existing large-bundle warning remains.`
};
const release={id:releaseId,date:'2026-11-20',title:'Core-funded robot assembly and processing flashes',commit:receipt.commit,url:'https://github.com/bookskaboo/bookskaboo.github.io/commit/'+receipt.commit,notes:`Only node/ changed. Five runtime files add robot assembly and pending Core-processing flashes; retain latest live renderer/Road behavior and all ${preflight.previousRuntimeAssetsRetained} previous assets. Pages succeeded; normal live HTML and all ten new assets matched SHA-256, plus ten preceding assets. No save fields or research timing changes.`};
for(const root of ['.',source]){
 const target=path.join(root,historyPath),history=JSON.parse(readFileSync(target,'utf8'));
 assert.ok(!history.entries.some(e=>e.id===id));assert.ok(!history.releases.some(r=>r.id===releaseId));
 const record=history.entries.find(e=>e.id==='NODE-0733');assert.equal(record.state,'implemented');record.delivery='published';record.publishedBy=releaseId;
 history.entries.push(entry);history.releases.unshift(release);writeFileSync(target,JSON.stringify(history,null,2)+'\n');
}
const evidence=path.join(source,folder);mkdirSync(evidence,{recursive:true});
for(const file of ['publication-receipt.json','preflight-report.json'])cpSync(folder+'/'+file,path.join(evidence,file));
writeFileSync(folder+'/publication-history-id.txt',id+'\n');console.log(JSON.stringify({id,releaseId,commit:receipt.commit}));
