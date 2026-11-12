import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    const extensionless = specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier);
    return next(extensionless ? specifier + '.ts' : specifier, context);
  },
});

const { GameEngine, createInitialState } = await import('../../src/simulation/engine.ts');
const { RECIPES, RECIPE_GROUPS, RETIRED_RECIPES } = await import('../../src/content/recipes.ts');
const { getEfficiencyMultiplier, getRecoveryMultiplier } = await import('../../src/content/efficiency.ts');
const { getNodeCapabilities } = await import('../../src/content/nodeCapabilities.ts');
const { NODE_DEFINITIONS, isNodeUnlocked, getEffectiveNodeInputFamilies } = await import('../../src/content/nodes.ts');
const { getResearchProject, getResearchCosts, isResearchAvailable } = await import('../../src/content/research.ts');
const { RECYCLER_RECOVERY } = await import('../../src/content/recycling.ts');
const { BOT_BUILDS } = await import('../../src/content/botAssembly.ts');
const { golemApCost } = await import('../../src/content/resourceGolems.ts');
const { ALPHA_AP } = await import('../../src/content/endgame.ts');

const moved = ['mithril-mesh', 'efficient-mythril-mesh', 'composite-mythril-gear', 'composite-mythril-wire'];
const originalGroups = structuredClone(RECIPE_GROUPS);
const originalProducer = Object.fromEntries(Object.entries(originalGroups).flatMap(([kind, ids]) => ids.map(id => [id, kind])));
const proposedProducer = { ...originalProducer, ...Object.fromEntries(moved.map(id => [id, 'separationFurnace'])) };
const ranks = ['advancedAssembler1', 'advancedAssembler2', 'assembler1', 'assembler2'];
const progressed = ['road', 'lakeTools', 'hydrochemistry', 'assembler', 'automataCore', 'fabricatorTools',
  'hydraulicAssembly', 'fluidRouting', 'mithrilTools', 'oreSeparation', 'precisionControl',
  'efficientIntermediates', 'efficientHigherIntermediates', 'suppressionBot', 'sealedRobotics',
  'heavyRobotics', 'commandRobotics', 'finalRobotics', 'resourceGolemSurvey', 'recycler'];
const rawItems = new Set(['iron', 'copper', 'mythril', 'wood', 'stone', 'water']);
const put = (bag, item, delta) => { bag[item] = (bag[item] ?? 0) + delta; };
const round = value => Math.round(value * 1000) / 1000;

function machine(id, kind, x, y, extra = {}) {
  return { id, kind, name: NODE_DEFINITIONS[kind].name, x, y, rotation: 0, input: {}, output: {},
    cycleMs: 1000, progressMs: 0, constructedAt: 0, constructionMs: 0, ...extra };
}

function fixture(nodes, research) {
  const state = createInitialState(204);
  state.research.completed = [...research];
  state.research.unlocked.push(...research);
  state.sectors['5,5'].nodes = nodes;
  return new GameEngine(state, { autosave: false });
}

function runUntil(engine, predicate, limit = 240000, tick = 100) {
  for (let elapsed = 0; elapsed <= limit; elapsed += tick) {
    if (predicate()) return elapsed;
    if (elapsed < limit) engine.tick(tick);
  }
  return null;
}

function withTransfers(run) {
  for (const id of moved) RECIPE_GROUPS[originalProducer[id]] = RECIPE_GROUPS[originalProducer[id]].filter(candidate => candidate !== id);
  RECIPE_GROUPS.separationFurnace.push(...moved);
  try { return run(); }
  finally { for (const [kind, ids] of Object.entries(originalGroups)) RECIPE_GROUPS[kind] = [...ids]; }
}

function wiredBatch(id, kind, completed, oldKind) {
  const recipe = RECIPES[id];
  const inputs = Object.entries(recipe.inputs);
  const sources = inputs.map(([item, count], index) => machine(
    'source-' + index, ['water', 'coolant'].includes(item) ? 'fluidStorage' : 'woodenChest', 360, 370 + index * 420,
    { output: { [item]: count * 3 } },
  ));
  const separateWaste = id === 'efficient-mythril-mesh';
  const drains = separateWaste ? [
    machine('product-filter', 'filter', 1650, 790, { filterItem: 'mithril-mesh' }),
    machine('waste-filter', 'filter', 2050, 1120, { filterItem: 'glassy-crust' }),
    machine('mesh-sink', 'warehouse', 2160, 550),
    machine('crust-sink', 'warehouse', 2560, 1000),
    machine('flux-sink', 'warehouse', 2560, 1380),
  ] : [];
  const engine = fixture([...sources, machine('producer', kind, 1300, 790), ...drains,
    ...(oldKind ? [machine('former-producer', oldKind, 2000, 1500)] : [])], completed);
  if (oldKind) assert.equal(engine.setRecipe('former-producer', id), false, id + ' remains selectable at its old producer');
  assert(engine.setRecipe('producer', id), id + ' could not be selected at ' + kind);
  const node = engine.getSector().nodes.find(candidate => candidate.id === 'producer');
  assert.deepEqual(getEffectiveNodeInputFamilies(node, completed), inputs.map(([item]) => item));
  inputs.forEach(([item], index) => assert(engine.connectPorts('source-' + index, 0, node.id, index), 'Wiring ' + id + ' ' + item));
  if (separateWaste) {
    const routes = [['producer', 0, 'product-filter'], ['product-filter', 0, 'mesh-sink'],
      ['product-filter', 1, 'waste-filter'], ['waste-filter', 0, 'crust-sink'], ['waste-filter', 1, 'flux-sink']];
    for (const [from, port, to] of routes) assert(engine.connectPorts(from, port, to, 0), 'Wiring ' + from + ' to ' + to);
  }
  const startMs = runUntil(engine, () => node.batch || node.progressMs > 0, 60000);
  const remainingMs = runUntil(engine, () => Object.values(node.output).some(Boolean), 60000);
  assert.notEqual(startMs, null);
  assert.notEqual(remainingMs, null);
  const outputs = { ...node.output };
  assert.deepEqual(outputs, recipe.outputs);
  const firstOutputSeconds = (startMs + remainingMs) / 1000;
  const result = { recipe: recipe.name, machine: NODE_DEFINITIONS[kind].name, firstOutputSeconds,
    batchSeconds: (remainingMs + 100) / 1000, outputs, capacity: node.capacity ?? getNodeCapabilities(kind).defaultCapacity ?? 5 };
  if (separateWaste) {
    const sinkItems = { 'mesh-sink': 'mithril-mesh', 'crust-sink': 'glassy-crust', 'flux-sink': 'spent-flux' };
    const sinks = Object.entries(sinkItems).map(([id, item]) => [engine.getSector().nodes.find(n => n.id === id), item]);
    const amount = (sink, item) => (sink.input[item] ?? 0) + (sink.output[item] ?? 0);
    const sent = runUntil(engine, () => sinks.every(([sink, item]) => amount(sink, item) === 3 * recipe.outputs[item]), 120000);
    assert.notEqual(sent, null, kind + ' did not drain three batches');
    result.threeBatches = {
      secondsToDrain: firstOutputSeconds + sent / 1000,
      received: Object.fromEntries(sinks.map(([sink, item]) => [item, amount(sink, item)])),
    };
  }
  return result;
}

const wired = {};
for (const [name, completed] of Object.entries({
  base: progressed,
  originRank2SynthesizerRank0: [...progressed, ...ranks],
  allRank2: [...progressed, ...ranks, 'separationFurnace1', 'separationFurnace2'],
})) {
  const current = moved.map(id => wiredBatch(id, originalProducer[id], completed));
  const proposed = withTransfers(() => moved.map(id => wiredBatch(id, proposedProducer[id], completed, originalProducer[id])));
  assert.deepEqual(proposed.map(x => x.outputs), current.map(x => x.outputs));
  if (name !== 'originRank2SynthesizerRank0') {
    assert.deepEqual(proposed.map(x => x.firstOutputSeconds), current.map(x => x.firstOutputSeconds));
    assert.deepEqual(proposed.map(x => x.threeBatches), current.map(x => x.threeBatches));
  }
  wired[name] = { current, proposed };
}

const hydroPorts = ['coolant', 'conductive-slurry'].map(id => {
  const inputs = Object.keys(RECIPES[id].inputs);
  assert.equal(inputs.indexOf('water'), 0);
  return { ...wiredBatch(id, 'hydroProcessor', progressed), inputPorts: inputs };
});

function verifyMythrilGate() {
  const existing = ['assembler', 'automataCore', 'fabricatorTools', 'lakeTools', 'hydrochemistry',
    'hydraulicAssembly', 'fluidRouting', 'suppressionBot', 'sealedRobotics'];
  const engine = fixture([machine('dwarven', 'monster-camp', 2100, 1500, {
    lizardSettlement: 'camp', settlementMapTier: 4, attackRequirement: 6, campStrength: 25,
    obstructionMaxRadius: 600, input: { 'medium-suppression-bot': 4 },
  })], existing);
  const completed = () => engine.getState().research.completed;
  assert(!isNodeUnlocked('separationFurnace', engine.getState().research.unlocked));
  const oreSeparationCanBeResearchedBeforeMythril = isResearchAvailable(getResearchProject('oreSeparation'), completed());
  const firstTributeMs = runUntil(engine, () => completed().includes('mithrilTools'));
  assert.notEqual(firstTributeMs, null);
  assert(isNodeUnlocked('separationFurnace', engine.getState().research.unlocked));
  return { oreSeparationCanBeResearchedBeforeMythril, firstTributeAndSynthesizerSeconds: firstTributeMs / 1000,
    mediumBotsInFixture: 4, apPerCheck: 6, oreSeparationStillNeededForCleanMesh: !completed().includes('oreSeparation') };
}

function planOrder(targetId, amount, scenario, useEfficient) {
  const producer = scenario === 'current' ? originalProducer : proposedProducer;
  const overrides = { 'mythril-gear': 'composite-mythril-gear', 'mythril-wire': 'composite-mythril-wire',
    ...(useEfficient ? { 'mithril-mesh': 'efficient-mythril-mesh' } : {}) };
  const byProduct = {};
  for (const [id, recipe] of Object.entries(RECIPES)) {
    if (!producer[id] || RETIRED_RECIPES.has(id) || recipe.recovery || id.startsWith('assemble-bot-')
      || id.startsWith('efficient-') || id.startsWith('composite-')) continue;
    byProduct[Object.keys(recipe.outputs)[0]] = id;
  }
  Object.assign(byProduct, overrides);
  const needs = {};
  const plannedBatches = {};
  const raw = {};
  const expectedWaste = {};
  function plan(id, required) {
    const recipe = RECIPES[id];
    const mainOutput = Object.keys(recipe.outputs)[0];
    const before = plannedBatches[id] ?? 0;
    put(needs, id, required);
    const batches = Math.ceil(needs[id] / recipe.outputs[mainOutput]);
    const extra = batches - before;
    if (!extra) return;
    plannedBatches[id] = batches;
    for (const [item, units] of Object.entries(recipe.inputs)) {
      if (rawItems.has(item)) put(raw, item, units * extra);
      else {
        assert(byProduct[item], 'Unknown upstream producer for ' + item);
        plan(byProduct[item], units * extra);
      }
    }
    for (const [item, units] of Object.entries(recipe.outputs).slice(1)) put(expectedWaste, item, units * extra);
  }
  const target = RECIPES[targetId];
  plan(targetId, amount);
  const stock = { ...raw };
  const remaining = { ...plannedBatches };
  const events = new Map();
  const targetCompletions = [];
  let now = 0;
  while (targetCompletions.length < plannedBatches[targetId]) {
    for (const [id, end] of events) {
      if (end !== now) continue;
      for (const [item, count] of Object.entries(RECIPES[id].outputs)) put(stock, item, count);
      if (id === targetId) targetCompletions.push(now / 1000);
      events.delete(id);
    }
    if (targetCompletions.length === plannedBatches[targetId]) break;
    // Give shared intermediates to the branch furthest behind its order quota.
    const readyOrder = Object.entries(remaining).sort(([a, leftA], [b, leftB]) =>
      leftB / plannedBatches[b] - leftA / plannedBatches[a]);
    for (const [id, batches] of readyOrder) {
      if (!batches || events.has(id)) continue;
      const recipe = RECIPES[id];
      if (!Object.entries(recipe.inputs).every(([item, count]) => (stock[item] ?? 0) >= count)) continue;
      for (const [item, count] of Object.entries(recipe.inputs)) put(stock, item, -count);
      remaining[id]--;
      const speedKind = scenario === 'moved-native' ? producer[id] : originalProducer[id];
      const multiplier = getEfficiencyMultiplier(getNodeCapabilities(speedKind).efficiencyFamily, ranks);
      events.set(id, now + Math.round(recipe.cycleMs * multiplier * getRecoveryMultiplier(recipe, progressed)));
    }
    assert(events.size, 'Factory deadlock for ' + targetId);
    now = Math.min(...events.values());
  }
  assert.deepEqual(Object.keys(raw).filter(item => stock[item] !== 0), []);
  const first = targetCompletions[0];
  const last = targetCompletions.at(-1);
  const half = Math.floor(targetCompletions.length / 2);
  return { firstSeconds: first, finishSeconds: last, amount, rawConsumed: raw, byproducts: expectedWaste,
    sustainedPerMinute: half > 0 ? round((targetCompletions.length - half - 1) * 60 / (last - targetCompletions[half])) : null,
    productionNodes: Object.keys(plannedBatches).length };
}

const heavy = BOT_BUILDS.find(build => build.frameTier === 3 && build.gunTier === 3);
const command = BOT_BUILDS.find(build => build.frameTier === 4 && build.gunTier === 4);
const encounterOrders = {
  'Other Golem': { ap: golemApCost({ golemMineral: 'iron' }), bot: heavy },
  'Mythril Golem': { ap: golemApCost({ golemMineral: 'mythril' }), bot: heavy },
  'Ancient Dragon': { ap: ALPHA_AP, bot: command },
};
const modeled = {};
for (const scenario of ['current', 'moved-parity', 'moved-native']) {
  modeled[scenario] = {
    firstHydro: planOrder('hydro-core', 1, scenario, false),
    firstShiny: planOrder('shiny-core', 1, scenario, false),
    firstShinyEfficientMesh: planOrder('shiny-core', 1, scenario, true),
    firstHeavyBot: planOrder(heavy.recipe.id, 1, scenario, false),
    sustainedHeavyBots: planOrder(heavy.recipe.id, 40, scenario, false),
    sustainedCommandBots: planOrder(command.recipe.id, 40, scenario, true),
    encounters: Object.fromEntries(Object.entries(encounterOrders).map(([name, { ap, bot }]) => {
      const count = Math.ceil(ap / bot.ap);
      return [name, { ap, botAp: bot.ap, bots: count, ...planOrder(bot.recipe.id, count, scenario, bot === command) }];
    })),
  };
}
assert.deepEqual(modeled.current, modeled['moved-parity']);

function verifyCrust() {
  const recovery = getResearchProject('recycler');
  const accessWithoutRecycler = progressed.filter(id => id !== 'recycler');
  assert(isNodeUnlocked('separationFurnace', accessWithoutRecycler));
  assert(!isNodeUnlocked('recycler', accessWithoutRecycler));
  const direct = wiredBatch('recover-crust', 'separationFurnace', accessWithoutRecycler);
  const elapsed = {};
  for (const withFines of [false, true]) {
    const engine = fixture([machine('recycler', 'recycler', 1300, 790)], progressed);
    const recycler = engine.getSector().nodes[0];
    const proposedRecovery = { ...RECYCLER_RECOVERY, 'glassy-crust': 'recover-crust' };
    // Emulate the proposed automatic recipe registration in this process only.
    Object.assign(RECYCLER_RECOVERY, proposedRecovery);
    let crustBatches = 0;
    let finesBatches = 0;
    try {
      for (let t = 0; t < 1200; t++) {
        recycler.input.water = 1;
        recycler.input['glassy-crust'] = 4;
        if (withFines) recycler.input['metallic-fines'] = 4;
        engine.tick(100);
        crustBatches += recycler.output['copper-plate'] ?? 0;
        finesBatches += recycler.output['iron-plate'] ?? 0;
        recycler.output = {};
        recycler.outputQueue = [];
      }
    } finally { delete RECYCLER_RECOVERY['glassy-crust']; }
    elapsed[withFines ? 'continuousFinesAndCrust' : 'continuousCrustOnly'] = { seconds: 120, crustBatches, finesBatches };
  }
  return { current: direct, separateRecyclerUnlockCost: getResearchCosts(recovery, 0, accessWithoutRecycler), proposed: elapsed };
}

const report = {
  kind: 'Headless fixture tests and discrete-event factory comparison',
  assumptions: [
    'Engine fixtures use prebuilt stations, staged ingredients, 100 ms ticks, and normal recipe and cable checks. No existing save or game source was modified.',
    'The factory model starts with raw materials in stock, machines built, and the necessary research complete. One dedicated station per recipe, unlimited internal transfer and storage, no construction, extraction, travel, or research time. Shared ingredients go first to the branch furthest behind its batch quota.',
    'Encounter times measure production of sufficient AP, excluding delivery, encounter placement and payment cadence. Efficient Mesh is already researched in the late and efficient comparison cases.',
    'Prototype parity uses the prior efficiency family per moved recipe in the model. The real-engine recipe checks cover equal and unequal machine ranks.',
    'The Crust contention test feeds full batches and drains output on every tick to isolate scheduling, independent of cable rates.',
  ],
  wired, hydroPorts, gates: verifyMythrilGate(), modeled, crust: verifyCrust(),
};
writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  wired: report.wired.originRank2SynthesizerRank0,
  hydroPorts: report.hydroPorts,
  gates: report.gates,
  milestones: Object.fromEntries(Object.entries(modeled).map(([name, row]) => [name, {
    hydro: row.firstHydro.finishSeconds, shiny: row.firstShiny.finishSeconds, efficientShiny: row.firstShinyEfficientMesh.finishSeconds,
    firstHeavyBot: row.firstHeavyBot.finishSeconds, heavyBotsPerMinute: row.sustainedHeavyBots.sustainedPerMinute,
    commandBotsPerMinute: row.sustainedCommandBots.sustainedPerMinute,
    encounters: Object.fromEntries(Object.entries(row.encounters).map(([key, result]) => [key, result.finishSeconds])),
  }])),
  crust: report.crust,
}, null, 2));
