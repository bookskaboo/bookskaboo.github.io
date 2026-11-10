import assert from 'node:assert/strict';

const { isRecipeAvailable } = await import('../src/content/recipeAvailability.ts');
const { RECIPES } = await import('../src/content/recipes.ts');
const { CORNER_ITEMS } = await import('../src/content/endgame.ts');
const { getNodeSize } = await import('../src/domain/nodeGeometry.ts');
const { connectionBlockedByWorld } = await import('../src/simulation/connectionRules.ts');

const surveySeconds = 30;
const coordinate = id => id.split(',').map(Number);
const distance = (a, b) => coordinate(a).reduce((sum, value, i) => sum + Math.abs(value - coordinate(b)[i]), 0);
function neighbors(id) {
  const [x, y] = coordinate(id);
  return [[x, y - 1], [x - 1, y], [x, y + 1], [x + 1, y]]
    .filter(([a, b]) => [a, b].every(n => n >= 0 && n <= 10)).map(p => p.join(','));
}

const coreSize = {
  'simple-core': [120, 4], 'basic-core': [140, 4], 'automata-core': [100, 4], 'hydro-core': [85, 3],
};
const homeEntry = { 'simple-core': '4,5', 'basic-core': '6,5', 'automata-core': '5,4', 'hydro-core': '5,6' };
const supplyRate = {
  'medium-suppression-bot': 2.3, 'command-suppression-bot': .5, 'shiny-core': 2, 'command-core': 1,
  'ceramic-electrode': 5, 'sealed-frame': 2.5, 'mythril-gear': 6,
};
const localResources = ['wood', 'iron', 'copper', 'stone'];
const stock = (node, item) => (node.input[item] ?? 0) + (node.output[item] ?? 0);
const sumRaw = bills => Object.fromEntries(localResources.map(item => [item, bills.reduce((n, bill) => n + (bill.raw[item] ?? 0), 0)]));

export function runBlind(context) {
  const { engine, state, home, sector, source, activate, mark, tick, wait, research, place, connect, input, disconnect,
    stop, cart, freight, retireLane, lanes, factory, campaign, coreFreight, watches, cornerItems, unlocked, startHome, protectLakes, resume } = context;
  const visited = new Map();
  const corners = new Map();
  const reserved = new Map();
  const paid = {};
  const planned = { 'simple-core': 100, 'basic-core': 60 };
  const expeditions = [];
  const coreLoads = new Map();
  const homeStock = new Map();
  let coreDistricts = 0;

  function survey(id, reason, record = true) {
    activate(id);
    assert(sector(id).visited || id === home, `Map ${id} must be visited before inspection`);
    const nodes = sector(id).nodes;
    const observations = {
      resources: Object.fromEntries(localResources.map(item => [item, source(id, item)?.resourceRemaining ?? 0])),
      lake: nodes.some(n => n.kind === 'lake'),
      golem: nodes.find(n => n.kind === 'resourceGolem')?.golemMineral,
      dwarves: nodes.find(n => n.kind === 'monster-camp')?.lizardSettlement,
      goblin: nodes.some(n => n.kind === 'monster-camp' && !n.lizardSettlement),
      corner: nodes.find(n => n.kind === 'cornerChallenge')?.cornerType,
      holes: nodes.filter(n => n.kind === 'big-hole').length,
    };
    visited.set(id, observations);
    if (observations.corner) {
      corners.set(observations.corner, id);
      cornerItems[id] = CORNER_ITEMS[observations.corner];
    }
    if (id !== home && record) {
      expeditions.push({ map: id, reason, ...observations });
      mark(`survey ${id}`, { reason, lake: observations.lake, golem: observations.golem, dwarves: observations.dwarves, corner: observations.corner });
      const resumeAt = state.playTimeMs + surveySeconds * 1000;
      while (state.playTimeMs < resumeAt) tick();
    }
  }

  function path(from, to, item, entry, blockedEdges = new Set()) {
    assert(visited.has(from) && visited.has(to), 'Freight endpoints must have been surveyed');
    const slots = unlocked('roadChannels2') ? 3 : unlocked('roadChannels1') ? 2 : 1;
    const queue = [[from]], seen = new Set([from]);
    for (const route of queue) {
      const current = route.at(-1);
      if (current === to) return route;
      for (const next of neighbors(current)) {
        if (seen.has(next) || !visited.has(next)) continue;
        if (blockedEdges.has([current, next].sort().join('/'))) continue;
        if (next === home && entry && current !== entry) continue;
        const existing = lanes.has(`${current}/${next}/${item}`);
        if (!existing && sector(current).nodes.filter(n => n.kind === 'road' && n.pairedSectorId === next).length >= slots) continue;
        seen.add(next);
        queue.push([...route, next]);
      }
    }
  }

  const researchPath = (id, item) => protectLakes
    ? path(id, home, item, homeEntry[item]) ?? path(id, home, item)
    : path(id, home, item);

  function route(item, from, to, output, receiving, name = item) {
    if (from === to) {
      if (receiving && receiving !== output) connect(from, output, receiving);
      return { sink: receiving ?? output, lanes: [], last: undefined };
    }
    const blockedEdges = new Set();
    const original = new Set(lanes.values());
    let issue;
    for (let attempt = 0; attempt < 16; attempt++) {
      const routePath = path(from, to, item, undefined, blockedEdges);
      if (!routePath) break;
      try { return freight(item, routePath, output, receiving, name); }
      catch (error) {
        if (!error.freightEdge || !/corridor|Road endpoints|clearance/.test(error.message)) throw error;
        issue = error;
        blockedEdges.add(error.freightEdge);
        for (const lane of [...lanes.values()]) if (!original.has(lane)) retireLane(lane);
        mark('rerouted around blocked freight crossing', { item, crossing: error.freightEdge });
      }
    }
    throw new Error(`No surveyed ${item} freight path from ${from} to ${to}`, { cause: issue });
  }

  function reserveFor(raw) {
    return Object.fromEntries(localResources.map(item => [item, raw[item] ? raw[item] + (item === 'stone' ? 30 : 120) : 0]));
  }

  function book(id, bill, ledger = reserved) {
    const totals = ledger.get(id) ?? {};
    const need = reserveFor(bill);
    ledger.set(id, Object.fromEntries(localResources.map(item => [item, (totals[item] ?? 0) + need[item]])));
  }

  function canSupply(id, bill, ledger = reserved) {
    const need = reserveFor(bill);
    return localResources.every(item => (ledger.get(id)?.[item] ?? 0) + need[item] <= visited.get(id).resources[item]);
  }

  function makeFactory(name, item, count, id, options = {}) {
    assert(visited.has(id), `Factory site ${id} has not been surveyed`);
    const plan = campaign(name, { [item]: count });
    const rate = options.rate ?? coreSize[item]?.[1] ?? supplyRate[item];
    const producers = Object.fromEntries(Object.entries(plan.work).filter(([product]) => product !== 'mythril')
      .map(([product, seconds]) => [product, Math.ceil(seconds / (count / rate * 60 * .9))]));
    return factory(name, { ...options, plan: { id, ...plan, producers }, meterInputs: options.meterInputs ?? true });
  }

  function addCore(item, count) {
    const name = `Core bank ${++coreDistricts} ${item}`;
    const bill = campaign(name, { [item]: count }).raw;
    const sites = [...visited.keys()].filter(id => id !== home && (!bill.water || visited.get(id).lake)
      && canSupply(id, bill) && researchPath(id, item));
    const lakeCost = id => {
      const map = visited.get(id);
      if (!protectLakes || !map.lake) return 0;
      return item === 'hydro-core' ? Number(map.resources.copper >= 3000) : 1;
    };
    const fallbackEntry = id => protectLakes && researchPath(id, item).at(-2) !== homeEntry[item] ? 1 : 0;
    sites.sort((a, b) => fallbackEntry(a) - fallbackEntry(b) || lakeCost(a) - lakeCost(b) || researchPath(a, item).length - researchPath(b, item).length
      || Number(Boolean(visited.get(a).dwarves || visited.get(a).goblin)) - Number(Boolean(visited.get(b).dwarves || visited.get(b).goblin))
      || visited.get(a).holes - visited.get(b).holes);
    if (!sites.length && count > 30) return addCore(item, Math.floor(count * .65));
    assert(sites.length, `No surveyed site can support another ${count} ${item}`);
    const id = sites[0];
    book(id, bill);
    const district = makeFactory(name, item, count, id);
    const delivery = coreFreight(district, item, researchPath(id, item));
    if (!homeStock.has(item)) homeStock.set(item, new Set());
    homeStock.get(item).add(delivery.sink);
    for (const lane of delivery.lanes) {
      if (!coreLoads.has(lane)) {
        coreLoads.set(lane, 0);
        watches.push(() => {
          if (lane.delivered < coreLoads.get(lane)) return false;
          if (lanes.has(lane.key)) retireLane(lane);
          coreLoads.delete(lane);
          return true;
        });
      }
      coreLoads.set(lane, coreLoads.get(lane) + count);
    }
    planned[item] = (planned[item] ?? 0) + count;
  }

  function pay(id) {
    const costs = research(id, bill => {
      for (const [item, count] of Object.entries(bill)) {
        while ((planned[item] ?? 0) - (paid[item] ?? 0) < count) {
          assert(coreSize[item], `Waiting for the dedicated ${item} plant`);
          addCore(item, protectLakes && item === 'hydro-core' ? 115 : coreSize[item][0]);
        }
      }
    });
    for (const [item, count] of Object.entries(costs)) paid[item] = (paid[item] ?? 0) + count;
  }

  function discover(id, reason) {
    if (visited.has(id)) return;
    if (!state.research.mapPoints) pay('mapNode');
    assert(engine.unlockSector(...coordinate(id)), `Activate adjacent ${id}`);
    survey(id, reason);
  }

  const frontier = () => [...new Set([...visited.keys()].flatMap(neighbors))].filter(id => !visited.has(id));
  function scout(reason, score) {
    const next = frontier().sort((a, b) => score(a) - score(b))[0];
    assert(next, `No frontier for ${reason}`);
    discover(next, reason);
  }
  const nearHome = id => distance(home, id);
  const findCamp = () => [...visited].filter(([, map]) => map.dwarves === 'camp').sort(([a], [b]) => nearHome(a) - nearHome(b))[0]?.[0];
  const findGolem = mineral => [...visited].find(([, map]) => map.golem === mineral)?.[0];

  if (resume) {
    for (const map of Object.values(state.sectors)) if (map.unlocked && (map.visited || map.id === home)) survey(map.id, 'saved survey', false);
    for (const line of resume.priorTrace.split(/\r?\n/)) {
      const match = line.match(/^([\d.]+)m  survey ([\d,]+) (\{.*\})$/);
      if (match) expeditions.push({ map: match[2], minutes: Number(match[1]), ...JSON.parse(match[3]) });
    }
    const siteLine = resume.priorTrace.split(/\r?\n/).find(line => line.includes('scouting and revealed site selection complete'));
    const { sites, mythrilMap, ironMap } = JSON.parse(siteLine.slice(siteLine.indexOf('{')));
    const mythrilGolem = sector(mythrilMap).nodes.find(node => node.infiniteResource && node.golemMineral === 'mythril');
    assert(mythrilGolem && !state.produced['final-core'], 'Resume at the defeated Mythril Golem');
    Object.assign(paid, resume.paidCores());
    for (const id of visited.keys()) {
      activate(id);
      const oldRoads = sector(id).nodes.filter(node => node.kind === 'road').map(node => node.id);
      if (oldRoads.length) engine.deleteNodes(oldRoads);
    }
    mark('resumed at Mythril Golem checkpoint', { seed: state.seed, sites });
    return finishAfterMythril(sites, mythrilMap, mythrilGolem, ironMap);
  }

  mark('blind seed selected', { seed: state.seed });
  survey(home, 'fresh Home');
  const { lab, addSimple } = startHome();
  paid['simple-core'] = 10;
  paid['basic-core'] = 5;
  scout('nearest map after Exploration', nearHome);
  pay('road');
  // The second starter bank uses the same factory arrangement as the known-route run.
  addSimple();
  while (visited.size < 11) scout('near-Home resource survey', nearHome);
  assert([...visited.values()].some(map => map.lake) && unlocked('suppressionBot'));
  const waterProjects = ['fabricatorTools', 'hydrochemistry', 'hydraulicAssembly', 'treePlanter', 'roadChannels1', 'fluidRouting', 'sealedRobotics', 'resourceGolemSurvey'];
  pay('automataCore');
  if (!protectLakes) for (const id of waterProjects) pay(id);
  pay('areaExpansion1');
  mark('starter research and survey complete');

  // Corners are visible coordinates on the map. Their types are learned at arrival.
  for (const [x, y] of [[0, 0], [10, 0], [10, 10], [0, 10]]) {
    for (let column = 5 + Math.sign(x - 5); column !== x + Math.sign(x - 5); column += Math.sign(x - 5)) discover(`${column},5`, 'shared route toward visible world corners');
    for (let row = 5 + Math.sign(y - 5); row !== y + Math.sign(y - 5); row += Math.sign(y - 5)) discover(`${x},${row}`, 'approach a visible corner');
  }
  assert.equal(corners.size, 4);

  while (!findCamp() || !findGolem('mythril') || !findGolem('iron')) {
    scout('midfield survey for a small Dwarven Camp and two Golems', id => Math.abs(nearHome(id) - (protectLakes ? 5 : 4.5)));
  }
  const dwarf = findCamp(), mythrilMap = findGolem('mythril'), ironMap = findGolem('iron');
  const foundry = corners.get('foundry'), dragon = corners.get('alpha'), grove = corners.get('grove'), reclamation = corners.get('reclamation');
  const roles = [
    ['dragon', dragon, true, [['command-suppression-bot', 21]]],
    ['mythril', mythrilMap, true, [['command-suppression-bot', 15]]],
    ['medium', dwarf, true, [['medium-suppression-bot', 76]]],
    ['iron', ironMap, true, [['command-suppression-bot', 8]]],
    ['control', home, true, [['shiny-core', 15], ['command-core', 5]]],
    ['foundry', foundry, true, [['ceramic-electrode', 50], ['sealed-frame', 25]]],
    ['gears', foundry, false, [['mythril-gear', 100]]],
  ];

  function chooseSites() {
    const local = new Map(reserved), choices = {};
    for (const [role, near, lake, items] of roles) {
      const raw = sumRaw(items.map(([item, count]) => campaign(role, { [item]: count })));
      const available = [...visited.keys()].filter(id => id !== home && (!lake || visited.get(id).lake)
        && (!protectLakes || role !== 'foundry' || id !== choices.control) && canSupply(id, raw, local));
      available.sort((a, b) => distance(a, near) - distance(b, near) || visited.get(a).holes - visited.get(b).holes);
      if (!available.length) return;
      choices[role] = available[0];
      book(available[0], raw, local);
    }
    for (const [id, bill] of local) reserved.set(id, bill);
    return choices;
  }

  let sites = chooseSites();
  while (!sites) {
    scout('survey an outer map for a Lake and industrial reserves', id => (nearHome(id) < 6 ? 25 : 0) + distance(id, dragon));
    sites = chooseSites();
  }
  mark('scouting and revealed site selection complete', { opened: visited.size - 1, dwarf, mythrilMap, ironMap, sites });

  if (protectLakes) for (const id of waterProjects) pay(id);
  pay('oreSeparation');
  pay('roadChannels2');
  const medium = makeFactory('Dwarven supply', 'medium-suppression-bot', 76, sites.medium, { meterInputs: protectLakes });
  const camp = sector(dwarf).nodes.find(n => n.lizardSettlement === 'camp');
  const botRoute = route('medium-suppression-bot', sites.medium, dwarf, medium.output);
  const staged = cart(dwarf, botRoute.sink);
  const staging = connect(dwarf, botRoute.sink, staged);
  if (protectLakes) {
    const amounts = Object.keys(coreSize).map(item => [item, 15]);
    for (const [item, count] of amounts) {
      if ((planned[item] ?? 0) - (paid[item] ?? 0) < count) addCore(item, count);
    }
    wait('stage lower Cores for the three remaining projects', () => amounts.every(([item, count]) =>
      (lab.input[item] ?? 0) + [...(homeStock.get(item) ?? [])].reduce((sum, buffer) => sum + stock(buffer, item), 0) >= count), 75);
    for (const lane of [...lanes.values()]) if (lane.item.endsWith('-core')) retireLane(lane);
    mark('staged lower Cores and released research Roads');
  }
  wait('stage 34 Medium Bots', () => stock(staged, 'medium-suppression-bot') + stock(botRoute.sink, 'medium-suppression-bot') >= 34, 75);
  disconnect(dwarf, staging);
  connect(dwarf, staged, botRoute.sink);
  connect(dwarf, botRoute.sink, camp);
  mark('Dwarven Bot reserve ready');
  wait('first Dwarven Tribute', () => unlocked('mithrilTools'), 20);
  mark('first Dwarven Tribute');
  const tribute = sector(dwarf).nodes.find(n => n.tributeCampId === camp.id);
  const tributeCart = cart(dwarf, tribute);
  connect(dwarf, tribute, tributeCart);

  const shiny = makeFactory('Shiny research', 'shiny-core', 15, sites.control);
  const shinyPath = path(sites.control, home, 'shiny-core');
  assert(shinyPath);
  const shinyFreight = coreFreight(shiny, 'shiny-core', shinyPath);
  planned['shiny-core'] = 15;
  const researchOre = route('mythril', dwarf, sites.control, tributeCart, shiny.buses.get('mythril'), 'research Tribute');
  if (protectLakes) wait('reserve the first 48 Mythril for research', () => researchOre.last.delivered >= 48, 25);
  const attackOre = route('mythril', dwarf, sites.mythril, tributeCart, undefined, 'attack Tribute');
  const forgeStock = Array.from({ length: 12 }, () => cart(sites.mythril, attackOre.sink));
  const forgeStaging = forgeStock.map(buffer => connect(sites.mythril, attackOre.sink, buffer));
  const researchBranch = researchOre.lanes.find(lane => !attackOre.lanes.includes(lane));
  if (researchBranch) watches.push(() => {
    if (researchBranch.delivered < 70) return false;
    disconnect(researchBranch.from, researchBranch.feed);
    return true;
  });
  for (const project of ['heavyRobotics', 'precisionControl']) pay(project);
  const complex = makeFactory('Complex research', 'command-core', 5, sites.control, { secondIntake: true });
  connect(sites.control, shiny.buses.get('mythril'), complex.buses.get('mythril'));
  wait('deliver Shiny stock', () => shinyFreight.last.delivered >= 15, 40);
  for (const lane of shinyFreight.lanes) retireLane(lane);
  coreFreight(complex, 'command-core', path(sites.control, home, 'command-core'));
  planned['command-core'] = 5;
  pay('commandRobotics');
  for (const lane of [...lanes.values()]) if (lane.item.endsWith('-core')) retireLane(lane);
  mark('paid research complete');

  const mythrilAttack = makeFactory('Mythril Golem attack', 'command-suppression-bot', 15, sites.mythril);
  forgeStaging.forEach(cables => disconnect(sites.mythril, cables));
  for (const buffer of [...forgeStock, attackOre.sink]) connect(sites.mythril, buffer, mythrilAttack.buses.get('mythril'));
  const mythrilGolem = sector(mythrilMap).nodes.find(n => n.golemMineral === 'mythril');
  const attack = route('command-suppression-bot', sites.mythril, mythrilMap, mythrilAttack.output);
  connect(mythrilMap, attack.sink, mythrilGolem);
  wait('Mythril Golem', () => mythrilGolem.infiniteResource, 100);
  mark('Mythril Golem defeated', { map: mythrilMap, bots: attack.last?.delivered ?? 15 });
  for (const lane of new Set([...attack.lanes, ...attackOre.lanes, ...researchOre.lanes, ...botRoute.lanes])) if (lanes.has(lane.key)) retireLane(lane);
  return finishAfterMythril(sites, mythrilMap, mythrilGolem, ironMap);
  
  function finishAfterMythril(sites, mythrilMap, mythrilGolem, ironMap) {
  const foundry = corners.get('foundry'), dragon = corners.get('alpha'), grove = corners.get('grove'), reclamation = corners.get('reclamation');

  function extract(id, node, count, item) {
    const bus = cart(id, { x: node.x + 650, y: node.y });
    for (let i = 0; i < count; i++) {
      const extractor = place(id, 'extractor', node.x + 350, node.y + i * 280);
      connect(id, node, extractor, node.infiniteResource ? i : 0);
      connect(id, extractor, bus);
    }
    return bus;
  }

  const reserveOre = extract(mythrilMap, mythrilGolem, 2, 'mythril');
  const ironAttack = makeFactory('Iron Golem attack', 'command-suppression-bot', 8, sites.iron);
  const ironOre = route('mythril', mythrilMap, sites.iron, reserveOre, ironAttack.buses.get('mythril'), 'Iron attack Mythril');
  const ironGolem = sector(ironMap).nodes.find(n => n.golemMineral === 'iron');
  const ironBots = route('command-suppression-bot', sites.iron, ironMap, ironAttack.output);
  connect(ironMap, ironBots.sink, ironGolem);

  const corner = id => sector(id).nodes.find(n => n.kind === 'cornerChallenge');
  const parts = [['ceramic-electrode', 50], ['sealed-frame', 25], ['mythril-gear', 100]].map(([item, count]) => {
    const id = item === 'mythril-gear' ? sites.gears : sites.foundry;
    const district = makeFactory(`Foundry ${item}`, item, count, id);
    const delivery = route(item, id, foundry, district.output);
    connect(foundry, delivery.sink, corner(foundry), 0, input(corner(foundry), item));
    return { district, delivery };
  });
  wait('Iron Golem', () => ironGolem.infiniteResource, 85);
  mark('Iron Golem defeated', { map: ironMap, bots: ironBots.last?.delivered ?? 8 });
  for (const lane of [...ironOre.lanes, ...ironBots.lanes]) if (lanes.has(lane.key)) retireLane(lane);
  const gears = parts[2].district;
  const gearOre = route('mythril', mythrilMap, sites.gears, reserveOre, gears.buses.get('mythril'), 'Foundry Mythril');

  const groveNeighbor = neighbors(grove).find(id => visited.has(id));
  assert(groveNeighbor);
  const groveFeeds = [];
  for (const [item, count] of [['wood', 2], ['stone', 1]]) {
    const output = extract(groveNeighbor, source(groveNeighbor, item), count, item);
    groveFeeds.push([item, route(item, groveNeighbor, grove, output)]);
  }
  const iron = extract(ironMap, ironGolem, 1, 'iron');
  const wood = extract(ironMap, source(ironMap, 'wood'), 1, 'wood');
  const kiln = place(ironMap, 'kiln', wood.x + 240, wood.y);
  const smelter = place(ironMap, 'smelter', iron.x + 320, iron.y, 'smelt-iron');
  connect(ironMap, wood, kiln);
  connect(ironMap, kiln, smelter, 0, input(smelter, 'charcoal'));
  connect(ironMap, iron, smelter, 0, input(smelter, 'iron'));
  const plate = cart(ironMap, smelter);
  connect(ironMap, smelter, plate);
  groveFeeds.push(['iron-plate', route('iron-plate', ironMap, grove, plate, undefined, 'Golem Iron to Grove')]);

  const groveCamp = corner(grove), sign = coordinate(grove)[0] === 0 ? 1 : -1;
  const planters = [-160, 160].map(dy => {
    const planter = place(grove, 'treePlanter', groveCamp.x + sign * (getNodeSize(groveCamp).w / 2 + 420), groveCamp.y + dy, undefined,
      point => !connectionBlockedByWorld(point, groveCamp, { fromPort: 0, toPort: 0 }, sector(grove).nodes));
    for (const [item, delivery] of groveFeeds) connect(grove, delivery.sink, planter, 0, input(planter, item));
    connect(grove, planter, groveCamp);
    return planter;
  });
  watches.push(() => {
    if (!state.produced[CORNER_ITEMS.grove]) return false;
    stop(grove, planters);
    return true;
  });

  wait('100 Foundry gears', () => gears.meter.finishedAt, 55);
  for (const lane of gearOre.lanes) retireLane(lane);
  if (!gearOre.lanes.length) {
    const feeds = sector(mythrilMap).connections.filter(c => c.from === reserveOre.id && c.to === gears.buses.get('mythril').id);
    disconnect(mythrilMap, feeds.map(c => c.id));
  }
  wait('first corner piece', () => Object.values(CORNER_ITEMS).some(item => state.produced[item] > 0), 35);
  const halves = ['a', 'b'].map(half => {
    const recipe = Object.values(RECIPES).find(r => r.id.startsWith(`core-half-${half}-`) && isRecipeAvailable(r.id, state, 'assembler'));
    assert(recipe, `The game must reveal the ${half} recipe`);
    return place(home, 'assembler', 3050, half === 'a' ? 2150 : 2550, recipe.id);
  });
  const final = place(home, 'assembler', 3500, 2350, 'final-core');
  const finished = cart(home, { x: 4000, y: 2350 });
  halves.forEach((half, i) => connect(home, half, final, 0, i));
  connect(home, final, finished);

  function returnPiece(type, retired) {
    const id = corners.get(type), item = CORNER_ITEMS[type];
    wait(`${type} piece`, () => state.produced[item] >= 1, 100);
    for (const lane of retired) if (lanes.has(lane.key)) retireLane(lane);
    const box = sector(id).nodes.find(n => n.kind === 'cornerTribute');
    const output = cart(id, box);
    connect(id, box, output);
    const delivery = route(item, id, home, output, undefined, `return ${type}`);
    const half = halves.find(n => item in RECIPES[n.recipeId].inputs);
    connect(home, delivery.sink, half, 0, input(half, item));
    wait(`${type} received at Home`, () => delivery.last.delivered === 1, 5);
    mark(`${type} delivered Home`, { crossings: delivery.lanes.length });
    for (const lane of delivery.lanes) retireLane(lane);
  }

  returnPiece('foundry', parts.flatMap(part => part.delivery.lanes));
  returnPiece('grove', groveFeeds.flatMap(([, delivery]) => delivery.lanes));
  mark('released Foundry and Grove Roads for Dragon freight');

  const dragonFactory = makeFactory('Dragon Command Bots', 'command-suppression-bot', 21, sites.dragon, { exportFines: true });
  route('mythril', mythrilMap, sites.dragon, reserveOre, dragonFactory.buses.get('mythril'), 'Dragon Mythril');
  const dragonBots = route('command-suppression-bot', sites.dragon, dragon, dragonFactory.output);
  connect(dragon, dragonBots.sink, corner(dragon));
  const fines = route('metallic-fines', sites.dragon, reclamation, dragonFactory.fines);
  connect(reclamation, fines.sink, corner(reclamation));
  watches.push(() => {
    if (fines.first.delivered < 20) return false;
    disconnect(fines.first.from, fines.first.feed);
    connect(sites.dragon, dragonFactory.fines, dragonFactory.waste);
    return true;
  });
  returnPiece('reclamation', fines.lanes);
  returnPiece('alpha', dragonBots.lanes);

  wait('one Final Core in the collection Cart', () => stock(finished, 'final-core') === 1, 3);
  for (const item of Object.values(CORNER_ITEMS)) assert.equal(state.produced[item], 1);
  assert.equal(state.produced['final-core'], 1);
  assert.equal(fines.last.delivered, 20);
  mark('Final Core collected', { count: 1 });
  return { finished, blind: true, protectLakes, surveySeconds, expeditions, paidCores: paid, sites };
  }
}
