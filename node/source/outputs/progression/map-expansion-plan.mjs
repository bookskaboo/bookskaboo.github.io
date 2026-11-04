// Adopted map-expansion budget analysis; gameplay prices are verified by mapResearch.test.ts.
import { writeFileSync } from 'node:fs';
const totalMaps = 121;
const baselineMaps = Math.ceil(totalMaps / 2);
const baselineCompletions = baselineMaps - 2; // Home plus Exploration's point.
const cores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const allocations = [9, 10, 10, 10, 10, 10];
const phases = allocations.map((ranks, i) => ({ highestCore: cores[i], completions: ranks, costsEach: Array.from({ length: ranks }, (_, purchase) => i === 0 ? 5 : i * 5 + 1 + Math.floor(purchase / 2)) }));
const purchases = phases.flatMap((phase, i) => phase.costsEach.map(each => ({ coreTypes: i + 1, each })));
for (let n = 1; n <= totalMaps - baselineMaps; n++) purchases.push({ coreTypes: 6, each: 30 + Math.ceil(n / 5) });
const bill = list => {
  const costs = Object.fromEntries(cores.map(core => [core, 0]));
  costs['simple-core'] = costs['basic-core'] = 1; // Exploration's first point.
  for (const purchase of list) for (const core of cores.slice(0, purchase.coreTypes)) costs[core] += purchase.each;
  const sets = 1 + list.reduce((sum, p) => sum + p.each, 0);
  return { costs, physicalCores: Object.values(costs).reduce((a, b) => a + b, 0), synchronizedSets: sets, labSecondsAtBase: sets, labSecondsAtRank6: sets * .4 };
};
const report = {
  status: 'Implemented in gameplay',
  totalMaps, affordableBaselineMaps: baselineMaps,
  explorationMapPoints: 1, baselineMapNodeCompletions: baselineCompletions, fullWorldMapNodeCompletions: 119,
  phases, halfWorld: bill(purchases.slice(0, baselineCompletions)), fullWorld: bill(purchases),
  postBaselineScaling: 'For extra map n from 1 to 60: 30 + ceil(n / 5) of each required core; final cost 42 each.',
  coreAccessRule: 'Use the smaller of the scheduled core tier and highest unlocked core tier; add a new core requirement only after its recipe is unlocked. All earlier core types remain required.',
  limits: 'Baseline counts unlocked maps, not productive maps or guaranteed corner access. Costs assume new core access by each scheduled phase. Lab times exclude production, transport, building and other research.',
};
if (allocations.reduce((a, b) => a + b, 0) !== baselineCompletions || purchases.length !== 119) throw new Error('Planning invariant failed');
writeFileSync('outputs/progression/map-expansion-plan.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
