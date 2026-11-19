import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const folder = 'outputs/node-grid-contact-release-2026-11-18';
const preflight = JSON.parse(readFileSync(folder + '/preflight-report.json', 'utf8'));
const manifest = JSON.parse(readFileSync(folder + '/build-manifest.json', 'utf8'));
const previous = JSON.parse(readFileSync('outputs/node-research-tutorial-release-2026-11-18/publication-receipt.json', 'utf8'));
const url = 'https://bookskaboo.github.io/node/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = async href => (await promisify(execFile)('curl.exe', ['-fsSL', '--max-time', '25', '-H', 'User-Agent: NODE-release-verification', href],
  { encoding: 'buffer', maxBuffer: 20 * 1024 * 1024 })).stdout;
const deploymentCommit = process.argv[2] ?? preflight.commit;
const runs = JSON.parse((await bytes('https://api.github.com/repos/bookskaboo/bookskaboo.github.io/actions/runs?head_sha=' + deploymentCommit)).toString());
const deployment = runs.workflow_runs?.find(run => /pages/i.test(run.name));
writeFileSync(folder + (process.argv[2] ? '/metadata-pages-status.json' : '/pages-status.json'), JSON.stringify(deployment ?? runs, null, 2) + '\n');
if (deployment?.status === 'completed' && deployment.conclusion !== 'success') throw Error('Pages deployment failed: ' + deployment.conclusion);
const live = await bytes(url);
if (hash(live) !== manifest.files.find(({ file }) => file === 'index.html').sha256 || deployment?.status !== 'completed') {
  console.log(JSON.stringify({ status: 'waiting', pagesStatus: deployment?.status ?? 'not listed yet', pagesConclusion: deployment?.conclusion,
    liveBuild: live.toString().match(/src="([^"]+\.js)"/)?.[1] }));
  process.exitCode = 2;
} else {
  const required = new Map();
  for (const { file, sha256 } of [...manifest.files, ...previous.files.filter(({ file }) => file !== 'index.html')]) {
    if (required.has(file) && required.get(file) !== sha256) throw Error('Conflicting asset hash: ' + file);
    required.set(file, sha256);
  }
  required.delete('index.html');
  await Promise.all([...required].map(async ([file, sha256]) => {
    if (hash(await bytes(url + file)) !== sha256) throw Error('Live SHA-256 mismatch: ' + file);
  }));
  const receipt = { commit: preflight.commit, deploymentCommit, base: preflight.base, url, verifiedAt: new Date().toISOString(),
    pagesRun: { id: deployment.id, url: deployment.html_url, status: deployment.status, conclusion: deployment.conclusion },
    matchedRuntimeFiles: manifest.files.length, previousAssetsVerified: previous.files.length - 1, files: manifest.files };
  writeFileSync(folder + (process.argv[2] ? '/metadata-publication-receipt.json' : '/publication-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'verified', commit: receipt.commit, matchedRuntimeFiles: receipt.matchedRuntimeFiles,
    previousAssetsVerified: receipt.previousAssetsVerified, pagesRun: receipt.pagesRun.url, verifiedAt: receipt.verifiedAt }));
}
