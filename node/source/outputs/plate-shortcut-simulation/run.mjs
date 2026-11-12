import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { writeFileSync } from 'node:fs';

registerHooks({
  resolve(specifier, context, next) {
    return next(specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier) ? specifier + '.ts' : specifier, context);
  },
});

const { GameEngine, createInitialState } = await import('../../src/simulation/engine.ts');
const { RECIPES, RECIPE_GROUPS } = await import('../../src/content/recipes.ts');
const { generateSector } = await import('../../src/simulation/worldGeneration.ts');
const { getEfficiencyMultiplier } = await import('../../src/content/efficiency.ts');
const { isNodeUnlocked, NODE_DEFINITIONS } = await import('../../src/content/nodes.ts');
const { activateMod } = await import('../../src/mods/modContent.ts');
activateMod();

const HOME = '5,5';
const EAST = '6,5';
const RANKS = ['extractor1', 'extractor2', 'kiln1', 'kiln2', 'smelter1', 'smelter2'];
const ACCESS = ['road', 'roadChannels1', 'assembler', 'automataCore', 'fabricatorTools', 'lakeTools',
  'hydrochemistry', 'hydraulicAssembly', 'oreSeparation', 'precisionControl', 'mithrilTools', 'warehouseLogistics'];
const METALS = ['iron', 'copper'];
const TICK = 100;
const WARMUP = 120000;
const END = 720000;
const expectedOutputs = { iron: 'iron-plate', copper: 'copper-plate' };
const shortcutId = metal => 'prototype-' + metal + '-plate';

function withPrototype(completed, run) {
  const group = RECIPE_GROUPS.separationFurnace;
  for (const metal of METALS) {
    const id = shortcutId(metal);
    RECIPES[id] = {
      id, name: 'Direct ' + metal + ' plate', inputs: { [metal]: 2, wood: 1, water: 1 },
      outputs: { [expectedOutputs[metal]]: 1 },
      // Test the proposed inheritance without modifying the game's timing code.
      cycleMs: 8000 * getEfficiencyMultiplier('smelter', completed),
    };
    group.push(id);
  }
  try { return run(); }
  finally {
    group.splice(group.length - METALS.length, METALS.length);
    for (const metal of METALS) delete RECIPES[shortcutId(metal)];
  }
}

function simulate({ layout, recipe, ranks = [], vehicle = 'cart', hydroLoad = false, oreExtractors = 2 }) {
  const state = createInitialState(204);
  state.research.completed = [...ACCESS, ...ranks, ...(vehicle === 'truck' ? ['trucks'] : [])];
  state.research.unlocked.push(...state.research.completed);
  state.research.mapPoints = 1;
  state.sectors[EAST] = { ...generateSector(6, 5, 204), unlocked: true, visited: true };
  for (const sector of [state.sectors[HOME], state.sectors[EAST]]) {
    sector.nodes = [];
    sector.connections = [];
  }
  const local = layout === 'lake';
  const dry = layout === 'dry';
  const direct = recipe === 'direct';
  const processors = !local && !dry && direct ? EAST : HOME;
  const destination = local || dry ? HOME : EAST;
  const edges = [];
  const selections = [];
  const counters = {};
  function add(sectorId, id, kind, x, y, extra = {}) {
    state.sectors[sectorId].nodes.push({
      id, kind, name: NODE_DEFINITIONS[kind].name, x, y, rotation: 0,
      input: {}, output: {}, cycleMs: 1000, progressMs: 0, constructedAt: 0, constructionMs: 0, ...extra,
    });
  }
  function link(sector, from, to, toPort = 0, fromPort = 0) { edges.push({ sector, from, to, toPort, fromPort }); }
  function select(sector, id, recipeId) { selections.push({ sector, id, recipeId }); }
  function extract(sector, id, item, x, y) {
    const kind = item === 'wood' ? 'forest' : item;
    add(sector, id + '-reserve', kind, x, y, { resourceItem: item, resourceRemaining: 1000, resourceCapacity: 1000 });
    add(sector, id, 'extractor', x + 275, y);
    link(sector, id + '-reserve', id);
  }
  function roads(metal, y, materialSource) {
    const from = metal + '-road-out';
    const to = metal + '-road-in';
    add(HOME, from, 'road', 3532.5, y, { roadMode: 'export', roadFacing: 'west', pairedSectorId: EAST, pairedRoadId: to });
    add(EAST, to, 'road', 67.5, y, { roadMode: 'import', roadFacing: 'east', pairedSectorId: HOME, pairedRoadId: from });
    add(HOME, metal + '-send', 'woodenChest', 3100, y);
    add(EAST, metal + '-receive', 'woodenChest', 425, y);
    link(HOME, materialSource, metal + '-send');
    link(HOME, metal + '-send', from);
    link(EAST, to, metal + '-receive');
  }
  if ((direct && !dry) || hydroLoad) {
    add(processors, 'lake', 'lake', 1800, 1050, { resourceItem: 'water', cycleMs: 1000 });
    add(processors, 'pump', 'fluidLink', 2260, 1050);
    link(processors, 'lake', 'pump', 0, 0);
  }
  if (hydroLoad) {
    add(processors, 'coolant', 'hydroProcessor', 2720, 855);
    add(processors, 'slurry', 'hydroProcessor', 2720, 1250);
    add(processors, 'coolant-iron-feed', 'warehouse', 2960, 720, { output: { 'iron-plate': 200 } });
    add(processors, 'slurry-wire-feed', 'warehouse', 2950, 1430, { output: { 'copper-wire': 200 } });
    add(processors, 'slurry-charcoal-feed', 'warehouse', 3260, 1420, { output: { charcoal: 200 } });
    add(processors, 'coolant-sink', 'fluidStorage', 3270, 865);
    add(processors, 'slurry-sink', 'warehouse', 3270, 1190);
    select(processors, 'coolant', 'coolant');
    select(processors, 'slurry', 'conductive-slurry');
    link(processors, 'pump', 'coolant');
    link(processors, 'pump', 'slurry');
    link(processors, 'coolant-iron-feed', 'coolant', 1);
    link(processors, 'slurry-wire-feed', 'slurry', 1);
    link(processors, 'slurry-charcoal-feed', 'slurry', 2);
    link(processors, 'coolant', 'coolant-sink');
    link(processors, 'slurry', 'slurry-sink');
  }
  for (const [index, metal] of METALS.entries()) {
    const y = index === 0 ? 495 : 1705;
    const away = index === 0 ? -1 : 1;
    const mine = metal + '-mine-a';
    extract(HOME, mine, metal, 240, oreExtractors === 1 ? y : y + away * 200);
    let oreSource = mine;
    if (oreExtractors === 2) {
      extract(HOME, metal + '-mine-b', metal, 240, y - away * 200);
      oreSource = metal + '-ore';
      add(HOME, oreSource, 'merger', 920, y);
      link(HOME, mine, oreSource);
      link(HOME, metal + '-mine-b', oreSource, 1);
    }
    const processor = metal + '-processor';
    if (processors === EAST) {
      roads(metal, y, oreSource);
      oreSource = metal + '-receive';
    }
    extract(processors, metal + '-wood', 'wood', 1120, y + away * 235);
    let fuelSource = metal + '-wood';
    if (!direct) {
      add(processors, metal + '-kiln', 'kiln', 1740, y + away * 235);
      select(processors, metal + '-kiln', 'charcoal');
      link(processors, fuelSource, metal + '-kiln');
      fuelSource = metal + '-kiln';
    }
    add(processors, processor, direct ? 'separationFurnace' : 'smelter', 2510, y);
    select(processors, processor, direct ? shortcutId(metal) : 'smelt-' + metal);
    link(processors, oreSource, processor);
    link(processors, fuelSource, processor, 1);
    if (direct && !dry) link(processors, 'pump', processor, 2);
    let plateSource = processor;
    if (processors !== destination) {
      roads(metal, y, plateSource);
      plateSource = metal + '-receive';
    }
    add(destination, metal + '-sink', 'warehouse', processors === destination ? 3100 : 1030, y);
    link(destination, plateSource, metal + '-sink');
    counters[metal] = { firstSeconds: null, twentiethSeconds: null, atWarmup: 0, delivered: 0 };
  }
  const execute = () => {
    const engine = new GameEngine(state, { autosave: false });
    for (const { sector, id, recipeId } of selections) {
      if (engine.getSector().id !== sector) engine.switchSector(sector);
      assert(engine.setRecipe(id, recipeId), 'Select ' + id + ' ' + recipeId);
    }
    for (const { sector, from, to, toPort, fromPort } of edges) {
      if (engine.getSector().id !== sector) engine.switchSector(sector);
      assert(engine.connectPorts(from, fromPort, to, toPort),
        'Wire ' + sector + ' ' + from + ' -> ' + to + ':' + toPort + ' ' + JSON.stringify(engine.getConnectionFailure(from, fromPort, to, toPort)));
    }
    const live = engine.getState();
    const sinks = Object.fromEntries(METALS.map(metal => [metal, live.sectors[destination].nodes.find(n => n.id === metal + '-sink')]));
    let hydroAtWarmup;
    const hydroItems = ['coolant', 'conductive-slurry'];
    for (let t = TICK; t <= END; t += TICK) {
      engine.tick(TICK);
      if (hydroLoad && t === WARMUP) hydroAtWarmup = { ...live.produced };
      for (const metal of METALS) {
        const sink = sinks[metal];
        const plate = expectedOutputs[metal];
        const delivered = (sink.input[plate] ?? 0) + (sink.output[plate] ?? 0);
        const counter = counters[metal];
        if (delivered && counter.firstSeconds === null) counter.firstSeconds = t / 1000;
        if (delivered >= 20 && counter.twentiethSeconds === null) counter.twentiethSeconds = t / 1000;
        if (t === WARMUP) counter.atWarmup = delivered;
        counter.delivered = delivered;
      }
    }
    const rates = Object.fromEntries(METALS.map(metal => {
      const counter = counters[metal];
      const plate = expectedOutputs[metal];
      const { atWarmup, ...row } = counter;
      return [metal, { ...row, deliveredPerMinute: (counter.delivered - atWarmup) * 60000 / (END - WARMUP),
        produced: live.produced[plate] ?? 0, harvestedOre: live.extracted[metal] ?? 0 }];
    }));
    const nodeCounts = {};
    for (const sector of Object.values(live.sectors)) for (const node of sector.nodes) nodeCounts[node.kind] = (nodeCounts[node.kind] ?? 0) + 1;
    return { layout, recipe, vehicle, ranks: ranks.length ? 2 : 0, oreExtractorsPerMetal: oreExtractors, processorSector: processors, destination,
      crossingCargo: processors !== destination ? 'plate' : processors === EAST ? 'ore' : null,
      rates, nodeCounts, extracted: live.extracted, produced: live.produced,
      ...(hydroLoad ? { hydroPerMinute: Object.fromEntries(hydroItems.map(item =>
        [item, ((live.produced[item] ?? 0) - (hydroAtWarmup[item] ?? 0)) * 60000 / (END - WARMUP)])) } : {}),
      plateWaterConsumed: direct ? METALS.reduce((n, metal) => {
        const node = live.sectors[processors].nodes.find(n => n.id === metal + '-processor');
        return n + rates[metal].produced + Number(Boolean(node.batch));
      }, 0) : 0 };
  };
  return direct ? withPrototype(state.research.completed, execute) : execute();
}

assert.equal(isNodeUnlocked('fluidRoad', ACCESS), false);
const cases = {};
for (const [rank, ranks] of [['base', []], ['rank2', RANKS]]) {
  for (const layout of ['lake', 'remote']) {
    for (const recipe of ['standard', 'direct']) {
      cases[[rank, layout, recipe].join('-')] = simulate({ layout, recipe, ranks });
    }
  }
}
for (const recipe of ['standard', 'direct']) {
  cases['rank2-remote-truck-' + recipe] = simulate({ layout: 'remote', recipe, ranks: RANKS, vehicle: 'truck' });
}
cases['rank2-remote-local-without-water'] = simulate({ layout: 'dry', recipe: 'direct', ranks: RANKS });
for (const recipe of ['standard', 'direct']) {
  cases['rank2-lake-shared-pump-' + recipe] = simulate({ layout: 'lake', recipe, ranks: RANKS, hydroLoad: true });
  cases['base-lake-one-ore-extractor-' + recipe] = simulate({ layout: 'lake', recipe, oreExtractors: 1 });
}
for (const metal of METALS) {
  assert.equal(cases['rank2-remote-local-without-water'].rates[metal].delivered, 0);
  assert.equal(cases['rank2-remote-direct'].rates[metal].deliveredPerMinute, 6);
  assert.equal(cases['rank2-remote-truck-direct'].rates[metal].deliveredPerMinute, cases['rank2-lake-direct'].rates[metal].deliveredPerMinute);
  assert.equal(cases['rank2-lake-shared-pump-direct'].rates[metal].deliveredPerMinute, cases['rank2-lake-direct'].rates[metal].deliveredPerMinute);
  assert.equal(cases['base-lake-one-ore-extractor-standard'].rates[metal].deliveredPerMinute, 6);
  assert.equal(cases['base-lake-one-ore-extractor-direct'].rates[metal].deliveredPerMinute, 6);
}
assert.deepEqual(cases['rank2-lake-shared-pump-standard'].hydroPerMinute, cases['rank2-lake-shared-pump-direct'].hydroPerMinute);

const assumptions = [
  'Current game engine with normal Extractor, Pump, batch, cable and Road rules. Direct recipes exist only in memory for each test.',
  'One processor per metal, two local ore Extractors and one Wood Extractor per metal. Current setup uses a Kiln per metal. Direct setup shares one Pump across both lines.',
  'Each case starts with a built and wired layout, empty process buffers, local natural reserves and the specified research. Timings exclude building, travel and unlocking. Stock and transfers persist normally inside the engine run.',
  'The remote outpost has no Lake. The neighboring destination has a Lake and Wood, with one Road lane per metal via Road Channels 1. Current route ships plates; the shortcut ships raw ore to the lake and produces plates there.',
  'Rank 2 runs use Extractor, Kiln and Smelter rank 2. The proposed 8-second recipe inherits Smelter efficiency, giving a 6.4-second effective cycle.',
  'Measure 12 game minutes at 100 ms ticks. Delivery rate is measured over minutes 2 through 12. Delivered means plates at the destination warehouse. No downstream plate customers are included.',
  'The optional shared Pump test supplies one base Hydro Plant per fluid with staged non-Water inputs. It checks water competition in this layout, not full supply for a scaled Hydro district.',
  'A separate lakeside sensitivity test uses one base ore Extractor per metal to check the effect of ore-limited supply.',
];
writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify({ assumptions, cases }, null, 2) + '\n');
console.table(Object.fromEntries(Object.entries(cases).map(([name, row]) => [name, {
  firstIron: row.rates.iron.firstSeconds, firstCopper: row.rates.copper.firstSeconds,
  ironPerMin: row.rates.iron.deliveredPerMinute, copperPerMin: row.rates.copper.deliveredPerMinute,
  iron20: row.rates.iron.twentiethSeconds, copper20: row.rates.copper.twentiethSeconds,
  water: row.plateWaterConsumed, coolant: row.hydroPerMinute?.coolant, slurry: row.hydroPerMinute?.['conductive-slurry'],
}])));
