import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null } });
try {
  const { generateBorderObstructions, validateBorderWorld, borderTargets, borderLayoutStatistics, borderQuadrantCount } = await server.ssrLoadModule('/src/simulation/borderObstructions.ts');
  const started = performance.now(), groups = [];
  for (const size of [11, 13, 15, 17, 19, 21]) {
    const seeds = size === 11 ? 1000 : 20, targets = borderTargets(size), failures = [], fallbackSeeds = [];
    let minMaps = Infinity, maxMaps = 0, minQuadrants = 4;
    for (let seed = 0; seed < seeds; seed++) {
      const edges = generateBorderObstructions(seed, size), stats = borderLayoutStatistics(edges);
      if (!validateBorderWorld(edges, size)) failures.push(seed);
      if (Object.entries(targets).some(([kind, count]) => stats[kind] !== count)) fallbackSeeds.push(seed);
      minMaps = Math.min(minMaps, stats.maps); maxMaps = Math.max(maxMaps, stats.maps);
      for (const kind of ['river', 'mountain', 'chasm']) minQuadrants = Math.min(minQuadrants, borderQuadrantCount(edges, kind));
    }
    groups.push({ size, seeds, targets, failures, fallbackSeeds, minMaps, maxMaps, minQuadrants });
  }
  const report = { generatedAt: new Date().toISOString(), milliseconds: Math.round(performance.now() - started), groups,
    safeguards: ['Unique orthogonal shared borders; no adjacent occupied sides on either endpoint', 'At least two clear neighbors per sector; all Home borders and E1–E2 clear', 'Connected clear graph; clear Home-to-every-sector Manhattan shortest route', 'Every obstructed border has a clear bypass of at most three hops'],
    limits: ['Static graph audit; bypass sectors may still need purchase or Deep Hole completion', 'No normal-play routing, shipment-rate or progression-time balance claim', '45–60 maps touched was a recommendation; actual coverage is reported without reducing agreed quotas'] };
  await mkdir('outputs/border-obstructions-implementation', { recursive: true });
  await writeFile('outputs/border-obstructions-implementation/seed-audit.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (groups.some(group => group.failures.length || group.fallbackSeeds.length || group.minQuadrants < 3)) process.exitCode = 1;
} finally { await server.close(); }
