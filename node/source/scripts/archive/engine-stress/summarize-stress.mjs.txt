import { readFileSync, writeFileSync } from 'node:fs';

const report = JSON.parse(readFileSync('outputs/stress/latest.json', 'utf8'));
let baseline;
try { baseline = JSON.parse(readFileSync('outputs/stress/baseline.json', 'utf8')); } catch { /* First run has no baseline. */ }
const lines = [
  '# Current engine stress test', '',
  `Run: ${report.generatedAt}. CPU: ${report.cpu.trim()}. Runtime: ${report.node}.`, '',
  'Each case uses five simulated seconds of warmup followed by 30 measured seconds at 100 ms per tick. Sources contain preloaded wood. Production networks convert wood to charcoal. Continuous logistics networks pass wood through Joints. Each network has seven nodes, five local cables, and one paired Road link with a Cart at each endpoint. Road destinations are adjacent maps except in the one-map control.', '',
  '| Maps | Networks per map | Workload | Nodes | Road pairs | Mean tick ms | 95th percentile ms | Worst tick ms | Ticks over 100 ms | Peak travelling items | Delivered items |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...report.results.map((r) => `| ${r.maps} | ${r.networks} | ${r.production ? 'Production' : 'Continuous logistics'} | ${r.nodes} | ${r.roadPairs} | ${r.averageTickMs.toFixed(2)} | ${r.p95TickMs.toFixed(2)} | ${r.maxTickMs.toFixed(2)} | ${r.ticksOver100Ms}/300 | ${r.peakTransfers} | ${r.delivered} |`), '',
  'Every completed case checks delivery to every destination storage, integer/nonnegative inventories, and conservation of all items, including items travelling through cables. Wood-to-charcoal production is one-for-one, so total item count must remain constant.', '',
  'The 100 ms threshold is the simulation update interval. Browser rendering shares the main thread, so visible stutters can occur well below that threshold. These timings are a single run on this machine, not universal capacity limits.', '',
  '| Maps | Networks per map | Workload | Serialized state MB | Serialization ms | One state clone ms |',
  '| --- | --- | --- | --- | --- | --- |',
  ...report.results.map((r) => `| ${r.maps} | ${r.networks} | ${r.production ? 'Production' : 'Continuous logistics'} | ${(r.saveBytes / 1e6).toFixed(2)} | ${r.serializeMs.toFixed(2)} | ${r.cloneMs.toFixed(2)} |`), '',
  'Serialization and a single clone are measured separately from tick time. Autosave writes and accumulated undo snapshots are excluded.', '',
  'Limits:', '', ...report.limitations.map((line) => `- ${line}`),
  '- Generated terrain, camps, extraction, complex recipe mixes, map-switch catch-up, and blocked-road accumulation are not covered.',
  '- Listener notifications are counted, but React/Pixi work is excluded.', '',
  'Reproduce with `npm run stress`. Raw measurements: `outputs/stress/latest.json`.', '',
];
if (baseline?.fixtureVersion === report.fixtureVersion) {
  lines.push('## Before and after', '',
    'Baseline timings are from the original engine on the same machine. Performance varies between runs. Delivery counts and peak in-flight counts are compared to check that the workload stayed the same.', '',
    '| Maps | Networks per map | Workload | Before mean ms | After mean ms | Speedup | Before worst ms | After worst ms | Delivery/peak counts match |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of report.results) {
    const old = baseline.results.find((b) => b.maps === r.maps && b.networks === r.networks && b.production === r.production);
    if (!old) continue;
    lines.push(`| ${r.maps} | ${r.networks} | ${r.production ? 'Production' : 'Continuous logistics'} | ${old.averageTickMs.toFixed(2)} | ${r.averageTickMs.toFixed(2)} | ${(old.wallMs / r.wallMs).toFixed(1)}x | ${old.maxTickMs.toFixed(2)} | ${r.maxTickMs.toFixed(2)} | ${old.delivered === r.delivered && old.peakTransfers === r.peakTransfers ? 'Yes' : 'No'} |`);
  }
  lines.push('');
}
writeFileSync('outputs/stress/latest.md', lines.join('\n'));
