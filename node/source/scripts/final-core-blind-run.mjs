import assert from 'node:assert/strict';

const { isRecipeAvailable } = await import('../src/content/recipeAvailability.ts');
const { RECIPES } = await import('../src/content/recipes.ts');
const { ALPHA_AP, CORNER_ITEMS, FOUNDRY_INPUTS, GROVE_GROWTH } = await import('../src/content/endgame.ts');
const { BOT_STRENGTH } = await import('../src/content/botAssembly.ts');
const { GOLEM_AP_COST, MYTHRIL_GOLEM_AP_COST } = await import('../src/content/resourceGolems.ts');
const { roadChannels } = await import('../src/simulation/progression.ts');
const { getNodeSize } = await import('../src/domain/nodeGeometry.ts');
const { connectionBlockedByWorld } = await import('../src/simulation/connectionRules.ts');
const { destinationMapCosts } = await import('../src/simulation/mapExpansion.ts');

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
    stop, cart, freight, retireLane, lanes, factory, tryFactory, campaign, coreFreight, watches, cornerItems, unlocked, startHome, protectLakes, resume,
    allResearch, pilot, throughVictory, roadComparison, buyRoadChannels2, shinySurvey, shinyCopperBudget, researchCosts, remainingProjects, recordVictory, trackRoad,
    efficiencyArm, efficiencyUpgrade, peripheralSupply, maintainMapSupply } = context;
  const visited = new Map();
  const corners = new Map();
  const reserved = new Map();
  const paid = {};
  const planned = { 'simple-core': 100, 'basic-core': 60 };
  const expeditions = [];
  const coreLoads = new Map();
  const oreLoads = new Map();
  const activeBankMaps = new Set();
  const homeStock = new Map();
  let coreDistricts = 0;
  let mythrilSupply;
  let lab;
  const recoveredCoreStock = {};
  const lateBankSize = { 'shiny-core': 54, 'command-core': 38 };
  const lateResearch = [
    'heavyRobotics', 'precisionControl', 'commandRobotics',
    ...(buyRoadChannels2 ? ['roadChannels2'] : []),
    ...(allResearch ? ['victory'] : []),
  ];
  const billFor = item => lateResearch.reduce((sum, id) => sum + (researchCosts(id)[item] ?? 0), 0);
  const lowerStaging = billFor('simple-core');
  const shinyCount = billFor('shiny-core');
  const complexCount = billFor('command-core');
  const siteReserve = !efficiencyArm && (roadComparison === 'skip' || shinySurvey) ? researchCosts('roadChannels2') : {};
  const shinyWithImports = shinySurvey === 'shiny-with-imports';
  const distributedVictory = shinyWithImports && throughVictory;
  const sequenceFreight = roadComparison || distributedVictory;
  const initialBots = efficiencyArm ? 90 : 76;
  const efficiencyFactor = item => efficiencyArm === 'buy' && efficiencyUpgrade.recipes.includes(item) && unlocked(efficiencyUpgrade.id)
    ? efficiencyUpgrade.cycleMultiplier : 1;
  const shinyOre = campaign('Shiny research', { 'shiny-core': shinyCount }).raw.mythril;
  const complexOre = campaign('Complex research', { 'command-core': complexCount }).raw.mythril;
  const commandAP = BOT_STRENGTH['command-suppression-bot'];
  const mythrilBots = allResearch ? Math.ceil(MYTHRIL_GOLEM_AP_COST / commandAP) : 15;
  const ironBotCount = allResearch ? Math.ceil(GOLEM_AP_COST / commandAP) : 8;
  let dragonBotCount = allResearch ? Math.ceil(ALPHA_AP / commandAP) : 21;
  while (allResearch && (campaign('Reclamation waste', { 'command-suppression-bot': dragonBotCount }).surplus['metallic-fines'] ?? 0) < 20) dragonBotCount++;

  function survey(id, reason, record = true) {
    activate(id);
    assert(sector(id).visited || id === home, `Map ${id} must be visited before inspection`);
    const nodes = sector(id).nodes;
    const observations = {
      resources: Object.fromEntries(localResources.map(item => [item, source(id, item)?.resourceRemaining ?? 0])),
      lake: nodes.some(n => n.kind === 'lake'),
      golem: nodes.find(n => n.kind === 'resourceGolem' || n.infiniteResource && n.golemMineral)?.golemMineral,
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
    const slots = roadChannels(state);
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

  function route(item, from, to, output, receiving, name = item, entry) {
    if (from === to) {
      if (receiving && receiving !== output) connect(from, output, receiving);
      return { sink: receiving ?? output, lanes: [], last: undefined };
    }
    const blockedEdges = new Set();
    const original = new Set(lanes.values());
    const offsets = new Map();
    let issue;
    for (let attempt = 0; attempt < 40; attempt++) {
      const routePath = path(from, to, item, entry, blockedEdges) ?? path(from, to, item, undefined, blockedEdges);
      if (!routePath) break;
      try { return freight(item, routePath, output, receiving, name, offsets); }
      catch (error) {
        if (!error.freightEdge || !/corridor|Road endpoints|clearance|No placement for woodenChest/.test(error.message)) throw error;
        issue = error;
        if (error.roadRetry) {
          offsets.set(error.roadRetry.edge, error.roadRetry.offset);
          continue;
        }
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
    const plan = options.campaign ?? campaign(name, { [item]: count });
    const rate = options.rate ?? coreSize[item]?.[1] ?? supplyRate[item];
    const producers = Object.fromEntries(Object.entries(plan.work).filter(([product]) => product !== 'mythril')
      .map(([product, seconds]) => [product, Math.ceil(seconds * efficiencyFactor(product) / (count / rate * 60 * .9))]));
    const build = options.tryPlacement ? tryFactory : factory;
    const existing = maintainMapSupply ? new Set(sector(id).nodes.map(node => node.id)) : undefined;
    const district = build(name, { ...options, plan: { id, ...plan, producers }, meterInputs: options.meterInputs ?? true });
    if (existing && district) district.floor = sector(id).nodes.filter(node => !existing.has(node.id));
    return district;
  }

  function clearFinishedFloor(district) {
    const { id, floor } = district;
    const lake = source(id, 'water');
    const intakes = new Set(sector(id).connections.filter(cable => cable.from === lake?.id).map(cable => cable.to));
    activate(id);
    engine.deleteNodes(floor.filter(node => !intakes.has(node.id)).map(node => node.id));
  }

  function clearFloorAfterDelivery(district, item, coreBank = false) {
    const members = new Set(district.floor.map(node => node.id));
    watches.push(() => {
      if (!mythrilSupply || !district.meter.finishedAt || stock(district.output, item) || district.meter.nodes.some(node => stock(node, item)) ||
        state.inFlightTransfers.some(transfer => !transfer.cosmeticOnly && transfer.item === item &&
          (members.has(transfer.from) || members.has(transfer.to)))) return false;
      clearFinishedFloor(district);
      if (coreBank) activeBankMaps.delete(district.id);
      return true;
    });
  }

  const supplies = (id, raw) => canSupply(id, raw) && localResources.every(item =>
    (source(id, item)?.resourceRemaining ?? 0) >= reserveFor(raw)[item]);

  function inwardPlan(item, count, center, excluded, crossings = 1, imported = item === 'shiny-core' ? ['circuit-a'] : ['circuit-a', 'hydraulic-actuator']) {
    const local = campaign(item, { [item]: count }, { imported });
    if (!supplies(center, local.raw)) return;
    const imports = [];
    const sites = [...visited.keys()].filter(id => distance(id, center) <= crossings && nearHome(id) > nearHome(center) && !excluded.includes(id))
      .sort((a, b) => distance(a, center) - distance(b, center) || sector(a).nodes.length - sector(b).nodes.length);
    for (const cargo of [...imported].reverse()) {
      const amount = local.imports[cargo];
      const plan = campaign(cargo, { [cargo]: amount });
      const from = sites.find(id => (!plan.raw.water || visited.get(id).lake) && supplies(id, plan.raw)
        && !imports.some(other => other.from === id) && (path(id, center, cargo)?.length ?? Infinity) <= crossings + 1);
      if (!from) return;
      imports.push({ item: cargo, from, count: amount, raw: plan.raw });
    }
    return { local, imports, localSupply: Object.fromEntries(imported.map(cargo => [cargo, 0])) };
  }

  function reserveInward(center, plan) {
    book(center, plan.local.raw);
    for (const shipment of plan.imports) book(shipment.from, shipment.raw);
  }

  function shipInward(district, imports) {
    return imports.flatMap(({ item, from, count }) => {
      const name = `Inward ${item} from ${from} to ${district.id}`;
      const supplier = makeFactory(name, item, count, from, { rate: item === 'hydraulic-actuator' ? 4 : 10 });
      const shipment = route(item, from, district.id, supplier.output, district.buses.get(item), name);
      mark('routed peripheral intermediate', { item, from, to: district.id, count, crossings: shipment.lanes.length });
      return shipment.lanes;
    });
  }

  function addCore(item, count) {
    const name = `Core bank ${++coreDistricts} ${item}`;
    const bill = campaign(name, { [item]: count }).raw;
    const lateBank = maintainMapSupply && Boolean(bill.water) && mythrilSupply;
    const sites = [...visited.keys()].filter(id => id !== home && (!bill.water || visited.get(id).lake)
      && (lateBank ? !activeBankMaps.has(id) : canSupply(id, bill)) && researchPath(id, item));
    const lakeCost = id => {
      const map = visited.get(id);
      if (!protectLakes || !map.lake) return 0;
      return item === 'hydro-core' ? Number(map.resources.copper >= 3000) : 1;
    };
    const fallbackEntry = id => protectLakes && researchPath(id, item).at(-2) !== homeEntry[item] ? 1 : 0;
    const postVictory = unlocked('victory');
    const flexiblePlacement = postVictory || (distributedVictory && unlocked('commandRobotics')) || maintainMapSupply;
    const oreDistance = id => maintainMapSupply && bill.mythril && mythrilSupply ? distance(mythrilSupply.id, id) : 0;
    sites.sort((a, b) => oreDistance(a) - oreDistance(b) || (flexiblePlacement ? sector(a).nodes.length - sector(b).nodes.length : 0)
      || fallbackEntry(a) - fallbackEntry(b) || lakeCost(a) - lakeCost(b) || researchPath(a, item).length - researchPath(b, item).length
      || Number(Boolean(visited.get(a).dwarves || visited.get(a).goblin)) - Number(Boolean(visited.get(b).dwarves || visited.get(b).goblin))
      || visited.get(a).holes - visited.get(b).holes);
    let id, district, delivery, ore, distributed, inwardFreight;
    for (const candidate of sites) {
      if (bill.mythril && (!mythrilSupply || !path(mythrilSupply.id, candidate, 'mythril'))) continue;
      distributed = lateBank ? inwardPlan(item, count, candidate, [home, mythrilSupply.id], 5, ['iron-plate'])
        ?? inwardPlan(item, count, candidate, [home, mythrilSupply.id], 5,
          item === 'hydro-core' ? ['copper-plate'] : undefined) : undefined;
      if (lateBank && !distributed && !supplies(candidate, bill)) continue;
      const rate = lateBank ? (item === 'command-core' ? .5 : 1.3) : postVictory && item === 'hydro-core' ? 2 : undefined;
      district = makeFactory(name, item, count, candidate, { tryPlacement: flexiblePlacement, rate,
        campaign: distributed?.local, localSupply: distributed?.localSupply });
      if (!district) continue;
      if (lateBank) {
        const previousLanes = new Set(lanes.values());
        try {
          if (bill.mythril) ore = route('mythril', mythrilSupply.id, candidate, mythrilSupply.bus, district.buses.get('mythril'), name);
          delivery = route(item, candidate, home, district.output, undefined, name, homeEntry[item]);
          inwardFreight = distributed?.imports.map(shipment => {
            const supplier = makeFactory(`Map bank ${name} ${shipment.item}`, shipment.item, shipment.count, shipment.from, { rate: 6, tryPlacement: true });
            if (!supplier) throw new Error(`No surveyed factory fit for ${shipment.item} on ${shipment.from}`);
            const input = route(shipment.item, shipment.from, candidate, supplier.output, district.buses.get(shipment.item), name);
            return { supplier, item: shipment.item, count: shipment.count, input };
          });
        } catch (error) {
          if (!error.message.startsWith('No surveyed ')) throw error;
          for (const lane of [...lanes.values()]) if (!previousLanes.has(lane)) retireLane(lane);
          clearFinishedFloor(district);
          mark('tried another revealed factory site for freight', { item, map: candidate, reason: error.message });
          district = undefined;
          ore = undefined;
          delivery = undefined;
          continue;
        }
      }
      id = candidate;
      break;
    }
    if (!district && count > (lateBank ? 2 : postVictory || maintainMapSupply ? 8 : 30)) return addCore(item, Math.floor(count * .65));
    assert(district, `No surveyed site can support another ${count} ${item}`);
    if (distributed) {
      reserveInward(id, distributed);
      for (const shipment of inwardFreight) {
        countFreight(shipment.input.lanes, shipment.count, coreLoads);
        clearFloorAfterDelivery(shipment.supplier, shipment.item);
      }
    } else book(id, bill);
    const lab = sector(home).nodes.find(node => node.kind === 'researchCenter');
    delivery ??= allResearch || maintainMapSupply ? route(item, id, home, district.output, undefined, name, homeEntry[item])
      : coreFreight(district, item, researchPath(id, item));
    if ((allResearch || maintainMapSupply) && !sector(home).connections.some(cable => cable.from === delivery.sink.id && cable.to === lab.id)) connect(home, delivery.sink, lab);
    if (bill.mythril) {
      assert(mythrilSupply, `No mine for ${item}`);
      ore ??= route('mythril', mythrilSupply.id, id, mythrilSupply.bus, district.buses.get('mythril'), name);
      if (maintainMapSupply) countFreight(ore.lanes, distributed?.local.raw.mythril ?? bill.mythril, oreLoads);
    }
    if (!homeStock.has(item)) homeStock.set(item, new Set());
    homeStock.get(item).add(delivery.sink);
    countFreight(delivery.lanes, count, coreLoads);
    if (maintainMapSupply) {
      if (lateBank) activeBankMaps.add(id);
      clearFloorAfterDelivery(district, item, Boolean(lateBank));
    }
    planned[item] = (planned[item] ?? 0) + count;
  }

  function countFreight(delivery, count, loads) {
    for (const lane of delivery) {
      if (lane.restored) continue;
      if (!loads.has(lane)) {
        loads.set(lane, 0);
        watches.push(() => {
          if (!lanes.has(lane.key)) { loads.delete(lane); return true; }
          if (lane.delivered < loads.get(lane)) return false;
          if (lanes.has(lane.key)) retireLane(lane);
          loads.delete(lane);
          return true;
        });
      }
      loads.set(lane, loads.get(lane) + count);
    }
  }

  function pay(id, destination) {
    const costs = research(id, bill => {
      const entries = Object.entries(bill);
      if (unlocked('victory')) entries.reverse();
      for (const [item, count] of entries) {
        while (Math.max((planned[item] ?? 0) - (paid[item] ?? 0), unlocked('victory') || (maintainMapSupply && mythrilSupply) ? labStock(item) : 0) < count) {
          const lateCore = (allResearch || maintainMapSupply) && mythrilSupply && Object.hasOwn(lateBankSize, item);
          assert(coreSize[item] || lateCore, `Waiting for the dedicated ${item} plant`);
          try {
            const remaining = count - Math.max((planned[item] ?? 0) - (paid[item] ?? 0), labStock(item));
            const standardBank = protectLakes && item === 'hydro-core' ? 115 : coreSize[item]?.[0];
            const size = maintainMapSupply && mythrilSupply
              ? Math.max(remaining, Math.min(lateBankSize[item] ?? standardBank, remaining + 12))
              : lateCore ? Math.max(remaining, 20) : standardBank;
            addCore(item, size);
          } catch (error) {
            if (!unlocked('victory') || !error.message.startsWith('No surveyed site can support another')) throw error;
            const contributed = state.research.contributed[item] ?? 0;
            mark('waiting for existing supply after exhausting surveyed placements', { project: id, item, needed: count, onHand: labStock(item) });
            wait(`existing ${item} supply for ${id}`, () => state.research.selected !== id
              || labStock(item) + (state.research.contributed[item] ?? 0) >= count + contributed, 12);
            if (state.research.selected !== id) return;
            break;
          }
        }
      }
    }, destination);
    for (const [item, count] of Object.entries(costs)) paid[item] = (paid[item] ?? 0) + count;
  }

  function labStock(item) {
    const map = sector(home);
    const suppliers = new Set(map.connections.filter(cable => cable.to === lab.id).map(cable => cable.from));
    return stock(lab, item) + map.nodes.filter(node => suppliers.has(node.id)).reduce((sum, node) => sum + stock(node, item), 0);
  }

  function expandHomeBuffer(item, count, inlet) {
    const supplier = inlet ?? [...(homeStock.get(item) ?? [])].at(-1);
    assert(supplier, `No freight supplier for ${item}`);
    for (let remaining = count - 20; remaining > 0; remaining -= 20) {
      const buffer = cart(home, supplier);
      connect(home, supplier, buffer);
      connect(home, buffer, lab);
    }
  }

  function discover(id, reason) {
    if (visited.has(id)) return;
    if (!state.sectors[id]?.unlocked && !state.research.mapPoints) {
      const override = state.mod?.research?.mapNode;
      pay('mapNode', override?.costs === undefined && !override?.costGrowth ? id : undefined);
    }
    if (!state.sectors[id]?.unlocked) assert(engine.unlockSector(...coordinate(id)), `Activate adjacent ${id}`);
    survey(id, reason);
  }

  const frontier = () => [...new Set([...visited.keys()].flatMap(neighbors))].filter(id => !visited.has(id));
  function scout(reason, score, maxTier = Infinity) {
    const canFundTier = id => {
      if (!maintainMapSupply || state.research.mapPoints || state.sectors[id]?.unlocked) return true;
      const price = destinationMapCosts(state, ...coordinate(id));
      return price && Object.keys(price).every(item => item === 'simple-core' || (state.produced[item] ?? 0) > 0) &&
        (mythrilSupply || !price['shiny-core']);
    };
    const next = frontier().filter(id => nearHome(id) <= maxTier && canFundTier(id)).sort((a, b) => score(a) - score(b))[0];
    assert(next, `No frontier for ${reason}`);
    discover(next, reason);
  }
  const nearHome = id => distance(home, id);
  const findCamp = () => [...visited].filter(([, map]) => map.dwarves === 'camp').sort(([a], [b]) => nearHome(a) - nearHome(b))[0]?.[0];
  const findGolem = mineral => [...visited].find(([, map]) => map.golem === mineral)?.[0];

  if (resume) {
    for (const map of Object.values(state.sectors)) if (map.unlocked && (map.visited || map.id === home)) survey(map.id, 'saved survey', false);
    if (maintainMapSupply && resume.audit) return resumeMapSupply(resume.audit);
    if (resume.audit) {
      const { trace, payments, failure } = resume.audit;
      const { sites, dwarf, mythrilMap, ironMap } = trace.find(entry => entry.name === 'scouting and revealed site selection complete');
      for (const payment of payments) for (const [item, count] of Object.entries(payment.costs)) paid[item] = (paid[item] ?? 0) + count;
      lab = sector(home).nodes.find(node => node.kind === 'researchCenter');
      const suppliers = sector(home).connections.filter(cable => cable.to === lab.id).map(cable => sector(home).nodes.find(node => node.id === cable.from));
      const mythrilGolem = sector(mythrilMap).nodes.find(node => node.infiniteResource && node.golemMineral === 'mythril');
      if (mythrilGolem) {
        if (unlocked('victory')) return resumeResearch(sites, mythrilMap);
        for (const item of [...Object.keys(coreSize), 'shiny-core', 'command-core']) {
          planned[item] = (paid[item] ?? 0) + stock(lab, item) + suppliers.reduce((sum, node) => sum + stock(node, item), 0);
        }
        if (failure?.startsWith('No surveyed foundry-component freight path') && state.produced[CORNER_ITEMS.grove] && state.produced[CORNER_ITEMS.foundry]) {
          return resumeCornerFreight(sites, mythrilMap);
        }
        assert(failure?.startsWith('No placement') && failure.includes(` on ${sites.iron} `), 'Expected an unfinished Iron attack build after the Mythril Golem');
        const newest = Math.max(...sector(sites.iron).nodes.map(node => node.constructedAt));
        for (const id of new Set([sites.iron, mythrilMap])) {
          activate(id);
          const unfinished = sector(id).nodes.filter(node => node.constructedAt === newest);
          if (unfinished.length) engine.deleteNodes(unfinished.map(node => node.id));
        }
        const bill = campaign('Iron Golem attack', { 'command-suppression-bot': ironBotCount }).raw;
        const foundryBill = campaign('Foundry parts', { 'ceramic-electrode': 50, 'sealed-frame': 25 }).raw;
        const alternative = [...visited.keys()].filter(id => id !== sites.iron && (id === sites.foundry || !Object.values(sites).includes(id)) && visited.get(id).lake
          && localResources.every(item => visited.get(id).resources[item] >= (bill[item] ?? 0) + (id === sites.foundry ? foundryBill[item] ?? 0 : 0)))
          .sort((a, b) => sector(a).nodes.length - sector(b).nodes.length || distance(a, ironMap) - distance(b, ironMap))[0];
        assert(alternative, 'No surveyed alternate Lake for the Iron Golem attack');
        mark('moved Iron attack to a surveyed Lake with more construction space', { from: sites.iron, to: alternative });
        return finishAfterMythril({ ...sites, iron: alternative }, mythrilMap, mythrilGolem, ironMap);
      }
      assert(failure === 'Select assemble-bot-f2-g2 on botPlant' && unlocked('roadChannels2'), 'Expected the checkpoint immediately after the Bot Plant setup stopped');
      for (const item of Object.keys(coreSize)) {
        homeStock.set(item, new Set(suppliers));
        planned[item] = (paid[item] ?? 0) + lowerStaging;
      }
      const unfinished = sector(sites.medium).nodes.find(node => node.kind === 'botPlant');
      assert(unfinished, 'Expected the unfinished Bot Plant in the checkpoint');
      activate(sites.medium);
      engine.deleteNodes(sector(sites.medium).nodes.filter(node => node.constructedAt === unfinished.constructedAt).map(node => node.id));
      mark('resumed after Road Channels 2 with part-fed Bot Plants', { seed: state.seed, sites });
      return startEncounters(sites, dwarf, mythrilMap, ironMap);
    }
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
  const starter = startHome();
  lab = starter.lab;
  paid['simple-core'] = 10;
  paid['basic-core'] = 5;
  scout('nearest map after Exploration', nearHome);
  pay('road');
  // The second starter bank uses the same factory arrangement as the known-route run.
  starter.addSimple();
  while (visited.size < 11) scout('near-Home resource survey', nearHome);
  assert([...visited.values()].some(map => map.lake) && unlocked('suppressionBot'));
  const waterProjects = ['fabricatorTools', 'hydrochemistry', 'hydraulicAssembly', 'treePlanter', 'roadChannels1', 'fluidRouting', 'sealedRobotics'];
  pay('automataCore');
  if (!protectLakes) for (const id of waterProjects) pay(id);
  pay('areaExpansion1');
  if (allResearch && protectLakes) for (const id of ['fabricatorTools', 'hydrochemistry', 'hydraulicAssembly', 'roadChannels1']) pay(id);
  if (efficiencyArm === 'buy') {
    wait('first Hydro Core before efficiency', () => state.produced['hydro-core'] > 0);
    pay(efficiencyUpgrade.id);
  }
  mark('starter research and survey complete');

  const mediumRole = dwarf => ['medium', dwarf, true, [['medium-suppression-bot', initialBots]]];
  const controlRole = ['control', home, true, [['shiny-core', shinyCount + (siteReserve['shiny-core'] ?? 0)], ['command-core', complexCount + (siteReserve['command-core'] ?? 0)]]];

  if (shinySurvey === 'tribute-first' || shinySurvey === 'bots-during-survey' || shinyWithImports) {
    while (!findCamp()) scout('find a small Dwarven Camp before the corners', id => Math.abs(nearHome(id) - 5));
    const dwarf = findCamp();
    const scoutLake = () => scout('find Lake sites for Bots and Shiny Cores', id => nearHome(id) + distance(id, dwarf));
    if (shinySurvey !== 'tribute-first') {
      let mediumSite = chooseSites([mediumRole(dwarf)], dwarf);
      while (!mediumSite) {
        scoutLake();
        mediumSite = chooseSites([mediumRole(dwarf)], dwarf);
      }
      pay('sealedRobotics');
      const botStaging = stageDwarvenBots(mediumSite.medium, dwarf);
      const selectShinySite = () => shinyWithImports
        ? chooseShinyWithImports(dwarf, mediumSite.medium)
        : chooseSites([controlRole], dwarf, mediumSite);
      let sites = selectShinySite();
      while (!sites) {
        scoutLake();
        sites = selectShinySite();
      }
      const botsStaged = stock(botStaging.staged, 'medium-suppression-bot') + stock(botStaging.botRoute.sink, 'medium-suppression-bot');
      mark('scouting and revealed site selection complete', { opened: visited.size - 1, dwarf, sites, botsStaged });
      return startShinyRoute(sites, dwarf, undefined, undefined, botStaging);
    }
    const roles = [mediumRole(dwarf), controlRole];
    let sites = chooseSites(roles, dwarf);
    while (!sites) {
      scoutLake();
      sites = chooseSites(roles, dwarf);
    }
    mark('scouting and revealed site selection complete', { opened: visited.size - 1, dwarf, sites });
    return startShinyRoute(sites, dwarf);
  }

  function scoutCorners() {
    // Corner coordinates are visible. Challenge types are learned on arrival.
    if (maintainMapSupply) {
      for (const corner of ['0,0', '10,0', '10,10', '0,10']) {
        while (!visited.has(corner)) {
          const queue = [...visited.keys()].map(id => ({ id, cost: 0, first: undefined }));
          const best = new Map(queue.map(entry => [entry.id, 0]));
          let nextOpening;
          while (queue.length) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift();
            if (current.cost > best.get(current.id)) continue;
            if (current.id === corner) { nextOpening = current.first; break; }
            for (const id of neighbors(current.id)) {
              if (visited.has(id)) continue;
              const price = destinationMapCosts(state, ...coordinate(id));
              const estimate = price ? Object.values(price).reduce((n, count) => n + count, 0) : 5 * nearHome(id);
              const cost = current.cost + estimate;
              if (cost >= (best.get(id) ?? Infinity)) continue;
              best.set(id, cost);
              queue.push({ id, cost, first: current.first ?? id });
            }
          }
          assert(nextOpening, `No frontier route to corner ${corner}`);
          discover(nextOpening, 'reuse surveyed territory on the route to a corner');
        }
      }
      assert.equal(corners.size, 4);
      return;
    }
    for (const [x, y] of [[0, 0], [10, 0], [10, 10], [0, 10]]) {
      for (let column = 5 + Math.sign(x - 5); column !== x + Math.sign(x - 5); column += Math.sign(x - 5)) discover(`${column},5`, 'shared route toward visible world corners');
      for (let row = 5 + Math.sign(y - 5); row !== y + Math.sign(y - 5); row += Math.sign(y - 5)) discover(`${x},${row}`, 'approach a visible corner');
    }
    assert.equal(corners.size, 4);
  }

  function chooseSites(roles, dwarf, previousChoices = {}) {
    const local = new Map(reserved), choices = { ...previousChoices };
    for (const [role, near, lake, items] of roles) {
      const raw = sumRaw(items.map(([item, count]) => campaign(role, { [item]: count })));
      const occupied = Object.entries(choices).filter(([name]) => !maintainMapSupply || !mythrilSupply ||
        !['medium', 'control', 'complex', 'mythril'].includes(name)).map(([, id]) => id);
      const available = [...visited.keys()].filter(id => id !== home && (!lake || visited.get(id).lake)
        && (!pilot || (!occupied.includes(id) && (role !== 'control' || id !== dwarf)))
        && (!protectLakes || role !== 'foundry' || id !== choices.control) && canSupply(id, raw, local));
      available.sort((a, b) => distance(a, near) - distance(b, near) || visited.get(a).holes - visited.get(b).holes);
      if (!available.length) return;
      choices[role] = available[0];
      book(available[0], raw, local);
    }
    for (const [id, bill] of local) reserved.set(id, bill);
    return choices;
  }

  function chooseShinyWithImports(dwarf, medium) {
    const demand = campaign('Shiny research', { 'shiny-core': shinyCount }).raw;
    const lakes = [...visited].filter(([id, map]) => map.lake && id !== home && id !== dwarf && id !== medium)
      .map(([id]) => id).sort((a, b) => nearHome(a) - nearHome(b));
    const freeStock = (id, item) => Math.max(0, Math.min(source(id, item)?.resourceRemaining ?? 0,
      visited.get(id).resources[item] - (reserved.get(id)?.[item] ?? 0)));
    for (const control of lakes) {
      if (!path(dwarf, control, 'mythril') || !path(control, home, 'shiny-core')) continue;
      if (peripheralSupply) {
        const inward = inwardPlan('shiny-core', shinyCount, control, [home, dwarf, medium]);
        if (!inward) continue;
        reserveInward(control, inward);
        return { medium, control, inward, localSupply: inward.localSupply };
      }
      if (efficiencyArm) {
        if (!localResources.every(item => freeStock(control, item) >= reserveFor(demand)[item])) continue;
        book(control, demand);
        return { medium, control, localSupply: {}, imports: [] };
      }
      const localSupply = {}, imports = [], exportReserves = new Map();
      let supplied = true;
      for (const item of ['iron', 'copper', 'stone', 'wood'].filter(item => demand[item] > 0)) {
        const budget = item === 'copper' ? shinyCopperBudget ?? Infinity : Infinity;
        const cargo = item === 'copper' || item === 'iron' ? `${item}-plate` : item;
        const orePerCargo = cargo === item ? 1 : RECIPES[`smelt-${item}`].inputs[item];
        const exportedFuel = item === 'wood' ? [...exportReserves.values()].reduce((sum, stock) => sum + (stock.wood ?? 0), 0) : 0;
        const cargoDemand = (demand[item] - exportedFuel) / orePerCargo;
        const local = Math.min(cargoDemand, Math.floor(Math.min(freeStock(control, item), budget) / orePerCargo));
        let shortfall = cargoDemand - local;
        if (!shortfall) continue;
        localSupply[cargo] = local;
        const suppliers = [...visited.keys()].filter(id => id !== control && id !== home)
          .map(id => {
            const booked = exportReserves.get(id) ?? {};
            const ore = Math.floor((freeStock(id, item) - (booked[item] ?? 0)) / orePerCargo);
            const fuel = cargo === item ? Infinity : freeStock(id, 'wood') - (booked.wood ?? 0);
            return { id, stock: Math.min(ore, fuel), path: path(id, control, cargo) };
          })
          .filter(supplier => supplier.stock > 0 && supplier.path).sort((a, b) => a.path.length - b.path.length);
        for (const supplier of suppliers) {
          const count = Math.min(shortfall, supplier.stock);
          imports.push({ item: cargo, from: supplier.id, count });
          const booked = exportReserves.get(supplier.id) ?? {};
          booked[item] = (booked[item] ?? 0) + count * orePerCargo;
          if (cargo !== item) booked.wood = (booked.wood ?? 0) + count;
          exportReserves.set(supplier.id, booked);
          shortfall -= count;
          if (!shortfall) break;
        }
        if (shortfall) { supplied = false; break; }
      }
      if (supplied) return { medium, control, localSupply, imports };
    }
  }

  function selectCornerSites(earlierSites = {}) {
    scoutCorners();
    while (!findCamp() || !findGolem('mythril') || !findGolem('iron')) {
      scout('midfield survey for a small Dwarven Camp and two Golems', id => Math.abs(nearHome(id) - (protectLakes ? 5 : 4.5)));
    }
    const dwarf = findCamp(), mythrilMap = findGolem('mythril'), ironMap = findGolem('iron');
    const foundry = corners.get('foundry'), dragon = corners.get('alpha');
    const roles = [
      ['dragon', dragon, true, [['command-suppression-bot', dragonBotCount]]],
      ...(!earlierSites.mythril ? [['mythril', mythrilMap, true, [['command-suppression-bot', mythrilBots]]]] : []),
      ...(!earlierSites.medium ? [mediumRole(dwarf)] : []),
      ['iron', ironMap, true, [['command-suppression-bot', ironBotCount]]],
      ...(!earlierSites.control ? [controlRole] : []),
      ['foundry', foundry, true, [['ceramic-electrode', 50], ['sealed-frame', 25]]],
      ['gears', foundry, false, [['mythril-gear', 100]]],
    ];
    let sites = chooseSites(roles, dwarf, earlierSites);
    while (!sites) {
      scout('survey an outer map for a Lake and industrial reserves', id => (nearHome(id) < 6 ? 25 : 0) + distance(id, dragon));
      sites = chooseSites(roles, dwarf, earlierSites);
    }
    mark('scouting and revealed site selection complete', { opened: visited.size - 1, dwarf, mythrilMap, ironMap, sites });
    return { sites, dwarf, mythrilMap, ironMap };
  }
  const { sites, dwarf, mythrilMap, ironMap } = selectCornerSites();
  return startShinyRoute(sites, dwarf, mythrilMap, ironMap);

  function startShinyRoute(sites, dwarf, mythrilMap, ironMap, botStaging) {
    if (protectLakes) for (const id of waterProjects.filter(id => !unlocked(id))) pay(id);
    pay('oreSeparation');
    if (!pilot) pay('roadChannels2');
    return startEncounters(sites, dwarf, mythrilMap, ironMap, botStaging);
  }

  function stageDwarvenBots(mediumSite, dwarf) {
    const medium = makeFactory('Dwarven supply', 'medium-suppression-bot', initialBots, mediumSite, { meterInputs: protectLakes });
    const botRoute = route('medium-suppression-bot', mediumSite, dwarf, medium.output);
    const staged = cart(dwarf, botRoute.sink);
    const staging = connect(dwarf, botRoute.sink, staged);
    return { botRoute, staged, staging };
  }

  function startEncounters(sites, dwarf, mythrilMap, ironMap, botStaging = stageDwarvenBots(sites.medium, dwarf)) {
    const { botRoute, staged, staging } = botStaging;
    const camp = sector(dwarf).nodes.find(n => n.lizardSettlement === 'camp');
    if (protectLakes) {
      const amounts = Object.keys(coreSize).map(item => [item, pilot ? billFor(item) : lowerStaging]);
      for (const [item, count] of amounts) {
        while ((planned[item] ?? 0) - (paid[item] ?? 0) < count) addCore(item, count);
        if (efficiencyArm) expandHomeBuffer(item, count);
      }
      wait('stage lower Cores for the remaining projects', () => amounts.every(([item, count]) =>
        (pilot ? labStock(item) : (lab.input[item] ?? 0) + [...(homeStock.get(item) ?? [])].reduce((sum, buffer) => sum + stock(buffer, item), 0)) >= count), 75);
      if (!maintainMapSupply) for (const lane of [...lanes.values()]) if (lane.item.endsWith('-core')) retireLane(lane);
      if (efficiencyArm) {
        planned['simple-core'] = (paid['simple-core'] ?? 0) + labStock('simple-core');
      }
      if (resume?.audit) for (const id of visited.keys()) {
        activate(id);
        const active = new Set([...lanes.values()].map(lane => lane.sending.id));
        const retired = sector(id).nodes.filter(node => node.kind === 'road' && node.roadMode === 'export' && !active.has(node.id));
        if (retired.length) engine.deleteNodes(retired.map(node => node.id));
      }
      mark(maintainMapSupply ? 'staged lower Cores and kept freight in service' : 'staged lower Cores and released research Roads');
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

    const beforeShiny = new Set(sector(sites.control).nodes.map(node => node.id));
    const shiny = makeFactory('Shiny research', 'shiny-core', shinyCount, sites.control, { localSupply: sites.localSupply, campaign: sites.inward?.local,
      ...(efficiencyArm ? { rate: 4.5 } : {}) });
    const inwardShiny = peripheralSupply ? shipInward(shiny, sites.inward.imports) : [];
    const shinyFactoryNodes = sector(sites.control).nodes.filter(node => !beforeShiny.has(node.id));
    const shinyPath = path(sites.control, home, 'shiny-core');
    assert(shinyPath);
    const shinyFreight = efficiencyArm ? route('shiny-core', sites.control, home, shiny.output) : coreFreight(shiny, 'shiny-core', shinyPath);
    if (efficiencyArm) {
      connect(home, shinyFreight.sink, lab);
      expandHomeBuffer('shiny-core', shinyCount - researchCosts('heavyRobotics')['shiny-core'] - researchCosts('precisionControl')['shiny-core'], shinyFreight.sink);
    }
    planned['shiny-core'] = shinyCount;
    const researchOre = route('mythril', dwarf, sites.control, tributeCart, shiny.buses.get('mythril'), 'research Tribute');
    const solidLanes = new Set(), supplyLanes = new Set();
    if (shinyWithImports) {
      for (const { item, from, count } of sites.imports ?? []) {
        const name = `Shiny ${item} import from ${from}`;
        const supplier = makeFactory(name, item, count, from, { rate: 12 });
        const shipment = route(item, from, sites.control, supplier.output, shiny.buses.get(item), name);
        supplyLanes.add(shipment.last);
        for (const lane of shipment.lanes) solidLanes.add(lane);
        mark('routed Shiny solid import', { item, from, to: sites.control, count, crossings: shipment.lanes.length });
      }
    }
    if (shinySurvey) wait('first Shiny Core', () => state.produced['shiny-core'] >= 1, 30);
    if (shinySurvey && !throughVictory) {
      return { firstShinyAt: sites.control, ...(shinyWithImports ? { solidImports: [...supplyLanes].map(lane => ({ item: lane.item, dispatchedOnLastRoad: lane.delivered })) } : {}) };
    }
    const initialOre = pilot ? shinyOre : 48;
    if (protectLakes && !distributedVictory) wait('reserve the first Mythril shipment for research', () => researchOre.last.delivered >= initialOre, 25);
    const attackOre = pilot ? undefined : route('mythril', dwarf, sites.mythril, tributeCart, undefined, 'attack Tribute');
    const forgeStock = attackOre ? Array.from({ length: 12 }, () => cart(sites.mythril, attackOre.sink)) : [];
    const forgeStaging = forgeStock.map(buffer => connect(sites.mythril, attackOre.sink, buffer));
    const researchBranch = pilot ? researchOre.first : researchOre.lanes.find(lane => !attackOre.lanes.includes(lane));
    if (researchBranch) watches.push(() => {
      if (researchBranch.delivered < (pilot ? shinyOre + complexOre + 4 : 70)) return false;
      disconnect(researchBranch.from, researchBranch.feed);
      return true;
    });
    for (const project of ['heavyRobotics', 'precisionControl']) pay(project);
    const deliverShiny = () => {
      wait('deliver Shiny stock', () => shinyFreight.last.delivered >= shinyCount, efficiencyArm ? 90 : 40);
      for (const lane of shinyFreight.lanes) retireLane(lane);
    };
    if (distributedVictory) {
      deliverShiny();
      for (const lane of new Set([...researchOre.lanes, ...solidLanes, ...inwardShiny])) if (lanes.has(lane.key)) retireLane(lane);
      if (maintainMapSupply) clearFinishedFloor(shiny);
      const complexBill = campaign('Complex research', { 'command-core': complexCount }).raw;
      const candidates = () => [...visited.keys()].filter(id => id !== sites.control && id !== sites.medium && id !== dwarf
        && visited.get(id).lake && (peripheralSupply || canSupply(id, complexBill)) && path(dwarf, id, 'mythril') && path(id, home, 'command-core'))
        .sort((a, b) => peripheralSupply ? nearHome(a) - nearHome(b) : (efficiencyArm ? sector(a).nodes.length - sector(b).nodes.length : 0) || nearHome(a) - nearHome(b));
      const attempted = new Set();
      const rates = efficiencyArm ? [2.8, 2, 1.35, .9, .65] : [.65];
      let complex, inward;
      while (!complex) {
        const available = candidates();
        for (const rate of rates) {
          for (const id of available) {
            const plan = peripheralSupply ? inwardPlan('command-core', complexCount, id, [home, dwarf, sites.medium, sites.control], 4) : undefined;
            if (peripheralSupply && !plan) continue;
            const key = `${id}/${rate}`;
            if (attempted.has(key)) continue;
            attempted.add(key);
            complex = makeFactory('Complex research', 'command-core', complexCount, id, { rate, tryPlacement: true,
              campaign: plan?.local, localSupply: plan?.localSupply });
            if (complex) { inward = plan; break; }
          }
          if (complex) break;
        }
        if (!complex) scout('find a Lake for Complex production', id => nearHome(id) + distance(id, dwarf));
      }
      if (inward) reserveInward(complex.id, inward);
      else book(complex.id, complexBill);
      const inwardComplex = inward ? shipInward(complex, inward.imports) : [];
      const ore = route('mythril', dwarf, complex.id, tributeCart, complex.buses.get('mythril'), 'Complex Tribute');
      const delivery = route('command-core', complex.id, home, complex.output, undefined, 'Complex research');
      connect(home, delivery.sink, lab);
      planned['command-core'] = complexCount;
      pay('commandRobotics');
      wait('deliver the Complex Core reserved for victory', () => delivery.last.delivered >= complexCount, efficiencyArm ? 45 : 20);
      for (const lane of [...ore.lanes, ...delivery.lanes, ...inwardComplex]) if (lanes.has(lane.key)) retireLane(lane);
      if (maintainMapSupply) clearFinishedFloor(complex);
      mark('paid research complete');
      const earlierSites = { medium: sites.medium, control: sites.control, complex: complex.id };
      let late;
      if (maintainMapSupply) {
        for (const item of ['shiny-core', 'command-core']) planned[item] = (paid[item] ?? 0) + labStock(item);
        while (!findGolem('mythril') || !findGolem('iron')) {
          scout('find the Golem reserves before corner expansion', id => Math.abs(nearHome(id) - 5), 5);
        }
        const mythrilMap = findGolem('mythril'), ironMap = findGolem('iron');
        const attackRole = [['mythril', mythrilMap, true, [['command-suppression-bot', mythrilBots]]]];
        let attackSites = chooseSites(attackRole, dwarf, earlierSites);
        while (!attackSites) {
          scout('find a Lake to supply the Mythril Golem attack', id => distance(id, mythrilMap), 7);
          attackSites = chooseSites(attackRole, dwarf, earlierSites);
        }
        late = { sites: attackSites, mythrilMap, ironMap };
      } else {
        // Count only stock still accessible at Home after retiring the early freight.
        planned['simple-core'] = (paid['simple-core'] ?? 0) + labStock('simple-core');
        late = selectCornerSites(earlierSites);
      }
      const replenishment = 65;
      const botBill = campaign('Dwarven replenishment', { 'medium-suppression-bot': replenishment }).raw;
      const supplySites = () => [...visited.keys()].filter(id => id !== dwarf && id !== home
        && !Object.values(late.sites).includes(id) && visited.get(id).lake
        && canSupply(id, botBill) && path(id, dwarf, 'medium-suppression-bot'))
        .sort((a, b) => distance(a, dwarf) - distance(b, dwarf));
      const tried = new Set();
      let resupply;
      while (!resupply) {
        for (const id of supplySites().filter(id => !tried.has(id))) {
          tried.add(id);
          resupply = makeFactory('Dwarven replenishment', 'medium-suppression-bot', replenishment, id, { tryPlacement: true });
          if (resupply) break;
        }
        if (!resupply) scout('find a Lake for renewed Dwarven supply', id => distance(id, dwarf));
      }
      // Stop the old lane so the two shipments cannot merge into the old
      // receiving Cart and drain directly into the camp while staging.
      for (const lane of botRoute.lanes) if (lanes.has(lane.key)) retireLane(lane);
      const oldCampFeed = sector(dwarf).connections.filter(cable => cable.to === camp.id).map(cable => cable.id);
      disconnect(dwarf, oldCampFeed);
      const refill = route('medium-suppression-bot', resupply.id, dwarf, resupply.output, undefined, 'Dwarven replenishment');
      const ready = () => stock(refill.sink, 'medium-suppression-bot') >= 18;
      wait('buffer Bots for renewed Dwarven supply', ready, 45);
      // Put the first reserve to work, then keep the new freight connected.
      connect(dwarf, refill.sink, camp);
      return clearMythrilGolem(late.sites, late.mythrilMap, late.ironMap, id => route('mythril', dwarf, id, tributeCart, undefined, 'attack Tribute'), [botRoute, refill]);
    }
    if (pilot) {
      deliverShiny();
      activate(sites.control);
      const lake = source(sites.control, 'water');
      const keep = new Set([shiny.buses.get('mythril').id, ...sector(sites.control).connections.filter(cable => cable.from === lake.id).map(cable => cable.to)]);
      engine.deleteNodes(shinyFactoryNodes.filter(node => !keep.has(node.id)).map(node => node.id));
      mark('reused the Shiny factory floor for Complex production', { map: sites.control });
    }
    const complex = makeFactory('Complex research', 'command-core', complexCount, sites.control, pilot ? { rate: .65 } : { secondIntake: true });
    connect(sites.control, shiny.buses.get('mythril'), complex.buses.get('mythril'));
    if (!pilot) deliverShiny();
    const complexFreight = coreFreight(complex, 'command-core', path(sites.control, home, 'command-core'));
    planned['command-core'] = complexCount;
    pay('commandRobotics');
    if (buyRoadChannels2) pay('roadChannels2');
    if (allResearch) wait('deliver the Complex Core reserved for victory', () => complexFreight.last.delivered >= complexCount, 20);
    for (const lane of [...lanes.values()]) if (lane.item.endsWith('-core')) retireLane(lane);
    mark('paid research complete');

    if (pilot) for (const lane of researchOre.lanes) if (lanes.has(lane.key)) retireLane(lane);
    return clearMythrilGolem(sites, mythrilMap, ironMap, () => {
      const supply = attackOre ?? route('mythril', dwarf, sites.mythril, tributeCart, undefined, 'attack Tribute');
      forgeStaging.forEach(cables => disconnect(sites.mythril, cables));
      return supply;
    }, [researchOre, botRoute], forgeStock);
  }

  function clearMythrilGolem(sites, mythrilMap, ironMap, supply, retiredRoutes, forgeStock = []) {
    const name = 'Mythril Golem attack';
    let mythrilAttack = makeFactory(name, 'command-suppression-bot', mythrilBots, sites.mythril, { tryPlacement: maintainMapSupply });
    if (!mythrilAttack && maintainMapSupply) {
      const raw = campaign(name, { 'command-suppression-bot': mythrilBots }).raw;
      const tried = new Set(Object.values(sites));
      while (!mythrilAttack) {
        const alternates = [...visited.keys()].filter(id => !tried.has(id) && visited.get(id).lake && supplies(id, raw)
          && path(id, mythrilMap, 'command-suppression-bot'))
          .sort((a, b) => distance(a, mythrilMap) - distance(b, mythrilMap));
        for (const id of alternates) {
          tried.add(id);
          mythrilAttack = makeFactory(name, 'command-suppression-bot', mythrilBots, id, { tryPlacement: true });
          if (!mythrilAttack) continue;
          book(id, raw);
          mark('relocated the Mythril attack to a surveyed Lake with room', { from: sites.mythril, to: id });
          sites = { ...sites, mythril: id };
          break;
        }
        if (!mythrilAttack) scout('find an alternate Lake for the Mythril attack', id => distance(id, mythrilMap), 7);
      }
    }
    const attackSupply = supply(sites.mythril);
    for (const buffer of [...forgeStock, attackSupply.sink]) connect(sites.mythril, buffer, mythrilAttack.buses.get('mythril'));
    const mythrilGolem = sector(mythrilMap).nodes.find(n => n.golemMineral === 'mythril');
    const attack = route('command-suppression-bot', sites.mythril, mythrilMap, mythrilAttack.output);
    connect(mythrilMap, attack.sink, mythrilGolem);
    wait('Mythril Golem', () => mythrilGolem.infiniteResource, 100);
    mark('Mythril Golem defeated', { map: mythrilMap, bots: attack.last?.delivered ?? mythrilBots });
    for (const lane of new Set([attack, attackSupply, ...retiredRoutes].flatMap(route => route.lanes))) if (lanes.has(lane.key)) retireLane(lane);
    if (maintainMapSupply) {
      const reserveOre = extract(mythrilMap, mythrilGolem, 4);
      mythrilSupply = { id: mythrilMap, bus: reserveOre };
      const late = selectCornerSites(sites);
      return finishAfterMythril(late.sites, mythrilMap, mythrilGolem, ironMap, reserveOre);
    }
    return finishAfterMythril(sites, mythrilMap, mythrilGolem, ironMap);
  }

  function extract(id, node, count) {
    const bus = cart(id, { x: node.x + 650, y: node.y });
    for (let i = 0; i < count; i++) {
      const extractor = place(id, 'extractor', node.x + 350, node.y + i * 280);
      connect(id, node, extractor, node.infiniteResource ? i : 0);
      connect(id, extractor, bus);
    }
    return bus;
  }

  function resumeMapSupply(audit) {
    const mythrilMap = findGolem('mythril') ?? audit.trace.find(entry => entry.name === 'Mythril Golem defeated')?.map;
    const ironMap = findGolem('iron');
    const golem = mythrilMap && sector(mythrilMap).nodes.find(node => node.golemMineral === 'mythril');
    assert(golem && ironMap && unlocked('commandRobotics') && !Object.keys(state.produced).some(item => Object.values(CORNER_ITEMS).includes(item)),
      'Recovery needs a surveyed Mythril Golem, Command Robotics and an unfinished corner survey');
    for (const payment of audit.payments) for (const [item, count] of Object.entries(payment.costs)) paid[item] = (paid[item] ?? 0) + count;
    lab = sector(home).nodes.find(node => node.kind === 'researchCenter');
    const priorContributions = { ...state.research.contributed };
    const active = corners.size < 4 || Object.values(priorContributions).some(Boolean) ? state.research.mapNodeQuote : undefined;
    for (const item of [...Object.keys(coreSize), ...Object.keys(lateBankSize)]) {
      planned[item] = (paid[item] ?? 0) + labStock(item);
    }
    // Rebuild the stopped districts through ordinary deletion and construction.
    // Keep Home stock and the working infinite-reserve production in place.
    for (const id of visited.keys()) {
      const obsolete = sector(id).nodes.filter(node => node.kind === 'road' && node.roadMode === 'export' ||
        (id !== home && id !== mythrilMap && node.constructedAt > 0 && node.kind !== 'road'));
      if (!obsolete.length) continue;
      activate(id);
      engine.deleteNodes(obsolete.map(node => node.id));
    }
    if (!golem.infiniteResource) clearGolemWithLocalBots(mythrilMap, golem);
    const oreMap = sector(mythrilMap);
    const extractors = new Set(oreMap.connections.filter(cable => cable.from === golem.id).map(cable => cable.to));
    const busId = oreMap.connections.find(cable => extractors.has(cable.from) && cable.item === 'mythril')?.to;
    const reserveOre = oreMap.nodes.find(node => node.id === busId) ?? extract(mythrilMap, golem, 4);
    mythrilSupply = { id: mythrilMap, bus: reserveOre };
    mark('resumed stopped map research with rebuilt production space', { destination: active?.destination });
    if (!active?.destination && corners.size < 4 && !unlocked('roadChannels2')) pay('roadChannels2');
    if (!active && state.research.selected === 'mapNode') engine.selectResearch(undefined);
    if (active?.destination) {
      discover(active.destination, 'finish the saved map quote');
      for (const [item, count] of Object.entries(priorContributions)) planned[item] = (planned[item] ?? 0) + count;
    }
    const former = audit.trace.find(entry => entry.name === 'scouting and revealed site selection complete')?.sites ?? {};
    const complex = audit.trace.find(entry => entry.name === 'built Complex research')?.map;
    const late = selectCornerSites({ medium: former.medium, control: former.control, complex, mythril: mythrilMap });
    return finishAfterMythril(late.sites, mythrilMap, golem, ironMap, reserveOre);
  }

  function clearGolemWithLocalBots(id, golem) {
    const bot = 'medium-suppression-bot', damage = BOT_STRENGTH[bot];
    while (!golem.infiniteResource) {
      const count = Math.min(12, Math.ceil(golem.health / damage));
      const raw = campaign('Medium Bot Golem attack', { [bot]: count }).raw;
      const candidates = [...visited.keys()].filter(map => visited.get(map).lake && supplies(map, raw) && path(map, id, bot))
        .sort((a, b) => distance(a, id) - distance(b, id));
      let district;
      for (const map of candidates) {
        district = makeFactory('Medium Bot Golem attack', bot, count, map, { tryPlacement: true });
        if (district) break;
      }
      if (!district) {
        scout('find a Lake for a small Medium Bot batch', map => distance(id, map), 7);
        continue;
      }
      book(district.id, raw);
      const delivery = route(bot, district.id, id, district.output);
      connect(id, delivery.sink, golem);
      const remaining = golem.health - count * damage;
      wait('deliver a Medium Bot Golem attack batch', () => golem.infiniteResource || golem.health <= remaining, 35);
      for (const lane of delivery.lanes) if (lanes.has(lane.key)) retireLane(lane);
      clearFinishedFloor(district);
    }
    mark('Mythril Golem defeated by Medium Bots', { map: id });
  }

  function finishAfterMythril(sites, mythrilMap, mythrilGolem, ironMap, reserveOre = extract(mythrilMap, mythrilGolem, 2)) {
    const foundry = corners.get('foundry'), dragon = corners.get('alpha'), grove = corners.get('grove'), reclamation = corners.get('reclamation');
    mythrilSupply = { id: mythrilMap, bus: reserveOre };
    const beforeIron = new Set(sector(sites.iron).nodes.map(node => node.id));
    const ironAttack = makeFactory('Iron Golem attack', 'command-suppression-bot', ironBotCount, sites.iron);
    const ironFactoryNodes = sector(sites.iron).nodes.filter(node => !beforeIron.has(node.id));
    const ironOre = route('mythril', mythrilMap, sites.iron, reserveOre, ironAttack.buses.get('mythril'), 'Iron attack Mythril');
    const ironGolem = sector(ironMap).nodes.find(n => n.golemMineral === 'iron');
    const ironBots = route('command-suppression-bot', sites.iron, ironMap, ironAttack.output);
    connect(ironMap, ironBots.sink, ironGolem);

    const corner = id => sector(id).nodes.find(n => n.kind === 'cornerChallenge');
    const startFoundry = () => Object.entries(FOUNDRY_INPUTS).reduce((parts, [item, count]) => {
      const id = item === 'mythril-gear' ? sites.gears : sites.foundry;
      const district = makeFactory(`Foundry ${item}`, item, count, id);
      if (sequenceFreight && !path(id, foundry, item)) {
        for (const part of parts) {
          if (!part.delivery.lanes.some(lane => lanes.has(lane.key))) continue;
          wait(`deliver Foundry ${part.item} before switching Roads`, () => part.delivery.last.delivered >= part.count, 55);
          for (const lane of part.delivery.lanes) if (lanes.has(lane.key)) retireLane(lane);
          mark('reused Foundry Roads for another input', { from: part.item, to: item });
          if (path(id, foundry, item)) break;
        }
      }
      const delivery = route(item, id, foundry, district.output);
      connect(foundry, delivery.sink, corner(foundry), 0, input(corner(foundry), item));
      parts.push({ district, delivery, item, count });
      return parts;
    }, []);
    let parts = sites.iron === sites.foundry ? undefined : startFoundry();
    wait('Iron Golem', () => ironGolem.infiniteResource, 85);
    mark('Iron Golem defeated', { map: ironMap, bots: ironBots.last?.delivered ?? ironBotCount });
    for (const lane of [...ironOre.lanes, ...ironBots.lanes]) if (lanes.has(lane.key)) retireLane(lane);
    if (!parts) {
      // The completed attack has no further demand. Reuse its floor space and Lake intake.
      activate(sites.iron);
      const lake = source(sites.iron, 'water');
      const intakes = new Set(sector(sites.iron).connections.filter(cable => cable.from === lake.id).map(cable => cable.to));
      engine.deleteNodes(ironFactoryNodes.filter(node => !intakes.has(node.id)).map(node => node.id));
      mark('reused the Iron attack floor for Foundry production', { map: sites.iron });
      parts = startFoundry();
    }
    const gears = parts.find(part => part.item === 'mythril-gear').district;
    const gearOre = route('mythril', mythrilMap, sites.gears, reserveOre, gears.buses.get('mythril'), 'Foundry Mythril');

    const groveNeighbor = neighbors(grove).find(id => visited.has(id) && (!allResearch || localResources.filter(item => item !== 'copper')
      .every(item => (source(id, item)?.resourceRemaining ?? 0) >= (item === 'wood' ? 120 : 30))));
    assert(groveNeighbor);
    const groveFeeds = [];
    for (const [item, count] of [['wood', 2], ['stone', 1]]) {
      const output = extract(groveNeighbor, source(groveNeighbor, item), count, item);
      groveFeeds.push([item, route(item, groveNeighbor, grove, output)]);
    }
    const plateMap = allResearch ? groveNeighbor : ironMap;
    const iron = extract(plateMap, allResearch ? source(plateMap, 'iron') : ironGolem, 1, 'iron');
    const wood = allResearch ? groveFeeds[0][1].first.source : extract(ironMap, source(ironMap, 'wood'), 1, 'wood');
    const kiln = place(plateMap, 'kiln', wood.x + 240, wood.y);
    const smelter = place(plateMap, 'smelter', iron.x + 320, iron.y, 'smelt-iron');
    connect(plateMap, wood, kiln);
    connect(plateMap, kiln, smelter, 0, input(smelter, 'charcoal'));
    connect(plateMap, iron, smelter, 0, input(smelter, 'iron'));
    const plate = cart(plateMap, smelter);
    connect(plateMap, smelter, plate);
    if (sequenceFreight && !path(plateMap, grove, 'iron-plate')) {
      const stone = groveFeeds.find(([item]) => item === 'stone')[1];
      wait('buffer Stone at the Grove before switching Roads', () => stock(stone.sink, 'stone') >= Math.ceil(GROVE_GROWTH / 100), 15);
      for (const lane of stone.lanes) retireLane(lane);
      mark('reused the Grove Stone Road for Iron Plate');
    }
    groveFeeds.push(['iron-plate', route('iron-plate', plateMap, grove, plate, undefined, 'Iron Plate to Grove')]);

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

    return finishCorners({ sites, mythrilMap, reserveOre, halves, finished, foundryLanes: parts.flatMap(part => part.delivery.lanes), groveFeeds, planters });
  }

  function resumeCornerFreight(sites, mythrilMap) {
    const relay = sites.control;
    assert(!sector(relay).nodes.some(node => node.kind === 'road'), 'The control factory must have no active Roads before clearing the relay');
    activate(relay);
    const retired = sector(relay).nodes.filter(node => node.constructedAt > 0);
    engine.deleteNodes(retired.map(node => node.id));
    mark('cleared the retired Shiny and Complex district for west freight', { map: relay, removed: retired.length });

    const grove = corners.get('grove');
    const planters = sector(grove).nodes.filter(node => node.kind === 'treePlanter');
    const groveFeeds = sector(grove).nodes.filter(node => node.kind === 'road' && node.roadMode === 'import').map(receiving => {
      const from = receiving.pairedSectorId;
      const sending = sector(from).nodes.find(node => node.id === receiving.pairedRoadId);
      const feed = sector(from).connections.find(cable => cable.to === sending.id);
      const exit = sector(grove).connections.find(cable => cable.from === receiving.id);
      const source = sector(from).nodes.find(node => node.id === feed.from);
      const sink = sector(grove).nodes.find(node => node.id === exit.to);
      const item = Object.keys(source.output).find(item => source.output[item] > 0);
      assert(item, 'Saved Grove lane must hold its material');
      const key = `${from}/${grove}/${item}`;
      const lane = { from, to: grove, sending, receiving, source, sink, feed: [feed.id], exit: [exit.id], item, key };
      lanes.set(key, lane);
      return [item, { first: lane, last: lane, lanes: [lane], sink }];
    });
    assert.equal(groveFeeds.length, 3);
    const reserveOre = sector(mythrilMap).nodes.find(node => node.kind === 'woodenChest' && stock(node, 'mythril') > 0);
    const halves = sector(home).nodes.filter(node => node.recipeId?.startsWith('core-half-'));
    const final = sector(home).nodes.find(node => node.recipeId === 'final-core');
    const finished = sector(home).nodes.find(node => sector(home).connections.some(cable => cable.from === final.id && cable.to === node.id));
    mythrilSupply = { id: mythrilMap, bus: reserveOre };
    return finishCorners({ sites, mythrilMap, reserveOre, halves, finished, foundryLanes: [], groveFeeds, planters });
  }

  function finishCorners({ sites, mythrilMap, reserveOre, halves, finished, foundryLanes, groveFeeds, planters }) {
    const dragon = corners.get('alpha'), grove = corners.get('grove'), reclamation = corners.get('reclamation'), foundry = corners.get('foundry');
    const corner = id => sector(id).nodes.find(n => n.kind === 'cornerChallenge');
    if (!unlocked('victory')) {

      function returnPiece(type, retired) {
        const id = corners.get(type), item = CORNER_ITEMS[type];
        wait(`${type} piece`, () => state.produced[item] >= 1, 100);
        for (const lane of retired) if (lanes.has(lane.key)) retireLane(lane);
        const box = sector(id).nodes.find(n => n.kind === 'cornerTribute');
        const outgoing = sector(id).connections.find(cable => cable.from === box.id);
        const output = outgoing ? sector(id).nodes.find(node => node.id === outgoing.to) : cart(id, box);
        if (!outgoing) connect(id, box, output);
        const delivery = route(item, id, home, output, undefined, `return ${type}`);
        const half = halves.find(n => item in RECIPES[n.recipeId].inputs);
        connect(home, delivery.sink, half, 0, input(half, item));
        wait(`${type} received at Home`, () => delivery.last.delivered === 1, 5);
        mark(`${type} delivered Home`, { crossings: delivery.lanes.length });
        for (const lane of delivery.lanes) retireLane(lane);
      }

      returnPiece('foundry', foundryLanes);
      returnPiece('grove', groveFeeds.flatMap(([, delivery]) => delivery.lanes));
      mark('released Foundry and Grove Roads for Dragon freight');

      const dragonFactory = makeFactory('Dragon Command Bots', 'command-suppression-bot', dragonBotCount, sites.dragon, { exportFines: true });
      const dragonOre = route('mythril', mythrilMap, sites.dragon, reserveOre, dragonFactory.buses.get('mythril'), 'Dragon Mythril');
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
      if (peripheralSupply && !path(reclamation, home, CORNER_ITEMS.reclamation)) {
        wait('finish Dragon production to release freight', () => state.produced[CORNER_ITEMS.alpha] >= 1, 100);
        for (const lane of new Set([...dragonOre.lanes, ...dragonBots.lanes])) if (lanes.has(lane.key)) retireLane(lane);
        mark('released completed Dragon freight for Reclamation');
      }
      returnPiece('reclamation', fines.lanes);
      returnPiece('alpha', dragonBots.lanes);

      wait('one Final Core in the collection Cart', () => stock(finished, 'final-core') === 1, 3);
      for (const item of Object.values(CORNER_ITEMS)) assert.equal(state.produced[item], 1);
      assert.equal(state.produced['final-core'], 1);
      assert.equal(fines.last.delivered, 20);
      mark('Final Core collected', { count: 1 });
      if (allResearch) {
        for (const lane of dragonOre.lanes) if (lanes.has(lane.key)) retireLane(lane);
        const lab = sector(home).nodes.find(node => node.kind === 'researchCenter');
        connect(home, finished, lab);
        planned['final-core'] = 1;
        pay('victory');
        recordVictory();
        mark('first Final Core spent on victory');
      }
    }
    if (allResearch && !throughVictory) {
      for (const item of [...Object.keys(coreSize), 'shiny-core', 'command-core', 'final-core']) {
        planned[item] = (paid[item] ?? 0) + labStock(item) + (recoveredCoreStock[item] ?? 0);
      }
      const completedAfterVictory = [];
      if (state.research.selected && !state.research.selected.startsWith('mapNode')) pay(state.research.selected);
      while (true) {
        const pending = remainingProjects().filter(project => !(project.costs['final-core'] > 0));
        if (!pending.length) break;
        const project = pending.sort((a, b) => Object.keys(a.costs).length - Object.keys(b.costs).length
          || Math.max(...Object.values(a.costs)) - Math.max(...Object.values(b.costs)))[0];
        pay(project.id);
        completedAfterVictory.push(project.id);
      }
      mark('research without Final Cores exhausted', { completed: completedAfterVictory.length });
      const finalProjects = remainingProjects().filter(project => project.costs['final-core'] > 0);
      const projectOrder = [...finalProjects];
      for (const project of projectOrder) {
        produceAnotherFinalCore();
        planned['final-core']++;
        pay(project.id);
        for (const next of remainingProjects()) if (next.costs['final-core'] > 0 && !projectOrder.includes(next)) projectOrder.push(next);
      }
    }
    return { finished, blind: true, protectLakes, surveySeconds, expeditions, paidCores: paid, sites };

    function produceAnotherFinalCore() {
      const target = (state.produced['final-core'] ?? 0) + 1;
      const replaceInput = (id, from, to, port) => {
        const prior = sector(id).connections.filter(cable => cable.to === to.id && cable.toPort === port);
        if (prior.length) disconnect(id, prior.map(cable => cable.id));
        connect(id, from, to, 0, port);
      };
      const job = (item, count, to, options) => {
        const name = `Final Core ${target}: ${item}`;
        const bill = campaign(name, { [item]: count }).raw;
        const id = [...visited.keys()].filter(id => id !== home && (!bill.water || visited.get(id).lake)
          && canSupply(id, bill) && path(id, to, item) && (!bill.mythril || path(mythrilMap, id, 'mythril')))
          .sort((a, b) => distance(a, to) - distance(b, to))[0];
        assert(id, `No surveyed factory site for ${name}`);
        book(id, bill);
        const district = makeFactory(name, item, count, id, options);
        const ore = bill.mythril ? route('mythril', mythrilMap, id, reserveOre, district.buses.get('mythril'), name) : undefined;
        const delivery = route(item, id, to, district.output, undefined, name);
        replaceInput(to, delivery.sink, corner(to), input(corner(to), item));
        return { district, delivery, ore };
      };
      const sendPiece = type => {
        const id = corners.get(type), item = CORNER_ITEMS[type];
        const box = sector(id).nodes.find(node => node.kind === 'cornerTribute');
        const outgoing = sector(id).connections.find(cable => cable.from === box.id);
        const output = sector(id).nodes.find(node => node.id === outgoing.to);
        const delivery = route(item, id, home, output, undefined, `Final Core ${target} ${type}`);
        const half = halves.find(node => item in RECIPES[node.recipeId].inputs);
        replaceInput(home, delivery.sink, half, input(half, item));
        wait(`Final Core ${target} ${type} delivered`, () => delivery.last.delivered >= 1, 15);
        for (const lane of delivery.lanes) retireLane(lane);
      };
      const foundryJobs = Object.entries(FOUNDRY_INPUTS).map(([item, count]) => job(item, count, foundry));
      wait(`Final Core ${target} Foundry piece`, () => state.produced[CORNER_ITEMS.foundry] >= target, 100);
      for (const { delivery, ore } of foundryJobs) for (const lane of [...delivery.lanes, ...(ore?.lanes ?? [])]) if (lanes.has(lane.key)) retireLane(lane);
      sendPiece('foundry');

      // Reconnect the original Grove supplies and resume the original planters through normal controls.
      const groveSupplies = groveFeeds.map(([item, delivery]) => {
        const first = delivery.first;
        const to = route(item, first.from, grove, first.source);
        for (const planter of planters) replaceInput(grove, to.sink, planter, input(planter, item));
        return to;
      });
      activate(grove);
      for (const planter of planters) engine.toggleNodeProcessingPause(planter.id);
      wait(`Final Core ${target} Grove piece`, () => state.produced[CORNER_ITEMS.grove] >= target, 45);
      stop(grove, planters);
      for (const supply of groveSupplies) for (const lane of supply.lanes) retireLane(lane);
      sendPiece('grove');

      const attack = job('command-suppression-bot', dragonBotCount, dragon, { exportFines: true });
      const waste = route('metallic-fines', attack.district.id, reclamation, attack.district.fines);
      replaceInput(reclamation, waste.sink, corner(reclamation), 0);
      wait(`Final Core ${target} Reclamation piece`, () => state.produced[CORNER_ITEMS.reclamation] >= target, 100);
      if (waste.first) disconnect(waste.first.from, waste.first.feed);
      connect(attack.district.id, attack.district.fines, attack.district.waste);
      for (const lane of waste.lanes) retireLane(lane);
      sendPiece('reclamation');
      wait(`Final Core ${target} Dragon piece`, () => state.produced[CORNER_ITEMS.alpha] >= target, 100);
      for (const lane of [...attack.delivery.lanes, ...(attack.ore?.lanes ?? [])]) if (lanes.has(lane.key)) retireLane(lane);
      sendPiece('alpha');
      wait(`Final Core ${target} assembled`, () => state.produced['final-core'] >= target, 5);
    }
  }

  function resumeResearch(sites, mythrilMap) {
    if (state.produced['shiny-core'] === shinyCount && state.produced['command-core'] === complexCount) {
      let removed = 0;
      for (const id of visited.keys()) {
        const map = sector(id);
        const retired = map.nodes.filter(node => node.kind === 'road' && node.roadMode === 'export'
          && map.connections.some(cable => cable.to === node.id && cable.item === 'mythril'));
        if (!retired.length) continue;
        activate(id);
        engine.deleteNodes(retired.map(node => node.id));
        removed += retired.length;
      }
      if (removed) mark('released the completed Dragon Mythril freight route', { crossings: removed });
    }
    for (const from of visited.keys()) {
      const map = sector(from);
      for (const sending of map.nodes.filter(node => node.kind === 'road' && node.roadMode === 'export')) {
        const to = sending.pairedSectorId;
        const receiving = sector(to).nodes.find(node => node.id === sending.pairedRoadId);
        const feed = map.connections.find(cable => cable.to === sending.id);
        const exit = sector(to).connections.find(cable => cable.from === receiving?.id);
        const item = feed?.item ?? exit?.item;
        if (!item?.endsWith('-core') || !feed || !exit) continue;
        const key = `${from}/${to}/${item}`;
        if (lanes.has(key)) continue;
        const source = map.nodes.find(node => node.id === feed.from);
        const sink = sector(to).nodes.find(node => node.id === exit.to);
        const lane = { from, to, sending, receiving, feed: [feed.id], exit: [exit.id], source, sink, item, key,
          delivered: 0, restored: true, label: `Existing ${item} ${from} -> ${to}` };
        lanes.set(key, lane);
        trackRoad(lane);
      }
    }
    const missingCore = /^No surveyed site can support another \d+ ([a-z-]+-core)$/.exec(resume.audit.failure ?? '')?.[1];
    if (missingCore) {
      const options = [...visited.keys()].filter(id => id !== home && path(id, home, missingCore))
        .map(id => {
          const map = sector(id);
          const buffer = map.nodes.find(node => node.kind === 'woodenChest' && stock(node, missingCore) > 0
            && !map.connections.some(cable => cable.from === node.id));
          if (!buffer) return undefined;
          const upstream = new Set([buffer.id]);
          const queue = [buffer.id];
          for (const node of queue) for (const cable of map.connections.filter(cable => cable.to === node && cable.item === missingCore)) {
            if (!upstream.has(cable.from)) { upstream.add(cable.from); queue.push(cable.from); }
          }
          const available = map.nodes.filter(node => upstream.has(node.id)).reduce((sum, node) => sum + (node.output[missingCore] ?? 0), 0);
          return { id, buffer, available };
        }).filter(Boolean).sort((a, b) => b.available - a.available);
      const supply = options[0];
      if (supply?.available >= 8) {
        const delivery = route(missingCore, supply.id, home, supply.buffer, undefined, `Recover stranded ${missingCore}`);
        if (!sector(home).connections.some(cable => cable.from === delivery.sink.id && cable.to === lab.id)) connect(home, delivery.sink, lab);
        recoveredCoreStock[missingCore] = supply.available;
        mark('restored freight for stranded research Cores', { item: missingCore, map: supply.id, available: supply.available });
      }
    }
    const failedMap = /No placement .* on ([\d,]+) near/.exec(resume.audit.failure ?? '')?.[1];
    if (failedMap) {
      activate(failedMap);
      const nodes = sector(failedMap).nodes;
      const newest = Math.max(...nodes.map(node => node.constructedAt));
      const unfinished = nodes.filter(node => node.constructedAt === newest);
      if (unfinished.length) engine.deleteNodes(unfinished.map(node => node.id));
      mark('removed the incomplete factory placement', { map: failedMap, removed: unfinished.length });
    }
    const grove = corners.get('grove');
    const groveNeighbor = neighbors(grove).find(id => visited.has(id) && sector(id).nodes.some(node => node.recipeId === 'smelt-iron'));
    const groveFeeds = ['wood', 'stone', 'iron-plate'].map(item => {
      const from = groveNeighbor;
      const source = sector(from).nodes.find(node => node.kind === 'woodenChest' && stock(node, item) > 0);
      assert(source, `Preserved Grove supply for ${item}`);
      return [item, { first: { from, source } }];
    });
    const planters = sector(grove).nodes.filter(node => node.kind === 'treePlanter');
    const reserveOre = sector(mythrilMap).nodes.find(node => node.kind === 'woodenChest' && stock(node, 'mythril') > 0);
    const halves = sector(home).nodes.filter(node => node.recipeId?.startsWith('core-half-'));
    const final = sector(home).nodes.find(node => node.recipeId === 'final-core');
    const finished = sector(home).nodes.find(node => sector(home).connections.some(cable => cable.from === final.id && cable.to === node.id));
    mythrilSupply = { id: mythrilMap, bus: reserveOre };
    mark('resumed post-victory research from the paused checkpoint', { selected: state.research.selected });
    return finishCorners({ sites, mythrilMap, reserveOre, halves, finished, groveFeeds, planters });
  }
}
