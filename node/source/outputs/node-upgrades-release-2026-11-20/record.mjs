import assert from 'node:assert/strict';
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const folder='outputs/node-upgrades-release-2026-11-20',source=folder+'/repo/node/source';
const receipt=JSON.parse(readFileSync(folder+'/publication-receipt.json','utf8'));
const preflight=JSON.parse(readFileSync(folder+'/preflight-report.json','utf8'));
assert.equal(receipt.pagesRun.conclusion,'success');assert.equal(receipt.matchedRuntimeFiles,11);
const historyPath='docs/changelog/entries.json',current=JSON.parse(readFileSync(historyPath,'utf8'));
const id='NODE-'+String(Math.max(...current.entries.map(e=>Number(e.id.slice(5))))+1).padStart(4,'0'),releaseId=receipt.commit.slice(0,7);
const entry={id,date:'2026-11-20',dateBasis:'chat',kind:'added',state:'implemented',delivery:'published',publishedBy:releaseId,
 title:'Publish the new Upgrades modal and character progression',
 summary:'Release the reviewed robot Upgrades modal, sequential Core-funded character promotions, four-project research queue, saved hint history and banked Map Points to the live game.',
 details:[
  `Fast-forward live main from ${receipt.base} to ${receipt.commit}, changing only node/. Publish the frozen current game source with its matching /node/ production build. Preserve all ${preflight.previousRuntimeAssetsRetained} older runtime assets, using a distinct assets/upgrades-20261120 directory for the ten new assets.`,
  'Unmodded factories open Upgrades with Q or the toolbar. Character upgrades take priority while enabled, preserve queued payments and unlock the next Core recipe. Retain earned recipe access, old contributions, paused research, learned hints and the exact bill of an old paid map purchase; completion banks a Map Point. Applied-mod factories retain their existing Research screen while new progression support is deferred.',
  'The current source snapshot also includes previously implemented Map Node ground terrain for new factories, corner discovery emphasis, retired Deep Hole exploration gating, reviewed Road controls and zoom-preserving arrival, camp presentation and managed refill links, developer input fixes and tutorial prompt suppression. Existing saved terrain/layout choices remain preserved. Author study pages remain separate from the main game build. Power-up/landmark proposals remain design-only; no proposed landmark gameplay is implemented by this release.',
  'Verify the normal live URL and every new runtime asset after GitHub Pages succeeds. Open the actual live game through normal UI, pause it and confirm the initial portrait, assignment hint, available Simple upgrade, required-Core badge, exclusive research views, queue controls and four empty slots. Preserve existing game tabs and saves.'
 ],topics:['Research','Interface','Tutorials','Saves','World map','Publishing'],sources:['local-code'],
 evidence:['src/ui/ResearchPanel.tsx','src/content/botUpgrades.ts','src/simulation/upgradesMigration.ts','src/ui/UpgradesIntegration.test.tsx','docs/systems/research.md','docs/systems/saves-and-compatibility.md','outputs/upgrades-integration/verification.json',folder+'/publication-receipt.json',folder+'/preflight-report.json',folder+'/build-manifest.json',folder+'/source-manifest.json',folder+'/workspace-tests.log',folder+'/candidate-tests.log',folder+'/candidate-build.log'],
 validation:`Workspace: ${preflight.tests.workspace} tests passed, two existing skips; site build passed. Frozen release: ${preflight.tests.candidate} tests passed, one existing skip; site build, six current catalogs, links across 39 system documents and all six history checks passed. Corrected one missing exported hint-review link in the source snapshot and reran the documentation check successfully. Preflight verified all 340 source files against the frozen manifest, matching committed build/source assets, only node/ changes, clean fast-forward and all 137 previous runtime asset blobs unchanged. Pages run ${receipt.pagesRun.id} succeeded; SHA-256 matched normal live HTML, all ten new assets and ten preceding-build assets. Live Upgrades UI rendered correctly and was paused. Earlier integration evidence covers all 19 normal-UI Basics stages, save/load, responsive layouts and keyboard navigation. No new sustained balance run, grants, save injection or reload of an existing player factory. Existing bundle-size warning remains.`
};
const release={id:releaseId,date:'2026-11-20',title:'Upgrades character progression and queued research',commit:receipt.commit,url:'https://github.com/bookskaboo/bookskaboo.github.io/commit/'+receipt.commit,notes:'Current tested game snapshot, changes only node/. Pages succeeded; normal HTML and all ten new assets verified by SHA-256, plus ten preceding assets. Retain all 137 older runtime assets. Earned unmodded research migrates; applied-mod factories retain their Research screen. Author proposals remain separate.'};
const implemented=['NODE-0620','NODE-0622','NODE-0624','NODE-0626','NODE-0630','NODE-0668','NODE-0671','NODE-0672','NODE-0674','NODE-0676','NODE-0678','NODE-0683','NODE-0685','NODE-0687','NODE-0689','NODE-0693','NODE-0695','NODE-0697','NODE-0698','NODE-0702','NODE-0705','NODE-0706','NODE-0710','NODE-0712','NODE-0715'];
for(const root of ['.',source]){
 const target=path.join(root,historyPath),history=JSON.parse(readFileSync(target,'utf8'));
 assert.ok(!history.entries.some(e=>e.id===id));assert.ok(!history.releases.some(r=>r.id===releaseId));
 for(const previous of implemented){const record=history.entries.find(e=>e.id===previous);assert.ok(record,previous);assert.equal(record.state,'implemented',previous);record.delivery='published';record.publishedBy=releaseId;}
 history.entries.push(entry);history.releases.unshift(release);writeFileSync(target,JSON.stringify(history,null,2)+'\n');
}
const evidence=path.join(source,folder);mkdirSync(evidence,{recursive:true});
for(const file of ['publication-receipt.json','preflight-report.json'])cpSync(folder+'/'+file,path.join(evidence,file));
writeFileSync(folder+'/publication-history-id.txt',id+'\n');console.log(JSON.stringify({id,releaseId,commit:receipt.commit}));
