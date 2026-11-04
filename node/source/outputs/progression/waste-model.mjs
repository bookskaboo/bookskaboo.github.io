// Proposed stochastic waste mechanics. No live simulation changes.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { displayText } from './item-display.mjs';
const design = JSON.parse(readFileSync('outputs/progression/core-design.json', 'utf8'));
const names = { slag: 'Slag', 'metallic-fines': 'Metallic Fines', 'spent-flux': 'Spent Flux', 'glassy-crust': 'Glassy Crust' };
const sources = ['refined-mithril', 'precision-controller', 'advanced-actuator'].map(id => {
  const r = design.recipes[id];
  const waste = [...Object.entries(r.outputs).filter(([item]) => item !== id).map(([item, amount]) => ({ item, amount, probability: 1 })), ...(r.chanceOutputs ?? [])];
  return { id, seconds: r.seconds, waste,
    expectedPerBatch: waste.reduce((n, w) => n + w.amount * w.probability, 0),
    maxPerBatch: waste.reduce((n, w) => n + w.amount, 0) };
});
const recovery = [
  { name: 'Slag washing', node: 'Hydro Processor', inputs: { slag: 4, water: 2 }, outputs: { 'mineral-aggregate': 2, 'metal-residue': 1 }, seconds: 12 },
  { name: 'Fines settling', node: 'Hydro Processor', inputs: { 'metallic-fines': 4, water: 1 }, outputs: { 'metal-residue': 3 }, seconds: 10 },
  { name: 'Flux stabilization', node: 'Hydro Processor', inputs: { 'spent-flux': 4, charcoal: 1, water: 2 }, outputs: { 'mineral-aggregate': 2 }, seconds: 12 },
  { name: 'Crust milling', node: 'Separation Furnace', inputs: { 'glassy-crust': 2, water: 1 }, outputs: { 'mineral-aggregate': 3 }, seconds: 14 },
  { name: 'Recovered brick', node: 'Refiner', inputs: { 'mineral-aggregate': 2 }, outputs: { brick: 1 }, seconds: 4 },
  { name: 'Recovered iron', node: 'Separation Furnace', inputs: { 'metal-residue': 2, charcoal: 1 }, outputs: { 'iron-plate': 1 }, seconds: 6 },
];
const six = design.recalculation.mixedEnvelopes.find(e => e.tier === 6).byproducts;
const rate = Object.fromEntries(Object.entries(six).map(([id, count]) => [id, count / .8]));
const treatment = recovery.slice(0, 4).map(r => {
  const [id, batch] = Object.entries(r.inputs)[0];
  const mean = rate[id], perMachine = batch / r.seconds;
  return { name: r.name, item: id, meanPerSecond: mean, baseMachinesAtMean: Math.ceil(mean / perMachine),
    machinesAt25PercentHeadroom: Math.ceil(mean * 1.25 / perMachine),
    bufferFor60SecondMeanFlow: Math.ceil(mean * 60) };
});
let seed = 0x4d595448;
const rng = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
const furnace = sources[0];
const advancedSources = sources.slice(1).map(s => ({ ...s, batchesPerKit: design.recipes['command-core'].inputs[s.id] }));
const trials = 1000, batches = 1000;
const samples = Array.from({ length: trials }, () => {
  const out = Object.fromEntries(Object.keys(names).map(id => [id, 0]));
  for (let b = 0; b < batches; b++) for (const s of advancedSources) for (let k = 0; k < s.batchesPerKit; k++) for (const w of s.waste) if (rng() < w.probability) out[w.item] += w.amount;
  return out;
});
const monteCarlo = Object.keys(names).filter(item => item !== 'slag').map(item => {
  const terms = advancedSources.flatMap(s => s.waste.filter(w => w.item === item).map(w => ({ ...w, rolls: batches * s.batchesPerKit })));
  const counts = samples.map(s => s[item]).sort((a, b) => a - b);
  const mean = counts.reduce((a, b) => a + b, 0) / trials;
  const expected = terms.reduce((n,w) => n + w.rolls * w.amount * w.probability, 0);
  const standardError = Math.sqrt(terms.reduce((n,w) => n + w.amount ** 2 * w.rolls * w.probability * (1-w.probability), 0) / trials);
  assert.ok(Math.abs(mean - expected) <= Math.max(1e-9, 5 * standardError));
  assert.ok(counts.every(c => Number.isInteger(c) && c >= 0 && c <= terms.reduce((n,w) => n + w.rolls*w.amount, 0)));
  return { item, expected, sampledMean: mean, p05: counts[49], p50: counts[499], p95: counts[949] };
});
const recoveryCores=design.research.find(r=>r.name==='Mineral Recovery').each;
const bootstrapBatches=Math.ceil(recoveryCores*design.cores.find(c=>c.core==='shiny-core').workSeconds['refined-mithril']/design.recipes['refined-mithril'].seconds-1e-9);
const bootstrap = { shinyCores: recoveryCores, furnaceBatches: bootstrapBatches, sharedHopperCapacity: 200,
  expectedWaste: bootstrapBatches * furnace.expectedPerBatch, maximumWaste: bootstrapBatches * furnace.maxPerBatch,
  note: 'Tier 5 refining produces only guaranteed Slag. Random waste starts with tier 6 intermediaries, alongside sorting and recovery unlocks.' };
assert.ok(bootstrap.maximumWaste <= bootstrap.sharedHopperCapacity);
const meanTotalPerSecond = Object.values(rate).reduce((a, b) => a + b, 0);
const output = { status: 'Design proposal only', probabilityRule: 'Separate independent roll for every listed chance on each batch; any combination can occur. Guaranteed primary output and Slag are not rolled.',
  sources, recovery, bootstrap, expectedFixedResearchWaste: design.recalculation.byproducts,
  tier6AtPoint8Seconds: { byTypePerSecond: rate, totalPerSecond: meanTotalPerSecond,
    legacyCableLaunchesPerSecond: 2.5, cableEquivalentAtMean: Math.ceil(meanTotalPerSecond / 2.5), treatment,
    caveat: 'Treatment counts are unupgraded machines. Exclude sorting, recovery-product processing, power, water supply, combat waste and logistics. Headroom and buffers are heuristics, not overflow guarantees.' },
  simulation: { seed: '0x4d595448', trials, batchesPerTrial: batches, results: monteCarlo,
    scope: 'Each trial makes 1,000 Complex ingredient kits using the current Controller/Actuator quantities. Checks independent tier-6 waste rolls, not transport, stalls or player timing.' },
  handling: [
    'Tier 5 Ore Separation introduces only deterministic Slag and the existing 200-item Slag Hopper. Mineral Recovery unlocks Slag washing and recovered Brick/Iron. No random waste occurs in mythril production.',
    'Tier 6 Precision Control introduces the advanced intermediaries and simultaneously unlocks mixed Waste Hoppers, Waste Sorters and the three advanced treatments at its existing price. A mixed hopper has 200 shared solid slots; Spent Flux is solid spent treatment material, not fluid.',
    'Waste Sorter has one mixed input and four labeled typed outlets. It can route up to 40 items/second, with at most 40 on any one branch; blocked branches retain items in separate 32-unit bins while other branches continue until the affected bin fills. Waste transport uses explicit batch links of up to 40 items/second; existing 2.5-item/s cables do not gain speed.',
    'Furnace keeps separate product/waste outlets. Precision Controller and Advanced Actuator recipes also require an assembler waste outlet. Waste buffers are 32 slots per source machine; reserve the full maximum batch output before consuming ingredients.',
    'At batch start, roll once and store the outcome, RNG state and reserved output capacity in save data. Reloading, pausing or changing recipe must not reroll it. Stop or resume the stored batch normally; no silent waste deletion.',
    'Recovery has guaranteed yields and produces no further random waste. Tier-6 recovery access is bundled with Precision Control, avoiding another research wait. Rare waste is never a required core, bot or research ingredient; recovery supplements ordinary supplies.',
    'Show chance per batch, possible amount, mean rate, maximum batch and blocked waste type in the inspector. A 65% chance for one item does not mean 0.65 of an item is transferred.',
    'Recovery outputs can block too. Export aggregate to brick manufacture and residue to iron manufacture across maps. Storage is finite; long-term recovery must have real downstream demand. Do not assume an unlimited disposal sink.',
    '25% treatment headroom and 60 seconds of average storage are initial test settings. Rare streaks, synchronized machine completions and long delivery gaps still require backpressure and overflow tests.',
  ],
  modelScope: 'Expected stochastic outputs change waste totals. Deterministic core ingredients, research prices and lab times are unchanged. Existing production node counts omit waste processing and sorting. No recycling credits are applied; average batch bills can be fractional.' };
writeFileSync('outputs/progression/waste-design.json', JSON.stringify(output, null, 2));
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const table = (heads, rows) => `<div class="scroll"><table><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
const bag = b => Object.entries(b).map(([id,n])=>`${n} ${names[id] ?? id.replaceAll('-',' ')}`).join(' + ');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Probabilistic waste and recovery proposal</title><style>body{font:16px/1.65 system-ui;max-width:1150px;margin:40px auto;padding:0 24px;background:#111923;color:#e8edf5}h1,h2{line-height:1.2}h2{margin-top:40px}a{color:#89deff}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #3c4d60}th{background:#223447}li{margin-bottom:12px}.note{border-left:4px solid #e1b46d;padding:16px;background:#263039}</style>
<h1>Tier 6 probabilistic waste and recovery</h1><p class="note">Proposal only. Tier 5 mythril refining introduces guaranteed Slag. Tier 6 Precision Controllers and Advanced Actuators introduce independent waste rolls, mixed sorting and advanced recovery. Rare drops never gate progression.</p>
<h2>Waste per completed batch</h2>${table(['Recipe','Waste','Chance','Amount on success','Average/batch'],sources.flatMap(s=>s.waste.map(w=>[s.id.replaceAll('-',' '),names[w.item],`${w.probability*100}%`,w.amount,(w.amount*w.probability).toFixed(2)])))}
<p>Different waste types can occur together within each advanced recipe. Refined Mythril guarantees two refined units plus two Slag per ${sources[0].seconds}-second batch with no random outputs. Controllers average 0.73 waste items (maximum two); actuators average 0.75 (maximum three). Useful yields stay guaranteed.</p>
<h2>Recovery recipes</h2>${table(['Recipe / machine','Inputs','Guaranteed outputs','Cycle'],recovery.map(r=>[`${r.name} / ${r.node}`,bag(r.inputs),bag(r.outputs),`${r.seconds}s`]))}
<h2>Sorting and safe bootstrap</h2><ul>${output.handling.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>The first ${bootstrap.shinyCores} Shiny Cores for Mineral Recovery require ${bootstrap.furnaceBatches} refining batches and exactly ${bootstrap.maximumWaste} Slag. Tier-6 sorting and recovery tools unlock together with the intermediaries.</p>
<h2>Expected research waste</h2>${table(['Waste','One Shiny Core','One Complex Core','Fixed research through tier 6'],Object.entries(names).map(([id,n])=>[n,(design.cores.find(c=>c.core==='shiny-core').byproducts[id]??0).toFixed(3),(design.cores.find(c=>c.core==='command-core').byproducts[id]??0).toFixed(3),(output.expectedFixedResearchWaste[id]??0).toFixed(3)]))}
<p>These are expectations and average batch bills, not guaranteed drops or fractional inventory items. No recycling credits reduce the research ingredient bill.</p>
<h2>Six-core research at a 0.8-second lab cycle</h2>${table(['Waste','Average items/s','Base treatment machines at mean','With 25% headroom','60s average storage'],treatment.map(r=>[names[r.item],r.meanPerSecond.toFixed(3),r.baseMachinesAtMean,r.machinesAt25PercentHeadroom,r.bufferFor60SecondMeanFlow]))}
<p>Total mean waste is ${meanTotalPerSecond.toFixed(3)} items/s. One proposed 40-item/s mixed link and sorter clears the mean flow, but offers only ${(100*(40/meanTotalPerSecond-1)).toFixed(1)}% headroom and needs buffering or a second path for bursts. This is ${Math.ceil(meanTotalPerSecond/2.5)} ordinary-cable equivalents at the mean. Treatment counts exclude all support and downstream recovery manufacture.</p>
<h2>Randomness sanity check</h2><p>${trials} seeded trials of ${batches} Complex ingredient kits each (${advancedSources.map(s=>`${s.batchesPerKit} ${s.id}`).join(' + ')} per kit). All sampled means passed a five-standard-error check; counts stayed whole and within their possible ranges.</p>${table(['Waste','Expected/trial','Sample mean','5th percentile','Median','95th percentile'],monteCarlo.map(r=>[names[r.item],r.expected,r.sampledMean.toFixed(2),r.p05,r.p50,r.p95]))}
<p>The simulation checks output distributions, not transport reliability or player progression. Averages cannot guarantee no stalls. Production node estimates need sorting, recovery and buffering added before validating the world-map budgets.</p><p><a href="player-simulation.html">Player progression simulation and waiting times</a> · <a href="benchmarks.html">Pacing and originality comparison</a></p></html>`;
writeFileSync('outputs/progression/waste-design.html', displayText(html));
console.log(JSON.stringify({ bootstrap, meanWastePerSecond: meanTotalPerSecond, treatment, simulation: monteCarlo }, null, 2));
