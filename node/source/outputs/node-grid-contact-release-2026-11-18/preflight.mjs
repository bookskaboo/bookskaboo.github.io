import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const folder = 'outputs/node-grid-contact-release-2026-11-18';
const repo = folder + '/repo';
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { maxBuffer: 32 * 1024 * 1024 });
const ref = (...args) => git(...args).toString().trim();
const manifest = JSON.parse(readFileSync(folder + '/build-manifest.json', 'utf8'));
const commit = ref('rev-parse', 'HEAD');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(ref('rev-parse', commit + '^'), manifest.base);
assert.equal(ref('rev-parse', 'origin/main'), manifest.base);
assert.equal(ref('merge-base', 'origin/main', commit), manifest.base);
assert.equal(ref('status', '--porcelain'), '');
const changes = ref('diff-tree', '--no-commit-id', '--name-only', '-r', commit).split('\n');
assert.ok(changes.every(file => file.startsWith('node/')));
assert.equal(ref('diff', '--name-only', '--diff-filter=D', manifest.base, commit), '');
for (const { file, sha256 } of manifest.files) {
  assert.equal(sha(readFileSync('dist/' + file)), sha256, file + ': workspace build');
  assert.equal(sha(git('cat-file', 'blob', commit + ':node/' + file)), sha256, file + ': committed build');
  assert.equal(sha(readFileSync(repo + '/node/source/dist/' + file)), sha256, file + ': source build');
}
const previous = JSON.parse(readFileSync('outputs/node-research-tutorial-release-2026-11-18/publication-receipt.json', 'utf8'));
for (const { file, sha256 } of previous.files.filter(({ file }) => file !== 'index.html'))
  assert.equal(sha(git('cat-file', 'blob', commit + ':node/' + file)), sha256, file + ': previous runtime asset');
for (const file of changes.filter(file => file.startsWith('node/source/'))) {
  const relative = file.slice('node/source/'.length);
  const local = readFileSync(relative), committed = git('cat-file', 'blob', commit + ':' + file);
  if (/\.(docx|jpg|png)$/.test(relative)) assert.equal(sha(local), sha(committed), relative);
  else assert.equal(local.toString().replaceAll('\r\n', '\n'), committed.toString().replaceAll('\r\n', '\n'), relative);
}
const result = { commit, base: manifest.base, changedFiles: changes.length, buildFiles: manifest.files.length,
  previousRuntimeAssetsRetained: previous.files.length - 1, onlyNodeChanged: true, canFastForward: true,
  worktreeClean: true, sourceMatchesWorkspace: true, checkedAt: new Date().toISOString() };
writeFileSync(folder + '/preflight-report.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
