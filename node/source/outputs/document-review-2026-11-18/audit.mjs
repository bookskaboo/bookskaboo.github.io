// Isolated review evidence. No browser storage, player save, or gameplay source is written.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createServer } from 'vite';
import { applyReviewedProduction } from '../../scripts/apply-reviewed-production.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const server = await createServer({ root, configFile: false, logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' });
const results = { scope: 'Static review and isolated engine fixtures; not a normal-play balance run', checks: {} };
try {
  const load = path => server.ssrLoadModule(`/src/${path}.ts`);
  const { RECIPES, RECIPE_GROUPS, RETIRED_RECIPES } = await load('content/recipes');
  const { ITEM_NAMES, isFluidItem } = await load('content/items');
  const { NODE_DEFINITIONS } = await load('content/nodes');
  const { RESEARCH_PROJECTS } = await load('content/research');
  const { MACHINE_EFFICIENCY, efficiencyFactors } = await load('content/machineEfficiency');
  const { vehiclePayload } = await load('content/cartUpgrades');
  const { getRecoveryMultiplier } = await load('content/efficiency');
  const { inputPortAcceptsItem } = await load('simulation/connectionRules');
  const { GameEngine, createInitialState } = await load('simulation/engine');
  const projects = new Set(RESEARCH_PROJECTS.map(p => p.id));
  const missingPrerequisites = RESEARCH_PROJECTS.flatMap(p => [p.prerequisite, ...(p.prerequisites ?? [])].filter(id => id && id !== 'finalCoreProduction' && !projects.has(id)).map(id => ({ project: p.id, prerequisite: id })));
  const unknownItems = Object.values(RECIPES).flatMap(r => [...Object.keys(r.inputs), ...Object.keys(r.outputs), ...(r.chanceOutputs ?? []).map(o => o.item)].filter(id => !ITEM_NAMES[id]).map(id => ({ recipe: r.id, item: id })));
  assert.deepEqual(missingPrerequisites, []);
  assert.deepEqual(unknownItems, []);
  results.checks.catalogs = { projects: RESEARCH_PROJECTS.length, recipesInLiveGroups: Object.values(RECIPES).filter(r => !RETIRED_RECIPES.has(r.id) && Object.values(RECIPE_GROUPS).some(g => g.includes(r.id))).length, efficiencyRanks: MACHINE_EFFICIENCY.reduce((n, d) => n + efficiencyFactors(d.start).length, 0), missingPrerequisites, unknownItems };

  const machine = (kind, id, x, extra = {}) => ({ id, kind, name: NODE_DEFINITIONS[kind].name, x, y: 900, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0, ...extra });
  function fixture(nodes) {
    const state = createInitialState(18);
    state.sectors['5,5'].nodes = nodes;
    state.research.completed = ['exploration', 'lakeTools', 'fluidRouting', 'hydraulicAssembly', 'autonomousLogistics', 'inventoryPlacementCapacity'];
    state.research.unlocked = [...state.research.completed];
    const engine = new GameEngine(state, { autosave: false });
    return engine;
  }
  function run(engine, ms) { for (let time = 0; time < ms; time += 100) engine.tick(100); }

  const pump = fixture([
    machine('fluidStorage', 'source', 400, { output: { coolant: 8 } }),
    machine('fluidLink', 'pump', 1200),
    machine('fluidStorage', 'receiver', 2200),
  ]);
  assert(pump.connectPorts('source', 0, 'pump', 0));
  assert(pump.connectPorts('pump', 0, 'receiver', 0));
  run(pump, 8000);
  const receiver = pump.getSector().nodes.find(n => n.id === 'receiver');
  const received = (receiver.input.coolant ?? 0) + (receiver.output.coolant ?? 0);
  assert.equal(received, 8);
  results.checks.pumpRelay = { suppliedCoolant: 8, receivedCoolant: received, extractedWater: pump.getState().extracted.water ?? 0 };

  const global = fixture([
    machine('fluidStorage', 'water-supply', 400, { output: { water: 8 } }),
    machine('storage', 'deposit', 1200),
  ]);
  const remote = { ...structuredClone(global.getSector()), id: '6,5', x: 6, y: 5, nodes: [machine('inventory', 'withdraw', 400), machine('filter', 'filter', 1200, { filterItem: 'water' }), machine('fluidStorage', 'remote-tank', 2200)], connections: [], controlGroups: [] };
  global.getState().sectors['6,5'] = remote;
  assert(global.connectPorts('water-supply', 0, 'deposit', 0));
  global.getState().activeSectorId = '6,5';
  assert(global.connectPorts('withdraw', 0, 'filter', 0));
  assert(global.connectPorts('filter', 0, 'remote-tank', 0));
  run(global, 20000);
  const remoteTank = global.getSector().nodes.find(n => n.id === 'remote-tank');
  const remoteWater = (remoteTank.input.water ?? 0) + (remoteTank.output.water ?? 0);
  assert.equal(remoteWater, 8);
  results.checks.crossMapFluidPool = { suppliedWaterAtHome: 8, receivedWaterOnNeighbor: remoteWater, usedRoads: false, researchAccess: 'Autonomous Logistics; post-first-Final-Core bill' };

  const tank = machine('fluidStorage', 'tank', 400);
  results.checks.slurryClassification = { classifiedFluid: isFluidItem('conductive-slurry'), tankAccepts: inputPortAcceptsItem(tank, 0, 'conductive-slurry') };
  assert(results.checks.slurryClassification.classifiedFluid && !results.checks.slurryClassification.tankAccepts);
  const drill = fixture([machine('miningDrill', 'drill', 400)]);
  results.checks.mythrilDrill = { selectable: drill.setMiningTarget('drill', 'mythril') };
  assert.equal(results.checks.mythrilDrill.selectable, false);

  const panel = readFileSync(resolve(root, 'src/ui/RoadFlowPanel.tsx'), 'utf8');
  assert(panel.includes('12 * vehiclePayload(game.research.completed)'));
  const actualRate = 12 * vehiclePayload(['trains'], 2);
  const shownRate = 12 * vehiclePayload(['trains']);
  assert.equal(actualRate, 72); assert.equal(shownRate, 48);
  results.checks.roadRatePresentation = { repeatableRank: 2, actualIdealPerMinute: actualRate, panelFormulaPerMinute: shownRate, panelReadsModInterval: panel.includes('roadTransferMs') };

  results.checks.recoveryFlag = { plainMultiplier: getRecoveryMultiplier({ recovery: false }, ['recycler7']), recoveryMultiplier: getRecoveryMultiplier({ recovery: true }, ['recycler7']), editorPromisesRecoveryResearch: readFileSync(resolve(root, 'src/ui/ModEntryEditor.tsx'), 'utf8').includes('Applies recovery efficiency research') };
  assert.equal(results.checks.recoveryFlag.recoveryMultiplier, 1);

  // Execute the historical content compiler with its write function intercepted.
  // This checks its output without overwriting the authoritative gameplay catalog.
  const syncSource = readFileSync(resolve(root, 'scripts/sync-progression-content.mjs'), 'utf8').replace(/^import[^\n]*;\r?\n/gm, '');
  const captured = new Map();
  vm.runInNewContext(syncSource, {
    readFileSync: (path, encoding) => readFileSync(resolve(root, path), encoding),
    writeFileSync: (path, content) => captured.set(path, content),
    applyReviewedProduction, console: { log() {} }, structuredClone,
  }, { timeout: 10000 });
  const generated = captured.get('src/content/progression.ts');
  assert(generated);
  const generatedRecipes = JSON.parse(generated.match(/export const LATE_RECIPES = ([\s\S]*?) satisfies Record<string,Recipe>;/)[1]);
  results.checks.historicalContentCompiler = { realFilesWritten: 0, coreRecipeGates: ['hydro-core', 'shiny-core', 'command-core'].map(id => ({ recipe: id, current: RECIPES[id].unlockResearch, compilerOutput: generatedRecipes[id].unlockResearch })) };

  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(resolve(dir, e.name)) : /\.(md|docx)$/.test(e.name) ? [resolve(dir, e.name)] : []);
  const registerPath = resolve(root, 'docs/reviews/system-review-temporary.md');
  const register = readFileSync(registerPath, 'utf8');
  assert.equal([...register.matchAll(/^### SR-\d\d /gm)].length, 27);
  assert.equal(new Set([...register.matchAll(/^### (SR-\d\d) /gm)].map(m => m[1])).size, 27);
  assert.equal([...register.matchAll(/\*\*Outcome: pending\.\*\*/g)].length, 27);
  function anchors(content) {
    const found = new Set([...content.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
    const counts = new Map();
    for (const [, title] of content.matchAll(/^#{1,6} (.+)$/gm)) {
      const base = title.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
      const count = counts.get(base) ?? 0; counts.set(base, count + 1);
      found.add(count ? `${base}-${count}` : base);
    }
    return found;
  }
  let checkedLinks = 0;
  for (const [, raw] of register.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = raw.replace(/^<|>$/g, '');
    if (/^[a-z]+:/i.test(target)) continue;
    const [path, anchor] = target.split('#');
    const file = path ? resolve(dirname(registerPath), path) : registerPath;
    const content = readFileSync(file, file.endsWith('.docx') ? undefined : 'utf8');
    if (anchor && file.endsWith('.md')) assert(anchors(content).has(anchor), `Unresolved review anchor: ${target}`);
    checkedLinks++;
  }
  results.checks.reviewRegister = { issueCount: 27, pendingOutcomes: 27, checkedLinks };
  results.documentInventory = walk(resolve(root, 'docs')).map(path => ({ path: relative(root, path).replaceAll('\\', '/'), sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }));
  const destination = fileURLToPath(new URL('./results.json', import.meta.url));
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results.checks, null, 2));
} finally { await server.close(); }
