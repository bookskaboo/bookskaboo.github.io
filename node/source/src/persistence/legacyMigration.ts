import { NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { getResearchProject, getResearchCosts, RESEARCH_PROJECTS } from '../content/research';
import { migrateRetiredNodes } from '../content/retiredNodes';
import { normalizeControlGroups } from '../domain/controlGroups';
import type { GameState, ItemId, MachineNode, NodeKind, SectorState } from '../domain/types';

import { record, number, entries, type UnknownRecord } from './saveValidation';

const LEGACY_ITEMS: Record<string, ItemId> = {
  IRON: 'iron', COPPER: 'copper', MYTHRIL: 'mythril', STONE: 'stone', BRICK: 'brick', WOOD: 'wood', CHARCOAL: 'charcoal',
  IRON_PLATE: 'iron-plate', COPPER_PLATE: 'copper-plate', MYTHRIL_PLATE: 'mythril-plate', IRON_GEAR: 'iron-gear', COPPER_GEAR: 'copper-gear', MYTHRIL_GEAR: 'mythril-gear',
  IRON_WIRE: 'iron-wire', COPPER_WIRE: 'copper-wire', MYTHRIL_WIRE: 'mythril-wire', MOTOR: 'motor', CIRCUIT_A: 'circuit-a', SIMPLE_CORE: 'simple-core', BASIC_CORE: 'basic-core', AUTOMATA_CORE: 'automata-core',
  SIMPLE_ROBOT_FRAME: 'simple-robot-frame', SIMPLE_ROBOT_GUN: 'simple-robot-gun', SMALL_SUPPRESSION_BOT: 'suppression-bot', SUPPRESSION_BOT: 'suppression-bot', WATER: 'water', POWER: 'power', FOREST_GROWTH: 'forest-growth',
};

const legacyItem = (value: unknown): ItemId | undefined => typeof value === 'string' ? LEGACY_ITEMS[value] ?? (value in LEGACY_ITEMS ? LEGACY_ITEMS[value] : undefined) : undefined;
const legacyBag = (value: unknown) => Object.fromEntries(entries(value).flatMap(([key, amount]) => {
  const item = legacyItem(key); const count = Math.max(0, Math.floor(number(amount)));
  return item && count ? [[item, count]] : [];
})) as Partial<Record<ItemId, number>>;

const legacyKind = (value: unknown): NodeKind | undefined => {
  if (value === 'automataCoreAssembler') return 'assembler';
  if (typeof value === 'string' && value in NODE_DEFINITIONS) return value as NodeKind;
  if (value === 'gearPress' || value === 'wireMill') return 'refiner';
  if (value === 'motorFactory' || value === 'circuitAConduit') return 'assembler';
  return undefined;
};

const RECIPE_IDS: Record<string, string> = {
  circuitA: 'circuit-a', basicCore: 'basic-core', automataCore: 'automata-core', simpleRobotFrame: 'robot-frame', simpleRobotGun: 'robot-gun', smallSuppressionBot: 'suppression-bot',
  gear: 'iron-gear', wire: 'iron-wire', brick: 'brick', simpleCore: 'simple-core',
};

const recipeForLegacyNode = (kind: NodeKind, state: UnknownRecord, originalKind?: unknown) => {
  if (kind === 'kiln') return 'charcoal';
  if (originalKind === 'automataCoreAssembler') return 'automata-core';
  const selected = typeof state.assemblerRecipe === 'string' ? state.assemblerRecipe : typeof state.refinerRecipe === 'string' ? state.refinerRecipe : undefined;
  let recipe = selected ? RECIPE_IDS[selected] : undefined;
  const material = legacyItem(state.materialType);
  if (kind === 'smelter') recipe = material === 'copper' || material === 'copper-plate' ? 'smelt-copper' : material === 'mythril' || material === 'mythril-plate' ? 'smelt-mythril' : 'smelt-iron';
  if (kind === 'refiner' && recipe && (recipe.endsWith('-gear') || recipe.endsWith('-wire'))) {
    const metal = material?.startsWith('copper') ? 'copper' : material?.startsWith('mythril') ? 'mythril' : 'iron';
    recipe = `${metal}-${selected === 'wire' ? 'wire' : 'gear'}`;
  }
  return recipe;
};

function migrateFactory(factoryValue: unknown, sectorKey: string, unlocked: boolean, now: number): SectorState {
  const factory = record(factoryValue);
  const runtime = record(factory.runtime);
  const positions = record(factory.positions);
  const construction = record(runtime.construction);
  const processorStates = record(runtime.processors);
  const extractorStates = record(runtime.extractors);
  const roads = record(runtime.roads);
  const nodes: MachineNode[] = [];
  for (const rawNode of Array.isArray(factory.nodes) ? factory.nodes : []) {
    const oldNode = record(rawNode); const kind = legacyKind(oldNode.kind); const id = typeof oldNode.id === 'string' ? oldNode.id : undefined;
    if (!kind || !id) continue;
    const position = record(positions[id]);
    const processor = record(processorStates[id]);
    const extractor = record(extractorStates[id]);
    const road = record(roads[id]);
    const constructed = record(construction[id]);
    const recipeId = recipeForLegacyNode(kind, processor, oldNode.kind);
    const outputItem = legacyItem(extractor.materialType ?? processor.materialType);
    const node: MachineNode = {
      id, kind, name: typeof oldNode.title === 'string' ? oldNode.title : NODE_DEFINITIONS[kind].name,
      x: number(position.x, 800), y: number(position.y, 600), rotation: number(oldNode.portRotation) * 90,
      recipeId, input: legacyBag(processor.inputs), output: {}, progressMs: number(processor.progress ?? extractor.progress),
      cycleMs: kind === 'researchCenter' ? 5000 : recipeId ? RECIPES[recipeId]?.cycleMs ?? 1000 : 1000, constructedAt: 0, constructionMs: constructed.complete === false ? 1500 : 0,
    };
    if (oldNode.kind === 'automataCoreAssembler' && node.name === 'Automata Core Assembler') node.name = 'Assembler';
    if (outputItem) node.output[outputItem] = Math.max(0, Math.floor(number(extractor.stored ?? processor.stored)));
    if (kind === 'iron' || kind === 'copper' || kind === 'mythril' || kind === 'stoneDeposit' || kind === 'forest') {
      const source = kind === 'stoneDeposit' ? record(runtime.stone) : record(runtime[kind]);
      node.resourceItem = kind === 'stoneDeposit' ? 'stone' : kind === 'forest' ? 'wood' : kind;
      node.resourceRemaining = number(source.remaining);
      node.resourceCapacity = number(source.capacity, node.resourceRemaining);
      node.cycleMs = 5000;
      node.capacity = 5;
    }
    if (kind === 'charcoalGenerator') { const value = record(record(runtime.charcoalGenerators)[id]); node.input.charcoal = number(value.charcoal); node.output.power = number(value.power); node.capacity = 100; }
    if (kind === 'researchCenter') { const value = record(record(runtime.researchCenters)[id]); for (const core of Array.isArray(value.coreItems) ? value.coreItems : []) { const item = legacyItem(core); if (item) node.input[item] = (node.input[item] ?? 0) + 1; } node.progressMs = number(value.progress); node.cycleMs = 5000; }
    if (kind === 'miningDrill') { const value = record(record(runtime.miningDrills)[id]); node.miningTarget = legacyItem(value.selectedType) as MachineNode['miningTarget']; node.miningProgress = number(value.iterations); node.progressMs = number(value.progress); }
    if (kind === 'woodenChest') { const value = record(record(runtime.woodenChests)[id]); const item = legacyItem(value.itemType); if (item) node.output[item] = number(value.stored); node.capacity = 20; node.transferProgressMs = number(value.outputTransferElapsed); }
    if (kind === 'storage') node.input = legacyBag(record(record(runtime.storages)[id]).items);
    if (kind === 'filter') node.filterItem = legacyItem(record(record(runtime.filters)[id]).selectedType);
    if (kind === 'splitter') node.alternator = record(record(runtime.splitters)[id]).nextOutput === 'b' ? 1 : 0;
    if (kind === 'road') { node.roadMode = road.mode === 'import' ? 'import' : 'export'; node.pairedSectorId = typeof road.pairedSector === 'string' ? road.pairedSector : undefined; node.pairedRoadId = typeof road.pairedRoadId === 'string' ? road.pairedRoadId : undefined; node.progressMs = number(road.transferElapsed); }
    nodes.push(node);
  }

  for (const [id, value] of entries(runtime.bigHoles)) { const hole = record(value); nodes.push({ id, kind: 'big-hole', name: 'Deep Hole', x: number(hole.x), y: number(hole.y), rotation: number(hole.rotation), input: { stone: 0 }, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0, resourceRemaining: Math.max(0, number(hole.stoneRequirement, 250) - number(hole.stoneFilled)), obstructionRadius: Math.max(1, number(hole.radius, 105)) }); }
  for (const [id, value] of entries(runtime.lakes)) { const lake = record(value); nodes.push({ id, kind: 'lake', name: 'Lake', x: number(lake.x), y: number(lake.y), rotation: 0, input: {}, output: {}, progressMs: number(lake.productionElapsed), cycleMs: 1000, constructedAt: 0, constructionMs: 0, resourceItem: 'water', capacity: 5, obstructionWidth: Math.max(1, number(lake.width, 350)), obstructionHeight: Math.max(1, number(lake.height, 245)) }); }
  for (const [id, value] of entries(runtime.monsterCamps)) { const camp = record(value); nodes.push({ id, kind: 'monster-camp', name: typeof camp.title === 'string' ? camp.title : 'Monster Camp', x: number(camp.x), y: number(camp.y), rotation: number(camp.rotation), input: { 'suppression-bot': number(camp.storedAttackPower) }, output: {}, progressMs: number(camp.checkElapsed), cycleMs: number(camp.expansionCheckIntervalMs, 60000), constructedAt: 0, constructionMs: 0, campStrength: Math.max(10, Math.round(number(camp.sizeRatio, .25) * 100)), obstructionMaxRadius: Math.max(1, number(camp.maxRadius, 600)) }); }

  const connections = (Array.isArray(factory.connections) ? factory.connections : []).flatMap((value) => {
    const connection = record(value); const from = connection.sourceNode; const to = connection.targetNode;
    return typeof connection.id === 'string' && typeof from === 'string' && typeof to === 'string' ? [{ id: connection.id, from, to, item: legacyItem(connection.type), createdAt: now }] : [];
  });
  const [x, y] = sectorKey.split(',').map((part) => number(part, 5));
  const viewport = record(factory.viewport);
  return { id: sectorKey, x, y, name: `Sector ${x}.${y}`, label: sectorKey === '5,5' ? 'HME' : `S${Math.abs(x - 5) + Math.abs(y - 5)}`.slice(0, 3), unlocked, nodes, connections, controlGroups: normalizeControlGroups(factory.controlGroups, nodes), camera: { x: -number(viewport.scrollLeft), y: -number(viewport.scrollTop), zoom: number(factory.zoom, .72) }, lastSimulatedAt: number(factory.lastSimulatedAt, now) };
}

function migrateOriginalPayload(payloadValue: unknown): GameState | null {
  const payload = record(payloadValue);
  if (payload.version !== 1 || !Array.isArray(payload.nodes) || !payload.runtime) return null;
  const now = Date.now(); const activeSectorId = typeof payload.activeMapSector === 'string' ? payload.activeMapSector : '5,5';
  const mapProgress = record(payload.mapNodeProgress);
  const activeFactory = { nodes: payload.nodes, positions: payload.positions, connections: payload.connections, controlGroups: payload.controlGroups, runtime: payload.runtime, zoom: payload.zoom, viewport: payload.viewport, lastSimulatedAt: now };
  const sectors: Record<string, SectorState> = { [activeSectorId]: migrateFactory(activeFactory, activeSectorId, true, now) };
  for (const [key, factory] of entries(payload.mapFactories)) sectors[key] = migrateFactory(factory, key, record(mapProgress[key]).explored === true || key === activeSectorId, now);
  for (const [key, progressValue] of entries(mapProgress)) {
    if (!sectors[key]) continue;
    const progress = record(progressValue);
    if (typeof progress.customName === 'string') sectors[key].name = progress.customName;
    if (typeof progress.mapLabel === 'string') sectors[key].label = progress.mapLabel.slice(0, 3).toUpperCase();
  }
  const runtime = record(payload.runtime); const oldResearch = record(runtime.research);
  const unlocked = RESEARCH_PROJECTS.filter((project) => oldResearch[`${project.id}Unlocked`] === true).map((project) => project.id);
  const activeProject = typeof oldResearch.activeProject === 'string' ? oldResearch.activeProject : undefined;
  const repeatableCompletions = { mapNode: Math.max(0, Math.floor(number(oldResearch.mapNodeResearchCompletions))) };
  const contributed: Partial<Record<ItemId, number>> = {};
  if (activeProject) {
    const project = getResearchProject(activeProject);
    let progress = Math.max(0, Math.floor(number(record(oldResearch.progress)[activeProject])));
    if (project) for (const [item, cost] of Object.entries(getResearchCosts(project, repeatableCompletions.mapNode, unlocked))) { const amount = Math.min(progress, cost ?? 0); contributed[item as ItemId] = amount; progress -= amount; }
  }
  return {
    version: 1, seed: 1, activeSectorId, sectors,
    research: { unlocked: Array.from(new Set(['extractor', 'woodenChest', ...unlocked])), selected: activeProject, contributed, completed: unlocked.filter((id) => id !== 'mapNode'), mapPoints: Math.max(0, Math.floor(number(runtime.mapPoints))), repeatableCompletions },
    paused: payload.isRunning === false, playTimeMs: Math.max(0, number(payload.gameElapsedMs)), achievements: Array.isArray(payload.achievements) ? payload.achievements.filter((value): value is string => typeof value === 'string') : [],
    preferences: { autosaveMinutes: 5, confirmDelete: !record(payload.promptPreferences).skipNodeDestructionConfirmation, particles: true, showGrid: true, sound: false },
    tutorialStep: 0, events: [], revision: 1, produced: legacyBag(runtime.produced), extracted: legacyBag(runtime.extractorProduced), hasCreatedConnection: sectors[activeSectorId].connections.length > 0,
    discoveryTimes: Object.fromEntries(entries(payload.unlockTimes).filter(([kind, time]) => kind in NODE_DEFINITIONS && Number.isFinite(Number(time))).map(([kind, time]) => [kind, Math.max(0, Number(time))])),
  };
}

function normalizeGameState(value: GameState) {
  const state = structuredClone(value);
  migrateRetiredNodes(state);
  for (const sector of Object.values(state.sectors)) if (sector.controlGroups !== undefined) sector.controlGroups = normalizeControlGroups(sector.controlGroups, sector.nodes);
  state.produced ??= {}; state.extracted ??= {}; state.hasCreatedConnection ??= false; state.research.completed ??= []; state.research.repeatableCompletions ??= {};
  state.preferences ??= { autosaveMinutes: 5, confirmDelete: true, particles: true, showGrid: true, sound: false };
  state.events ??= []; state.achievements ??= [];
  return state;
}

export function normalizeLegacy(payload: unknown): GameState | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Partial<GameState>;
  if (value.version === 1 && value.sectors && value.activeSectorId && value.research) return normalizeGameState(value as GameState);
  return migrateOriginalPayload(payload);
}

