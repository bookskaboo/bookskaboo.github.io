// Design-only model. Reads live recipes; adds sample recipes without changing gameplay.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const balance = JSON.parse(readFileSync('outputs/progression/balance-settings.json', 'utf8'));
const encounters = JSON.parse(readFileSync('outputs/progression/encounter-unlocks.json', 'utf8'));

const bag = (text) => Object.fromEntries([...text.matchAll(/(?:'([^']+)'|(\w+)):\s*([\d.]+)/g)].map((m) => [m[1] ?? m[2], Number(m[3])]));
const recipes = {};
for (const m of readFileSync('src/content/recipes.ts', 'utf8').matchAll(/id: '([^']+)'[^\n]*?inputs: \{([^}]+)\}, outputs: \{([^}]+)\}, cycleMs: (\d+)/g)) {
  const outputs = bag(m[3]); const [primary, amount] = Object.entries(outputs)[0];
  recipes[primary] = { inputs: bag(m[2]), outputs, primaryAmount: amount, seconds: Number(m[4]) / 1000, node: 'Existing processor' };
}
function add(primary, inputs, seconds, node, outputs = { [primary]: 1 }) {
  recipes[primary] = { inputs, outputs, primaryAmount: outputs[primary], seconds, node, proposed: true };
}
add('coolant', { water: 4, 'iron-plate': 1 }, 8, 'Hydro Processor', { coolant: 2 });
add('conductive-slurry', { water: 2, 'copper-wire': 1, charcoal: 1 }, 10, 'Hydro Processor', { 'conductive-slurry': 2 });
add('hydraulic-actuator', { 'iron-gear': 2, motor: 1, coolant: 2 }, 14, 'Advanced Assembler');
add('hydro-core', { 'automata-core': 1, 'hydraulic-actuator': 1, 'conductive-slurry': 2 }, 25, 'Advanced Assembler');
add('refined-mithril', { mythril: 4, charcoal: 2, coolant: 2 }, 16, 'Separation Furnace', { 'refined-mithril': 2, slag: 2 });
add('shiny-core', { 'hydro-core': 1, 'refined-mithril': 4, 'circuit-a': 2 }, 40, 'Advanced Assembler');
add('precision-controller', { 'circuit-a': 2, 'refined-mithril': 1, 'conductive-slurry': 2 }, 18, 'Advanced Assembler');
add('advanced-actuator', { 'hydraulic-actuator': 1, 'refined-mithril': 2, coolant: 2 }, 24, 'Advanced Assembler');
add('command-core', { 'shiny-core': 2, 'precision-controller': 1, 'advanced-actuator': 2 }, 60, 'Advanced Assembler');
add('ceramic-electrode', { brick: 1, 'copper-wire': 1, 'conductive-slurry': 1 }, 10, 'Advanced Assembler');
add('mithril-mesh', { 'refined-mithril': 2, 'copper-wire': 1 }, 12, 'Advanced Assembler');
add('logic-substrate', { 'circuit-a': 2, 'ceramic-electrode': 1, 'refined-mithril': 1 }, 16, 'Advanced Assembler');
// Composite recipes live in recipes.ts, alongside the retained smart Refiner alternatives.
add('mythril-gear', { 'copper-gear': 4, 'mythril-plate': 1 }, 12, 'Assembler', { 'mythril-gear': 4 });
add('mythril-wire', { 'iron-wire': 4, 'mythril-plate': 1 }, 12, 'Assembler', { 'mythril-wire': 4 });
recipes['mythril-gear'].proposed = false;
recipes['mythril-wire'].proposed = false;
// Independent optional outputs per completed batch. Primary yields stay deterministic.
recipes['precision-controller'].chanceOutputs = [
  { item: 'metallic-fines', amount: 1, probability: .65 },
  { item: 'glassy-crust', amount: 1, probability: .08 },
];
recipes['advanced-actuator'].chanceOutputs = [
  { item: 'spent-flux', amount: 2, probability: .35 },
  { item: 'glassy-crust', amount: 1, probability: .05 },
];
add('sealed-frame', { 'simple-robot-frame': 1, 'hydraulic-actuator': 1, brick: 2 }, 18, 'Advanced Assembler');
add('cooled-gun', { 'simple-robot-gun': 1, coolant: 2, 'iron-plate': 2 }, 16, 'Advanced Assembler');
add('medium-suppression-bot', { 'sealed-frame': 1, 'cooled-gun': 1, 'basic-core': 1 }, 25, 'Advanced Assembler');
add('mithril-frame', { 'sealed-frame': 1, 'refined-mithril': 3, motor: 2 }, 24, 'Advanced Assembler');
add('focused-gun', { 'cooled-gun': 1, 'refined-mithril': 2, 'circuit-a': 2 }, 22, 'Advanced Assembler');
add('heavy-suppression-bot', { 'mithril-frame': 1, 'focused-gun': 1, 'hydro-core': 1 }, 40, 'Advanced Assembler');
add('servo-frame', { 'mithril-frame': 1, 'advanced-actuator': 2, 'precision-controller': 1 }, 32, 'Advanced Assembler');
add('pulse-cannon', { 'focused-gun': 1, 'precision-controller': 2, coolant: 4 }, 30, 'Advanced Assembler');
add('command-suppression-bot', { 'servo-frame': 1, 'pulse-cannon': 1, 'command-core': 1 }, 60, 'Advanced Assembler');
for (const [id, overrides] of Object.entries(balance.recipes)) Object.assign(recipes[id], overrides);
recipes['conductive-slurry'].name = 'Copper–Carbon Dispersion';
// Cores may share intermediaries, but may not depend on any core at any depth.
function assertNoCoreInputs(item, path = []) {
  assert.ok(!path.includes(item), `Recipe cycle: ${[...path,item].join(' -> ')}`);
  for (const input of Object.keys(recipes[item]?.inputs ?? {})) {
    assert.ok(!input.endsWith('-core'), `${item} consumes core ${input}`);
    assertNoCoreInputs(input, [...path,item]);
  }
}
for (const item of ['simple-core','basic-core','automata-core','hydro-core','shiny-core','command-core']) assertNoCoreInputs(item);

function merge(target, source, scale = 1) { for (const [key, value] of Object.entries(source)) target[key] = (target[key] ?? 0) + value * scale; }
function expand(item, amount = 1) {
  const result = { raw: {}, workSeconds: {}, byproducts: {} };
  const recipe = recipes[item];
  if (!recipe) {
    result.raw[item] = amount;
    result.workSeconds[item === 'water' ? 'lake-intake' : `extract:${item}`] = amount * (item === 'water' ? .25 : 5);
    return result;
  }
  const cycles = amount / recipe.primaryAmount;
  result.workSeconds[item] = cycles * recipe.seconds;
  for (const [output, count] of Object.entries(recipe.outputs)) if (output !== item) result.byproducts[output] = count * cycles;
  for (const output of recipe.chanceOutputs ?? []) result.byproducts[output.item] = (result.byproducts[output.item] ?? 0) + cycles * output.amount * output.probability;
  for (const [input, count] of Object.entries(recipe.inputs)) {
    const child = expand(input, count * cycles);
    merge(result.raw, child.raw); merge(result.workSeconds, child.workSeconds); merge(result.byproducts, child.byproducts);
  }
  return result;
}
const cores = ['automata-core', 'hydro-core', 'shiny-core', 'command-core'].map((core) => {
  const bill = expand(core);
  const machines = Object.fromEntries(Object.entries(bill.workSeconds).map(([operation, seconds]) => [operation, Math.ceil(seconds)]));
  return { core, ...bill, leanMachinesIncludingLab: Object.keys(machines).length + 1,
    leanSecondsPerCore: Math.max(...Object.values(bill.workSeconds)),
    peakMachinesIncludingLab: Object.values(machines).reduce((a, b) => a + b, 1), peakMachines: machines,
    minimumRateMachinesIncludingLab: Object.values(bill.workSeconds).reduce((n, seconds) => n + Math.ceil(seconds / 60), 1) };
});
const byId = Object.fromEntries(cores.map((core) => [core.core, core]));
assert.equal(byId['hydro-core'].raw.water, 9);
assert.equal(byId['shiny-core'].raw.mythril, 2);
assert.equal(byId['command-core'].raw.mythril, 3);
assert.ok(byId['command-core'].raw.water > byId['shiny-core'].raw.water);
assert.equal(byId['command-core'].byproducts.slag, byId['shiny-core'].byproducts.slag);
assert.equal(recipes['refined-mithril'].chanceOutputs, undefined);
assert.deepEqual(byId['shiny-core'].byproducts, { slag: 2 });
assert.ok(Math.abs(byId['command-core'].byproducts['metallic-fines'] - .65) < 1e-9);
const bots = [
  ['suppression-bot', 1], ['medium-suppression-bot', 3], ['heavy-suppression-bot', 8], ['command-suppression-bot', 20],
].map(([bot, strength]) => ({ bot, strength, ...expand(bot) }));
const output = { status: 'Implemented general baseline through tier 6; analytical estimates exclude support systems', assumptions: ['Unupgraded production and Extractors at five seconds; the intended lab consumes one of each required core per synchronized tick.',
  'Single-core chain tables are isolated production references. Full research requires all types simultaneously at the lab tick rate; minimum illustrative rate is one complete set per minute.',
  'Water intakes modeled at four units/second; upgrades can reduce intake count.',
  'No recycling credits, electricity, logistics, renewable forestry or deposit replacement in raw or node totals.',
  'Fractional totals represent average batch consumption, not fractional individual item movements.'], recipes, cores, bots, balanceRevision: balance, encounterUnlocks: encounters };
const coreOrder = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
const researchSpecs = [
  ['Hydrochemistry', 3, 8], ['Hydraulic Assembly', 3, 10],
  ['Fluid Routing', 4, 10], ['Sealed Robotics', 4, 12], ['Ore Separation', 4, 15],
  ['Mineral Recovery', 5, 15], ['Pressure Systems', 5, 45], ['Heavy Robotics', 5, 20], ['Precision Control', 5, 25],
  ['Autonomous Logistics', 6, 30], ['Command Robotics', 6, 35], ['Mineral Regeneration 2', 6, 90],
  ['High Pressure Intakes', 6, 100], ['Endgame Theory', 6, 40],
  ['Factory Templates', 4, 25],
  ['Hydro Processor 1', 4, 20], ['Advanced Assembler 1', 4, 20],
  ['Power Distribution', 4, 12], ['Tree Planter 1', 4, 25],
  ['Research Center 2', 5, 70], ['Mineral Recovery 1', 5, 55],
  ['Warehouse Logistics', 5, 55], ['Road Channels 1', 4, 2],
  ['Hydro Processor 2', 6, 100], ['Advanced Assembler 2', 6, 100], ['Area Expansion 2', 6, 150],
  ['Resource Golem Survey', 4, 12], ['Mineral Regeneration', 5, 20], ['Road Channels 2', 6, 130],
];
const unlockNames = new Set(['Hydrochemistry', 'Hydraulic Assembly', 'Fluid Routing', 'Sealed Robotics', 'Ore Separation',
  'Mineral Recovery', 'Heavy Robotics', 'Precision Control', 'Autonomous Logistics', 'Command Robotics',
  'Endgame Theory', 'Power Distribution', 'Resource Golem Survey', 'Mineral Regeneration', 'Road Channels 1']);
const qualityOfLifeNames = new Set(['Factory Templates', 'Warehouse Logistics', 'Road Channels 2', 'Area Expansion 2']);
output.research = researchSpecs.map(([name, tier, each]) => ({ name, tier: balance.research[name]?.tier ?? tier, each: balance.research[name]?.each ?? each }))
 .map(({name,tier,each}) => ({ name, tier, each,
  pricingClass: unlockNames.has(name) ? 'unlock' : qualityOfLifeNames.has(name) ? 'quality-of-life' : 'efficiency',
  ...(each === 0 ? { milestone: balance.research[name]?.milestone ?? 'Produce the first Hydro Core' } : {}),
  costs: each === 0 ? {} : Object.fromEntries(coreOrder.slice(0, tier).map((core) => [core, each])) }));
output.pricingPolicy = {
  principle: 'Affordable capability unlocks; escalating optional efficiency and quality-of-life investments. Equal quantities of all required cores remain mandatory.',
  scope: 'Analytical subset of research projects using the adopted balance settings; the live research catalog is authoritative for the full project list.',
  unlockPrerequisiteChanges: {
    'Precision Control': ['Ore Separation', 'Mineral Recovery'],
    'Endgame Theory': ['Autonomous Logistics', 'Command Robotics', 'Mineral Regeneration', 'Precision Control'],
  },
  dependencyRule: 'An optional efficiency or quality-of-life upgrade must not be required merely to access the next core tier.',
  priceBands: [3, 4, 5, 6].map(tier => {
    const projects = output.research.filter(p => p.tier === tier);
    const unlocks = projects.filter(p => p.pricingClass === 'unlock').map(p => p.each);
    const improvements = projects.filter(p => p.pricingClass !== 'unlock').map(p => p.each);
    return { tier, unlockEach: [Math.min(...unlocks), Math.max(...unlocks)],
      improvementEach: improvements.length ? [Math.min(...improvements), Math.max(...improvements)] : null };
  }),
  groups: ['unlock', 'efficiency', 'quality-of-life'].map(pricingClass => {
    const projects = output.research.filter(p => p.pricingClass === pricingClass);
    return { pricingClass, count: projects.length, iterations: projects.reduce((sum, p) => sum + p.each, 0),
      coreItems: projects.reduce((sum, p) => sum + p.each * p.tier, 0) };
  }),
};
const proposedByName = new Map(output.research.map(p => [p.name, p]));
for (const [first, second] of [['Hydro Processor 1', 'Hydro Processor 2'], ['Advanced Assembler 1', 'Advanced Assembler 2'],
  ['Pressure Systems', 'High Pressure Intakes'], ['Road Channels 1', 'Road Channels 2'], ['Mineral Regeneration', 'Mineral Regeneration 2']]) {
  assert.ok(proposedByName.get(second).each > proposedByName.get(first).each);
}
for (const band of output.pricingPolicy.priceBands) if (band.improvementEach) assert.ok(band.improvementEach[0] > band.unlockEach[1]);
output.frameworkResearch = [
  { name: 'Factory Templates', prerequisites: ['Hydraulic Assembly'], effect: 'Paid core research for saved layouts and batch placement previews; existing duplicate controls remain available.' },
  { name: 'Hydro Processor 1', prerequisites: ['Hydraulic Assembly'], effect: 'Hydro Processor cycles use 90% of base time; ingredient quantities and yields stay unchanged.' },
  { name: 'Advanced Assembler 1', prerequisites: ['Hydraulic Assembly'], effect: 'Advanced Assembler cycles use 90% of base time.' },
  { name: 'Power Distribution', prerequisites: ['Basic Electricity', 'Hydraulic Assembly'], effect: 'Dedicated Power Conduits carry 25 existing power units per second, without single-unit cable particles or a change in generation yield.' },
  { name: 'Tree Planter 1', prerequisites: ['Tree Planter', 'Power Distribution'], effect: 'Tree Planter cycles use 90% of base time; each growth unit still consumes five power units.' },
  { name: 'Research Center 2', prerequisites: ['Ore Separation', 'Research Center 1'], effect: 'Research Center cycle uses 80% of base time; replaces the 90% factor rather than multiplying it.' },
  { name: 'Mineral Recovery 1', prerequisites: ['Mineral Recovery'], effect: 'Slag washing and recovered Brick/Iron recipes take 10% less time after any applicable family modifier; no extra material recovery.' },
  { name: 'Warehouse Logistics', prerequisites: ['Ore Separation', 'Fluid Routing'], effect: 'Dedicated one-item Warehouse holds 250 items with a filtered outlet; Inventory retrieval stays a later unlock.' },
  { name: 'Road Channels 1', prerequisites: ['Road', 'Ore Separation'], effect: 'Allows two one-way Road channels per direction. Each carries one solid item every five seconds; fluids cannot use roads.' },
  { name: 'Hydro Processor 2', prerequisites: ['Hydro Processor 1', 'Precision Control'], effect: 'Hydro Processor cycles use 80% of base time, replacing the 90% factor.' },
  { name: 'Advanced Assembler 2', prerequisites: ['Advanced Assembler 1', 'Precision Control'], effect: 'Advanced Assembler cycles use 80% of base time, replacing the 90% factor.' },
  { name: 'Area Expansion 2', prerequisites: ['Area Expansion 1', 'Precision Control'], effect: 'Field dimensions use a 1.5 multiplier over tier-scaled base dimensions, replacing 1.25.' },
  { name: 'Resource Golem Survey', prerequisites: ['Sealed Robotics'], effect: 'Reveals four mineral Golems in separate clear tier 6 sectors. Each requires 10,000 AP once, then becomes an infinite mineral reserve with four star connections for Extractors.' },
  { name: 'Mineral Regeneration', prerequisites: ['Mineral Recovery'], effect: 'Proposed base recovery of one unit per 30 seconds in ordinary non-wood deposits, up to capacity. Empty deposits remain to regenerate after this unlock; existing Deep Holes do not become deposits.' },
  { name: 'Mineral Regeneration 2', prerequisites: ['Mineral Regeneration', 'Precision Control'], effect: 'Proposed base regeneration improves to one unit per 15 seconds and opens indefinitely repeatable rate research. This replaces the earlier automated-drill proposal.' },
  { name: 'Road Channels 2', prerequisites: ['Road Channels 1', 'Precision Control'], effect: 'Allows four one-way Road channels per direction. Each carries one solid item every five seconds; fluids cannot use roads.' },
];
output.repeatableResearch = [
  { name: 'Mineral Regeneration Rate', tier: 6, firstCostEach: 40, growth: 1.5, effect: 'Each rank adds 20% of the post-Regeneration-2 base regeneration rate; no maximum rank.', source: 'D21' },
  { name: 'Storage Placement Capacity', tier: 6, firstCostEach: 50, growth: 1.5, effect: 'Each rank adds one Storage placement to the global cap; no maximum rank.', source: 'D19' },
  { name: 'Inventory Placement Capacity', tier: 6, firstCostEach: 50, growth: 1.5, effect: 'Each rank adds one Inventory placement to the global cap; no maximum rank.', source: 'D19' },
  { name: 'Storage Connection Capacity', tier: 6, firstCostEach: 40, growth: 1.5, effect: 'Each rank adds one permitted connection per Storage; no maximum rank.', source: 'D19' },
  { name: 'Inventory Connection Capacity', tier: 6, firstCostEach: 40, growth: 1.5, effect: 'Each rank adds one permitted output connection per Inventory; Inventory still initially connects only to Filters.', source: 'D19' },
  { name: 'Global Pool Item Capacity', tier: 7, firstCostEach: 50, growth: 1.5, effect: 'Indefinitely increases per-item limits in the one global transfer pool. Starting limits and capacity gains remain open.', source: 'D23/D25' },
];
output.endgameResearch = [{ name: 'Automatic Inventory Selection', tier: 7, costEach: 150,
  effect: 'Proposed research gate for exact-input-port selection, allowing a direct Inventory connection to a configured machine. Filters remain available. Research versus world-condition gate is still open.', source: 'D24' },
  { name: 'Monster Node Assault', tier: 7, costEach: 30, effect: 'Proposed access/targeting preparation for tier-10 Monster Nodes. Research does not defeat them; factory-supplied combat does. Encounter counts and delivery requirements remain open.', source: 'D01/D10' }];
for (const project of output.repeatableResearch) {
  const prices = Array.from({ length: 5 }, (_, rank) => Math.ceil(project.firstCostEach * project.growth ** rank));
  assert.ok(prices.every((price, i) => i === 0 || price > prices[i - 1]));
}
assert.equal(output.research.length, 29);
assert.equal(output.research.filter(r => !r.milestone).length, 28);
assert.equal(new Set(output.research.map(r => r.name)).size, output.research.length);
output.researchTotals = {};
output.researchRaw = {};
for (const project of output.research) {
  assert.equal(new Set(Object.values(project.costs)).size, project.milestone ? 0 : 1);
  merge(output.researchTotals, project.costs);
  for (const [core, count] of Object.entries(project.costs)) merge(output.researchRaw, expand(core, count).raw);
}
output.researchCoreItems = Object.values(output.researchTotals).reduce((sum, count) => sum + count, 0);
output.researchTicks = output.research.reduce((sum, project) => sum + project.each, 0);
assert.equal(output.researchCoreItems, output.research.reduce((n,p)=>n+p.each*p.tier,0));
assert.equal(output.researchTicks, output.researchTotals['simple-core']);
function bill(costs) {
  const result = { raw: {}, workSeconds: {}, byproducts: {} };
  for (const [core, count] of Object.entries(costs)) {
    const expanded = expand(core, count);
    for (const key of Object.keys(result)) merge(result[key], expanded[key]);
  }
  return result;
}
function capacity(workSeconds, periodSeconds) {
  const machines = Object.fromEntries(Object.entries(workSeconds).map(([operation, seconds]) => [operation, Math.ceil(seconds / periodSeconds - 1e-9)]));
  return { machines, productionAndLabNodes: Object.values(machines).reduce((sum, n) => sum + n, 1) };
}
const legacyIds = new Set(['assembler','exploration','road','automataCore','extractor1','kiln1','smelter1','refiner1','assembler1','researchCenter1','extractor2','kiln2','smelter2','refiner2','assembler2','areaExpansion1','treePlanter','miningDrill']);
const fixed = {};
for (const project of JSON.parse(readFileSync('outputs/progression/analysis.json', 'utf8')).projects.filter(p => legacyIds.has(p.id))) {
  for (const [core, cost] of Object.entries(project.costs)) fixed[core] = (fixed[core] ?? 0) + (balance.existingResearchEach[project.id] ?? cost);
}
const allCosts = { ...output.researchTotals }; merge(allCosts, fixed);
const aggregate = bill(allCosts);
const totalTicks = Object.values(allCosts).reduce((sum, n) => sum + n, 0);
output.recalculation = {
  goal: 'Perfect play completes all existing fixed research and all 29 proposed fixed projects through tier 6 within 10800 seconds. Optional repeatable ranks, tier-7 projects, Map Node repeats and combat manufacture are additional.',
  allCosts, ...aggregate, totalCoreItems: totalTicks,
  totalTicks: allCosts['simple-core'], baseLabSeconds: allCosts['simple-core'],
  optimisticUpgradedLabSeconds: allCosts['simple-core'] * .9,
  nonResearchTimeBudgetSeconds: 10800 - allCosts['simple-core'],
  mixedEnvelopes: [3, 4, 5, 6].map((tier) => {
    const set = Object.fromEntries(coreOrder.slice(0, tier).map((core) => [core, 1]));
    const b = bill(set);
    return { tier, coreSet: set, ...b,
      leanProductionAndLabNodes: Object.keys(b.workSeconds).length + 1,
      leanSecondsPerSet: Math.max(...Object.values(b.workSeconds)),
      slowOneSetPerMinute: capacity(b.workSeconds, 60),
      balancedFullBaseLab: capacity(b.workSeconds, 1),
      balancedFullUpgradedLab: capacity(b.workSeconds, .9),
      balancedFullResearchCenter2: capacity(b.workSeconds, .8),
      unbufferedAllTypesPerSecond: capacity(b.workSeconds, 1),
    };
  }),
};
const phaseDefs = [
  { phase: 'Existing levels 1–3', startMinute: 0, endMinute: 20, costs: fixed },
  { phase: 'Hydro and Shiny unlock', startMinute: 20, endMinute: 50, projects: output.research.filter(p => p.tier <= 4) },
  { phase: 'Shiny and Complex unlock', startMinute: 50, endMinute: 90, projects: output.research.filter(p => p.tier === 5) },
  { phase: 'Complex through Endgame Theory', startMinute: 90, endMinute: 180, projects: output.research.filter(p => p.tier === 6) },
];
output.recalculation.phases = phaseDefs.map((phase) => {
  const costs = { ...(phase.costs ?? {}) };
  for (const project of phase.projects ?? []) merge(costs, project.costs);
  const b = bill(costs);
  const seconds = (phase.endMinute - phase.startMinute) * 60;
  const ticks = costs['simple-core'];
  const effectiveTick = phase.projects?.some(p => p.tier === 6) ? .8 : 1;
  assert.ok(ticks * effectiveTick <= seconds);
  return { phase: phase.phase, startMinute: phase.startMinute, endMinute: phase.endMinute, costs, ...b,
    labSeconds: ticks, baseLabUtilization: ticks / seconds, downtimeAllowanceSeconds: seconds - ticks,
    averageWindowCapacity: capacity(b.workSeconds, seconds),
    plannedWindowCapacityWithReserve: capacity(b.workSeconds, seconds * .75) };
});
const checkRaw = {};
for (const phase of output.recalculation.phases) merge(checkRaw, phase.raw);
assert.deepEqual(checkRaw, aggregate.raw);
assert.equal(output.recalculation.phases.reduce((n, phase) => n + phase.labSeconds, 0), output.recalculation.totalTicks);
assert.equal(totalTicks, Object.values(allCosts).reduce((n,q)=>n+q,0));
assert.equal(output.recalculation.totalTicks, fixed['simple-core'] + output.researchTicks);
output.recalculation.optimisticResearchCenter2LabSeconds = output.recalculation.totalTicks * .8;
const phases = output.recalculation.phases;
// Complete the old fixed catalog first, gaining Research Center 1; prioritize
// Research Center 2 as the first paid Shiny project. Both upgrade projects use
// the previous lab speed while they are being researched.
const lab2=proposedByName.get('Research Center 2');
output.recalculation.recommendedLabScheduleSeconds = phases.reduce((sum,phase,i)=>{
 if(i===0)return sum+phase.labSeconds;
 if(i===(lab2.tier<=4?1:lab2.tier===5?2:3))return sum+lab2.each*.9+(phase.labSeconds-lab2.each)*.8;
 return sum+phase.labSeconds*(i===1?.9:.8);
},0);
function mapTicks(maps) {
  let ticks = 0;
  for (let completion = 0; completion < Math.max(0, maps - 2); completion++) {
    const amount = completion < 3 ? 5 * (completion + 1) : 10 + 5 * Math.min(completion - 3, 19);
    ticks += amount;
  }
  return ticks;
}
const capacities = [];
for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
  const tier = Math.abs(x - 5) + Math.abs(y - 5);
  if (tier > 0 && tier < 10) capacities.push(1000 + 500 * tier);
}
capacities.sort((a, b) => b - a);
let copperCapacity = 1000, copperMaps = 1;
while (copperCapacity < aggregate.raw.copper) copperCapacity += capacities[copperMaps++ - 1];
output.recalculation.expansion = {
  optimisticCopperMapsWithoutDrilling: copperMaps,
  note: 'Uses richest map capacities first plus Home, ignoring adjacency, map-research materials and recycling. This is an optimistic bound, not a travel route.',
  repeatTicksAtCopperMapBound: mapTicks(copperMaps),
  minimumBaseLabSecondsWithoutDrilling: output.recalculation.totalTicks + mapTicks(copperMaps),
  optionalSurveyGrantProposal: [
    ['Hydrochemistry', 4], ['Hydraulic Assembly', 4], ['Fluid Routing', 6], ['Ore Separation', 8],
    ['Pressure Systems', 8], ['Precision Control', 8], ['Autonomous Logistics', 8], ['Mineral Regeneration 2', 12],
  ],
  mapsWithExplorationAndAllSurveyGrants: 60,
  surveyGrantsRequiredByLabBudget: false,
  noteOnSurveyGrants: 'Earlier free-survey suggestion is no longer necessary to repair lab time after correcting synchronized research. Map progression remains open under D16.',
};
assert.ok(copperMaps > 0);
output.recalculation.buffering = {
  largestProjectCountPerType: Math.max(...output.research.map(p => p.each)), tiers: 6,
  idealReservoirCalculation: 'Not specified; size for route batch size, travel and safety margin, not the number of core types.',
  suggestedReservoirPerType: null, chestCapacity: 20, chestCountAllSixTypes: null,
  note: 'Research consumes one of each required core in the same tick. All required types must sustain one per tick; reservoirs absorb transport jitter but cannot divide the required production rate by the number of types.',
};
assert.equal(Object.values(proposedByName.get('Autonomous Logistics').costs).reduce((a,n)=>a+n,0),proposedByName.get('Autonomous Logistics').each*6);
writeFileSync('outputs/progression/core-design.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify({ totals: { coreCosts: allCosts, raw: aggregate.raw, coreItems: totalTicks, synchronizedBatches: output.recalculation.totalTicks },
  phases: output.recalculation.phases.map(p => ({ phase: p.phase, labSeconds: p.labSeconds, nodes: p.averageWindowCapacity.productionAndLabNodes, plannedNodes: p.plannedWindowCapacityWithReserve.productionAndLabNodes, raw: p.raw })),
  envelopes: output.recalculation.mixedEnvelopes.map(e => ({ tier: e.tier, lean: e.leanProductionAndLabNodes,
    leanSeconds: e.leanSecondsPerSet, slow: e.slowOneSetPerMinute.productionAndLabNodes,
    balanced: e.balancedFullBaseLab.productionAndLabNodes, upgraded: e.balancedFullUpgradedLab.productionAndLabNodes,
    unbuffered: e.unbufferedAllTypesPerSecond.productionAndLabNodes })) }, null, 2));
