import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

// Read the live-rule catalogs with Node 24. No game state, engine, or save is started.
registerHooks({
  resolve(specifier, context, next) {
    const needsExtension = specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier);
    return next(needsExtension ? `${specifier}.ts` : specifier, context);
  },
});

const { RECIPES } = await import('../src/content/recipes.ts');
const { getResearchCosts, getResearchProject, isResearchAvailable } = await import('../src/content/research.ts');
const { ALPHA_AP, FOUNDRY_INPUTS, GROVE_GROWTH, RECLAMATION_QUOTAS, SEVEN_CORES, seededPairIndex } = await import('../src/content/endgame.ts');
const { BOT_STRENGTH } = await import('../src/content/progression.ts');
const { generateSector, createHomeSector, getSectorWorldSize, sectorDistance } = await import('../src/simulation/worldGeneration.ts');
const { canPlaceNode } = await import('../src/simulation/collisions.ts');
const { getDwarvenSettlement } = await import('../src/content/lizardSettlements.ts');
const { golemApCost } = await import('../src/content/resourceGolems.ts');
const { BASE_MOD_RULES } = await import('../src/mods/modRules.ts');
const { RESEARCH_CENTER_BASE_CYCLE_MS } = await import('../src/content/researchTiming.ts');

const seed = 10;
const home = '5,5';
const homePlacement = [
  ['Kiln', 'kiln', 1260, 730],
  ['Copper Smelter', 'smelter', 1630, 1100],
  ['Copper Gear Refiner', 'refiner', 2030, 1100],
  ['Simple Core Refiner', 'refiner', 2430, 1100],
  ['Research Center', 'researchCenter', 2980, 1100],
  ['Iron Extractor', 'extractor', 900, 1780],
  ['Iron Smelter', 'smelter', 1630, 1730],
  ['Iron Wire Refiner', 'refiner', 2030, 1730],
  ['Basic Core Assembler', 'assembler', 2430, 1730],
];
const route = [
  '6,5', // Exploration
  '7,5', '5,6', '5,4', '4,5', '3,5', '2,5', '2,4', '2,3', '8,5',
  '9,5', '9,4', '10,5', '10,4', '10,3', '9,6', '9,7', '6,4', '1,5', '0,5',
  '0,4', '0,3', '0,2', '0,1', '0,0', '10,2', '10,1', '10,0', '10,6', '10,7',
  '10,8', '10,9', '10,10', '0,6', '0,7', '0,8', '0,9', '0,10',
];
const completed = new Set(['refiner', 'researchCenter']);
const unlocked = new Set([home]);
const maps = { [home]: createHomeSector(0) };
const homeObstructions = [...maps[home].nodes];
for (const [name, kind, x, y] of homePlacement) {
  const node = { id: `plan-${name}`, kind, x, y };
  assert(canPlaceNode(node, homeObstructions, getSectorWorldSize(maps[home], [])), `Home footprint for ${name}`);
  homeObstructions.push(node);
}
const stages = [];
const purchases = [];
let phase;
let stage;

function add(bag, item, quantity) {
  bag[item] = (bag[item] ?? 0) + quantity;
}

function research(id, count = 0) {
  const project = getResearchProject(id);
  assert(isResearchAvailable(project, [...completed]), `Prerequisite for ${id}`);
  const costs = getResearchCosts(project, count, [...completed], phase);
  for (const [item, quantity] of Object.entries(costs)) add(stage.cores, item, quantity);
  stage.labSeconds += Math.max(...Object.values(costs)) * RESEARCH_CENTER_BASE_CYCLE_MS / 1000;
  if (!project.repeatable) completed.add(id);
  return costs;
}

function openMap(id) {
  const [x, y] = id.split(',').map(Number);
  assert(!unlocked.has(id));
  assert([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(p => unlocked.has(p.join(','))), `Adjacency for ${id}`);
  const sector = generateSector(x, y, seed, 0, [...completed]);
  maps[id] = sector;
  unlocked.add(id);
  const kinds = sector.nodes.map(n => n.kind);
  if (kinds.includes('lake')) completed.add('lakeTools');
  if (kinds.includes('monster-camp')) completed.add('suppressionBot');
  return sector;
}

function mapPurchases(first, last) {
  const available = ['refiner', 'assembler', 'automataCore', 'hydraulicAssembly', 'oreSeparation', 'precisionControl'];
  for (let number = first; number <= last; number++) {
    const tier = Math.min(6, 1 + Math.floor(number / 10), available.findLastIndex(id => completed.has(id)) + 1);
    if (!phase || phase.tier !== tier) phase = { tier, startedAt: number - 1 };
    const costs = research('mapNode', number - 1);
    const map = openMap(route[number]);
    purchases.push({ number, map: map.id, tier: sectorDistance(map.x, map.y), costs });
  }
}

function block(name, run) {
  stage = { name, cores: {}, labSeconds: 0 };
  run();
  stages.push(stage);
}

block('Home and first three purchases', () => {
  research('assembler');
  research('exploration');
  openMap(route[0]);
  research('road');
  mapPurchases(1, 3);
  research('automataCore');
});
block('Hydro startup and purchases 4–9', () => {
  mapPurchases(4, 9);
  for (const id of ['fabricatorTools', 'hydrochemistry', 'hydraulicAssembly', 'treePlanter', 'areaExpansion1']) research(id);
});
block('Roads and robotics and purchases 10–19', () => {
  for (const id of ['roadChannels1', 'fluidRouting', 'sealedRobotics', 'resourceGolemSurvey', 'oreSeparation']) research(id);
  mapPurchases(10, 19);
});
block('Shiny and Complex research', () => {
  assert(maps['9,5'].nodes.some(n => n.lizardSettlement === 'camp'));
  completed.add('mithrilTools'); // Gate modeled separately from the paid projects.
  for (const id of ['heavyRobotics', 'precisionControl', 'commandRobotics', 'roadChannels2']) research(id);
});
block('Purchases 20–29', () => mapPurchases(20, 29));
block('Purchases 30–37', () => mapPurchases(30, 37));
assert.equal(unlocked.size, route.length + 1);

const coreTotals = {};
for (const block of stages) for (const [item, quantity] of Object.entries(block.cores)) add(coreTotals, item, quantity);

const recipes = new Map();
for (const recipe of Object.values(RECIPES)) {
  if (recipe.recovery || /^(recycle|efficient|core-half)-/.test(recipe.id) || recipe.id === 'final-core') continue;
  recipes.set(Object.keys(recipe.outputs)[0], recipe);
}
const rawOrder = ['wood', 'iron', 'copper', 'stone', 'water', 'mythril'];
const groveBatches = GROVE_GROWTH / 100;
const alphaBots = Math.ceil(ALPHA_AP / BOT_STRENGTH['command-suppression-bot']);
const golem = id => maps[id].nodes.find(n => n.kind === 'resourceGolem');
const golemBots = id => Math.ceil(golemApCost(golem(id)) / BOT_STRENGTH['command-suppression-bot']);

export function campaign(name, demand, options = {}) {
  const remaining = { ...demand };
  const raw = {}, work = {}, surplus = {};
  const ordered = [];
  const visit = item => {
    if (ordered.includes(item)) return;
    const recipe = recipes.get(item);
    if (recipe && !(options.standardGear && item === 'mythril-gear')) {
      Object.keys(recipe.inputs).forEach(visit);
    } else if (options.standardGear && item === 'mythril-gear') {
      visit('mythril-plate');
    }
    ordered.push(item);
  };
  Object.keys(demand).forEach(visit);
  for (const item of ordered.reverse()) {
    const quantity = remaining[item];
    if (rawOrder.includes(item)) {
      raw[item] = quantity;
      work[item] = quantity * (item === 'water' ? .25 : 5);
      continue;
    }
    const recipe = options.standardGear && item === 'mythril-gear' ? RECIPES[item] : recipes.get(item);
    assert(recipe, `Missing recipe for ${item}`);
    const batches = Math.ceil(quantity / recipe.outputs[item]);
    for (const [ingredient, count] of Object.entries(recipe.inputs)) add(remaining, ingredient, batches * count);
    for (const [output, count] of Object.entries(recipe.outputs)) {
      const left = batches * count - (output === item ? quantity : 0);
      if (left) add(surplus, output, left);
    }
    work[item] = batches * recipe.cycleMs / 1000;
  }
  return { name, demand, raw, work, surplus };
}

const campaigns = [
  ...SEVEN_CORES.slice(0, 6).map(item => campaign(RECIPES[item].name + ' research', { [item]: coreTotals[item] })),
  campaign('Dwarven Camp', { 'medium-suppression-bot': 62 }),
  campaign('Mythril Golem', { 'command-suppression-bot': golemBots('9,4') }),
  campaign('Iron Golem', { 'command-suppression-bot': golemBots('2,3') }),
  campaign('Ancient Dragon', { 'command-suppression-bot': alphaBots }),
  campaign('Ancient Foundry hydraulic parts', Object.fromEntries(Object.entries(FOUNDRY_INPUTS).filter(([id]) => id !== 'mythril-gear'))),
  campaign('Ancient Foundry gears', { 'mythril-gear': FOUNDRY_INPUTS['mythril-gear'] }),
  campaign('Ancient Foundry standard gears comparison', { 'mythril-gear': FOUNDRY_INPUTS['mythril-gear'] }, { standardGear: true }),
  campaign('Elder Grove', { wood: groveBatches * 10, 'iron-plate': groveBatches, stone: groveBatches }),
];
assert.equal(maps['9,4'].nodes.find(n => n.kind === 'resourceGolem')?.golemMineral, 'mythril');
assert.equal(maps['2,3'].nodes.find(n => n.kind === 'resourceGolem')?.golemMineral, 'iron');
assert(Object.values(FOUNDRY_INPUTS).every(quantity => quantity > 0));
assert(campaigns.find(c => c.name === 'Ancient Dragon').surplus['metallic-fines'] >= RECLAMATION_QUOTAS['metallic-fines']);

const dwarves = getDwarvenSettlement(maps['9,5'].nodes.find(n => n.lizardSettlement));
const beforeMythrilGolem = campaigns.filter(c => ['Shiny Core research', 'Complex Core research', 'Mythril Golem'].includes(c.name));
const dwarvenMythril = beforeMythrilGolem.reduce((sum, c) => sum + c.raw.mythril, 0);
const mediumBots = campaigns.find(c => c.name === 'Dwarven Camp').demand['medium-suppression-bot'];
const campChecks = Math.floor(mediumBots * BOT_STRENGTH['medium-suppression-bot'] / dwarves.attackRequirement);
const worstCampReduction = 9;
const tributeBudget = ((campChecks - worstCampReduction + 1) * 12 - 1) * dwarves.tributePerCycle;
assert(tributeBudget >= dwarvenMythril);
const rawTotals = {};
for (const c of campaigns.filter(c => !c.name.includes('comparison'))) {
  for (const [item, count] of Object.entries(c.raw)) add(rawTotals, item, count);
}

const sites = [
  ['5,5', 'Home Simple', { 'simple-core': 100 }, 3],
  ['5,5', 'Home Basic', { 'basic-core': 60 }, 3],
  ['4,5', 'First western Simple', { 'simple-core': 165 }, 4],
  ['2,5', 'Second western Simple', { 'simple-core': coreTotals['simple-core'] - 265 }, 4],
  ['2,3', 'Basic Core reserve', { 'basic-core': coreTotals['basic-core'] - 60 }, 4],
  ['5,6', 'South Automata', { 'automata-core': 200 }, 4],
  ['5,4', 'North Automata', { 'automata-core': coreTotals['automata-core'] - 200 }, 4],
  ['7,5', 'Main Hydro', { 'hydro-core': 120 }, 3],
  ['6,4', 'Secondary Hydro', { 'hydro-core': coreTotals['hydro-core'] - 120 }, 2],
  ['6,4', 'Shiny research', { 'shiny-core': coreTotals['shiny-core'] }, 2],
  ['6,4', 'Complex research', { 'command-core': coreTotals['command-core'] }, 1],
  ['9,7', 'Dwarven Camp', campaigns.find(c => c.name === 'Dwarven Camp').demand, 2.3],
  ['10,3', 'Mythril Golem', { 'command-suppression-bot': golemBots('9,4') }, .5],
  ['3,5', 'Iron Golem', { 'command-suppression-bot': golemBots('2,3') }, .5],
  ['0,1', 'Ancient Dragon', { 'command-suppression-bot': alphaBots }, .5],
  ['10,3', 'Foundry Circuit B', { 'ceramic-electrode': FOUNDRY_INPUTS['ceramic-electrode'] }, 5],
  ['10,3', 'Foundry Sealed Frame', { 'sealed-frame': FOUNDRY_INPUTS['sealed-frame'] }, 2.5],
  ['10,4', 'Foundry Mythril Gear', { 'mythril-gear': FOUNDRY_INPUTS['mythril-gear'] }, 6],
];
const districts = sites.map(([id, name, demand, rate]) => {
  const bill = campaign(name, demand);
  const minutes = Object.values(demand)[0] / rate;
  const producers = Object.fromEntries(Object.entries(bill.work).filter(([item]) => item !== 'mythril').map(([item, seconds]) => [item, Math.ceil(seconds / (minutes * 60 * .9))]));
  assert((producers.water ?? 0) <= 2, `${name} Lake Pump limit`);
  return { id, ...bill, rate, minutes, producers, productionNodes: Object.values(producers).reduce((sum, count) => sum + count, 0) };
});
const localBills = {};
for (const { id, raw } of [...districts, { id: '10,9', raw: campaigns.at(-1).raw }]) {
  for (const [item, quantity] of Object.entries(raw)) add(localBills[id] ??= {}, item, quantity);
}
for (const [id, bill] of Object.entries(localBills)) {
  const map = maps[id];
  for (const [item, quantity] of Object.entries(bill)) {
    if (item === 'mythril') continue;
    const source = map.nodes.find(node => node.resourceItem === item);
    assert(source && (item === 'water' || source.resourceRemaining >= quantity), `${id} ${item} needs ${quantity}`);
  }
}
const districtTotals = {};
for (const bill of Object.values(localBills)) for (const [item, quantity] of Object.entries(bill)) add(districtTotals, item, quantity);
assert.deepEqual(districtTotals, rawTotals);

// Reserve space for Road endpoints before machine blocks are laid out. A fitted
// endpoint is a footprint check only; individual cable paths still need routing.
const fields = Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, getSectorWorldSize(map, [...completed])]));
const roadObstructions = Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, map.nodes.map(node =>
  node.kind === 'monster-camp' ? { ...node, campStrength: 100 } : node)]));
const edge = (from, to) => [from, to].sort().join('/');
const slots = new Map();
function reserveRoads(path, count) {
  path.slice(1).forEach((to, i) => {
    const key = edge(path[i], to);
    slots.set(key, Math.max(slots.get(key) ?? 0, count));
  });
}
const row = Array.from({ length: 11 }, (_, x) => `${x},5`);
const west = Array.from({ length: 11 }, (_, y) => `0,${y}`);
const east = Array.from({ length: 11 }, (_, y) => `10,${y}`);
reserveRoads(row, 1);
reserveRoads(west, 1);
reserveRoads(east, 1);
reserveRoads(['2,3', '2,4', '2,5', '3,5', '4,5', '5,5'], 3);
reserveRoads(['7,5', '6,5'], 2);
reserveRoads(['6,5', '5,5'], 3);
reserveRoads(['6,4', '6,5'], 2);
reserveRoads(['5,4', '5,5', '5,6'], 1);
reserveRoads(['9,4', '9,5', '9,6', '9,7'], 2);
reserveRoads(['9,5', '10,5', '10,4'], 2);
reserveRoads(west.slice(1, 6), 2);
reserveRoads(east.slice(0, 5), 3);
reserveRoads(east.slice(-2), 3);

const roadSites = {};
for (const [key, count] of slots) {
  const [a, b] = key.split('/').sort((left, right) => {
    const first = maps[left], second = maps[right];
    return first.x - second.x || first.y - second.y;
  });
  const horizontal = maps[a].y === maps[b].y;
  const [fa, fb] = [fields[a], fields[b]];
  const usable = Math.min(...[fa, fb].map(f => horizontal ? f.height : f.width));
  const positions = [];
  for (let along = 240; along <= usable - 240 && positions.length < count; along += 16) {
    const coords = horizontal ? [[fa.width - 67.5, along], [67.5, along]] : [[along, fa.height - 67.5], [along, 67.5]];
    const endpoints = coords.map(([x, y], i) => ({ id: `${key}/${i}/${along}`, kind: 'road', x, y }));
    if (!endpoints.every((node, i) => canPlaceNode(node, roadObstructions[[a, b][i]], [fa, fb][i]))) continue;
    endpoints.forEach((node, i) => roadObstructions[[a, b][i]].push(node));
    positions.push(along);
    along += 224;
  }
  assert.equal(positions.length, count, `Road sites on ${key}`);
  roadSites[key] = positions;
}

export const dryRun = { seed, pairIndex: seededPairIndex(seed), route, stages, purchases, coreTotals, rawTotals,
  dwarvenMythril, dwarves, tributeBudget, districtTotals, districts, localBills, campaigns, homePlacement, roadSites,
  roadSeconds: BASE_MOD_RULES.roadTransferMs / 1000,
  survey: Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, map.nodes.map(n => ({
    name: n.name, x: Math.round(n.x), y: Math.round(n.y), reserve: n.resourceRemaining,
  }))])),
};
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(dryRun, null, 2));
