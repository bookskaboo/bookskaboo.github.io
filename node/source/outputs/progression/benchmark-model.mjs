// Comparative design analysis only. Does not modify live or proposed research prices.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { displayText } from './item-display.mjs';
const design = JSON.parse(readFileSync('outputs/progression/core-design.json', 'utf8'));
const sources = {
  factorioTech: 'https://raw.githubusercontent.com/wube/factorio-data/master/base/prototypes/technology.lua',
  factorioRecipes: 'https://raw.githubusercontent.com/wube/factorio-data/master/base/prototypes/recipe.lua',
  factorioScience: 'https://wiki.factorio.com/Science_pack',
  factorioLab: 'https://wiki.factorio.com/Lab_research_speed_(research)',
  factorioTime: 'https://wiki.factorio.com/Time',
  milestones: 'https://satisfactory.wiki.gg/wiki/Milestones',
  mam: 'https://satisfactory.wiki.gg/wiki/MAM',
  hub: 'https://satisfactory.wiki.gg/wiki/HUB',
  frames: 'https://satisfactory.wiki.gg/wiki/Modular_Frame',
  rotors: 'https://satisfactory.wiki.gg/wiki/Rotor',
  plating: 'https://satisfactory.wiki.gg/wiki/Smart_Plating',
  heavyFrame: 'https://satisfactory.wiki.gg/wiki/Heavy_Modular_Frame',
  oilWaste: 'https://satisfactory.wiki.gg/wiki/Heavy_Oil_Residue',
  aluminum: 'https://satisfactory.wiki.gg/wiki/Alumina_Solution',
};
const factorio = [
  ['Automation', 10, ['automation'], 10],
  ['Logistic science unlock', 75, ['automation'], 5],
  ['Chemical science unlock', 75, ['automation', 'logistic'], 10],
  ['Production science unlock', 100, ['automation', 'logistic', 'chemical'], 30],
  ['Utility science unlock', 100, ['automation', 'logistic', 'chemical'], 30],
  ['Lab speed 1', 100, ['automation', 'logistic'], 30],
  ['Lab speed 2', 200, ['automation', 'logistic'], 30],
  ['Lab speed 3', 250, ['automation', 'logistic', 'chemical'], 30],
  ['Lab speed 4', 500, ['automation', 'logistic', 'chemical'], 30],
].map(([name, sets, packs, secondsPerUnit]) => ({ name, sets, packs, secondsPerUnit,
  physicalItems: sets * packs.length, unmodifiedTenLabSeconds: sets * secondsPerUnit / 10,
  at30SetsPerMinuteSeconds: Math.max(sets * secondsPerUnit / 10, sets * 2),
  source: name.startsWith('Lab') ? sources.factorioLab : sources.factorioTech }));
const factorioRecipes = [
  { name: 'Automation science', inputs: '1 Copper Plate + 1 Iron Gear Wheel', output: 1, seconds: 5 },
  { name: 'Logistic science', inputs: '1 Inserter + 1 Transport Belt', output: 1, seconds: 6 },
  { name: 'Chemical science', inputs: '2 Engine Units + 3 Advanced Circuits + 1 Sulfur', output: 2, seconds: 24 },
  { name: 'Production science', inputs: '30 Rails + 1 Electric Furnace + 1 Productivity Module', output: 3, seconds: 21 },
].map(r => ({ ...r, speedOneFinalMachinePerMinute: 60 * r.output / r.seconds, source: sources.factorioRecipes }));
const satisfactory = [
  { name: 'Coal Power', tier: 3, inputs: '150 Reinforced Iron Plates + 50 Rotors + 500 Cable', cooldownMinutes: 8 },
  { name: 'Basic Steel Production', tier: 3, inputs: '50 Modular Frames + 150 Rotors + 500 Concrete + 1,000 Wire', cooldownMinutes: 8 },
  { name: 'FICSIT Blueprints', tier: 4, inputs: '100 Modular Frames + 200 Steel Beams + 500 Cable + 1,000 Concrete', cooldownMinutes: 5 },
  { name: 'Oil Processing', tier: 5, inputs: '50 Motors + 100 Encased Industrial Beams + 500 Steel Pipes + 500 Copper Sheets', cooldownMinutes: 10 },
].map(r => ({ ...r, source: sources.milestones }));
const satisfactoryRecipes = [
  { name: 'Modular Frame', inputs: '3 Reinforced Iron Plates + 12 Iron Rods', output: 2, seconds: 60, source: sources.frames },
  { name: 'Rotor', inputs: '5 Iron Rods + 25 Screws', output: 1, seconds: 15, source: sources.rotors },
  { name: 'Smart Plating', inputs: '1 Reinforced Iron Plate + 1 Rotor', output: 1, seconds: 30, source: sources.plating },
  { name: 'Heavy Modular Frame', inputs: '5 Modular Frames + 20 Steel Pipes + 5 Encased Industrial Beams + 120 Screws', output: 1, seconds: 30, source: sources.heavyFrame },
].map(r => ({ ...r, at100PercentPerMinute: 60 * r.output / r.seconds }));
const costsByName = new Map(design.research.map(r => [r.name, r]));
const windows = [2, 5, 10]; // Sensitivity parameters, not observed player learning times.
const latency = design.research.map(r => {
  const e = design.recalculation.mixedEnvelopes.find(e => e.tier === r.tier);
  const tickSeconds = r.tier >= 5 ? .8 : .9;
  return { name: r.name, tier: r.tier, pricingClass: r.pricingClass, sets: r.each,
    labOnlySeconds: r.each * tickSeconds,
    atOneSetPerMinuteSeconds: Math.max(r.each * 60, r.each * tickSeconds),
    atFiveSetsPerMinuteSeconds: Math.max(r.each * 12, r.each * tickSeconds),
    steadyLeanSeconds: r.each * e.leanSecondsPerSet,
    minSetRatesForWindows: windows.map(minutes => ({ minutes, setsPerMinute: r.each / minutes })),
    assumptions: 'Empty buffer; all required streams at equal sustained delivered rate. Excludes startup, switching and transport latency. Lean uses unupgraded production, hypothetical lab rate uses earned upgrades.' };
});
const gates = [
  { tier: 4, nextTier: 5, projects: ['Fluid Routing', 'Ore Separation'], note: 'Hydro-dependent access segment only; lower-tier prerequisites excluded.' },
  { tier: 5, nextTier: 6, projects: ['Mineral Recovery', 'Precision Control'], note: 'Shiny-dependent access segment only; optional Lab 2 excluded.' },
  { tier: 6, nextTier: 7, projects: ['Autonomous Logistics', 'Command Robotics', 'Endgame Theory'], note: 'Complex-dependent access segment only. Heavy Robotics and Mineral Regeneration must already be completed; those require earlier cores.' },
].map(g => ({ ...g, sets: g.projects.reduce((sum, n) => sum + costsByName.get(n).each, 0) }))
  .map(g => ({ ...g, atOneSetPerMinuteMinutes: g.sets, atFiveSetsPerMinuteMinutes: g.sets / 5,
    ratesForWindows: windows.map(minutes => ({ minutes, setsPerMinute: g.sets / minutes })) }));
// Deliberately narrow model: one active project, steady equal streams, no stockpile.
// Actual play needs an event schedule with prerequisites, per-core buffers and build-dependent rates.
const waitingSensitivity = latency.filter(r => r.pricingClass === 'unlock').flatMap(r =>
  [1, 5].flatMap(setsPerMinute => windows.map(usefulWorkMinutes => {
    const completionSeconds = Math.max(r.sets * 60 / setsPerMinute, r.labOnlySeconds);
    return { name: r.name, setsPerMinute, usefulWorkMinutes, completionSeconds,
      forcedWaitSeconds: Math.max(0, completionSeconds - usefulWorkMinutes * 60) };
  })));
const originality = [
  { subject: 'Hydro Core', similarity: 'medium', familiar: 'Water plus metals, dedicated processors and intermediate assembly are common factory patterns.',
    direction: 'Make finite lake access and typed links between compact map networks the main decision. Avoid oil fractions, pressure/head-lift simulation and recycled-water feedback as mandatory puzzles.' },
  { subject: 'Shiny Core', similarity: 'still under review', familiar: 'Refinery backpressure remains familiar. The revised proposal adds independent waste probabilities, mixed sorting and separate recovery branches; those alone do not establish a distinct overall logistics experience.',
    direction: 'Introduce only guaranteed Slag with tier 5 mithril. Defer Fines, Flux and Crust with different independent chances to tier 6 Precision Controllers and Advanced Actuators, as in waste-design.html. Bundle advanced sorting and recovery with that unlock. Preserve useful yields and keep rare drops out of mandatory progression; test regional solid recovery and chest-batch export.' },
  { subject: 'Complex Core', similarity: 'medium-high', familiar: 'Stacking frames, motors, circuits and upgraded actuators resembles conventional late-game assembly ladders.',
    direction: 'Test coordinating deliveries from specialized maps and allocating components between research and combat before adding deeper frame/circuit ladders. A pure 60-second recipe is not a new logistics problem.' },
  { subject: 'Research system', similarity: 'high at the general mechanic level', familiar: 'A set of colored/tiered research consumables resembles Factorio science.',
    direction: 'Keep the agreed equal-core rule. Emphasize the one Home lab, readable local networks, inter-map chest batches, renewal anchors and disposable combat supply. Renaming packs or changing ratios alone does not differentiate the experience.' },
];
const output = { checkedOn: '2026-10-30', status: 'Comparative design reference and rate sensitivity, not a calibrated human-play simulation',
  scope: 'Factorio base-game normal-quality, default research costs; excludes Space Age progression, modules and productivity. Satisfactory default recipes at 100% clock and default delivery costs. Sources are a dated snapshot, not pinned release data.',
  sources, factorio, factorioRecipes, satisfactory, satisfactoryRecipes,
  workedExamples: { steelDeliveryFinalStageLowerBoundMinutes: Math.max(50 / 2, 150 / 4),
    smartPlatingPhaseOneFinalStageMinutes: 50 / 2,
    caveat: 'All final machines run concurrently with infinite upstream supply. These are production bounds, not player progression times; no extra milestone cooldown is added to unlock availability.' },
  modelRefinement: { timing: 'Use required remaining sets / bottleneck delivered sets per second, bounded by lab capacity. With ready buffer B, supply bound is max(0,Q-B)/R; research still takes Q lab ticks. Do not add overlapping production and lab time.',
    wait: 'Forced wait = max(0, unlock completion time - time useful work runs out), with prerequisites and queue occupation included in the full event model.',
    designRule: 'Budget the complete mandatory unlock path, not each cheap project in isolation. Let upgrade work run on established lower-tier supply; avoid mandatory optional-upgrade gates.',
    queue: 'Capability research should be available to select when needed. In a single-lab game, queued optional upgrades can delay unlocks unless switching preserves contributions. Automatic priority is a proposal, not implemented here.',
    timingTargets: 'Use 2/5/10 minute useful-work windows as sensitivity inputs only. Set final limits using earliest reasonable readiness in playtests.',
    newMechanics: 'Introduce one primary unfamiliar logistics rule at a time, then combine familiar rules. This is a proposed design heuristic, not a measured rule from either reference game.' },
  latency, gates, waitingSensitivity, originality };
assert.ok(gates.every(g=>g.sets>0));
assert.equal(output.workedExamples.steelDeliveryFinalStageLowerBoundMinutes, 37.5);
assert.equal(latency.find(r => r.name === 'Ore Separation').atOneSetPerMinuteSeconds, costsByName.get('Ore Separation').each*60);
assert.ok(waitingSensitivity.every(r => r.forcedWaitSeconds >= 0));
writeFileSync('outputs/progression/benchmarks.json', JSON.stringify(output, null, 2));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const table = (heads, rows) => `<div class="table"><table><thead><tr>${heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const fmt = seconds => `${(seconds / 60).toFixed(1)} min`;
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factory game pacing and originality comparison</title>
<style>body{font:16px/1.6 system-ui;background:#111923;color:#e6edf5;max-width:1160px;margin:40px auto;padding:0 24px}h1,h2{line-height:1.2}h2{margin-top:44px}a{color:#80d7ff}p{max-width:90ch}.table{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #3a4a5b}th{background:#213143}.note{border-left:4px solid #7ed9c0;padding:12px 20px;background:#1a2c32}li{margin-bottom:12px}</style>
<h1>Factory game pacing and originality comparison</h1><p>Checked October 30, 2026. Default-cost reference values, calculated production bounds and explicit sensitivity assumptions. No live game prices changed.</p>
<p><a href="waste-design.html">Revised byproduct design: independent probabilities, mixed sorting and recovery recipes</a></p>
<p><a href="player-simulation.html">Player progression simulation: overlapping construction, research and forced waiting</a></p>
<p class="note">The main pacing variable is the delivered rate of the slowest required core. Cheap unlocks can still create long waits. Compare complete mandatory paths against useful building work, while keeping the logistics identity distinct.</p>
<h2>Factorio research</h2><p>Each count is a set of the listed packs. The comparison assumes ten unmodified speed-one labs, no productivity and empty buffers. The last column also assumes 30 delivered sets/minute. It excludes all prerequisites and factory construction.</p>
${table(['Research','Sets / pack types','Seconds per research unit','Lab-only bound','With 30 sets/min'],factorio.map(r=>[r.name,`${r.sets} / ${r.packs.join(', ')}`,r.secondsPerUnit,fmt(r.unmodifiedTenLabSeconds),fmt(r.at30SetsPerMinuteSeconds)]))}
<p><a href="${sources.factorioTech}">Developer technology definitions</a> · <a href="${sources.factorioLab}">Lab speed upgrade costs</a>. Real lab upgrades change these illustrative bounds.</p>
<h2>Production recipes</h2><p>Factorio recipe seconds use crafting speed 1; an ordinary Assembling Machine 1 has speed 0.5, so its rates are half the displayed Factorio rates. Upstream manufacture is excluded.</p>
${table(['Game / product','Inputs per batch','Output / seconds','Final-machine output/min'],[...factorioRecipes.map(r=>['Factorio / '+r.name,r.inputs,`${r.output} / ${r.seconds}`,r.speedOneFinalMachinePerMinute.toFixed(2)]),...satisfactoryRecipes.map(r=>['Satisfactory / '+r.name,r.inputs,`${r.output} / ${r.seconds}`,r.at100PercentPerMinute])])}
<p><a href="${sources.factorioRecipes}">Factorio recipes</a> · <a href="${sources.factorioTime}">Crafting speeds</a> · ${satisfactoryRecipes.map(r=>`<a href="${r.source}">${r.name}</a>`).join(' · ')}</p>
<h2>Satisfactory deliveries and research</h2>
${table(['Milestone','Tier','Manufactured delivery','Freighter cooldown'],satisfactory.map(r=>[r.name,r.tier,r.inputs,`${r.cooldownMinutes} min`]))}
<p>The listed milestone times are freighter return/cooldown values after completion, not a production duration or a timer to add before using the unlocked machinery. A cooldown can affect the next milestone. Ordinary MAM research takes 3 seconds after supplying materials; Hard Drive analysis takes 10 minutes. <a href="${sources.milestones}">Milestones</a> · <a href="${sources.hub}">HUB</a> · <a href="${sources.mam}">MAM</a>.</p>
<p>Calculated example: Basic Steel needs 25 minutes of one Modular Frame assembler and 37.5 minutes of one Rotor assembler. Running together gives a 37.5-minute final-stage bound before the other parts, startup and transport. A single Smart Plating assembler makes the Phase 1 delivery of 50 in 25 minutes. These are not estimates of human learning time.</p>
<h2>Our unlock delays at different production rates</h2><p>Empty buffers, steady complete sets and hypothetical earned lab speeds. Actual startup and shared-resource competition add time. “Lean” is the existing model's one-machine-per-operation steady-state factory, not minimum endgame map utilization.</p>
${table(['Capability','Sets','Lab only','1 set/min','5 sets/min','Lean steady supply'],latency.filter(r=>r.pricingClass==='unlock').map(r=>[r.name,r.sets,`${r.labOnlySeconds.toFixed(1)} sec`,fmt(r.atOneSetPerMinuteSeconds),fmt(r.atFiveSetsPerMinuteSeconds),fmt(r.steadyLeanSeconds)]))}
<h2>Mandatory path segments</h2><p>Several cheap unlocks accumulate into a gate. These segments include only projects paid with the tier's newest core, assuming earlier-core prerequisites are already complete. They are not full playthrough times.</p>
${table(['Transition','Required segment','Total sets','At 1 set/min','At 5 sets/min','Rate to fit 5 minutes'],gates.map(g=>[`${g.tier} → ${g.nextTier}`,g.projects.join(' → '),g.sets,`${g.sets} min`,`${g.sets/5} min`,`${g.sets/5} sets/min`]))}
<h2>Refinement to the pacing model</h2><ul>${Object.values(output.modelRefinement).map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
<h2>Keep the logistics distinct</h2>${table(['Our chain','Similarity concern','Direction to test'],originality.map(r=>[`${r.subject} (${r.similarity})`,r.familiar,r.direction]))}
<p>Similarity levels are qualitative design judgments, not numerical similarity scores. Familiar ingredients and generic machines alone do not establish a copied experience. Compare the dependency graph, routing decisions, failure modes and recovery choices together. <a href="${sources.oilWaste}">Satisfactory oil byproducts</a> · <a href="${sources.aluminum}">Aluminum chain</a> · <a href="${sources.factorioScience}">Factorio science</a>.</p>
<p>The agreed Hydro, mithril, unwanted-product and stronger-bot requirements remain intact. Proposed differentiation needs recipe and playtest work before adoption. No calibrated learning durations or verified three-hour playthrough are claimed.</p></html>`;
writeFileSync('outputs/progression/benchmarks.html', displayText(html));
console.log(JSON.stringify({ files: ['benchmarks.json','benchmarks.html'], researchExamples: factorio.length, recipeExamples: factorioRecipes.length + satisfactoryRecipes.length, unlockPathSegments: gates, sensitivityCases: waitingSensitivity.length }, null, 2));
