// Read-only analytical scenarios. This never loads a save or runs the simulation.
import { strict as assert } from 'node:assert';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { RECIPES, RETIRED_RECIPES } = await server.ssrLoadModule('/src/content/recipes.ts');
  const { RESEARCH_PROJECTS, getResearchCosts } = await server.ssrLoadModule('/src/content/research.ts');
  const { ALPHA_AP, GROVE_GROWTH, FOUNDRY_INPUTS, RECLAMATION_VALUE, RECLAMATION_QUOTAS, RECLAMATION_PRODUCTION_TARGET_MS } = await server.ssrLoadModule('/src/content/endgame.ts');
  const { BOT_STRENGTH } = await server.ssrLoadModule('/src/content/progression.ts');
  const { getLizardSettlementForMapTier } = await server.ssrLoadModule('/src/content/lizardSettlements.ts');
  const { BASE_MOD_RULES } = await server.ssrLoadModule('/src/mods/modRules.ts');
  const cores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
  const add = (target, source, scale = 1) => {
    for (const [item, count] of Object.entries(source)) target[item] = (target[item] ?? 0) + count * scale;
    return target;
  };
  function model(patches = {}, composite = false) {
    const recipes = structuredClone(RECIPES);
    for (const [id, inputs] of Object.entries(patches)) Object.assign(recipes[id].inputs, inputs);
    const byOutput = {};
    for (const recipe of Object.values(recipes)) {
      if (recipe.recovery || RETIRED_RECIPES.has(recipe.id) || recipe.id.startsWith('efficient-') || recipe.id.startsWith('composite-')) continue;
      byOutput[Object.keys(recipe.outputs)[0]] = recipe;
    }
    if (composite) for (const id of ['composite-mythril-gear', 'composite-mythril-wire']) byOutput[Object.keys(recipes[id].outputs)[0]] = recipes[id];
    function expand(items, path = []) {
      const bill = { raw: {}, workSeconds: {}, byproducts: {} };
      for (const [item, count] of Object.entries(items)) {
        assert(!path.includes(item), `Recipe cycle: ${[...path, item].join(' -> ')}`);
        const recipe = byOutput[item];
        if (!recipe) {
          add(bill.raw, { [item]: count });
          add(bill.workSeconds, { [`extract:${item}`]: count * (item === 'water' ? 0.25 : 5) });
          continue;
        }
        const batches = count / recipe.outputs[item];
        add(bill.workSeconds, { [recipe.id]: batches * recipe.cycleMs / 1000 });
        for (const [waste, quantity] of Object.entries(recipe.outputs).slice(1)) add(bill.byproducts, { [waste]: batches * quantity });
        const upstream = expand(recipe.inputs, [...path, item]);
        add(bill.raw, upstream.raw, batches);
        add(bill.workSeconds, upstream.workSeconds, batches);
        add(bill.byproducts, upstream.byproducts, batches);
      }
      return bill;
    }
    // Raw Mythril is listed separately; acquisition support is added explicitly below.
    const unit = item => expand({ [item]: 1 });
    return { unit, expand, recipes };
  }
  const variants = {
    currentStandard: model(),
    currentComposite: model({}, true),
    proposedWire: model({ 'iron-wire': { 'iron-plate': 2 }, 'copper-wire': { 'copper-plate': 2 }, 'mythril-wire': { 'mythril-plate': 2 } }),
    proposedWireAndGun: model({ 'iron-wire': { 'iron-plate': 2 }, 'copper-wire': { 'copper-plate': 2 }, 'mythril-wire': { 'mythril-plate': 2 }, 'cooled-gun': { 'iron-plate': 1 } }),
  };
  const items = [...cores, 'motor', 'suppression-bot', 'medium-suppression-bot', 'heavy-suppression-bot', 'command-suppression-bot'];
  const unitBills = Object.fromEntries(Object.entries(variants).map(([name, m]) => [name, Object.fromEntries(items.map(item => [item, m.unit(item)]))]));
  assert.deepEqual(unitBills.currentStandard['simple-core'].raw, { copper: 8, wood: 4 });
  assert.deepEqual(unitBills.currentStandard['basic-core'].raw, { copper: 2, wood: 4, iron: 6 });
  assert.deepEqual(unitBills.currentStandard['hydro-core'].raw, { iron: 12, wood: 14, copper: 15, water: 9, stone: 1 });
  assert.deepEqual(unitBills.currentStandard['medium-suppression-bot'].raw, { iron: 34, wood: 27, copper: 20, water: 8, stone: 2 });

  const mediumStrength = BOT_STRENGTH['medium-suppression-bot'];
  function withMythrilSupport(m, bill, tier) {
    const settlement = getLizardSettlementForMapTier(tier);
    const botsPerMythril = settlement.attackRequirement / mediumStrength / (settlement.tributePerCycle * 12);
    const raw = { ...bill.raw };
    add(raw, m.unit('medium-suppression-bot').raw, (raw.mythril ?? 0) * botsPerMythril);
    return raw;
  }
  function withPaidForestry(raw) {
    // 100 growth costs 10 Wood + one Plate + one Stone = 11 harvested Wood + 2 Iron + 1 Stone.
    // Replanting its own 11 Wood leaves 89 useful Wood. Ignore passive regeneration.
    const growth = (raw.wood ?? 0) / 0.89;
    return { ...raw, wood: growth, iron: (raw.iron ?? 0) + growth * 0.02, stone: (raw.stone ?? 0) + growth * 0.01 };
  }
  const supplyScenarios = Object.fromEntries(Object.entries(variants).map(([name, m]) => [name, Object.fromEntries([4, 9].map(tier => [tier, Object.fromEntries(cores.map(core => [core, { acquisition: withMythrilSupport(m, m.unit(core), tier), sustainable: withPaidForestry(withMythrilSupport(m, m.unit(core), tier)) }]))]))]));

  const mapProject = RESEARCH_PROJECTS.find(p => p.id === 'mapNode');
  const allAccess = ['refiner', 'assembler', 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
  const hydroAccess = allAccess.slice(0, 4);
  const maps = [9, 10, 19, 20, 29, 30, 34, 39, 40, 49, 50, 59, 60, 119].map(purchase => {
    const quote = getResearchCosts(mapProject, purchase - 1);
    const hydroQuote = getResearchCosts(mapProject, purchase - 1, hydroAccess);
    return { purchase, quote, hydroQuote, currentRaw: variants.currentStandard.expand(quote).raw, proposedRaw: variants.proposedWire.expand(quote).raw, labSeconds: Math.max(...Object.values(quote)) * 5 };
  });
  const recordedMapCosts = {};
  // Match the report: Automata available by purchase 20; Hydro by purchase 30. Earlier tiers are not charged retroactively.
  for (let i = 0; i < 34; i++) add(recordedMapCosts, getResearchCosts(mapProject, i, hydroAccess));
  const recordedMapBill = variants.currentStandard.expand(recordedMapCosts);
  const proposedMapBill = variants.proposedWire.expand(recordedMapCosts);
  assert.deepEqual(recordedMapCosts, { 'simple-core': 339, 'basic-core': 294, 'automata-core': 214, 'hydro-core': 84 });

  const camps = [4, 5, 9].map(tier => {
    const s = getLizardSettlementForMapTier(tier);
    const botsPerMinute = s.attackRequirement / mediumStrength;
    return { tier, apPerMinute: s.attackRequirement, mythrilPerMinute: s.tributePerCycle * 12, mediumBotsPerMinute: botsPerMinute, finalAssemblersAtBaseSpeed: botsPerMinute / (60000 / RECIPES['medium-suppression-bot'].cycleMs), rawPerMinute: add({}, variants.currentStandard.unit('medium-suppression-bot').raw, botsPerMinute), proposedRawPerMinute: add({}, variants.proposedWireAndGun.unit('medium-suppression-bot').raw, botsPerMinute) };
  });
  const cornerScenario = () => {
    const alphaBots = Math.ceil(ALPHA_AP / mediumStrength);
    const foundry = { ...FOUNDRY_INPUTS };
    const grove = GROVE_GROWTH;
    return {
      alpha: { ap: ALPHA_AP, mediumBots: alphaBots, finalAssemblerHoursOneBase: alphaBots * RECIPES['medium-suppression-bot'].cycleMs / 3600000, raw: variants.currentStandard.expand({ 'medium-suppression-bot': alphaBots }).raw },
      foundry: { inputs: foundry, standardWithTier9AndPaidForestry: withPaidForestry(withMythrilSupport(variants.currentStandard, variants.currentStandard.expand(foundry), 9)), cartRoadHoursOneSharedLane: Object.values(foundry).reduce((a, b) => a + b, 0) / 12 / 60, trainRoadHoursOneSharedLane: Object.values(foundry).reduce((a, b) => a + b, 0) / 48 / 60 },
      grove: { growth: grove, directUpkeepRaw: { wood: grove * 0.11, iron: grove * 0.02, stone: grove * 0.01 }, includingPaidForestry: withPaidForestry({ wood: grove * 0.11, iron: grove * 0.02, stone: grove * 0.01 }), hoursTwoBasePlanters: grove / 2 / 3600, hoursEightIndustrialPlanters: grove / 80 / 3600 },
    };
  };
  const finesPerComplex = variants.currentStandard.unit('command-core').byproducts['metallic-fines'];
  const baseControllerFinesPerMinute = 60000 / RECIPES['precision-controller'].cycleMs * RECIPES['precision-controller'].outputs['metallic-fines'];
  const reclamation = {
    currentSingleTypeQuotas: RECLAMATION_QUOTAS,
    controllerFinesPerMinute: baseControllerFinesPerMinute,
    currentHoursTenBaseControllers: 1 / RECLAMATION_VALUE['metallic-fines'] / (10 * baseControllerFinesPerMinute) / 60,
    currentComplexCoresPerComponentAtStandardWasteYield: 1 / RECLAMATION_VALUE['metallic-fines'] / finesPerComplex,
  };
  const before = JSON.parse(readFileSync(new URL('../outputs/balance-review-2026-11-05/before-corner-balance.json', import.meta.url), 'utf8'));
  const baseProductionReferences = [
    { corner: 'alpha', recipe: 'medium-suppression-bot', item: 'medium-suppression-bot', quantity: Math.ceil(ALPHA_AP / mediumStrength) },
    ...Object.entries(FOUNDRY_INPUTS).map(([item, quantity]) => ({ corner: 'foundry', recipe: item, item, quantity })),
    ...[['metallic-fines', 'precision-controller'], ['spent-flux', 'efficient-hydro-piston'], ['glassy-crust', 'efficient-mythril-mesh'], ['slag', 'efficient-circuit-c']].map(([item, recipe]) => ({ corner: 'reclamation', recipe, item, quantity: RECLAMATION_QUOTAS[item] })),
  ].map(row => ({ ...row, seconds: row.quantity / RECIPES[row.recipe].outputs[row.item] * RECIPES[row.recipe].cycleMs / 1000 }));
  baseProductionReferences.push({ corner: 'grove', recipe: 'base Tree Planter', item: 'forest-growth', quantity: GROVE_GROWTH, seconds: GROVE_GROWTH });
  assert(baseProductionReferences.filter(row => row.corner === 'reclamation').every(row => row.seconds <= RECLAMATION_PRODUCTION_TARGET_MS / 1000));

  // Minimum capability path for the implemented victory route. Endgame Theory is
  // retired; transport and standard waste separation
  // are included. Encounter requirements and recipe inputs remain separate.
  const requiredIds = new Set();
  function requireProject(id) {
    if (requiredIds.has(id)) return;
    const p = RESEARCH_PROJECTS.find(project => project.id === id);
    assert(p, 'Unknown required project ' + id);
    requiredIds.add(id);
    for (const prerequisite of [p.prerequisite, ...(p.prerequisites ?? [])].filter(Boolean)) requireProject(prerequisite);
  }
  ['precisionControl', 'treePlanter', 'sealedRobotics', 'road', 'exploration', 'mithrilTools', 'lakeTools', 'fabricatorTools', 'cornerComponents', 'victory', 'finalCoreProduction'].forEach(requireProject);
  const requiredProjects = RESEARCH_PROJECTS.filter(p => requiredIds.has(p.id));
  const requiredBill = requiredProjects.reduce((bill, p) => add(bill, p.costs), {});
  assert.deepEqual(requiredBill, { 'simple-core': 30, 'basic-core': 29, 'automata-core': 24, 'hydro-core': 9, 'shiny-core': 3, 'command-core': 1, 'final-core': 1 });
  const count = bill => Object.values(bill).reduce((sum, n) => sum + n, 0);
  const routeExample = (access) => {
    const mapBill = {};
    for (let i = 0; i < 29; i++) add(mapBill, getResearchCosts(mapProject, i, access));
    const total = add({ ...requiredBill }, mapBill);
    return { mapNodePurchases: 29, additionalMaps: 30, mapBill, total, totalCoreItems: count(total) };
  };
  const requiredResearch = {
    projects: requiredProjects.map(p => ({ id: p.id, costs: p.costs, encounter: p.trigger })),
    fixedBill: requiredBill, fixedCoreItems: count(requiredBill),
    thirtyMapRouteWithAutomata: routeExample(hydroAccess),
    thirtyMapRouteDelayingAutomata: routeExample(['refiner', 'assembler']),
    caveats: [
      'The 30-map ideal forms an H: both outer columns plus the middle row, including Home. It reaches every corner with 30 new maps; Exploration supplies one point, leaving 29 repeat purchases.',
      'This is a geometric route-cost example, not a seed-independent solvability claim. Lake/Dwarven access and available resources can require extra maps; unlock order affects repeat prices.',
      'Basic Cores used inside Medium Bots are additional. Alpha alone needs 17 Medium Bots at 50 AP, consuming 17 Basic Cores and preserving one AP surplus; Dwarven Mythril upkeep adds more.',
      'Victory is explicitly selected at the Research Center and costs one each of all seven Core types. Endgame Theory is retired. Optional efficiencies, transport upgrades and post-victory research are excluded.',
    ],
  };
  const report = {
    date: '2026-11-05', type: 'analytical-recipe-review-and-explicit-corner-costs',
    assumptions: [
      'Live local catalogs; no mods, efficiency upgrades, recovery credits, buffers, startup, routing blockage, camp shrink/recovery time, travel or player setup.',
      'Recipe unit costs average complete batches. A fractional unit bill is not a first-item shopping list.',
      'Standard Mythril Gear/Wire unless explicitly labelled composite. Raw Mythril acquisition support and paid forestry are separate scenarios; no double credit for waste recovery.',
      'Work seconds sum demand per operation. They are machine work and ideal supply requirements, not predicted elapsed progression time.',
      'Corners proceed concurrently; do not add their ideal hours. Forestry rates assume enough upkeep, output room and direct growth connections.',
      'Reclamation Controller scenarios require useful-output sinks; neither represents measured average factory waste.',
      'Wire/Gun proposals exist only in cloned analytical catalogs. Explicit user-selected Alpha/Foundry/Grove quotas supersede five-minute sizing; Reclamation retains its five-minute target. Overall completion-time goals are not revalidated by this change.',
    ],
    unitBills, supplyScenarios, maps, requiredResearch,
    completedMapPurchases34: { costs: recordedMapCosts, currentRaw: recordedMapBill.raw, proposedWireRaw: proposedMapBill.raw },
    camps, corners: { before: before.corners.current, current: cornerScenario(), baseProductionReferences }, reclamation: { before: before.reclamation, current: reclamation },
    recovery: { motorCostTwentyCurrent: variants.currentStandard.expand({ motor: 20 }).raw, motorCostTwentyProposed: variants.proposedWire.expand({ motor: 20 }).raw, drillDeposit: 1000, naturalForestPerMinute: 60000 / BASE_MOD_RULES.forestRegenMs, ordinaryMineralRegenerationPerMinute: 2, improvedMineralRegenerationPerMinute: 4 },
    alternativeRecipeFollowup: { reason: 'Reducing Wire to two Plates removes the Copper savings of existing Efficient Circuit A/Motor; preserve their resource advantage if adopting this change.', proposedInputs: { 'efficient-circuit-a': { 'copper-plate': 1, 'iron-plate': 1 }, 'efficient-motor': { 'iron-plate': 2, 'copper-plate': 1 } }, note: 'Other inputs, cycles, guaranteed waste, unlocks and outputs stay as defined. Mythril/composite and fixed Recycler returns also need regression coverage before implementation.' },
  };
  for (const bills of Object.values(unitBills)) for (const bill of Object.values(bills)) for (const counts of Object.values(bill)) assert(Object.values(counts).every(n => Number.isFinite(n) && n >= 0));
  const output = new URL('../outputs/balance-review-2026-11-05/', import.meta.url);
  mkdirSync(output, { recursive: true });
  writeFileSync(new URL('analysis.json', output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checks: 'Known unit bills, map totals, cycle detection, finite quantities and Reclamation reference rates passed.', currentMedium: unitBills.currentStandard['medium-suppression-bot'].raw, proposedMedium: unitBills.proposedWireAndGun['medium-suppression-bot'].raw, cornerReferenceSeconds: baseProductionReferences.map(({ corner, item, seconds }) => ({ corner, item, seconds })), report: 'outputs/balance-review-2026-11-05/analysis.json' }, null, 2));
} finally {
  await server.close();
}
