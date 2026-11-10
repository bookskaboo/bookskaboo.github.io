import assert from 'node:assert/strict';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { campaign, dryRun } from './final-core-dry-run.mjs';

const { GameEngine, createInitialState } = await import('../src/simulation/engine.ts');
const { RECIPES, RECIPE_GROUPS } = await import('../src/content/recipes.ts');
const { isCartKind } = await import('../src/content/cartUpgrades.ts');
const { getEffectiveNodeInputFamilies, isNodeUnlocked } = await import('../src/content/nodes.ts');
const { connectionBlockedByWorld } = await import('../src/simulation/connectionRules.ts');
const { canPlaceNode } = await import('../src/simulation/collisions.ts');
const { getNodeSize } = await import('../src/domain/nodeGeometry.ts');
const { getSectorWorldSize } = await import('../src/simulation/worldGeneration.ts');
const { getResearchCostsForState, getResearchProject, mapNodePricingPhaseForState } = await import('../src/content/research.ts');

const blind = process.argv.includes('--blind');
const protectLakes = process.argv.includes('--protect-lakes');
const seedOverride = process.argv.find(arg => arg.startsWith('--seed='));
const checkpointPath = process.argv.find(arg => arg.startsWith('--checkpoint='))?.slice('--checkpoint='.length);
const milestonePath = process.argv.find(arg => arg.startsWith('--milestone-checkpoint='))?.slice('--milestone-checkpoint='.length);
const resumePath = process.argv.find(arg => arg.startsWith('--resume='))?.slice('--resume='.length);
const priorTracePath = process.argv.find(arg => arg.startsWith('--prior-trace='))?.slice('--prior-trace='.length);
const resumed = resumePath && JSON.parse(readFileSync(resumePath, 'utf8'));
const tickMs = blind ? (protectLakes ? 400 : 200) : 100;
const wallNow = Date.now;
const epoch = wallNow();
let elapsed = resumed?.playTimeMs ?? 0;
Date.now = () => epoch + elapsed;

const quantity = (node, item) => (node.input[item] ?? 0) + (node.output[item] ?? 0);
const productionMeters = new Map();
const roadMeters = new Map();
const recipeFeeds = new Map();
const trace = [];
const progressPath = process.env.NODE_FINAL_CORE_PROGRESS;
const watches = [];
const districts = new Map();
const lanes = new Map();
const freightLinks = new Set();
const freightLedger = [];
const water = new Map();
const cornerItems = blind ? {} : { '0,0': 'alpha', '10,0': 'foundry-component', '10,10': 'grove-component', '0,10': 'reclamation-component' };
const cornerRecords = {};
let placed = 0, cables = 0, joints = 0;

class OfflineEngine extends GameEngine {
  checkpoint() {} // No undo is used in the offline run.

  deliverTransfers(now, mapId) {
    const receipts = new Map();
    for (const transfer of state.inFlightTransfers) {
      if (transfer.cosmeticOnly || transfer.arrivesAtMs > now) continue;
      const feed = recipeFeeds.get(`${transfer.sectorId}/${transfer.to}/${transfer.item}`);
      if (feed && !receipts.has(feed)) receipts.set(feed, feed.target.input[feed.item] ?? 0);
    }
    super.deliverTransfers(now, mapId);
    for (const [feed, before] of receipts) {
      feed.received += (feed.target.input[feed.item] ?? 0) - before;
      if (feed.received < feed.limit) continue;
      assert.equal(feed.received, feed.limit, `${feed.target.recipeId} ${feed.item} batch feed`);
      // Close the cable through the normal action. Any extra in flight is refunded by the engine.
      disconnect(feed.id, feed.cables);
      recipeFeeds.delete(`${feed.id}/${feed.target.id}/${feed.item}`);
    }
  }

  simulateSector(sector, dt, lookups) {
    const meters = productionMeters.get(sector.id) ?? [];
    const outputBefore = meters.map(meter => meter.nodes.reduce((n, node) => n + (node.output[meter.item] ?? 0), 0));
    super.simulateSector(sector, dt, lookups);
    meters.forEach((meter, i) => {
      meter.made += meter.nodes.reduce((n, node) => n + (node.output[meter.item] ?? 0), 0) - outputBefore[i];
      if (meter.made && !meter.firstAt) meter.firstAt = elapsed / 1000;
    });
  }

  dispatchRoadItem(sector, road, lookups) {
    const meter = roadMeters.get(road.id);
    const before = meter ? quantity(meter.source, meter.item) : 0;
    super.dispatchRoadItem(sector, road, lookups);
    if (meter) meter.delivered += before - quantity(meter.source, meter.item);
  }
}

const engine = new OfflineEngine(resumed || createInitialState(blind ? seedOverride && Number(seedOverride.slice(7)) : dryRun.seed), { autosave: false });
const state = engine.getState();
if (resumed?.paused) engine.togglePause();
const home = '5,5';
const unlocked = project => state.research.completed.includes(project);
const sector = id => state.sectors[id];
const find = (id, predicate) => sector(id).nodes.find(predicate);
const source = (id, item) => find(id, n => n.resourceItem === item && !n.infiniteResource);
const grid = id => getSectorWorldSize(sector(id), state.research.completed);
const activate = id => { if (state.activeSectorId !== id) engine.switchSector(id); };
const mark = (name, details = {}) => {
  trace.push({ name, seconds: elapsed / 1000, ...details });
  const line = `${(elapsed / 60000).toFixed(2)}m  ${name}${Object.keys(details).length ? ` ${JSON.stringify(details)}` : ''}\n`;
  process.stderr.write(line);
  if (progressPath) appendFileSync(progressPath, line);
  if (milestonePath && ['scouting and revealed site selection complete', 'paid research complete', 'Mythril Golem defeated', 'Iron Golem defeated'].includes(name)) saveCheckpoint(milestonePath);
};

function saveCheckpoint(filename) {
  const checkpoint = structuredClone(state);
  const clockOffset = Date.now() - wallNow();
  for (const map of Object.values(checkpoint.sectors)) {
    map.lastSimulatedAt -= clockOffset;
    for (const node of map.nodes) if (node.constructedAt > 0) node.constructedAt -= clockOffset;
  }
  checkpoint.paused = true;
  checkpoint.activeSectorId = home;
  writeFileSync(filename, JSON.stringify(checkpoint));
}

function place(id, kind, x, y, recipe, viable = () => true) {
  activate(id);
  assert(isNodeUnlocked(kind, state.research.unlocked), `${kind} is locked`);
  const field = grid(id);
  const nodes = sector(id).nodes.map(n => n.kind === 'monster-camp' ? { ...n, campStrength: 100 } : n);
  const points = [[x, y]];
  for (let py = 188; py <= field.height - 188; py += 96) {
    for (let px = 188; px <= field.width - 188; px += 96) points.push([px, py]);
  }
  points.sort((a, b) => Math.hypot(a[0] - x, a[1] - y) - Math.hypot(b[0] - x, b[1] - y));
  for (const [px, py] of points) {
    const proposed = { id: '__offline-preview', kind, x: px, y: py, rotation: 0, recipeId: recipe, input: {}, output: {} };
    if (!canPlaceNode(proposed, nodes, field) || engine.getCableInsertionPreview(proposed) || !viable(proposed)) continue;
    const nodeId = engine.placeNode(kind, px, py);
    if (!nodeId) continue;
    const node = find(id, n => n.id === nodeId);
    if (recipe) assert(engine.setRecipe(node.id, recipe), `Select ${recipe} on ${kind}`);
    placed++;
    if (kind === 'joint') joints++;
    return node;
  }
  throw new Error(`No placement for ${kind} ${recipe ?? ''} on ${id} near ${x},${y}`);
}

function connect(id, from, to, fromPort = 0, toPort = 0, spacing = 126) {
  activate(id);
  const nodes = sector(id).nodes.map(n => n.kind === 'monster-camp' ? { ...n, campStrength: 100 } : n);
  const blocked = (a, b, p = 0, q = 0) => connectionBlockedByWorld(a, b, { fromPort: p, toPort: q }, nodes);
  const edge = (a, b, p, q) => {
    const previous = sector(id).connections.length;
    assert(engine.connectPorts(a.id, p, b.id, q), `${id} ${a.name}[${p}] -> ${b.name}[${q}]: ${JSON.stringify(engine.getConnectionFailure(a.id, p, b.id, q))}`);
    assert.equal(sector(id).connections.length, previous + 1, `Connection displaced a feed on ${id}: ${a.name} -> ${b.name}`);
    cables++;
    return sector(id).connections.at(-1).id;
  };
  if (!blocked(from, to, fromPort, toPort)) return [edge(from, to, fromPort, toPort)];

  const field = grid(id), points = [];
  const columns = [], rows = [];
  for (let x = 64; x < field.width - 50; x += spacing) columns.push(x);
  for (let y = 86; y < field.height - 50; y += spacing) rows.push(y);
  if (spacing < 126) {
    columns.push(48, field.width - 48);
    rows.push(field.height - 48);
  }
  for (const y of rows) for (const x of columns) {
    const point = { id: `joint-${x}-${y}`, kind: 'joint', x, y, rotation: 0, input: {}, output: {} };
    if (canPlaceNode(point, nodes, field)) points.push(point);
  }
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const queue = [{ point: from, cost: 0, path: [] }], cost = new Map([[from.id, 0]]);
  while (queue.length) {
    queue.sort((a, b) => a.cost + distance(a.point, to) - b.cost - distance(b.point, to));
    const next = queue.shift();
    if (next.cost !== cost.get(next.point.id)) continue;
    const first = next.point === from ? fromPort : 0;
    if (!blocked(next.point, to, first, toPort)) {
      const route = [from, ...next.path.map(point => {
        const joint = place(id, 'joint', point.x, point.y);
        if (joint.x === point.x && joint.y === point.y) return joint;
        // A grouped move avoids automatically inserting the Joint into an unrelated cable.
        const anchor = nodes.find(n => n.kind === 'woodenChest' && n.id !== joint.id);
        assert(anchor && engine.tryMoveNodesTo({
          [joint.id]: { x: point.x, y: point.y },
          [anchor.id]: { x: anchor.x, y: anchor.y },
        }), `Place detour at ${point.x},${point.y} on ${id}`);
        assert.equal(joint.x, point.x);
        assert.equal(joint.y, point.y);
        return joint;
      }), to];
      return route.slice(1).map((node, i) => edge(route[i], node, i === 0 ? fromPort : 0, node === to ? toPort : 0));
    }
    for (const point of points) {
      const step = distance(next.point, point), proposed = next.cost + step + 300;
      if (step > 1500 || proposed >= (cost.get(point.id) ?? Infinity) || blocked(next.point, point, first)) continue;
      cost.set(point.id, proposed);
      queue.push({ point, cost: proposed, path: [...next.path, point] });
    }
  }
  if (blind && spacing === 126) return connect(id, from, to, fromPort, toPort, 82);
  if (blind && to.recipeId) {
    const candidates = [];
    for (let y = 188; y < field.height - 188; y += 96) for (let x = 188; x < field.width - 188; x += 96) candidates.push({ x, y });
    candidates.sort((a, b) => distance(a, to) - distance(b, to));
    for (const point of candidates) {
      const moved = { ...to, ...point };
      if (!canPlaceNode(moved, nodes, field, new Set([to.id])) || blocked(from, moved, fromPort, toPort)) continue;
      if (engine.tryMoveNodesTo({ [to.id]: point })) return [edge(from, to, fromPort, toPort)];
    }
  }
  throw new Error(`No cable corridor on ${id} from ${from.name} ${from.x},${from.y} to ${to.name} ${to.x},${to.y}`);
}

const input = (node, item) => {
  const index = getEffectiveNodeInputFamilies(node, state.research.completed).indexOf(item);
  assert(index >= 0, `${node.name} has no input for ${item}`);
  return index;
};

function disconnect(id, ids) {
  activate(id);
  for (const cable of ids) engine.deleteConnection(cable);
}

function stop(id, nodes) {
  activate(id);
  for (const node of nodes) if (!node.processingPaused) {
    engine.toggleNodeProcessingPause(node.id);
    assert(node.processingPaused, `Pause ${node.name}`);
  }
}

function meter(id, item, nodes, limit, machinery = nodes, name = item) {
  const record = { item, nodes, limit, made: 0, startedAt: elapsed / 1000 };
  if (!productionMeters.has(id)) productionMeters.set(id, []);
  productionMeters.get(id).push(record);
  watches.push(() => {
    if (record.made < limit) return false;
    stop(id, machinery);
    record.finishedAt = elapsed / 1000;
    productionMeters.set(id, productionMeters.get(id).filter(entry => entry !== record));
    mark(`${name} production quota`, { item, made: record.made });
    return true;
  });
  return record;
}

function tick() {
  elapsed += tickMs;
  engine.tick(tickMs);
  assert(!state.rescue?.pending, 'Hidden resource rescue fired');
  for (const [id, item] of Object.entries(cornerItems)) if (!cornerRecords[item] && state.produced[item] > 0) {
    cornerRecords[item] = elapsed / 1000;
    mark(`piece ${item}`, { map: id });
  }
  if (elapsed % 1000 === 0) for (let i = watches.length - 1; i >= 0; i--) if (watches[i]()) watches.splice(i, 1);
  if (progressPath && elapsed % 300000 === 0) {
    const active = [...districts].filter(([, district]) => !district.meter.finishedAt).map(([name, { meter }]) => `${name} ${meter.made}/${meter.limit}`);
    appendFileSync(progressPath, `${elapsed / 60000}m  ${state.research.selected ?? 'freight and production'}${active.length ? ` | ${active.join(', ')}` : ''}\n`);
  }
}

function wait(name, condition, minutes = 90) {
  const end = elapsed + minutes * 60000;
  while (!condition() && elapsed < end) tick();
  if (!condition()) {
    const snapshot = Object.fromEntries([...districts].map(([name, district]) => [name, {
      produced: district.meter?.made, target: district.meter?.limit,
      raw: sector(district.id).nodes.filter(n => n.resourceItem).map(n => [n.resourceItem, n.resourceRemaining]),
      output: district.output?.output,
      machines: district.machines.filter(n => n.recipeId && (n.processingPaused || n.progressMs === 0)).map(n => [n.recipeId, n.input, n.output]),
    }]));
    process.stderr.write(`${JSON.stringify({ snapshot, lab: lab?.input, research: state.research.selected, paid: state.research.contributed, roads: [...roadMeters.values()].map(m => [m.label, m.delivered]) }, null, 2)}\n`);
    throw new Error(`${name} timed out at ${elapsed / 60000}m`);
  }
}

function research(id, prepare) {
  const before = state.research.repeatableCompletions.mapNode ?? 0;
  engine.selectResearch(id);
  assert.equal(state.research.selected, id, `Select ${id}`);
  if (!blind && id === 'mapNode') assert.deepEqual(state.research.mapNodeQuote.costs, dryRun.purchases[before].costs);
  const costs = getResearchCostsForState(getResearchProject(id), state.research);
  prepare?.(costs);
  wait(id, () => id === 'mapNode' ? state.research.repeatableCompletions.mapNode > before : unlocked(id));
  if (id !== 'mapNode') mark(id);
  return costs;
}

function open(number) {
  if (number) research('mapNode');
  const id = dryRun.route[number];
  assert(engine.unlockSector(...id.split(',').map(Number)), `Unlock ${id}`);
  activate(id);
  mark(`map ${number} ${id}`);
  return id;
}

const middle = id => ({ x: grid(id).width * .48, y: grid(id).height * .5 });
function cart(id, point = middle(id)) { return place(id, 'woodenChest', point.x, point.y); }

function roadPair(from, to) {
  activate(from);
  const a = sector(from), b = sector(to), fa = grid(from), fb = grid(to);
  assert.equal(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 1);
  const horizontal = a.y === b.y;
  const dimension = horizontal ? 'height' : 'width';
  const existing = a.nodes.filter(n => n.kind === 'road' && n.pairedSectorId === to);
  const limit = unlocked('roadChannels2') ? 3 : unlocked('roadChannels1') ? 2 : 1;
  assert(existing.length < limit, `All ${limit} Road slots occupied on ${from} -> ${to}`);
  for (let offset = 240; offset <= Math.min(fa[dimension], fb[dimension]) - 240; offset += 32) {
    if (existing.some(n => Math.abs((horizontal ? n.y : n.x) - offset) < 220)) continue;
    const x = horizontal ? a.x < b.x ? fa.width - 68 : 68 : offset;
    const y = horizontal ? offset : a.y < b.y ? fa.height - 68 : 68;
    const proposed = { id: '__road-preview', kind: 'road', x, y, rotation: 0 };
    const paired = { ...proposed, x: horizontal ? a.x < b.x ? 67.5 : fb.width - 67.5 : x, y: horizontal ? y : a.y < b.y ? 67.5 : fb.height - 67.5 };
    const safe = (s, f, node) => canPlaceNode(node, s.nodes.map(n => n.kind === 'monster-camp' ? { ...n, campStrength: 100 } : n), f);
    if (!safe(a, fa, proposed) || !safe(b, fb, paired)) continue;
    const roadId = engine.placeNode('road', x, y);
    if (!roadId) continue;
    const sending = find(from, n => n.id === roadId);
    const receiving = find(to, n => n.id === sending.pairedRoadId);
    placed += 2;
    return { from, to, sending, receiving };
  }
  throw new Error(`Could not place both Road endpoints ${from} -> ${to}`);
}

const cartNearRoad = (id, road, viable) => place(id, 'woodenChest',
  Math.min(grid(id).width - 180, Math.max(180, road.x)),
  Math.min(grid(id).height - 180, Math.max(180, road.y)), undefined, viable);

function freight(item, path, origin, destination, name = item) {
  const result = [];
  let sendingCart = origin;
  for (let i = 0; i < path.length - 1; i++) {
    const [from, to] = [path[i], path[i + 1]], key = `${from}/${to}/${item}`;
    let lane = lanes.get(key);
    let pair, stagingCart, unloadingCart;
    try {
    if (lane) {
      if (sendingCart && lane.source !== sendingCart) {
        const link = `${from}/${sendingCart.id}/${lane.source.id}`;
        if (!freightLinks.has(link)) {
          connect(from, sendingCart, lane.source);
          freightLinks.add(link);
        }
      }
    } else {
      pair = roadPair(from, to);
      const nodes = sector(from).nodes.map(node => node.kind === 'monster-camp' ? { ...node, campStrength: 100 } : node);
      const clearsRoad = node => !connectionBlockedByWorld(node, pair.sending, { fromPort: 0, toPort: 0 }, nodes);
      if (!sendingCart || !isCartKind(sendingCart.kind) || !clearsRoad(sendingCart)) {
        stagingCart = cartNearRoad(from, pair.sending, clearsRoad);
        if (sendingCart) connect(from, sendingCart, stagingCart);
        sendingCart = stagingCart;
      }
      const destinationNodes = sector(to).nodes.map(node => node.kind === 'monster-camp' ? { ...node, campStrength: 100 } : node);
      const clearsReceivingRoad = node => !connectionBlockedByWorld(pair.receiving, node, { fromPort: 0, toPort: 0 }, destinationNodes);
      const finalStop = i === path.length - 2 ? destination : undefined;
      if (!finalStop || !isCartKind(finalStop.kind) || !clearsReceivingRoad(finalStop)) {
        unloadingCart = cartNearRoad(to, pair.receiving, clearsReceivingRoad);
      }
      const receivingCart = unloadingCart ?? finalStop;
      const feed = connect(from, sendingCart, pair.sending);
      const exit = connect(to, pair.receiving, receivingCart);
      lane = { ...pair, key, source: sendingCart, sink: receivingCart, feed, exit, delivered: 0, item, label: `${name} ${from} -> ${to}` };
      lanes.set(key, lane);
      roadMeters.set(pair.sending.id, lane);
      freightLedger.push(lane);
    }
    } catch (error) {
      if (pair) {
        activate(from);
        engine.deleteNodes(stagingCart ? [pair.sending.id, stagingCart.id] : [pair.sending.id]);
        if (unloadingCart) { activate(to); engine.deleteNodes([unloadingCart.id]); }
      }
      error.freightEdge = [from, to].sort().join('/');
      throw error;
    }
    result.push(lane);
    sendingCart = lane.sink;
  }
  const last = result.at(-1);
  if (destination && last.sink !== destination) {
    const id = path.at(-1), link = `${id}/${last.sink.id}/${destination.id}`;
    if (!freightLinks.has(link)) {
      connect(id, last.sink, destination);
      freightLinks.add(link);
    }
  }
  return { lanes: result, first: result[0], last, sink: last.sink };
}

function retireLane(lane) {
  disconnect(lane.from, lane.feed);
  disconnect(lane.to, lane.exit);
  activate(lane.from);
  engine.deleteNodes([lane.sending.id]);
  lanes.delete(lane.key);
  roadMeters.delete(lane.sending.id);
}

const recipeByItem = new Map();
for (const recipe of Object.values(RECIPES)) {
  if (!recipe.recovery && !recipe.id.startsWith('efficient-')) recipeByItem.set(Object.keys(recipe.outputs)[0], recipe);
}
const machineFor = id => Object.keys(RECIPE_GROUPS).find(kind => RECIPE_GROUPS[kind].includes(id));
const rawItems = new Set(['wood', 'copper', 'iron', 'stone']);
const fluid = item => ['water', 'coolant', 'conductive-slurry'].includes(item);
const slurryBranches = new Map();

function feed(id, source, target, port) {
  if (!slurryBranches.has(source.id)) return connect(id, source, target, 0, port);
  const tail = slurryBranches.get(source.id);
  const used = sector(id).connections.some(c => c.from === tail.id && c.fromPort === 0);
  if (!used) return connect(id, tail, target, 0, port);
  const next = place(id, 'splitter', tail.x + 140, tail.y + 150);
  connect(id, tail, next, 1);
  slurryBranches.set(source.id, next);
  return connect(id, next, target, 0, port);
}

function intake(id, second = false) {
  const key = `${id}/${second ? 2 : 1}`;
  if (water.has(key)) return water.get(key);
  const lake = source(id, 'water');
  const size = getNodeSize(lake), nodes = sector(id).nodes;
  const shores = [[0, 0, -size.h / 2 - 160], [1, size.w / 2 + 160, 0], [2, 0, size.h / 2 + 160], [3, -size.w / 2 - 160, 0]];
  for (const [port, dx, dy] of second ? [...shores.slice(2), ...shores.slice(0, 2)] : shores) {
    try {
      const node = place(id, 'fluidLink', lake.x + dx, lake.y + dy, undefined, proposed => !connectionBlockedByWorld(lake, proposed, { fromPort: port, toPort: 0 }, nodes));
      connect(id, lake, node, port);
      water.set(key, node);
      return node;
    } catch (error) { if (!error.message.startsWith('No placement')) throw error; }
  }
  throw new Error(`No usable Pump at ${id}`);
}

function factory(name, overrides = {}) {
  const plan = overrides.plan ?? dryRun.districts.find(district => district.name === name);
  assert(plan, name);
  const id = plan.id, layout = middle(id);
  const district = { id, machines: [], buses: new Map(), producers: new Map(), fines: undefined };
  const goal = Object.keys(plan.demand)[0];
  const meterInputs = overrides.meterInputs ?? ['Shiny research', 'Complex research', 'Mythril Golem', 'Iron Golem', 'Ancient Dragon', 'Foundry Mythril Gear'].includes(name);
  const uses = {};
  for (const item of Object.keys(plan.producers)) {
    if (rawItems.has(item) || item === 'water') continue;
    for (const ingredient of Object.keys(recipeByItem.get(item).inputs)) uses[ingredient] = (uses[ingredient] ?? 0) + (overrides[item] ?? plan.producers[item]);
  }
  const available = item => {
    if (district.buses.has(item)) return district.buses.get(item);
    if (item === 'water') return intake(id, overrides.secondIntake ?? (name === 'Complex research' || name === 'Secondary Hydro'));
    if (item === 'mythril') {
      const bus = cart(id, layout);
      district.buses.set(item, bus);
      return bus;
    }
    const raw = rawItems.has(item), recipe = raw ? undefined : recipeByItem.get(item);
    const inputs = Object.keys(recipe?.inputs ?? {});
    const feeds = inputs.map(available);
    const batches = meterInputs && recipe ? Math.round(plan.work[item] * 1000 / recipe.cycleMs) : undefined;
    const count = Math.min(batches ?? Infinity, overrides[item] ?? plan.producers[item]);
    assert(count > 0, `${name} requires ${item}`);
    const material = raw ? source(id, item) : undefined;
    assert(!raw || material, `${id} lacks ${item}`);
    const base = raw ? { x: material.x + 340, y: material.y } : {
      x: Math.min(grid(id).width - 250, feeds.reduce((sum, n) => sum + n.x, 0) / feeds.length + 320),
      y: feeds.reduce((sum, n) => sum + n.y, 0) / feeds.length,
    };
    const group = Array.from({ length: count }, () => place(id, raw ? 'extractor' : machineFor(recipe.id), base.x, base.y, recipe?.id));
    district.machines.push(...group);
    district.producers.set(item, group);
    group.forEach((node, index) => {
      if (raw) connect(id, material, node);
      else feeds.forEach((supply, port) => {
        const cables = feed(id, supply, node, port);
        const ingredient = inputs[port];
        if (!meterInputs || ingredient === 'water') return;
        const cycles = Math.floor(batches / count) + (index < batches % count ? 1 : 0);
        const limit = cycles * recipe.inputs[ingredient];
        recipeFeeds.set(`${id}/${node.id}/${ingredient}`, { id, target: node, item: ingredient, received: 0, limit, cables });
      });
    });
    // Direct cables keep scarce intermediates out of twenty-item storage buffers.
    if (item !== goal && group.length === 1 && uses[item] === 1 && !recipe?.outputs['metallic-fines']) {
      district.buses.set(item, group[0]);
      return group[0];
    }
    const busPoint = { x: base.x + 270, y: base.y };
    const useSplitters = item === 'conductive-slurry' || meterInputs && item === 'coolant' && group.length === 1;
    if (useSplitters) assert.equal(group.length, 1, 'Each local fluid splitter has one Hydro Plant');
    const bus = useSplitters ? place(id, 'splitter', busPoint.x, busPoint.y)
      : fluid(item) ? place(id, group.length === 1 ? 'fluidLink' : 'fluidStorage', busPoint.x, busPoint.y) : cart(id, busPoint);
    if (useSplitters) slurryBranches.set(bus.id, bus);
    district.buses.set(item, bus);
    for (const node of group) {
      if (recipe?.outputs['metallic-fines']) {
        const filter = place(id, 'filter', node.x + 225, node.y);
        activate(id);
        assert(engine.setFilterItem(filter.id, 'metallic-fines'));
        district.fines ??= cart(id, { x: node.x + 500, y: node.y + 300 });
        district.waste ??= place(id, 'wasteHopper', district.fines.x + 220, district.fines.y);
        if (!overrides.exportFines && !district.wasteWired) { connect(id, district.fines, district.waste); district.wasteWired = true; }
        connect(id, filter, district.fines, 0);
        connect(id, filter, bus, 1);
        connect(id, node, filter);
      } else connect(id, node, bus);
    }
    return bus;
  };
  district.output = available(goal);
  district.meter = meter(id, goal, district.producers.get(goal), overrides.limit ?? plan.demand[goal], district.machines, name);
  districts.set(name, district);
  mark(`built ${name}`, { map: id, production: district.machines.length });
  return district;
}

let lab;
const starter = { simple: [], basic: [] };
function simpleStarter(x, y, existing = false) {
  const wood = existing ? find(home, n => n.id === 'ironExtractor') : place(home, 'extractor', x, y - 310);
  const copper = existing ? find(home, n => n.id === 'extractor-2') : place(home, 'extractor', x, y);
  connect(home, source(home, 'wood'), wood);
  connect(home, source(home, 'copper'), copper);
  wait('Kiln and Smelter discovery', () => unlocked('kiln') && unlocked('smelter'), 1);
  const kiln = place(home, 'kiln', x + 380, y - 310);
  const smelter = place(home, 'smelter', x + 750, y, 'smelt-copper');
  connect(home, wood, kiln);
  connect(home, kiln, smelter, 0, input(smelter, 'charcoal'));
  connect(home, copper, smelter, 0, input(smelter, 'copper'));
  wait('Refiner discovery', () => unlocked('refiner'), 1);
  const gear = place(home, 'refiner', x + 1150, y, 'copper-gear');
  const simple = place(home, 'refiner', x + 1550, y, 'simple-core');
  lab ??= place(home, 'researchCenter', 2980, 1100);
  connect(home, smelter, gear);
  connect(home, gear, simple);
  connect(home, simple, lab);
  starter.simple.push(simple);
  return [wood, copper, kiln, smelter, gear, simple];
}

function basicStarter() {
  const add = (kind, x, y, recipe) => {
    const node = place(home, kind, x, y, recipe);
    machinery.push(node);
    return node;
  };
  const machinery = [];
  const basic = add('assembler', 2430, 1730, 'basic-core');
  for (const [ore, y] of [['copper', 1450], ['iron', 1760]]) {
    const fuel = add('extractor', 920, y + 340);
    const extractor = add('extractor', 910, y);
    const kiln = add('kiln', 1270, y + 340);
    const smelter = add('smelter', 1630, y, `smelt-${ore}`);
    connect(home, source(home, 'wood'), fuel);
    connect(home, source(home, ore), extractor);
    connect(home, fuel, kiln);
    connect(home, kiln, smelter, 0, input(smelter, 'charcoal'));
    connect(home, extractor, smelter, 0, input(smelter, ore));
    if (ore === 'iron') {
      const wire = add('refiner', 2030, y, 'iron-wire');
      connect(home, smelter, wire);
      connect(home, wire, basic, 0, input(basic, 'iron-wire'));
    } else connect(home, smelter, basic, 0, input(basic, 'copper-plate'));
  }
  connect(home, basic, lab);
  starter.basic.push(basic);
  return machinery;
}

function coreFreight(district, item, path) {
  const route = freight(item, path, district.output);
  if (!sector(home).connections.some(c => c.from === route.sink.id && c.to === lab.id)) connect(home, route.sink, lab);
  return route;
}

function openRange(first, last, onMap = () => {}) {
  for (let i = first; i <= last; i++) onMap(i, open(i));
}

function knownRoute() {
const homeSimple = simpleStarter(900, 1100, true);
const homeSimpleMeter = meter(home, 'simple-core', starter.simple, 100, homeSimple, 'Home Simple');
research('assembler');
const homeBasic = basicStarter();
meter(home, 'basic-core', starter.basic, 60, homeBasic, 'Home Basic');
research('exploration');
open(0);
research('road');
homeSimple.push(...simpleStarter(875, 435));
assert(homeSimpleMeter.made >= 5);
openRange(1, 3);
research('automataCore');
const south = factory('South Automata');
coreFreight(south, 'automata-core', ['5,6', home]);
mark('phase A complete');

openRange(4, 9);
for (const project of ['fabricatorTools', 'hydrochemistry', 'hydraulicAssembly', 'treePlanter', 'areaExpansion1']) research(project);
mark('phase B complete');
const west = factory('First western Simple');
coreFreight(west, 'simple-core', ['4,5', home]);
const hydro = factory('Main Hydro', { limit: 105 });
coreFreight(hydro, 'hydro-core', ['7,5', '6,5', home]);
research('roadChannels1');
const basic = factory('Basic Core reserve', { limit: 225 });
coreFreight(basic, 'basic-core', ['2,3', '2,4', '2,5', '3,5', '4,5', home]);
for (const project of ['fluidRouting', 'sealedRobotics', 'resourceGolemSurvey', 'oreSeparation']) research(project);
openRange(10, 19);
mark('phase C complete');

const dwarf = find('9,5', n => n.lizardSettlement === 'camp');
const medium = factory('Dwarven Camp', { limit: 76 });
const bots = freight('medium-suppression-bot', ['9,7', '9,6', '9,5'], medium.output);
const dwarfBotReserve = cart('9,5', { x: bots.sink.x + 220, y: bots.sink.y + 140 });
const stagingCable = connect('9,5', bots.sink, dwarfBotReserve);
wait('prefill 34 Medium Bots at the camp', () => bots.last.delivered >= 34, 65);
mark('Dwarven Bot reserve ready', { bots: bots.last.delivered });
disconnect('9,5', stagingCable);
connect('9,5', dwarfBotReserve, bots.sink);
connect('9,5', bots.sink, dwarf);
wait('first Dwarven Tribute', () => unlocked('mithrilTools'), 30);
mark('first Dwarven Tribute', { campStrength: dwarf.campStrength, botsDelivered: bots.last.delivered });
const tribute = find('9,5', n => n.tributeCampId === dwarf.id);
const dwarfStock = cart('9,5', tribute);
connect('9,5', tribute, dwarfStock);

const shiny = factory('Shiny research');
const shineFreight = coreFreight(shiny, 'shiny-core', ['6,4', '6,5', home]);
const dwarfWestPath = ['9,5', '8,5', '7,5', '6,5', '6,4'];
// Leave the first material lane separate from Hydro and the outgoing research lane.
const westMythril = freight('mythril', dwarfWestPath, dwarfStock, shiny.buses.get('mythril'), 'Tribute west');
const dwarfEast = freight('mythril', ['9,5', '10,5', '10,4', '10,3'], dwarfStock, undefined, 'Tribute east');
const forgeStock = Array.from({ length: 12 }, () => cart('10,3', { x: dwarfEast.sink.x + 280, y: dwarfEast.sink.y - 220 }));
const forgeStagingCables = forgeStock.map(buffer => connect('10,3', dwarfEast.sink, buffer));
watches.push(() => {
  if (westMythril.first.delivered < 88) return false;
  disconnect(westMythril.first.from, westMythril.first.feed);
  return true;
});
for (const project of ['heavyRobotics', 'precisionControl']) research(project);
const complex = factory('Complex research');
connect('6,4', shiny.buses.get('mythril'), complex.buses.get('mythril'));
wait('15 Shiny arrived', () => shineFreight.last.delivered >= 15);
mark('15 Shiny delivered to Home');
for (const lane of shineFreight.lanes) retireLane(lane);
const complexFreight = coreFreight(complex, 'command-core', ['6,4', '6,5', home]);
research('commandRobotics');
research('roadChannels2');
mark('phase D complete');

const mythrilAttack = factory('Mythril Golem');
for (const cables of forgeStagingCables) disconnect('10,3', cables);
for (const buffer of [...forgeStock, dwarfEast.sink]) connect('10,3', buffer, mythrilAttack.buses.get('mythril'));
const mythrilGolem = find('9,4', n => n.golemMineral === 'mythril');
const attackingMythril = freight('command-suppression-bot', ['10,3', '10,4', '10,5', '9,5', '9,4'], mythrilAttack.output, undefined, 'Mythril Golem attack');
connect('9,4', attackingMythril.sink, mythrilGolem);
const bulkSimple = factory('Second western Simple');
coreFreight(bulkSimple, 'simple-core', ['2,5', '3,5', '4,5', home]);
openRange(20, 29);
mark('phase E maps complete');
wait('Mythril Golem', () => mythrilGolem.infiniteResource, 75);
mark('Mythril Golem defeated', { commandBots: attackingMythril.last.delivered, tributeToForge: dwarfEast.last.delivered, tributeToResearch: westMythril.last.delivered });

const firstBasic = basic.meter;
for (const route of [westMythril, dwarfEast, complexFreight, attackingMythril]) for (const lane of route.lanes) retireLane(lane);
const reserveMythril = cart('9,4', { x: mythrilGolem.x + 700, y: mythrilGolem.y });
for (const [i, dy] of [-300, 300].entries()) {
  const extractor = place('9,4', 'extractor', mythrilGolem.x + 400, mythrilGolem.y + dy);
  connect('9,4', mythrilGolem, extractor, i);
  connect('9,4', extractor, reserveMythril);
}
const mythrilTrunk = freight('mythril', ['9,4', '9,5'], reserveMythril, undefined, 'Mythril reserve');
const ironAttack = factory('Iron Golem');
const ironPath = ['9,5', '8,5', '7,5', '6,5', home, '4,5', '3,5'];
const ironOre = freight('mythril', ironPath, mythrilTrunk.sink, ironAttack.buses.get('mythril'), 'Iron Golem feed');
const ironGolem = find('2,3', n => n.golemMineral === 'iron');
const attackingIron = freight('command-suppression-bot', ['3,5', '2,5', '2,4', '2,3'], ironAttack.output, undefined, 'Iron Golem attack');
connect('2,3', attackingIron.sink, ironGolem);

const north = factory('North Automata');
coreFreight(north, 'automata-core', ['5,4', home]);
const secondary = factory('Secondary Hydro', { limit: 42 });
coreFreight(secondary, 'hydro-core', ['6,4', '6,5', home]);

const dragon = factory('Ancient Dragon', { exportFines: true });
const westSpine = ['0,1', '0,2', '0,3', '0,4', '0,5', '1,5', '2,5', '3,5', '4,5', home];
const eastSpine = ['10,0', '10,1', '10,2', '10,3', '10,4', '10,5', '9,5', '8,5', '7,5', '6,5', home];
const southEastSpine = ['10,10', '10,9', '10,8', '10,7', '10,6', ...eastSpine.slice(5)];
const southWestSpine = ['0,10', '0,9', '0,8', '0,7', '0,6', ...westSpine.slice(4)];
const dragonBots = freight('command-suppression-bot', ['0,1', '0,0'], dragon.output, undefined, 'Dragon');
const corner = id => find(id, n => n.kind === 'cornerChallenge');
const piece = id => find(id, n => n.kind === 'cornerTribute');
connect('0,0', dragonBots.sink, corner('0,0'));

const circuitB = factory('Foundry Circuit B');
const frame = factory('Foundry Sealed Frame');
const gears = factory('Foundry Mythril Gear');
const foundryRoutes = [circuitB, frame, gears].map(district => {
  const item = district.meter.item;
  const path = ['10,3', '10,2', '10,1', '10,0'];
  if (district.id === '10,4') path.unshift('10,4');
  const route = freight(item, path, district.output, undefined, `Foundry ${item}`);
  connect('10,0', route.sink, corner('10,0'), 0, input(corner('10,0'), item));
  return route;
});

function startDragon() {
  const ironLast = ironOre.last;
  // Isolate the local Iron Golem feed after it has received enough to finish.
  // Its last receiving Cart is the factory's raw bus, so extend from the previous relay instead.
  retireLane(ironLast);
  // The crossing west of the Iron Bot plant already carries two eastbound Cores.
  // Release the completed Bot lane before sending Mythril through that face.
  assert(ironGolem.infiniteResource && attackingIron.last.delivered === 8);
  for (const lane of attackingIron.lanes) retireLane(lane);
  const dragonPath = [...ironPath.slice(0, -1), ...westSpine.slice(0, 8).reverse()];
  freight('mythril', dragonPath, mythrilTrunk.sink, dragon.buses.get('mythril'), 'Dragon Mythril');
}

let switchedIron = false, sentToDragon = false;
watches.push(() => {
  if (!ironGolem.infiniteResource || !firstBasic.finishedAt) return false;
  const incoming = basic.producers.get('iron').flatMap(node => sector('2,3').connections.filter(c => c.to === node.id).map(c => c.id));
  disconnect('2,3', incoming);
  basic.producers.get('iron').forEach((node, i) => connect('2,3', ironGolem, node, i));
  activate('2,3');
  for (const node of basic.machines) if (node.processingPaused) engine.toggleNodeProcessingPause(node.id);
  basic.meter = meter('2,3', 'basic-core', basic.producers.get('basic-core'), 87, basic.machines, 'Golem Iron Basic');
  switchedIron = true;
  mark('Iron Golem defeated and Basic feed switched', { commandBots: attackingIron.last.delivered });
  return true;
});
watches.push(() => {
  if (!ironAttack.meter.finishedAt) return false;
  const east = freight('mythril', ['9,5', '10,5', '10,4'], mythrilTrunk.sink, gears.buses.get('mythril'), 'Foundry Mythril');
  watches.push(() => {
    if (east.last.delivered < 65 || !ironGolem.infiniteResource) return false;
    disconnect(east.first.from, east.first.feed);
    startDragon();
    sentToDragon = true;
    mark('Mythril redirected from Foundry to Dragon', { foundryMythril: east.last.delivered });
    return true;
  });
  return true;
});

function startGrove() {
  const from = '10,9', to = '10,10';
  const feeds = {};
  for (const [item, count] of [['wood', 2], ['iron', 1], ['stone', 1]]) {
    const material = source(from, item);
    const bus = cart(from, { x: material.x + 600, y: material.y });
    for (let i = 0; i < count; i++) {
      const producer = place(from, 'extractor', material.x + 320, material.y + i * 270);
      connect(from, material, producer);
      connect(from, producer, bus);
    }
    feeds[item] = bus;
  }
  const kiln = place(from, 'kiln', feeds.wood.x + 325, feeds.wood.y);
  const smelter = place(from, 'smelter', feeds.iron.x + 320, feeds.iron.y, 'smelt-iron');
  connect(from, feeds.wood, kiln);
  connect(from, kiln, smelter, 0, input(smelter, 'charcoal'));
  connect(from, feeds.iron, smelter, 0, input(smelter, 'iron'));
  const plate = cart(from, { x: smelter.x + 250, y: smelter.y });
  connect(from, smelter, plate);
  const routes = Object.entries({ wood: feeds.wood, stone: feeds.stone, 'iron-plate': plate }).map(([item, bus]) => [item, freight(item, [from, to], bus, undefined, `Grove ${item}`)]);
  const grove = corner(to), west = grove.x - getNodeSize(grove).w / 2;
  const planters = [];
  for (const y of [grove.y - 160, grove.y + 160]) {
    const node = place(to, 'treePlanter', west - 420, y, undefined, proposed => !connectionBlockedByWorld(proposed, grove, { fromPort: 0, toPort: 0 }, sector(to).nodes));
    for (const [item, route] of routes) connect(to, route.sink, node, 0, input(node, item));
    connect(to, node, grove);
    planters.push(node);
  }
  watches.push(() => {
    if (!state.produced['grove-component']) return false;
    stop(to, planters);
    for (const [item, route] of routes) {
      disconnect(from, route.first.feed);
      mark(`Grove ${item} shipment`, { delivered: route.last.delivered });
    }
    return true;
  });
  return routes.map(([, route]) => route);
}

let groveRoutes;
openRange(30, 37, number => { if (number === 32) groveRoutes = startGrove(); });
mark('phase F maps complete');
for (const lane of lanes.values()) if (lane.item.endsWith('-core')) retireLane(lane);

const finesPath = Array.from({ length: 10 }, (_, i) => `0,${i + 1}`);
const fines = freight('metallic-fines', finesPath, dragon.fines, undefined, 'Reclamation fines');
connect('0,10', fines.sink, corner('0,10'));
watches.push(() => {
  if (fines.first.delivered < 20) return false;
  disconnect(fines.first.from, fines.first.feed);
  connect(dragon.id, dragon.fines, dragon.waste);
  mark('Reclamation dispatch quota reached', { finesDispatched: fines.first.delivered });
  return true;
});

let yin, yang, final, finished;
function finalAssembly() {
  if (final) return;
  assert(unlocked('cornerComponents'));
  yin = place(home, 'assembler', 3050, 2150, `core-half-a-${dryRun.pairIndex}`);
  yang = place(home, 'assembler', 3050, 2550, `core-half-b-${dryRun.pairIndex}`);
  final = place(home, 'assembler', 3500, 2350, 'final-core');
  finished = cart(home, { x: 4000, y: 2350 });
  connect(home, yin, final, 0, input(final, 'core-half-a'));
  connect(home, yang, final, 0, input(final, 'core-half-b'));
  connect(home, final, finished);
}

function returnPiece(id, path, half, retired = []) {
  const item = cornerItems[id];
  wait(`${item} from ${id}`, () => state.produced[item] >= 1, 95);
  finalAssembly();
  for (const lane of retired) if (lanes.has(lane.key)) retireLane(lane);
  const crate = cart(id, piece(id));
  connect(id, piece(id), crate);
  const route = freight(item, path, crate, undefined, `return ${item}`);
  const assembler = half === 'yin' ? yin : yang;
  connect(home, route.sink, assembler, 0, input(assembler, item));
  wait(`${item} delivered to Home`, () => route.last.delivered === 1, 5);
  mark(`${item} delivered to Home`, { crossings: path.length - 1 });
  return route;
}

const beta = returnPiece('10,0', eastSpine, 'yin', foundryRoutes[0].lanes);
const gamma = returnPiece('10,10', southEastSpine, 'yang', [...groveRoutes[0].lanes, ...beta.lanes]);
const delta = returnPiece('0,10', southWestSpine, 'yang');
returnPiece('0,0', ['0,0', ...westSpine], 'yin', [...dragonBots.lanes, ...delta.lanes]);
wait('one Final Core in collection Cart', () => quantity(finished, 'final-core') === 1, 5);
assert.equal(state.produced['final-core'], 1);
assert.equal(state.research.repeatableCompletions.mapNode, 37);
assert.equal(Object.values(state.sectors).filter(map => map.unlocked).length, 39);
assert(switchedIron && sentToDragon);
assert.equal(basic.meter.made, 87);
assert.equal(dragonBots.last.delivered, 21);
assert(foundryRoutes.every((route, i) => route.last.delivered >= [50, 25, 100][i]));
assert.equal(fines.last.delivered, 20);
assert.deepEqual(Object.fromEntries(Object.values(cornerItems).map(item => [item, state.produced[item]])), Object.fromEntries(Object.values(cornerItems).map(item => [item, 1])));
mark('Final Core collected', { count: quantity(finished, 'final-core') });
return finished;
}

const result = blind ? await (await import('./final-core-blind-run.mjs')).runBlind({
  engine, state, home, sector, source, activate, mark, tick, wait, research, place, connect, input, disconnect, stop, meter,
  middle, cart, freight, retireLane, lanes, factory, campaign, coreFreight, watches, cornerItems, unlocked, protectLakes,
  resume: resumed && {
    priorTrace: readFileSync(priorTracePath, 'utf8'),
    paidCores() {
      const ledger = {}, research = { completed: [], unlocked: [], repeatableCompletions: {} };
      for (const event of [...state.researchLog].reverse()) {
        const project = getResearchProject(event.projectId);
        if (!project) continue;
        if (!project.trigger) {
          if (project.id === 'mapNode') research.mapNodePricingPhase = mapNodePricingPhaseForState(research);
          for (const [item, count] of Object.entries(getResearchCostsForState(project, research))) ledger[item] = (ledger[item] ?? 0) + count;
        }
        if (project.repeatable) research.repeatableCompletions[project.id] = (research.repeatableCompletions[project.id] ?? 0) + 1;
        else research.completed.push(project.id);
      }
      return ledger;
    },
  },
  startHome() {
    const simple = simpleStarter(900, 1100, true);
    meter(home, 'simple-core', starter.simple, 100, simple, 'Home Simple');
    research('assembler');
    meter(home, 'basic-core', starter.basic, 60, basicStarter(), 'Home Basic');
    research('exploration');
    return { lab, addSimple: () => simple.push(...simpleStarter(875, 435)) };
  },
}) : { finished: knownRoute() };
const { finished, ...extra } = result;
if (checkpointPath) saveCheckpoint(checkpointPath);

console.log(JSON.stringify({
  ...extra, seed: state.seed, tickMs, elapsedSeconds: elapsed / 1000, trace, cornerRecords,
  extracted: state.extracted, produced: state.produced, research: state.research.completed,
  paidMaps: state.research.repeatableCompletions.mapNode, placed, cables, joints,
  finalCoreInCart: quantity(finished, 'final-core'), finalCoreProduced: state.produced['final-core'],
  districts: Object.fromEntries([...districts].map(([name, { id, meter, machines }]) => [name, { id, machines: machines.length, startedAt: meter.startedAt, firstAt: meter.firstAt, finishedAt: meter.finishedAt, made: meter.made, limit: meter.limit }])),
  freight: freightLedger.map(({ label, from, to, item, delivered, sending, receiving }) => ({ label, from, to, item, delivered, offsets: [[sending.x, sending.y], [receiving.x, receiving.y]] })),
  ...(process.argv.includes('--layout') ? { layout: Object.fromEntries(Object.values(state.sectors).map(map => [map.id, {
    nodes: map.nodes.map(({ id, kind, name, x, y, recipeId, filterItem, roadMode, pairedSectorId, pairedRoadId }) => ({ id, kind, name, x, y, recipeId, filterItem, roadMode, pairedSectorId, pairedRoadId })),
    cables: map.connections.map(({ from, fromPort, to, toPort, item }) => ({ from, fromPort, to, toPort, item })),
  }])) } : {}),
}, null, 2));
