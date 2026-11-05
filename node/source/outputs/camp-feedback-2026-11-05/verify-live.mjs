import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const release = 'df69900';
const build = JSON.parse(readFileSync(new URL('./site-build.json', import.meta.url), 'utf8'));
const base = 'https://bookskaboo.github.io/node/';
const response = await fetch(base + '?node_release=' + release, { signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
if (!response.ok) throw Error('Site HTTP ' + response.status);
const bytes = Buffer.from(await response.arrayBuffer());
const html = bytes.toString('utf8');
const expected = build.directReferences.find(path => path.endsWith('.js'));
if (!html.includes(expected)) {
  console.log(JSON.stringify({ status: 'waiting-for-pages', observedScript: html.match(/src="([^"]+\.js)"/)?.[1], expectedScript: expected }));
  process.exitCode = 2;
} else {
  const assets = await Promise.all(build.runtime.filter(row => row.file !== 'index.html').map(async row => {
    const reply = await fetch(base + row.file + '?node_release=' + release, { signal: AbortSignal.timeout(20000) });
    if (!reply.ok) throw Error(row.file + ': HTTP ' + reply.status);
    const sha256 = createHash('sha256').update(Buffer.from(await reply.arrayBuffer())).digest('hex');
    if (sha256 !== row.sha256) throw Error('Hash mismatch: ' + row.file);
    return { file: row.file, sha256, matched: true };
  }));
  const receipt = { date: '2026-11-05', verifiedAtUtc: new Date().toISOString(), url: base, repository: build.repository, contentCommit: 'df69900fd71d89b911057eeb90a1fb0ae63a2824', mainUpdated: true, livePublicationVerified: true, expectedScript: expected, directlyReferencedAssets: build.directReferences.length, matchedRuntimeAssets: assets.length, assets, verification: 'Live HTML names the expected /node/ build and every runtime asset matches the published package by SHA-256.', interactiveBrowserVerified: false };
  writeFileSync(new URL('./publication-receipt.json', import.meta.url), JSON.stringify(receipt, null, 2) + '\n');
  writeFileSync(new URL('./published-index.html', import.meta.url), html);
  console.log(JSON.stringify({ status: 'live-verified', script: expected, matchedRuntimeAssets: assets.length }));
}
