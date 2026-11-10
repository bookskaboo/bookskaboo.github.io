import { applyExpansionRescue } from './expansionRescue';
import { firstSpottedDwarvenCamp, DWARVEN_DISCOVERY_PROMPT } from '../tutorials/dwarvenDiscovery';
import { endgameRank, reconcileHole, worldRecipeAllowed, FOUNDRY_INPUTS } from '../content/endgame';
import { initializeEndgame, simulateCorner, simulateRecycler, cornerInputAllowed, syncCornerLayout } from './endgameRuntime';
import { recyclerAccepts } from '../content/recycling';
import { simulatePlanter } from '../content/forestry';
import { activateMod, BASE_MOD_CONTENT } from '../mods/modContent';
import { validateMod } from '../mods/modValidation';
import { applyModNames, modCompatibilityError } from '../mods/modRuntime';
import { modNode, modNodeTemplate, modRule, modWorldGridSize } from '../mods/modRules';
import { HOME_SECTOR_ID, isWorldGridCell, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import type { GameMod } from '../mods/modTypes';
import { FactoryTemplateRuntime } from './factoryTemplateRuntime';
import { ResearchRuntime } from './researchRuntime';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, isResourceBehavior, needsRecipeSelection } from '../content/nodeCapabilities';
import { isRecipeUnlocked, RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { cargoMaterial, MATCHED_BOTS } from '../content/botAssembly';
import { RESEARCH_PROJECTS } from '../content/research';
import { getEfficiencyMultiplier } from '../content/efficiency';
import { migrateRetiredNodes } from '../content/retiredNodes';
import { LEGACY_NODE_DISPLAY_NAMES } from '../content/displayNameChanges';
import { CONTROL_GROUP_COLORS, copyControlGroups, normalizeControlGroups, regroupControlNodes } from '../domain/controlGroups';
import type { Connection, GameEvent, GameState, InFlightTransfer, ItemId, MachineNode, NodeKind, SectorState } from '../domain/types';
import { getEncounterLayoutVersion, getGolemPlacementTier, getWorldFieldSize, normalizeWorldFieldSize, sectorDistance, sectorForState, sectorId, syncCornerLayouts } from './worldGeneration';
import { logisticsRoute } from './logisticsRoutes';
import { routedConnectionFailure } from './connectionMaterials';
import { isTutorialUnlocked, type ProgressiveTutorialKind } from '../tutorials/tutorialUnlocks';
import { cablesUnderNode } from './cableInsertion';
import { canPlaceNode } from './collisions';
import { DEFERRED_POWER_NODES } from '../content/deferredPower';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';
import { applyCartUpgrades, cartCapacity, cartUpgrade, isCartKind, vehiclePayload } from '../content/cartUpgrades';
import { updateCampEncroachment } from './campEffects';
import { obstructedConnections } from './obstructedConnections';
import { facingAwayFromNeighbor, pairedRoadPositions } from './roadPlacement';
import { devExtractorMaterial, supplyDevInputs } from './devSource';
import { recoverRoadStock } from './roadTransport';
import { connectionBlockedByWorld, connectionObstruction, inputPortAcceptsItem, portFamilyAcceptsItem, portFamiliesCompatible, resolveConnectionPlan, resolveExactConnectionPlan, roadVehicleError } from './connectionRules';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { CONNECTOR_MIRRORING_RESEARCH, isProductionMachine } from '../content/productionNodes';

import { getNodeSize } from '../domain/nodeGeometry';
import { FILTERABLE_ITEMS, ITEM_NAMES } from '../content/items';
import { SimulationLookups } from './simulationLookups';
import { WASTE_ITEMS } from '../content/progression';
import { migrateReviewedProduction } from './reviewedProductionMigration';
import { filterOutlet, selectedFilterPort, type FilterPort } from '../domain/filterRouting';
import { outputHead, queueOutputs, reconcileQueue, returnOutput, takeOutput } from './mixedOutput';
import { getGoblinAttackRequirement, getMonsterSettlementDefinition, GOBLIN_CHECK_INTERVAL_MS } from '../content/goblinSettlements';
import { createGoblinTribute, getTributeItems, isCampFullySuppressed, produceGoblinTribute, tributeMaterial, type TributeItem } from './goblinTribute';
import { isRoadFluid, roadConnectionError, roadInputAccepts, roadMaterialState } from './roadMaterials';
import { initializeProgression, discoverActiveSector, simulateProgressionNode, simulateExtendedRecipe, attackPower, consumeCampBots, placementLimit, connectionLimit, roadChannels } from './progression';

const clone = <T,>(value: T): T => structuredClone(value);
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
const sum = (bag: Partial<Record<ItemId, number>>) => Object.values(bag).reduce<number>((a, b) => a + (b ?? 0), 0);
export interface RoadPlacementTarget {
  sector: SectorState;
  endpoint: MachineNode;
  localFacing: NonNullable<MachineNode['roadFacing']>;
}

const nonItemFamilies = new Set(['FLUID', 'WASTE','ANY', 'RESOURCE', 'METAL', 'PLATE', 'GEAR', 'CORE', 'ROBOT_FRAME', 'ROBOT_WEAPON', 'ATTACK_POWER', 'POWER']);
const concreteOutputItem = (node: MachineNode, port: number) => {
  if (node.kind === 'refiner' && node.recipeId?.match(/-(gear|wire)$/) &&
    sum(node.input) === 0 && sum(node.output) === 0 && node.progressMs === 0) return undefined;
  const family = getEffectiveNodeOutputFamilies(node)[port];
  return family && !nonItemFamilies.has(family) ? family as ItemId : undefined;
};

export { createInitialState } from './createInitialState';
import { createInitialState } from './createInitialState';
import { AUTOSAVE_KEY } from '../persistence/storageKeys';

export class GameEngine {
  private readonly templates = new FactoryTemplateRuntime(
    () => this.getState(), () => this.checkpoint(), () => this.publish(), makeId,
  );
  private readonly research = new ResearchRuntime(
    () => this.getState(),
    () => this.publish(),
    (type, message, projectId, elapsedMs) => this.event(type, message, projectId, elapsedMs),
    () => this.journalElapsedMs(),
    kind => this.efficiencyMultiplier(kind),
    () => this.syncFieldLayouts(),
  );
  private state: GameState;
  private listeners = new Set<() => void>();
  private history: GameState[] = [];
  private transferAccumulator = 0;
  private publishAccumulator = 0;
  private autosaveAccumulator = 0;
  private rescueAccumulator = 0;
  private realtimeTickAt?: number;
  private realtimePendingMs = 0;
  private visibleTransferSource?: InFlightTransfer[];
  private visibleTransferCount = -1;
  private visibleTransferSectorId?: string;
  private visibleTransfers: InFlightTransfer[] = [];

  constructor(initial?: GameState, private readonly options: { autosave?: boolean } = {}) {
    this.state = initial ? clone(initial) : createInitialState();
    if (this.state.mod) this.state.mod = validateMod(this.state.mod);
    activateMod(this.state.mod);
    this.state.produced ??= {};
    this.state.extracted ??= {};
    this.state.hasCreatedConnection ??= false;
    this.state.research.completed ??= [];
    this.state.research.repeatableCompletions ??= {};
    this.state.research.projectContributions ??= {};
    this.state.inFlightTransfers ??= [];
    this.normalizeExtractorCycles();
    applyModNames(this.state);
    this.research.reconcileResearchSelection();
    this.pruneLockedForestInputs();
    this.evaluateMilestones();
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getState = () => { activateMod(this.state.mod); return this.state; };
  getSector = () => { activateMod(this.state.mod); return this.state.sectors[this.state.activeSectorId]; };
  applyMod(mod?: GameMod) {
    const candidate = mod ? validateMod(mod) : undefined;
    const gridSize = modWorldGridSize(candidate);
    if (gridSize !== undefined && gridSize !== worldGridSize(this.state) && Object.keys(this.state.sectors).some(id => id !== HOME_SECTOR_ID)) {
      throw new Error('Choose the world map size before opening your first map beyond Home. Start a new factory to use a different size.');
    }
    const error = modCompatibilityError(this.state, candidate);
    if (error) throw new Error(error);
    this.checkpoint();
    this.state.mod = candidate;
    if (gridSize !== undefined) this.state.worldGridSize = gridSize;
    activateMod(candidate);
    this.syncFieldLayouts();
    applyModNames(this.state);
    applyCartUpgrades(this.state);
    applyModNames(this.state);
    delete this.state.research.mapNodeQuote;
    this.transferAccumulator = 0;
    this.research.reconcileResearchSelection();
    this.publish();
  }
  private normalizeExtractorCycles() {
    normalizeWorldFieldSize(this.state);
    this.state.golemPlacementTier ??= getGolemPlacementTier(this.state);
    this.state.encounterLayoutVersion ??= getEncounterLayoutVersion(this.state);
    migrateRetiredNodes(this.state);
    initializeProgression(this.state);
    migrateReviewedProduction(this.state);
    this.migrateBotAssembly();
    initializeEndgame(this.state);
    applyCartUpgrades(this.state);
    for (const node of [...Object.values(this.state.sectors).flatMap(sector => sector.nodes), ...(this.state.factoryTemplates ?? []).flatMap(template => template.nodes)]) {
      node.name = LEGACY_NODE_DISPLAY_NAMES[node.name] ?? node.name;
      if (node.modBaseName) node.modBaseName = LEGACY_NODE_DISPLAY_NAMES[node.modBaseName] ?? node.modBaseName;
      if (node.kind === 'goblinTribute') node.name = 'Tribute';
      if (node.kind === 'monster-camp' && node.lizardSettlement) {
        node.name = getMonsterSettlementDefinition(node).name;
        if (!node.tributeSelectionVersion) {
          node.tributeItem = 'mythril';
          node.tributeSelectionVersion = 1;
        }
      }
    }
    for (const sector of Object.values(this.state.sectors)) {
      for (const node of sector.nodes) {
        if (NODE_DEFINITIONS[node.kind].category === 'Logistics') node.processingPaused = false;
        if (node.kind === 'extractor') node.cycleMs = 5000;
        if (node.kind === 'forest' && node.name === 'Wild Forest') node.name = 'Forest';
        if (node.kind === 'big-hole' && ['Big Hole', 'Depletion Hole'].includes(node.name)) node.name = 'Deep Hole';
        if (hasNodeBehavior(node.kind, 'road') && !node.roadFacing && node.pairedSectorId) {
          const [x, y] = node.pairedSectorId.split(',').map(Number);
          node.roadFacing = x < sector.x ? 'east' : x > sector.x ? 'west' : y < sector.y ? 'south' : 'north';
        }
      }
      for (const tribute of sector.nodes.filter(node => node.kind === 'goblinTribute')) {
        const camp = sector.nodes.find(node => node.kind === 'monster-camp' && node.id === tribute.tributeCampId);
        if (camp) tribute.tributeItem = tributeMaterial(camp);
      }
      this.removeInactiveTribute(sector);
      this.removeDefeatedGolemCables(sector);
      this.clearFilledHoles(sector, sector.nodes.filter(node => node.kind === 'big-hole' && node.resourceRemaining === 0));
    }
    this.syncFieldLayouts();
    const roadCables = new Set(Object.values(this.state.sectors).flatMap(sector => {
      const roads = new Set(sector.nodes.filter(node => node.kind === 'road').map(node => node.id));
      return sector.connections.filter(cable => roads.has(cable.from) || roads.has(cable.to)).map(cable => cable.id);
    }));
    this.cancelTransfers(roadCables);
    const lookups = new SimulationLookups(this.state);
    recoverRoadStock(this.state, (target, port, item, sector) => {
      if (!this.canAcceptAtInputPort(target, port, item, sector, lookups)) return 0;
      const pending = lookups.target(sector.id, target.id);
      const reserved = this.inputUsesPerItemCapacity(target) ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((n, t) => n + (t.amount ?? 1), 0) ?? 0;
      return Math.max(0, this.inputCapacity(target, item) - this.inputOccupancy(target, item) - reserved);
    });
  }
  /** Reuse the active map's animation data between simulation updates. */
  getActiveTransfers = (): readonly InFlightTransfer[] => {
    const transfers = this.state.inFlightTransfers;
    if (transfers !== this.visibleTransferSource || (transfers?.length ?? 0) !== this.visibleTransferCount || this.state.activeSectorId !== this.visibleTransferSectorId) {
      this.visibleTransferSource = transfers;
      this.visibleTransferCount = transfers?.length ?? 0;
      this.visibleTransferSectorId = this.state.activeSectorId;
      this.visibleTransfers = transfers?.filter((transfer) => transfer.sectorId === this.state.activeSectorId) ?? [];
    }
    return this.visibleTransfers;
  };
  private publish() { this.state.revision++; this.listeners.forEach((listener) => listener()); }
  private checkpoint() { this.history.push(clone(this.state)); if (this.history.length > 50) this.history.shift(); }
  private event(type: GameEvent['type'], message: string, projectId?: string, elapsedMs = this.state.playTimeMs) {
    const event: GameEvent = { id: makeId('event'), type, message, at: Date.now(), ...(projectId ? { projectId, elapsedMs } : {}) };
    this.state.events.unshift(event);
    if (type === 'ResearchCompleted') (this.state.researchLog ??= []).unshift(clone(event));
    this.state.events = this.state.events.slice(0, 12);
  }

  private pruneLockedForestInputs() {
    if (this.state.research.completed.includes('treePlanter')) return;
    const removed = new Set<string>();
    Object.values(this.state.sectors).forEach((sector) => {
      const forests = new Set(sector.nodes.filter((node) => node.kind === 'forest').map((node) => node.id));
      sector.connections.forEach((connection) => { if (forests.has(connection.to)) removed.add(connection.id); });
      sector.connections = sector.connections.filter((connection) => !removed.has(connection.id));
      sector.nodes.filter((node) => forests.has(node.id)).forEach((forest) => { delete forest.input['forest-growth']; });
    });
    if (removed.size) this.state.inFlightTransfers = (this.state.inFlightTransfers ?? []).filter((transfer) => !removed.has(transfer.connectionId));
  }

  private recordProduced(item: ItemId, amount = 1, extracted = false) {
    const ledger = extracted ? this.state.extracted! : this.state.produced!;
    ledger[item] = (ledger[item] ?? 0) + amount;
  }

  private evaluateMilestones() { this.research.evaluateMilestones(); }

  startRealtimeClock() {
    this.realtimeTickAt = performance.now();
    this.realtimePendingMs = 0;
  }

  stopRealtimeClock() { this.realtimeTickAt = undefined; }

  private activeTimeSinceTick(now: number) {
    return this.realtimeTickAt === undefined || this.state.paused ? 0 : Math.max(0, now - this.realtimeTickAt);
  }

  private journalElapsedMs() {
    if (this.realtimeTickAt === undefined) return this.state.playTimeMs;
    return this.state.playTimeMs + Math.min(1000, this.realtimePendingMs + this.activeTimeSinceTick(performance.now()));
  }

  tickRealtime() {
    if (this.realtimeTickAt === undefined) return;
    const now = performance.now();
    if (this.state.paused) return;
    const deltaMs = this.realtimePendingMs + this.activeTimeSinceTick(now);
    this.realtimePendingMs = 0;
    // While the tick commits events, its elapsed time already includes this interval.
    this.realtimeTickAt = undefined;
    try {
      this.tick(deltaMs);
    } finally {
      this.realtimeTickAt = now;
    }
  }

  tick(deltaMs: number) {
    activateMod(this.state.mod);
    if (this.state.paused) return;
    const dt = Math.min(deltaMs, 1000);
    this.state.playTimeMs += dt;
    this.transferAccumulator += dt;
    this.publishAccumulator += dt;
    this.autosaveAccumulator += dt;
    this.deliverTransfers(this.state.playTimeMs);
    const sectors = Object.values(this.state.sectors).filter((s) => s.unlocked);
    const simulationLookups = new SimulationLookups(this.state);
    let clearedHole = false;
    for (const sector of sectors) clearedHole = this.simulateSector(sector, dt, simulationLookups) || clearedHole;
    this.evaluateMilestones();
    this.rescueAccumulator+=dt;
    if(this.rescueAccumulator>=1000&&!this.state.isTraining){this.rescueAccumulator%=1000;if(applyExpansionRescue(this.state))this.publish();}
    if (this.transferAccumulator >= modRule('cableLaunchMs')) {
      this.transferAccumulator %= modRule('cableLaunchMs');
      let launched = false;
      const routingLookups = new SimulationLookups(this.state);
      sectors.forEach((sector) => { launched = this.routeSector(sector, this.state.playTimeMs, routingLookups) || launched; });
      if (launched) this.publish();
    }
    if (clearedHole || this.publishAccumulator >= 750) { this.publishAccumulator %= 750; this.publish(); }
    if (this.options.autosave !== false && this.autosaveAccumulator >= this.state.preferences.autosaveMinutes * 60000) {
      this.autosaveAccumulator = 0;
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(this.state));
    }
  }

  private simulateSector(sector: SectorState, dt: number, lookups = new SimulationLookups(this.state)) {
    const baseDt = dt;
    updateCampEncroachment(sector.nodes);
    for (const supply of supplyDevInputs(this.state, sector, lookups, (target, item) => this.inputCapacity(target, item))) {
      (this.state.inFlightTransfers ??= []).push({ ...supply, id: makeId('dev-pulse'), sectorId: sector.id, launchedAtMs: this.state.playTimeMs, arrivesAtMs: this.state.playTimeMs + modRule('cableTravelMs'), cosmeticOnly: true });
    }
    const depleted: string[] = [];
    const filledHoles: MachineNode[] = [];
    const checkedCamps: MachineNode[] = [];
    for (const node of sector.nodes) {
      const dt = baseDt / (modNode(node.kind)?.cycleMultiplier ?? 1);
      if (node.disabled || Date.now() - node.constructedAt < node.constructionMs) continue;
      if (NODE_DEFINITIONS[node.kind].category === 'Logistics') node.processingPaused = false;
      if (node.processingPaused) continue;
      if(node.kind==='cornerChallenge'){simulateCorner(this.state,sector,node);continue;}
      if(node.kind==='cornerTribute')continue;
      if(node.kind==='recycler'){simulateRecycler(node,dt);continue;}
      if (node.kind === 'goblinTribute') {
        produceGoblinTribute(this.state, node, sector.nodes.find(camp => camp.id === node.tributeCampId && camp.kind === 'monster-camp'), dt);
        continue;
      }
      if (simulateProgressionNode(this.state,sector,node,dt,lookups,(target,item)=>this.canAcceptAtInputPort(target,0,item,sector,lookups))) continue;
      if (node.kind === 'monster-camp') {
        node.progressMs += dt;
        const credit = node.lizardSettlement ? node.suppressionCredit ?? 0 : 0;
        const retry = node.lizardSettlement && node.suppressionRetry && credit + attackPower(node) >= getGoblinAttackRequirement(node);
        if (retry || node.progressMs >= GOBLIN_CHECK_INTERVAL_MS) {
          node.progressMs %= GOBLIN_CHECK_INTERVAL_MS;
          if (retry) node.progressMs = 0;
          const attack = attackPower(node) + credit;
          const requirement = getGoblinAttackRequirement(node);
          node.suppressed = attack >= requirement;
          node.campLastCheck = { passed: node.suppressed, atMs: this.state.playTimeMs, suppliedAp: attack, requiredAp: requirement };
          checkedCamps.push(node);
          node.campStrength = attack >= requirement ? Math.max(10, (node.campStrength ?? 25) - 10) : Math.min(100, (node.campStrength ?? 25) + 10);
          if (node.lizardSettlement) {
            node.suppressionRetry = !node.suppressed;
            if (node.suppressed) {
              const paid = credit >= requirement ? 0 : consumeCampBots(node, requirement - credit);
              node.suppressionCredit = credit + paid - requirement;
            }
          } else consumeCampBots(node, requirement);
          updateCampEncroachment(sector.nodes);
          this.cancelTransfers(new Set(obstructedConnections(sector)));
        }
        continue;
      }
      if (node.kind === 'big-hole') {
        reconcileHole(node, this.state);
        const stone = node.input.stone ?? 0;
        const remaining = node.resourceRemaining ?? 0;
        if (stone > 0 && remaining > 0) {
          node.holeStoneConsumed = (node.holeStoneConsumed ?? 0) + 1;
          node.input.stone = stone - 1;
          node.resourceRemaining = Math.max(0, remaining - 1);
        }
        if (node.resourceRemaining === 0) filledHoles.push(node);
        continue;
      }
      if (hasNodeBehavior(node.kind,'road')) {
        if (node.kind === 'fluidRoad') continue;
        if (node.roadMode === 'export') {
          node.progressMs += dt;
          if (node.progressMs >= modRule('roadTransferMs')) {
            node.progressMs %= modRule('roadTransferMs');
            for (let shipment = 0; shipment < vehiclePayload(this.state.research.completed,endgameRank(this.state,'trainFreightCapacity')); shipment++) this.dispatchRoadItem(sector, node, lookups);
          }
        }
        continue;
      }
      if (node.kind === 'storage') continue;
      if (hasNodeBehavior(node.kind, 'buffer')) {
        node.inputQueue = reconcileQueue(node.inputQueue, node.input);
        // The buffer is storage, not a second timed transport hop.
        while (node.inputQueue.length && sum(node.output) < cartCapacity(node)) {
          const item = node.inputQueue.shift()!;
          node.input[item]!--; queueOutputs(node, { [item]: 1 });
        }
        continue;
      }
      if (node.kind === 'inventory') {
        node.transferProgressMs = (node.transferProgressMs ?? 0) + dt;
        if (node.transferProgressMs >= 4000) {
          node.transferProgressMs %= 4000;
          const filterIds = sector.connections.filter((connection) => connection.from === node.id).map((connection) => connection.to);
          for (const filter of sector.nodes.filter((candidate) => filterIds.includes(candidate.id) && candidate.kind === 'filter')) {
            const item = filter.filterItem;
            if (!item || sum(filter.input) >= 5) continue;
            const storage = sector.nodes.find((candidate) => candidate.kind === 'storage' && ((candidate.input[item] ?? 0) + (candidate.output[item] ?? 0)) > 0);
            if (!storage) continue;
            const bag = (storage.output[item] ?? 0) > 0 ? storage.output : storage.input;
            bag[item]!--;
            filter.input[item] = (filter.input[item] ?? 0) + 1;
          }
        }
        continue;
      }
      if (node.kind === 'miningDrill') {
        if ((node.input.motor ?? 0) > 0 && (node.miningProgress ?? 0) < 20) {
          node.progressMs += dt;
          if (node.progressMs >= 1000) {
            node.progressMs %= 1000;
            node.input.motor!--;
            node.miningProgress = (node.miningProgress ?? 0) + 1;
          }
        }
        if ((node.miningProgress ?? 0) >= 20) {
          const target = node.miningTarget ?? 'iron';
          node.kind = target === 'stone' ? 'stoneDeposit' : target;
          node.name = target === 'stone' ? 'Stone Deposit' : `${target[0].toUpperCase()}${target.slice(1)}`;
          node.resourceItem = target;
          node.resourceRemaining = 1000;
          node.resourceCapacity = 1000;
          node.input = {};
          node.output = {};
          node.cycleMs = 5000;
          node.progressMs = 0;
        }
        continue;
      }
      if (node.kind === 'splitter' || node.kind === 'merger' || node.kind === 'joint' || node.kind === 'powerSplitter' || node.kind === 'filter') continue;
      if (isResourceBehavior(node.kind)) {
        if (node.kind === 'forest') {
          const growth = node.input['forest-growth'] ?? 0;
          if (growth > 0) { const amount = Math.min(growth, Math.max(0, (node.resourceCapacity ?? 0) - (node.resourceRemaining ?? 0))); node.input['forest-growth'] = growth - amount; node.resourceRemaining = (node.resourceRemaining ?? 0) + amount; }
          if ((node.resourceRemaining ?? 0) >= (node.resourceCapacity ?? 0)) node.regenMs = 0;
          else {
            node.regenMs = (node.regenMs ?? 0) + dt;
            const period=modRule('forestRegenMs')/(1+endgameRank(this.state,'resourceRegeneration'));
            if (node.regenMs >= period) { const q=Math.floor(node.regenMs/period);node.regenMs %= period; node.resourceRemaining = Math.min(node.resourceCapacity ?? 0, (node.resourceRemaining ?? 0) + q); }
          }
        }
        // The original deposits are passive reserves. Extractors mine them directly;
        // only lakes create a freely routed resource on their own timer.
        if (node.kind !== 'lake') {
          node.progressMs = 0;
          if (!node.infiniteResource && (node.resourceRemaining ?? 1) <= 0 && node.kind !== 'forest' && !this.state.research.completed.includes('mineralRegeneration')) depleted.push(node.id);
          continue;
        }
        const item = node.resourceItem!;
        if (sum(node.output) >= (modNode(node.kind)?.capacity ?? node.capacity ?? 5)) continue;
        node.progressMs += dt;
        if (node.progressMs >= node.cycleMs) {
          node.progressMs %= node.cycleMs;
          node.output[item] = (node.output[item] ?? 0) + 1;
        }
        continue;
      }
      if (node.kind === 'extractor') {
        const { resourceEdge, resourceRoute } = this.resolveExtractorInput(sector, node, lookups);
        const source = resourceRoute?.source;
        const item = source?.resourceItem;
        this.reconcileExtractorStorage(node, item);
        if (!resourceEdge || !source || !item || (!source.infiniteResource && (source.resourceRemaining ?? 0) <= 0) || sum(node.output) >= 5) { node.progressMs = 0; continue; }
        node.progressMs += dt;
        const duration = node.cycleMs * this.efficiencyMultiplier('extractor');
        if (node.progressMs >= duration) {
          node.progressMs %= duration;
          if (!source.infiniteResource) source.resourceRemaining = Math.max(0, (source.resourceRemaining ?? 0) - 1);
          node.output[item] = (node.output[item] ?? 0) + 1;
          const route = [...resourceRoute!.connections, resourceEdge];
          route.forEach(cable => { cable.item = item; });
          (this.state.inFlightTransfers ??= []).push({ id: makeId('pulse'), sectorId: sector.id, connectionId: route[0].id, routeConnectionIds: route.length > 1 ? route.map(cable => cable.id) : undefined, from: source.id, to: node.id, item, launchedAtMs: this.state.playTimeMs, arrivesAtMs: this.state.playTimeMs + modRule('cableTravelMs'), cosmeticOnly: true });
          this.recordProduced(item, 1, true);
          this.event('ItemProduced', `${node.name} extracted 1 ${item}.`);
        }
        continue;
      }
      if (hasNodeBehavior(node.kind, 'research')) { this.research.simulateResearch(node, dt); continue; }
      if (hasNodeBehavior(node.kind, 'planter')) { simulatePlanter(this.state, node, dt); continue; }
      if(simulateExtendedRecipe(this.state,node,dt,this.efficiencyMultiplier(node.kind)))continue;
      const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
      if (!recipe) continue;
      const hasInputs = Object.entries(recipe.inputs).every(([item, count]) => (node.input[item as ItemId] ?? 0) >= (count ?? 0));
      const hasOutputRoom = sum(node.output) + sum(recipe.outputs) <= (modNode(node.kind)?.capacity ?? 5);
      if (!hasInputs || !hasOutputRoom) { node.progressMs = 0; continue; }
      node.progressMs += dt;
      const duration = recipe.cycleMs * this.efficiencyMultiplier(node.kind);
      if (node.progressMs >= duration) {
        node.progressMs %= duration;
        Object.entries(recipe.inputs).forEach(([item, count]) => { node.input[item as ItemId] = (node.input[item as ItemId] ?? 0) - (count ?? 0); });
        Object.entries(recipe.outputs).forEach(([item, count]) => { node.output[item as ItemId] = (node.output[item as ItemId] ?? 0) + (count ?? 0); });
        Object.entries(recipe.outputs).forEach(([item, count]) => this.recordProduced(item as ItemId, count ?? 0));
        this.event('ItemProduced', `${node.name} completed ${recipe.name}.`);
      }
    }
    depleted.forEach((id) => {
      if(this.state.research.completed.includes('mineralRegeneration'))return;
      const source = sector.nodes.find((node) => node.id === id);
      if (!source || sum(source.output) > 0) return;
      this.cancelTransfers(new Set(sector.connections.filter((connection) => connection.from === id || connection.to === id).map((connection) => connection.id)));
      source.kind = 'big-hole'; source.name = 'Deep Hole'; source.resourceItem = undefined; source.resourceRemaining = 250; source.holeBaseStone=250;source.holeStoneConsumed=0; source.resourceCapacity = undefined; source.obstructionRadius = 38 * Math.sqrt(10); source.input = {}; source.output = {}; source.progressMs = 0;
      sector.connections = sector.connections.filter((connection) => connection.from !== id && connection.to !== id);
      this.event('DepositDepleted', 'A depleted deposit collapsed into a Deep Hole.');
    });
    this.clearFilledHoles(sector, filledHoles);
    this.removeDefeatedGolemCables(sector);
    this.removeInactiveTribute(sector);
    for (const camp of checkedCamps) {
      if (!isCampFullySuppressed(camp) || sector.nodes.some(node => node.kind === 'goblinTribute' && node.tributeCampId === camp.id)) continue;
      const tribute = createGoblinTribute(camp, sector.nodes, getWorldFieldSize(this.state));
      if (tribute) { sector.nodes.push(tribute); this.event('NodePlaced', `${camp.name} is suppressed and now supplies configurable tribute.`); }
    }
    sector.lastSimulatedAt = Date.now();
    return filledHoles.length > 0;
  }

  private removeDefeatedGolemCables(sector: SectorState) {
    const reserves = new Set(sector.nodes.filter(node => node.infiniteResource && node.golemMineral).map(node => node.id));
    const removed = new Set(sector.connections.filter(connection => reserves.has(connection.to)).map(connection => connection.id));
    if (!removed.size) return;
    this.cancelTransfers(removed);
    sector.connections = sector.connections.filter(connection => !removed.has(connection.id));
  }

  private removeInactiveTribute(sector: SectorState) {
    const expired = new Set(sector.nodes.filter(node => node.kind === 'goblinTribute' &&
      !sector.nodes.some(camp => camp.kind === 'monster-camp' && camp.id === node.tributeCampId && (camp.lizardSettlement || isCampFullySuppressed(camp)))).map(node => node.id));
    if (!expired.size) return;
    this.cancelTransfers(new Set(sector.connections.filter(c => expired.has(c.from) || expired.has(c.to)).map(c => c.id)));
    sector.nodes = sector.nodes.filter(node => !expired.has(node.id));
    sector.connections = sector.connections.filter(c => !expired.has(c.from) && !expired.has(c.to));
  }

  private resolveExtractorInput(sector: SectorState, node: MachineNode, lookups: SimulationLookups) {
    const resourceEdge = lookups.sector(sector).incoming.get(node.id)?.find(connection => (connection.toPort ?? 0) === 0);
    const resourceRoute = resourceEdge ? this.resolveResourceRoute(sector, resourceEdge, lookups, node) : undefined;
    return { resourceEdge, resourceRoute };
  }

  private reconcileExtractorStorage(node: MachineNode, item: ItemId | undefined) {
    if (!item) return;
    for (const storedItem of Object.keys(node.output) as ItemId[]) {
      if (storedItem === item) continue;
      if ((node.output[storedItem] ?? 0) > 0) node.progressMs = 0;
      delete node.output[storedItem];
    }
  }

  /** Upstream rewiring can change an Extractor's material even while paused. */
  private reconcileSectorExtractorStorage(sector: SectorState) {
    const lookups = new SimulationLookups(this.state);
    for (const node of sector.nodes) {
      if (node.kind !== 'extractor') continue;
      const { resourceRoute } = this.resolveExtractorInput(sector, node, lookups);
      this.reconcileExtractorStorage(node, resourceRoute?.source.resourceItem);
    }
  }

  private resolveResourceRoute(sector: SectorState, edge: Connection, lookups: SimulationLookups, extractor: MachineNode, visited = new Set<string>(), accepts = (_item: ItemId) => true): { source: MachineNode; connections: Connection[] } | undefined {
    if (visited.has(edge.from)) return undefined;
    const index = lookups.sector(sector);
    const node = index.nodes.get(edge.from);
    if (!node || node.disabled) return;
    if (node.kind === 'devSource') {
      const resourceItem = devExtractorMaterial(extractor, sector, this.state);
      if (accepts(resourceItem)) return { source: { ...node, resourceItem, infiniteResource: true }, connections: [] };
      return;
    }
    if (node.resourceItem && node.kind !== 'lake') return accepts(node.resourceItem) ? { source: node, connections: [] } : undefined;
    if (!getNodeCapabilities(node.kind).passThrough) return;
    const path = new Set(visited).add(node.id);
    const throughOutlet = node.kind === 'filter' ? (item: ItemId) => accepts(item) && (edge.fromPort ?? 0) === filterOutlet(node, item) : accepts;
    for (const incoming of index.incoming.get(node.id) ?? []) {
      const route = this.resolveResourceRoute(sector, incoming, lookups, extractor, path, throughOutlet);
      if (route && (route.source.infiniteResource || (route.source.resourceRemaining ?? 0) > 0)) return { source: route.source, connections: [...route.connections, incoming] };
    }
    return undefined;
  }

  private efficiencyMultiplier(kind: NodeKind) {
    const prefix = getNodeCapabilities(kind).efficiencyFamily;
    return getEfficiencyMultiplier(prefix, this.state.research.completed);
  }

  /** Commit one item only when both local wiring and the remote destination are ready. */
  private dispatchRoadItem(sector: SectorState, road: MachineNode, lookups: SimulationLookups) {
    const remote = road.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
    const pair = remote && road.pairedRoadId ? lookups.sector(remote).nodes.get(road.pairedRoadId) : undefined;
    if (!remote?.unlocked || pair?.kind !== 'road' || pair.roadMode !== 'import' || pair.disabled
      || Date.now() - pair.constructedAt < pair.constructionMs
      || (pair.pairedRoadId && pair.pairedRoadId !== road.id) || (pair.pairedSectorId && pair.pairedSectorId !== sector.id)) return;
    const material = roadMaterialState(this.state, sector, road);
    if (material.mixed || material.fluid) return;
    const localIndex = lookups.sector(sector), remoteIndex = lookups.sector(remote);
    const exits = remoteIndex.outgoing.get(pair.id) ?? [];
    if (!exits.length) return;
    for (const feed of localIndex.incoming.get(road.id) ?? []) {
      const source = localIndex.nodes.get(feed.from);
      if (!source || roadVehicleError(source, road) || source.disabled || Date.now() - source.constructedAt < source.constructionMs) continue;
      const family = getEffectiveNodeOutputFamilies(source)[feed.fromPort ?? 0];
      if (!family) continue;
      const bags = [source.input, source.output];
      const items = [...new Set(bags.flatMap(bag => (Object.keys(bag) as ItemId[]).filter(item => (bag[item] ?? 0) >= 1)))];
      for (const item of items) {
        if (outputHead(source) && outputHead(source) !== item) continue;
        if (isRoadFluid(item) || (material.materials.length && material.materials[0] !== cargoMaterial(item))) continue;
        if (!portFamilyAcceptsItem(family, item) || !inputPortAcceptsItem(road, feed.toPort ?? 0, item, this.state.research.completed)) continue;
        for (const exit of exits) {
          const delivery = this.resolveDeliveryRoute(exit, item, remote, lookups);
          if (!delivery) continue;
          if ((source.input[item] ?? 0) >= 1) source.input[item]!--;
          else takeOutput(source, item);
          delivery.target.input[item] = (delivery.target.input[item] ?? 0) + 1;
          feed.item = item;
          exit.item = item;
          // Visual cable motion carries no inventory or capacity reservation.
          for (const [owner, cable] of [[sector, feed], [remote, exit]] as const) {
            (this.state.inFlightTransfers ??= []).push({ id: makeId('road-pulse'), sectorId: owner.id, connectionId: cable.id,
              from: cable.from, to: cable.to, item, launchedAtMs: this.state.playTimeMs, arrivesAtMs: this.state.playTimeMs + modRule('cableTravelMs'), cosmeticOnly: true });
          }
          return;
        }
      }
    }
  }

  private inputCapacity(node: MachineNode, item: ItemId) {
    if (isCartKind(node.kind)) return Math.max(0, Math.min(modNode(node.kind)?.inputCapacity ?? Infinity, cartCapacity(node) - sum(node.output)));
    if(node.kind==='cornerChallenge')return node.cornerType==='foundry'?(FOUNDRY_INPUTS[item]??0):100;
    if (node.kind === 'road') return 0;
    if (modNode(node.kind)?.inputCapacity !== undefined) return modNode(node.kind)!.inputCapacity!;
    if (node.kind === 'forest' && this.state.research.completed.includes('planterThroughput')) return 20;
    if (node.kind === 'monster-camp') return Math.max(5, getGoblinAttackRequirement(node));
    return getNodeCapabilities(node.kind).inputCapacity ?? 5;
  }

  /** Original processors reserve a full ingredient buffer for every recipe input. */
  private inputUsesPerItemCapacity(node: MachineNode) {
    return Boolean((node.kind==='cornerChallenge'&&node.cornerType==='foundry') || getNodeCapabilities(node.kind).perItemInputCapacity || (node.recipeId && RECIPES[node.recipeId]));
  }

  private inputOccupancy(node: MachineNode, item: ItemId) {
    return this.inputUsesPerItemCapacity(node) ? (node.input[item] ?? 0) : sum(node.input);
  }

  private mergerItem(node: MachineNode, sector: SectorState, lookups: SimulationLookups) {
    const stored = (Object.keys({ ...node.input, ...node.output }) as ItemId[]).find((item) =>
      (node.input[item] ?? 0) + (node.output[item] ?? 0) > 0
    );
    if (stored) return stored;
    const pending = lookups.target(sector.id, node.id)?.transfers[0]?.item;
    if (pending) return pending;
    return lookups.sector(sector).incoming.get(node.id)?.find((connection) => connection.item)?.item;
  }

  private canAcceptAtInputPort(node: MachineNode, port: number, item: ItemId, sector: SectorState, lookups: SimulationLookups, ignoredTransferId?: string, routingPath = new Set<string>()) {
    if(node.kind==='recycler'&&!recyclerAccepts(item))return false;
    if(node.kind==='cornerChallenge'&&!cornerInputAllowed(sector,node))return false;
    if (!inputPortAcceptsItem(node, port, item, this.state.research.completed)) return false;
    if (!roadInputAccepts(this.state, sector, node, item)) return false;
    if (node.kind === 'filter') {
      if (routingPath.has(node.id)) return false;
      return !this.filterBlockage(node, sector, lookups, new Set(routingPath).add(node.id), item);
    }
    if (modNodeTemplate(node.kind) === 'splitter') {
      if (routingPath.has(node.id)) return false;
      const path = new Set(routingPath).add(node.id);
      const index = lookups.sector(sector);
      const incoming = lookups.target(sector.id, node.id);
      const delivering = incoming?.transfers.some(t => t.id === ignoredTransferId && t.item === item) ? 1 : 0;
      const queued = (node.input[item] ?? 0) + (node.output[item] ?? 0) + (incoming?.counts[item] ?? 0) - delivering;
      let space = 0;
      const seen = new Set<string>();
      for (const cable of index.outgoing.get(node.id) ?? []) {
        const target = index.nodes.get(cable.to);
        if (!target || target.disabled || seen.has(target.id) || !this.canAcceptAtInputPort(target, cable.toPort ?? 0, item, sector, lookups, ignoredTransferId, path)) continue;
        seen.add(target.id);
        const pending = lookups.target(sector.id, target.id);
        space += Math.max(0, this.inputCapacity(target, item) - this.inputOccupancy(target, item) - (this.inputUsesPerItemCapacity(target) ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((n, t) => n + (t.amount ?? 1), 0) ?? 0));
      }
      return space > queued;
    }
    if (modNodeTemplate(node.kind) === 'merger') {
      const retained = this.mergerItem(node, sector, lookups);
      return !retained || cargoMaterial(retained) === cargoMaterial(item);
    }
    return this.accepts(node, item);
  }

  /** Classify immediately; any required blocked outlet stops this whole Filter. */
  private filterBlockage(node: MachineNode, sector: SectorState, lookups: SimulationLookups, path = new Set([node.id]), candidate?: ItemId): MachineNode['filterBlocked'] {
    const index = lookups.sector(sector);
    const waiting = new Set<ItemId>(candidate ? [candidate] : []);
    for (const bag of [node.input, node.output]) for (const item of Object.keys(bag) as ItemId[]) if ((bag[item] ?? 0) > 0) waiting.add(item);
    const collect = (id: string, seen: Set<string>, accepts: (item: ItemId) => boolean = () => true) => {
      if (seen.has(id)) return;
      const next = new Set(seen).add(id);
      for (const edge of index.incoming.get(id) ?? []) {
        const source = index.nodes.get(edge.from);
        if (!source) continue;
        const family = getEffectiveNodeOutputFamilies(source)[edge.fromPort ?? 0];
        const throughThisOutlet = (item: ItemId): boolean => accepts(item) && Boolean(family && portFamilyAcceptsItem(family, item)) && (source.kind !== 'filter' || (edge.fromPort ?? 0) === filterOutlet(source, item));
        for (const item of Object.keys(source.output) as ItemId[]) if ((source.output[item] ?? 0) > 0 && throughThisOutlet(item)) waiting.add(item);
        if (getNodeCapabilities(source.kind).passThrough) collect(source.id, next, throughThisOutlet);
      }
    };
    collect(node.id, new Set());
    for (const item of waiting) {
      const outlet = filterOutlet(node, item);
      const ready = (index.outgoing.get(node.id) ?? []).filter(edge => (edge.fromPort ?? 0) === outlet).some(edge => logisticsRoute(edge, item, sector, this.state.research.completed, (target, port) => {
        if (!this.canAcceptAtInputPort(target, port, item, sector, lookups, undefined, path)) return false;
        const pending = lookups.target(sector.id, target.id);
        const reserved = this.inputUsesPerItemCapacity(target) ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((sum, t) => sum + (t.amount ?? 1), 0) ?? 0;
        return this.inputOccupancy(target, item) + reserved < this.inputCapacity(target, item);
      }, index));
      if (!ready) return outlet === selectedFilterPort(node) ? 'selected' : 'remainder';
    }
    return undefined;
  }

  private deliverTransfers(nowMs: number, sectorId?: string) {
    const lookups = new SimulationLookups(this.state);
    const pending = this.state.inFlightTransfers ??= [];
    const remaining = [] as typeof pending;
    const refunds: Array<{ source: MachineNode; item: ItemId; amount: number }> = [];
    for (const transfer of pending) {
      if ((sectorId && transfer.sectorId !== sectorId) || transfer.arrivesAtMs > nowMs) { remaining.push(transfer); continue; }
      if (transfer.cosmeticOnly) continue;
      const sector = this.state.sectors[transfer.sectorId];
      const index = sector ? lookups.sector(sector) : undefined;
      const target = index?.nodes.get(transfer.to);
      const source = index?.nodes.get(transfer.from);
      const routeIds = transfer.routeConnectionIds ?? [transfer.connectionId];
      const routeValid = routeIds.every((id, position) => {
        const cable = index?.connections.get(id);
        const previous = position ? index?.connections.get(routeIds[position - 1]) : undefined;
        const routeNode = cable && index?.nodes.get(cable.from);
        return Boolean(cable && routeNode && !routeNode.disabled && (!position || previous?.to === cable.from) &&
          (routeNode.kind !== 'filter' || (cable.fromPort ?? 0) === filterOutlet(routeNode, transfer.item)));
      });
      const connection = routeValid ? index?.connections.get(routeIds.at(-1)!) : undefined;
      const occupied = target ? this.inputOccupancy(target, transfer.item) : 0;
      const validSocket = Boolean(target && connection && sector && this.canAcceptAtInputPort(target, connection.toPort ?? 0, transfer.item, sector, lookups, transfer.id));
      if (target && connection && validSocket && occupied + (transfer.amount ?? 1) <= this.inputCapacity(target, transfer.item)) {
        target.input[transfer.item] = (target.input[transfer.item] ?? 0) + (transfer.amount ?? 1);
        if (getNodeCapabilities(target.kind).behavior === 'buffer') (target.inputQueue ??= []).push(...Array<ItemId>(transfer.amount ?? 1).fill(transfer.item));
      } else if (source) {
        refunds.push({ source, item: transfer.item, amount: transfer.amount ?? 1 });
      }
    }
    // Prepending in reverse restores the original dispatch order ahead of newer stock.
    for (const { source, item, amount } of refunds.reverse()) returnOutput(source, item, amount);
    this.state.inFlightTransfers = remaining;
  }

  private migrateBotAssembly() {
    if (this.state.botAssemblyVersion) return;
    const updatedBotRecipes = new Set<string>(MATCHED_BOTS.slice(1));
    const legacyCores: Record<string, ItemId> = {
      'medium-suppression-bot': 'basic-core', 'heavy-suppression-bot': 'hydro-core', 'command-suppression-bot': 'command-core',
    };
    const recovered = this.state.globalPool ??= {};
    const disconnect = new Set<string>();
    for (const sector of Object.values(this.state.sectors)) {
      const nodes = new Map(sector.nodes.map(node => [node.id, node]));
      for (const node of sector.nodes) {
        if (node.recipeId === 'robot-gun' && !node.batch && node.progressMs > 0 &&
            (node.input['copper-wire'] ?? 0) >= 1 && (node.input['iron-plate'] ?? 0) >= 2) {
          node.input['copper-wire']!--;
          node.input['iron-plate']! -= 2;
          node.batch = { recipeId: node.recipeId, outputs: { 'simple-robot-gun': 1 } };
        }
        if (!node.recipeId || !updatedBotRecipes.has(node.recipeId)) continue;
        const inputs = Object.keys(RECIPES[node.recipeId].inputs) as ItemId[];
        const oldInputs: ItemId[] = node.recipeId === 'final-suppression-bot'
          ? ['command-suppression-bot', 'command-core', 'servo-frame']
          : [...inputs, legacyCores[node.recipeId]];
        const incoming = sector.connections.filter(connection => connection.to === node.id);
        for (const connection of incoming) {
          const port = connection.toPort ?? 0;
          if (inputs[port] !== oldInputs[port]) disconnect.add(connection.id);
        }
        for (const item of oldInputs.filter(item => !inputs.includes(item))) {
          const amount = node.input[item] ?? 0;
          if (amount <= 0) continue;
          const connection = incoming.find(edge => (edge.toPort ?? 0) === oldInputs.indexOf(item) && (!edge.item || edge.item === item));
          const source = connection && nodes.get(connection.from);
          if (source && (getNodeCapabilities(source.kind).behavior === 'buffer' ||
              (source.recipeId && RECIPES[source.recipeId]?.outputs[item]))) returnOutput(source, item, amount);
          else recovered[item] = (recovered[item] ?? 0) + amount;
          delete node.input[item];
        }
        if (node.recipeId === 'final-suppression-bot') delete node.inputPortOrder;
        else if (node.inputPortOrder) node.inputPortOrder = node.inputPortOrder.filter(port => port < inputs.length);
      }
    }
    this.cancelTransfers(disconnect);
    for (const sector of Object.values(this.state.sectors)) sector.connections = sector.connections.filter(edge => !disconnect.has(edge.id));
    for (const template of this.state.factoryTemplates ?? []) {
      const finalIds = new Set(template.nodes.filter(node => node.recipeId === 'final-suppression-bot').map(node => node.id));
      const updatedIds = new Set(template.nodes.filter(node => node.recipeId && updatedBotRecipes.has(node.recipeId)).map(node => node.id));
      template.connections = template.connections.filter(edge => !finalIds.has(edge.to) && (!updatedIds.has(edge.to) || (edge.toPort ?? 0) < 2));
    }
    this.state.botAssemblyVersion = 1;
  }

  private cancelTransfers(connectionIds: Set<string>) {
    const retained = [] as NonNullable<GameState['inFlightTransfers']>;
    for (const transfer of [...this.state.inFlightTransfers ?? []].reverse()) {
      if (!(transfer.routeConnectionIds ?? [transfer.connectionId]).some(id => connectionIds.has(id))) { retained.push(transfer); continue; }
      if (transfer.cosmeticOnly) continue;
      const source = this.state.sectors[transfer.sectorId]?.nodes.find((node) => node.id === transfer.from);
      if (source) returnOutput(source, transfer.item, transfer.amount ?? 1);
    }
    this.state.inFlightTransfers = retained.reverse();
  }

  private resolveDeliveryRoute(connection: Connection, item: ItemId, sector: SectorState, lookups: SimulationLookups) {
    return logisticsRoute(connection, item, sector, this.state.research.completed, (destination, port) => {
      if (!this.canAcceptAtInputPort(destination, port, item, sector, lookups)) return false;
      const pending = lookups.target(sector.id, destination.id);
      const reserved = this.inputUsesPerItemCapacity(destination) ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((n, t) => n + (t.amount ?? 1), 0) ?? 0;
      return this.inputOccupancy(destination, item) + reserved < this.inputCapacity(destination, item);
    }, lookups.sector(sector));
  }

  private routeSector(sector: SectorState, nowMs = this.state.playTimeMs, lookups = new SimulationLookups(this.state)) {
    let launched = false;
    const index = lookups.sector(sector);
    for (const node of sector.nodes) if (node.kind === 'filter') node.filterBlocked = this.filterBlockage(node, sector, lookups);
    for (const connection of sector.connections) {
      if (!index.connections.has(connection.id)) continue;
      const source = index.nodes.get(connection.from);
      let target = index.nodes.get(connection.to);
      if (!source || !target || source.disabled || target.disabled) continue;
      if (source.kind === 'filter' && this.filterBlockage(source, sector, lookups)) continue;
      if (source.kind === 'devSource') continue; // Inputs are supplied directly before simulation.
      if (source.kind === 'lake' && target.kind === 'fluidLink') continue;
      if (hasNodeBehavior(target.kind, 'road') && hasNodeBehavior(source.kind, 'buffer')) continue;
      const sourceCapabilities = getNodeCapabilities(source.kind);
      if (isResourceBehavior(source.kind) && !sourceCapabilities.routesOwnOutput) continue;
      if (sourceCapabilities.alternatingOutputs) {
        const outputs = index.outgoing.get(source.id)!;
        // Prefer the next outlet, but do not stall every branch behind a full
        // or incompatible destination. Reservations include this routing pass.
        const chosen = Array.from({ length: outputs.length }, (_, offset) => outputs[((source.alternator ?? 0) + offset) % outputs.length]).find((candidate) => {
          const destination = index.nodes.get(candidate.to);
          if (!destination || destination.disabled || !portFamiliesCompatible(source, candidate.fromPort ?? 0, destination, candidate.toPort ?? 0, this.state.research.completed)) return false;
          return (Object.keys(source.output) as ItemId[]).some((item) => {
            if ((source.output[item] ?? 0) <= 0 || !this.resolveDeliveryRoute(candidate, item, sector, lookups) || !portFamilyAcceptsItem(getEffectiveNodeOutputFamilies(source)[candidate.fromPort ?? 0] ?? 'ANY', item) || !this.canAcceptAtInputPort(destination, candidate.toPort ?? 0, item, sector, lookups)) return false;
            const pending = lookups.target(sector.id, destination.id);
            const reserved = this.inputUsesPerItemCapacity(destination) ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((n, t) => n + (t.amount ?? 1), 0) ?? 0;
            return this.inputOccupancy(destination, item) + reserved < this.inputCapacity(destination, item);
          });
        });
        if (chosen?.id !== connection.id) continue;
      }
      const resolveRoute = (key: ItemId) => this.resolveDeliveryRoute(connection, key, sector, lookups);
      const head = outputHead(source);
      const item = (head ? [head] : Object.keys(source.output) as ItemId[]).find((key) =>
        (source.output[key] ?? 0) > 0 && Boolean(resolveRoute(key)) && portFamilyAcceptsItem(getEffectiveNodeOutputFamilies(source)[connection.fromPort??0]??'ANY',key) && this.canAcceptAtInputPort(target!, connection.toPort ?? 0, key, sector, lookups)
      );
      if (!item) continue;
      if (!portFamiliesCompatible(source,connection.fromPort??0,target,connection.toPort??0,this.state.research.completed) || !getEffectiveNodeOutputFamilies(source)[connection.fromPort??0] || !inputPortAcceptsItem(target,connection.toPort??0,item,this.state.research.completed))continue;
      const sourceFamily=getEffectiveNodeOutputFamilies(source)[connection.fromPort??0];
      if(sourceFamily==='WASTE'&&!WASTE_ITEMS.includes(item))continue;
      if(sourceFamily!=='ANY'&&sourceFamily!=='WASTE'&&!nonItemFamilies.has(sourceFamily!)&&sourceFamily!==item)continue;
      const route = resolveRoute(item);
      if (!route) continue;
      target = route.target;
      const cap = this.inputCapacity(target, item);
      const perItemCapacity = this.inputUsesPerItemCapacity(target);
      const pending = lookups.target(sector.id, target.id);
      const pendingForTarget = perItemCapacity ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((n, t) => n + (t.amount ?? 1), 0) ?? 0;
      const occupied = this.inputOccupancy(target, item);
      if (occupied + pendingForTarget >= cap) continue;
      const fastRate=source.kind==='goblinTribute'?10:(item==='water'||(item==='coolant'&&[source.kind,target.kind].includes('fluidLink')))&&(source.kind!=='lake')?16:(WASTE_ITEMS.includes(item)&&[source.kind,target.kind].includes('wasteHopper'))?40:item==='power'&&[source.kind,target.kind].includes('powerConduit')?25:0;
      if (fastRate) {
        connection.batchCredit = Math.min(fastRate, (connection.batchCredit ?? 0) + fastRate * .4);
        const nextItemIndex = source.outputQueue?.findIndex(key => key !== item) ?? -1;
        const queuedAmount = nextItemIndex >= 0 ? nextItemIndex : source.outputQueue?.length ?? Infinity;
        const amount = Math.min(Math.floor(connection.batchCredit), source.output[item] ?? 0, queuedAmount, cap - occupied - pendingForTarget);
        if (amount > 0) {
          takeOutput(source, item, amount);
          target.input[item] = (target.input[item] ?? 0) + amount;
          if (getNodeCapabilities(target.kind).behavior === 'buffer') (target.inputQueue ??= []).push(...Array<ItemId>(amount).fill(item));
          connection.batchCredit -= amount;
          connection.item = item;
          launched = true;
          if (sourceCapabilities.alternatingOutputs) source.alternator = index.outgoing.get(source.id)!.findIndex(candidate => candidate.id === connection.id) + 1;
        }
        continue;
      }
      const payload = item === 'forest-growth' && this.state.research.completed.includes('planterThroughput') ? 10 : isCartKind(source.kind) || isCartKind(target.kind) ? vehiclePayload(this.state.research.completed) : 1;
      const runLength = source.outputQueue ? source.outputQueue.findIndex(key => key !== item) : -1;
      const amount = Math.min(payload, source.output[item] ?? 0, cap - occupied - pendingForTarget, source.outputQueue ? runLength < 0 ? source.outputQueue.length : runLength : Infinity);
      if (amount <= 0) continue;
      takeOutput(source, item, amount);
      route.connections.forEach(cable => { cable.item = item; });
      route.routers.forEach(({ node, outputIndex }) => { if (getNodeCapabilities(node.kind).alternatingOutputs) node.alternator = outputIndex + 1; });
      const transfer = { id: makeId('transfer'), sectorId: sector.id, connectionId: connection.id, routeConnectionIds: route.connections.length > 1 ? route.connections.map(cable => cable.id) : undefined, from: source.id, to: target.id, item, amount, launchedAtMs: nowMs, arrivesAtMs: nowMs + modRule('cableTravelMs') };
      (this.state.inFlightTransfers ??= []).push(transfer);
      lookups.launched(transfer);
      launched = true;
      if (sourceCapabilities.alternatingOutputs) source.alternator = index.outgoing.get(source.id)!.findIndex(candidate => candidate.id === connection.id) + 1;
      this.event('TransferStarted', `${ITEM_NAMES[item] ?? item} routed to ${target.name}.`);
    }
    for (const node of sector.nodes) {
      if (node.disabled || node.processingPaused || !getNodeCapabilities(node.kind).passThrough) continue;
      const inputs = (Object.keys(node.input) as ItemId[]).filter((key) => (node.input[key] ?? 0) > 0);
      const canRoute = (item: ItemId) => (index.outgoing.get(node.id) ?? []).some(cable => {
        const target = index.nodes.get(cable.to);
        if (!target || target.disabled || !this.canAcceptAtInputPort(target, cable.toPort ?? 0, item, sector, lookups)) return false;
        const pending = lookups.target(sector.id, target.id);
        return this.inputOccupancy(target, item) + (this.inputUsesPerItemCapacity(target) ? pending?.counts[item] ?? 0 : pending?.transfers.reduce((n, t) => n + (t.amount ?? 1), 0) ?? 0) < this.inputCapacity(target, item);
      });
      const preferred = modNodeTemplate(node.kind) === 'splitter' ? inputs.find(canRoute) : undefined;
      const item = preferred ?? inputs[0];
      if (preferred && sum(node.output) >= (modNode(node.kind)?.capacity ?? node.capacity ?? 5)) {
        const blocked = (Object.keys(node.output) as ItemId[]).find(key => (node.output[key] ?? 0) > 0 && !canRoute(key));
        if (blocked) {
          // Exchange buffered items atomically; neither bag exceeds capacity.
          node.input[preferred]!--; node.output[blocked]!--;
          node.input[blocked] = (node.input[blocked] ?? 0) + 1;
          node.output[preferred] = (node.output[preferred] ?? 0) + 1;
          continue;
        }
      }
      if (item && sum(node.output) < (modNode(node.kind)?.capacity ?? node.capacity ?? 5)) { const q=['fluidLink','powerConduit'].includes(node.kind)?Math.min(node.input[item]??0,(modNode(node.kind)?.capacity ?? node.capacity ?? 64)-sum(node.output)):1;node.input[item]!-=q; node.output[item] = (node.output[item] ?? 0) + q; }
    }
    return launched;
  }

  private accepts(node: MachineNode, item: ItemId) {
    if (needsRecipeSelection(node)) return false;

    if (hasNodeBehavior(node.kind, 'big-hole')) return item === 'stone' && (node.resourceRemaining ?? 0) > 0;
    if (node.kind === 'forest') return item === 'forest-growth' && this.state.research.completed.includes('treePlanter');
    const inputs = getEffectiveNodeInputFamilies(node, this.state.research.completed);
    if (inputs.some((_family, port) => inputPortAcceptsItem(node, port, item, this.state.research.completed))) return true;
    const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
    return recipe ? item in recipe.inputs : false;
  }

  private planNodePlacement(kind: NodeKind, x: number, y: number, preview = false) {
    const def = NODE_DEFINITIONS[kind];
    if (kind === 'fluidRoad' || DEFERRED_POWER_NODES.has(kind)) return;
    if (!def || (def.hidden && !def.legacyAlias && kind !== 'devSource')) return;
    if (modNode(kind)?.template && !isNodeUnlocked(kind, this.state.research.unlocked) && !preview) return;
    const lockedStorage = (def.category === 'Storage' || isCartKind(kind)) && !isNodeUnlocked(kind, this.state.research.unlocked);
    const lockedBotPlant = kind === 'botPlant' && !isNodeUnlocked(kind, this.state.research.unlocked);
    if ((lockedStorage || lockedBotPlant) && !preview) return;
    const capabilities = getNodeCapabilities(kind);
    if(capabilities.globallyUnique&&this.state.activeSectorId!=='5,5')return;
    if((kind==='storage'||kind==='inventory')&&Object.values(this.state.sectors).flatMap(s=>s.nodes).filter(n=>n.kind===kind).length>=placementLimit(this.state,kind))return;
    const uniqueNodeBlocked = capabilities.globallyUnique && Object.values(this.state.sectors).some((sector) => sector.nodes.some((node) => getNodeCapabilities(node.kind).globallyUnique));
    if (uniqueNodeBlocked && !preview) return;
    const roadPair = capabilities.pairedSectorPlacement ? this.findRoadPair(x, y) : undefined;
    const faceRoads = (sector: SectorState, neighbor: string) => sector.nodes.filter(n => hasNodeBehavior(n.kind, 'road') && n.pairedSectorId === neighbor).length;
    const channelsFull = Boolean(roadPair && (faceRoads(this.getSector(), roadPair.sector.id) >= roadChannels(this.state) || faceRoads(roadPair.sector, this.getSector().id) >= roadChannels(this.state)));
    if (capabilities.pairedSectorPlacement && !roadPair && !preview) return;
    // The original configurable machines are inert until the player chooses a recipe.
    const configuredRecipes = modNode(kind)?.recipeIds;
    const defaultRecipe = capabilities.defaultRecipeId;
    const recipeId = defaultRecipe && (!configuredRecipes || configuredRecipes.includes(defaultRecipe)) ? defaultRecipe : undefined;
    const node: MachineNode = {
      id: preview ? '__placement-preview__' : makeId(kind), kind, name: def.name, x, y, rotation: 0, recipeId, input: {}, output: {}, progressMs: 0,
      cycleMs: recipeId ? RECIPES[recipeId].cycleMs : capabilities.behavior === 'research' ? RESEARCH_CENTER_BASE_CYCLE_MS : kind === 'recycler' ? 2000 : kind === 'extractor' ? 5000 : capabilities.behavior === 'recipe' ? 0 : 1000, constructedAt: Date.now(), constructionMs: kind === 'devSource' ? 0 : 1500,
      capacity: BASE_MOD_CONTENT.capabilities[modNodeTemplate(kind)].defaultCapacity,
      ...(modNode(kind)?.name ? { modBaseName: BASE_MOD_CONTENT.nodes[modNodeTemplate(kind)].name } : {}),
      ...(capabilities.defaultFilterItem ? { filterItem: capabilities.defaultFilterItem } : {}),
      ...(capabilities.defaultMiningTarget ? { miningTarget: capabilities.defaultMiningTarget, miningProgress: 0 } : {}),
    };
    if (isCartKind(kind)) Object.assign(node, cartUpgrade(this.state.research.completed,endgameRank(this.state,'trainFreightCapacity')));
    node.constructionMs = modNode(kind)?.constructionMs ?? node.constructionMs * modRule('constructionMultiplier');
    if (modNode(kind)?.name) node.name = modNode(kind)!.name!;
    let pairedNode: MachineNode | undefined;
    if (roadPair) {
      Object.assign(node, roadPair.local, { roadMode: 'export', pairedSectorId: roadPair.sector.id });
      const pair: MachineNode = { ...clone(node), ...roadPair.remote, id: preview ? '__placement-preview-pair__' : makeId('road'), roadMode: 'import', pairedSectorId: this.getSector().id, input: {}, output: {}, progressMs: 0 };
      node.pairedRoadId = pair.id; pair.pairedRoadId = node.id; pairedNode = pair;
    }
    const field = getWorldFieldSize(this.state);
    const localClear = canPlaceNode(node, this.getSector().nodes, field);
    const pairClear = !(pairedNode && roadPair && !canPlaceNode(pairedNode, roadPair.sector.nodes, field));
    const error = lockedBotPlant ? 'Complete Suppression Bot research to build a Bot Plant.'
      : lockedStorage ? ['woodenChest', 'chest'].includes(kind) ? 'Complete Road research to build a Cart.' : 'Research this storage node before building it.' : uniqueNodeBlocked ? 'This unique node already exists.'
      : capabilities.pairedSectorPlacement && !roadPair ? 'Unlock an adjacent map before placing a road to it.'
      : channelsFull ? `This boundary allows ${roadChannels(this.state)} Roads per map face, counting sending and receiving endpoints together. Use another face or remove a Road${roadChannels(this.state) < 3 ? ', or research Road Channels' : ''}.`
      : !localClear ? `The endpoint on map ${this.getSector().id} needs clearance from the field boundary, other nodes and obstructions. Choose another position.`
      : !pairClear ? `The paired endpoint on adjacent map ${roadPair!.sector.id} is blocked. Move this road along the boundary, or clear room on that map.` : undefined;
    return { node, pairedNode, roadPair, valid: !error, error };
  }

  /** Returns the held node, placement validity, and the destination for a Road near its wall. */
  getNodePlacementPreview(kind: NodeKind, x: number, y: number) {
    const plan = this.planNodePlacement(kind, x, y, true);
    if (!plan) return;
    const { node, pairedNode, roadPair, valid } = plan;
    const road: RoadPlacementTarget | undefined = roadPair && pairedNode && Math.abs(roadPair.score) <= getNodeSize(node).w
      ? { sector: roadPair.sector, endpoint: pairedNode, localFacing: roadPair.side }
      : undefined;
    return { node, valid, road };
  }

  getNodePlacementError(kind: NodeKind, x: number, y: number) {
    return this.planNodePlacement(kind, x, y, true)?.error ?? 'Choose an unlocked node and a clear location on this map.';
  }

  placeNode(kind: NodeKind, x: number, y: number) {
    const def = NODE_DEFINITIONS[kind]; const plan = this.planNodePlacement(kind, x, y);
    if (!def || !plan?.valid) return;
    this.checkpoint();
    if (plan.roadPair && plan.pairedNode) plan.roadPair.sector.nodes.push(plan.pairedNode);
    const node = plan.node;
    this.getSector().nodes.push(node);
    this.insertNodeOnCable(node);
    this.evaluateMilestones();
    this.event('NodePlaced', `${node.name} placed. Construction started.`);
    this.publish();
    return node.id;
  }
  createControlGroup(ids: string[], colorValue: string) {
    const sector = this.getSector();
    const available = new Set(sector.nodes.filter(node => isPlayerMovableNode(node.kind) && !node.disabled).map(node => node.id));
    const nodeIds = [...new Set(ids)].filter(id => available.has(id));
    const color = CONTROL_GROUP_COLORS.find(color => color.value === colorValue);
    if (nodeIds.length < 2 || !color) return;
    this.checkpoint();
    const group = { id: makeId('control-group'), nodeIds, color: color.value, colorName: color.name };
    sector.controlGroups = regroupControlNodes(sector.controlGroups ?? [], group);
    this.publish();
    return group;
  }
  disbandControlGroup(id: string) {
    const sector = this.getSector();
    if (!sector.controlGroups?.some(group => group.id === id)) return false;
    this.checkpoint();
    sector.controlGroups = sector.controlGroups.filter(group => group.id !== id);
    this.publish();
    return true;
  }
  private findRoadPair(x: number, y: number) {
    const current = this.getSector();
    const field = getWorldFieldSize(this.state);
    const candidates = [
      { score: x, x: current.x - 1, y: current.y, side: 'east' as const },
      { score: field.width - x, x: current.x + 1, y: current.y, side: 'west' as const },
      { score: y, x: current.x, y: current.y - 1, side: 'south' as const },
      { score: field.height - y, x: current.x, y: current.y + 1, side: 'north' as const },
    ].sort((a, b) => a.score - b.score);
    const candidate = candidates[0];
    const sector = this.state.sectors[sectorId(candidate.x, candidate.y)];
    if (!sector?.unlocked) return;
    return { ...candidate, ...pairedRoadPositions({ x, y }, candidate.side, field), sector };
  }

  private movedCablesBlocked(sector: SectorState, proposedById: Map<string, MachineNode>) {
    const nodes = sector.nodes.map(node => proposedById.get(node.id) ?? node);
    const byId = new Map(nodes.map(node => [node.id, node]));
    return sector.connections.some(connection => {
      if (!proposedById.has(connection.from) && !proposedById.has(connection.to)) return false;
      const source = byId.get(connection.from), target = byId.get(connection.to);
      return Boolean(source && target && connectionBlockedByWorld(source, target, { fromPort: connection.fromPort ?? 0, toPort: connection.toPort ?? 0 }, nodes));
    });
  }

  private planRoadMove(sector: SectorState, node: MachineNode, point: { x: number; y: number }) {
    const neighbor = node.pairedSectorId ? this.state.sectors[node.pairedSectorId] : undefined;
    if (!neighbor?.unlocked) return;
    const pair = neighbor.nodes.find(candidate => candidate.id === node.pairedRoadId && hasNodeBehavior(candidate.kind, 'road'));
    const localFacing = facingAwayFromNeighbor(sector, neighbor);
    if (!pair || !localFacing || (pair.pairedRoadId && pair.pairedRoadId !== node.id) ||
      (pair.pairedSectorId && pair.pairedSectorId !== sector.id)) return;
    const field = getWorldFieldSize(this.state);
    const { local, remote } = pairedRoadPositions(point, localFacing, field);
    const proposed = { ...node, ...local };
    const endpoint = { ...pair, ...remote };
    const road: RoadPlacementTarget = { sector: neighbor, endpoint, localFacing };
    const valid = canPlaceNode(proposed, sector.nodes, field) && canPlaceNode(endpoint, neighbor.nodes, field)
      && !this.movedCablesBlocked(sector, new Map([[node.id, proposed]]))
      && !this.movedCablesBlocked(neighbor, new Map([[pair.id, endpoint]]));
    return { node: proposed, road, pair, valid };
  }

  getRoadMovePreview(id: string, point: { x: number; y: number }) {
    const sector = this.getSector();
    const node = sector.nodes.find(candidate => candidate.id === id && hasNodeBehavior(candidate.kind, 'road'));
    const plan = node && this.planRoadMove(sector, node, point);
    return plan && { node: plan.node, road: plan.road, valid: plan.valid };
  }

  moveNodes(ids: string[], dx: number, dy: number) {
    const positions = Object.fromEntries(this.getSector().nodes.filter((node) => ids.includes(node.id)).map((node) => [node.id, { x: node.x + dx, y: node.y + dy }]));
    if (this.tryMoveNodesTo(positions)) this.publish();
  }

  /** Checks a drag preview against the same collision, cable, and paired-road rules as a committed move. */
  canMoveNodesTo(positions: Record<string, { x: number; y: number }>) {
    return this.tryMoveNodesTo(positions, false);
  }

  /** Applies a drag position using the original collision, cable, and paired-road rules. */
  tryMoveNodesTo(positions: Record<string, { x: number; y: number }>, apply = true) {
    const sector = this.getSector();
    positions={...positions};
    if(this.state.research.completed.includes('campRelocation'))for(const camp of sector.nodes.filter(n=>n.kind==='monster-camp')) {
      const box=sector.nodes.find(n=>n.kind==='goblinTribute'&&n.tributeCampId===camp.id);
      if(!box||(!positions[camp.id]&&!positions[box.id]))continue;
      const anchor=positions[camp.id]?camp:box, point=positions[anchor.id];
      const dx=point.x-anchor.x,dy=point.y-anchor.y;
      for(const member of [camp,box]) {const next={x:member.x+dx,y:member.y+dy};if(positions[member.id]&&(Math.abs(positions[member.id].x-next.x)>1e-7||Math.abs(positions[member.id].y-next.y)>1e-7))return false;positions[member.id]=next;}
    }
    const selected = sector.nodes.filter((node) => positions[node.id] && isPlayerMovableNode(node.kind,this.state,node));
    if (!selected.length) return false;
    if (selected.some(node => hasNodeBehavior(node.kind, 'road'))) {
      if (selected.length !== 1) return false;
      const node = selected[0];
      const plan = this.planRoadMove(sector, node, positions[node.id]);
      if (!plan?.valid) return false;
      if (apply) {
        this.checkpoint();
        this.applyRoadMove(sector, node, plan);
      }
      return true;
    }
    const field = getWorldFieldSize(this.state);
    const ignored = new Set(selected.map((node) => node.id));
    const proposals = selected.map((node) => ({ node, proposed: { ...node, ...positions[node.id] } }));
    if (!selected.some(n=>!getNodeModule(n.kind).controls.movable)) {
      const minimumShiftX = Math.max(...proposals.map(({ proposed }) => getNodeSize(proposed).w / 2 + 12 - proposed.x));
      const maximumShiftX = Math.min(...proposals.map(({ proposed }) => field.width - getNodeSize(proposed).w / 2 - 12 - proposed.x));
      const minimumShiftY = Math.max(...proposals.map(({ proposed }) => getNodeSize(proposed).h / 2 + 52 - proposed.y));
      const maximumShiftY = Math.min(...proposals.map(({ proposed }) => field.height - getNodeSize(proposed).h / 2 - 12 - proposed.y));
      const shiftX = Math.max(minimumShiftX, Math.min(maximumShiftX, 0)); const shiftY = Math.max(minimumShiftY, Math.min(maximumShiftY, 0));
      proposals.forEach(({ proposed }) => { proposed.x += shiftX; proposed.y += shiftY; });
    }
    if (proposals.some(({ proposed }) => !canPlaceNode(proposed, [...sector.nodes.filter(n=>!ignored.has(n.id)),...proposals.map(p=>p.proposed)], field))) return false;
    const proposedById = new Map(proposals.map(({ proposed }) => [proposed.id, proposed]));
    if (this.movedCablesBlocked(sector, proposedById)) return false;
    if (!apply) return true;
    this.checkpoint();
    proposals.forEach(({ node, proposed }) => { node.x = proposed.x; node.y = proposed.y; });
    updateCampEncroachment(sector.nodes);
    if (selected.length === 1 && getNodeModule(selected[0].kind).controls.movable) this.insertNodeOnCable(selected[0]);
    return true;
  }

  private applyRoadMove(sector: SectorState, node: MachineNode, plan: NonNullable<ReturnType<GameEngine['planRoadMove']>>) {
    node.x = plan.node.x; node.y = plan.node.y; node.roadFacing = plan.node.roadFacing;
    const { sector: neighbor, endpoint } = plan.road;
    plan.pair.x = endpoint.x; plan.pair.y = endpoint.y; plan.pair.roadFacing = endpoint.roadFacing;
    updateCampEncroachment(sector.nodes);
    updateCampEncroachment(neighbor.nodes);
  }

  private syncFieldLayouts() {
    syncCornerLayouts(this.state);
    for (const sector of Object.values(this.state.sectors)) {
      for (const node of sector.nodes) {
        if (node.kind !== 'road' || node.roadMode !== 'export') continue;
        const plan = this.planRoadMove(sector, node, node);
        if (plan?.valid && [plan.node.x - node.x, plan.node.y - node.y,
          plan.road.endpoint.x - plan.pair.x, plan.road.endpoint.y - plan.pair.y].some(delta => Math.abs(delta) > 1e-6)) {
          this.applyRoadMove(sector, node, plan);
        }
      }
    }
  }

  getCableInsertionPreview(node: MachineNode): { replacedConnectionId: string; connections: [Connection, Connection] } | undefined {
    if (!getNodeCapabilities(node.kind).passThrough || node.disabled) return undefined;
    const sector = this.getSector();
    for (const old of cablesUnderNode(node, sector)) {
      const from = sector.nodes.find(candidate => candidate.id === old.from), to = sector.nodes.find(candidate => candidate.id === old.to);
      if (!from || !to) continue;
      const remaining = sector.connections.filter(candidate => candidate.id !== old.id);
      for (let input = 0; input < getEffectiveNodeInputFamilies(node, this.state.research.completed).length; input++) {
        const first = resolveExactConnectionPlan(from, old.fromPort ?? 0, node, input, remaining, this.state.research.completed);
        if (!first || first.replace.length || connectionBlockedByWorld(from, node, first, sector.nodes)) continue;
        for (let output = 0; output < getEffectiveNodeOutputFamilies(node).length; output++) {
          const second = resolveExactConnectionPlan(node, output, to, old.toPort ?? 0, remaining, this.state.research.completed);
          if (!second || second.replace.length || connectionBlockedByWorld(node, to, second, sector.nodes)) continue;
          if (old.item && (!inputPortAcceptsItem(node, input, old.item, this.state.research.completed) || !portFamilyAcceptsItem(getEffectiveNodeOutputFamilies(node)[output], old.item))) continue;
          const firstCable: Connection = { ...old, id: `__insert-in-${node.id}`, to: node.id, toPort: input, createdAt: Date.now() };
          const secondCable: Connection = { ...old, id: `__insert-out-${node.id}`, from: node.id, fromPort: output, createdAt: Date.now() };
          const previewNodes = [...sector.nodes.filter(candidate => candidate.id !== node.id), node];
          if (routedConnectionFailure(secondCable, previewNodes, [...remaining, firstCable], this.state.research.completed, new Set())) continue;
          return { replacedConnectionId: old.id, connections: [firstCable, secondCable] };

        }
      }
    }
    return undefined;
  }

  private insertNodeOnCable(node: MachineNode) {
    const preview = this.getCableInsertionPreview(node);
    if (!preview) return false;
    const [firstCable, secondCable] = preview.connections.map(cable => ({ ...cable, id: makeId('cable') }));
    for (const transfer of this.state.inFlightTransfers ?? []) {
      const route = transfer.routeConnectionIds ?? [transfer.connectionId];
      if (!route.includes(preview.replacedConnectionId)) continue;
      transfer.routeConnectionIds = route.flatMap(id => id === preview.replacedConnectionId ? [firstCable.id, secondCable.id] : [id]);
      transfer.connectionId = transfer.routeConnectionIds[0];
    }
    const sector = this.getSector();
    sector.connections = [...sector.connections.filter(cable => cable.id !== preview.replacedConnectionId), firstCable, secondCable];
    return true;
  }

  beginMove() { this.checkpoint(); }
  commitMove() { this.publish(); }
  connect(from: string, to: string) {
    if (from === to) return false;
    const sector = this.getSector();
    const sourceNode = sector.nodes.find((node) => node.id === from);
    const targetNode = sector.nodes.find((node) => node.id === to);
    if (!sourceNode || !targetNode) return false;
    if(!this.canAddProgressionConnection(sourceNode,targetNode,sector.connections))return false;
    const plan = resolveConnectionPlan(sourceNode, targetNode, sector.connections, this.state.research.completed, plan => !routedConnectionFailure({ from, to, fromPort: plan.fromPort, toPort: plan.toPort }, sector.nodes, sector.connections, this.state.research.completed, new Set(plan.replace)));
    if (!plan || connectionBlockedByWorld(sourceNode, targetNode, plan, sector.nodes)) return false;
    return this.connectPorts(from, plan.fromPort, to, plan.toPort);
  }

  getRoadTransportStatus(nodeId: string) {
    const sector = this.getSector(); const node = sector.nodes.find(n => n.id === nodeId);
    return node && hasNodeBehavior(node.kind, 'road') ? roadMaterialState(this.state, sector, node) : undefined;
  }

  getRoadConnectionError(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string) {
    const sector = this.getSector();
    const source = sector.nodes.find(n => n.id === from), target = sector.nodes.find(n => n.id === to);
    if (!source || !target) return;
    const vehicleError = roadVehicleError(source, target);
    if (vehicleError) return vehicleError;
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, sector.connections.filter(c => c.id !== replaceConnectionId), this.state.research.completed);
    if (!plan) return;
    return roadConnectionError(this.state, sector, { id: '__road-validation', from, to, fromPort, toPort, createdAt: 0 }, new Set([...plan.replace, ...(replaceConnectionId ? [replaceConnectionId] : [])]));
  }

  /** Read-only explanation using the same checks as a committed cable. */
  getConnectionFailure(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string): { title: string; detail: string } | undefined {
    const sector = this.getSector();
    const source = sector.nodes.find(n => n.id === from), target = sector.nodes.find(n => n.id === to);
    if (!source || !target) return { title: 'Socket unavailable', detail: 'Choose an output and an input on existing nodes.' };
    if (source === target) return { title: 'Choose another node', detail: 'A cable must connect two different nodes.' };
    if (source.disabled || target.disabled) return { title: 'Node disabled', detail: 'Enable both nodes before connecting them.' };
    const vehicleError = roadVehicleError(source, target);
    if (vehicleError) return { title: 'Freight vehicle required', detail: vehicleError };
    const unconfigured = [source, target].find(needsRecipeSelection);
    if (unconfigured && source.kind !== 'devSource') return { title: 'Choose a recipe first', detail: `${unconfigured.name} needs a recipe before it can be connected. Left-click it and choose a recipe.` };
    if ((hasNodeBehavior(source.kind, 'resource') || source.infiniteResource) && !hasNodeBehavior(target.kind, 'extractor') && !getNodeCapabilities(target.kind).passThrough) return { title: 'Extractor required', detail: 'Connect the resource to an Extractor, then connect the Extractor output to this machine.' };
    if (!portFamiliesCompatible(source, fromPort, target, toPort, this.state.research.completed)) {
      if (isCartKind(target.kind)) return { title: 'Solid items only', detail: `${target.name} cannot store fluids. Use the appropriate fluid or waste storage instead.` };
      const family = getEffectiveNodeInputFamilies(target, this.state.research.completed)[toPort];
      const name = family && family in ITEM_NAMES ? ITEM_NAMES[family as ItemId] : family ?? 'a compatible material';
      return { title: 'Incompatible socket', detail: `${target.name}'s selected input requires ${name}. Choose the matching output and input, or use a Filter to select a material.` };
    }
    const connections = sector.connections.filter(c => c.id !== replaceConnectionId);
    if (!this.canAddProgressionConnection(source, target, connections)) return { title: 'Connection limit reached', detail: 'This node has reached its researched connection limit. Remove a connection or research more capacity.' };
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, connections, this.state.research.completed);
    if (!plan) return { title: 'Connection unavailable', detail: 'These sockets are already connected or the receiving Merger holds a different material. Drain that material or choose another socket.' };
    const materialFailure = routedConnectionFailure({ from, to, fromPort, toPort }, sector.nodes, connections, this.state.research.completed, new Set(plan.replace));
    if (materialFailure) return materialFailure;
    const obstruction = connectionObstruction(source, target, plan, sector.nodes);
    if (obstruction) return { title: `Blocked by ${obstruction.name}`, detail: `The cable crosses ${obstruction.name} on map ${sector.id}. Route it around the obstruction using Joints, allowing clearance outside its border.` };
    const road = this.getRoadConnectionError(from, fromPort, to, toPort, replaceConnectionId);
    return road ? { title: 'Road connection blocked', detail: road } : undefined;
  }

  connectPorts(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string) {
    if (from === to) return false;
    const sector = this.getSector();
    const sourceNode = sector.nodes.find((node) => node.id === from);
    const targetNode = sector.nodes.find((node) => node.id === to);
    if (!sourceNode || !targetNode) return false;
    const validationConnections = replaceConnectionId
      ? sector.connections.filter((connection) => connection.id !== replaceConnectionId)
      : sector.connections;
    if(!this.canAddProgressionConnection(sourceNode,targetNode,validationConnections))return false;
    const plan = resolveExactConnectionPlan(sourceNode, fromPort, targetNode, toPort, validationConnections, this.state.research.completed);
    if (!plan || connectionBlockedByWorld(sourceNode, targetNode, plan, sector.nodes)) return false;
    const replaced = new Set([...plan.replace, ...(replaceConnectionId ? [replaceConnectionId] : [])]);
    if (routedConnectionFailure({ from, to, fromPort, toPort }, sector.nodes, sector.connections, this.state.research.completed, replaced)) return false;
    if (roadConnectionError(this.state, sector, { id: '__road-validation', from, to, fromPort, toPort, createdAt: 0 }, replaced)) return false;
    this.checkpoint();
    this.cancelTransfers(replaced);
    sector.connections = sector.connections.filter((connection) => !replaced.has(connection.id));
    sector.connections.push({ id: makeId('cable'), from, to, fromPort, toPort, item: concreteOutputItem(sourceNode, fromPort), createdAt: Date.now() });
    this.reconcileSectorExtractorStorage(sector);
    this.state.hasCreatedConnection = true;
    this.evaluateMilestones();
    this.publish();
    return true;
  }

  deleteConnection(connectionId: string) {
    const sector = this.getSector();
    if (!sector.connections.some((connection) => connection.id === connectionId)) return;
    this.checkpoint();
    this.cancelTransfers(new Set([connectionId]));
    sector.connections = sector.connections.filter((connection) => connection.id !== connectionId);
    this.reconcileSectorExtractorStorage(sector);
    this.publish();
  }
  private canAddProgressionConnection(source:MachineNode,target:MachineNode,connections:Connection[]){
    if(source.kind==='devSource')return true;
    if (source.kind === 'lake' && target.kind === 'fluidLink') {
      const connectedPumps = connections.filter(cable => cable.from === source.id && cable.to !== target.id &&
        this.getSector().nodes.some(node => node.id === cable.to && node.kind === 'fluidLink'));
      if (connectedPumps.length >= 2) return false;
    }
    if(source.kind==='inventory'&&connections.filter(c=>c.from===source.id).length>=connectionLimit(this.state,'inventory'))return false;
    if(target.kind==='storage'&&connections.filter(c=>c.to===target.id).length>=connectionLimit(this.state,'storage'))return false;
    return true;
  }
  deleteNodes(ids: string[]) {
    const sector = this.getSector();
    const deletable = sector.nodes.filter((n) => ids.includes(n.id) && !n.protected && getNodeModule(n.kind).controls.deletable).map((n) => n.id);
    if (!deletable.length) return;
    this.checkpoint();
    const removedConnectionIds = new Set(sector.connections.filter((connection) => deletable.includes(connection.from) || deletable.includes(connection.to)).map((connection) => connection.id));
    this.cancelTransfers(removedConnectionIds);
    sector.nodes.filter((node) => deletable.includes(node.id) && hasNodeBehavior(node.kind,'road') && node.pairedSectorId && node.pairedRoadId).forEach((road) => {
      const pairSector = this.state.sectors[road.pairedSectorId!];
      if (!pairSector) return;
      this.cancelTransfers(new Set(pairSector.connections.filter((connection) => connection.from === road.pairedRoadId || connection.to === road.pairedRoadId).map((connection) => connection.id)));
      pairSector.nodes = pairSector.nodes.filter((node) => node.id !== road.pairedRoadId);
      pairSector.connections = pairSector.connections.filter((connection) => connection.from !== road.pairedRoadId && connection.to !== road.pairedRoadId);
    });
    sector.nodes = sector.nodes.filter((n) => !deletable.includes(n.id));
    sector.connections = sector.connections.filter((c) => !deletable.includes(c.from) && !deletable.includes(c.to));
    for (const map of Object.values(this.state.sectors)) map.controlGroups = normalizeControlGroups(map.controlGroups, map.nodes);
    this.publish();
  }

  private clearFilledHoles(sector: SectorState, holes: readonly MachineNode[]) {
    if (!holes.length) return;
    const ids = new Set(holes.map(hole => hole.id));
    const removedConnectionIds = new Set(sector.connections
      .filter(connection => ids.has(connection.from) || ids.has(connection.to))
      .map(connection => connection.id));
    this.cancelTransfers(removedConnectionIds);
    sector.nodes = sector.nodes.filter(node => !ids.has(node.id));
    sector.connections = sector.connections.filter(connection => !removedConnectionIds.has(connection.id));
    for (const hole of holes) {
      const unusedStone = hole.input.stone ?? 0;
      if (unusedStone > 0) {
        sector.nodes.push({
          id: makeId('fill-salvage'), kind: 'woodenChest', name: 'Unused fill Stone',
          x: hole.x, y: hole.y, rotation: 0, input: {}, output: { stone: unusedStone },
          outputQueue: Array(unusedStone).fill('stone'), progressMs: 0, cycleMs: 0,
          capacity: Math.max(unusedStone, cartUpgrade(this.state.research.completed, endgameRank(this.state, 'trainFreightCapacity')).capacity),
          constructedAt: 0, constructionMs: 0,
        });
      }
      this.event('NodePlaced', 'Deep Hole filled in. The obstruction has been cleared.');
    }
  }

  toggleNodeProcessingPause(nodeId: string) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId);
    if (!node || !getNodeModule(node.kind).controls.pauseable || NODE_DEFINITIONS[node.kind].category === 'World' || NODE_DEFINITIONS[node.kind].output.length === 0) return;
    node.processingPaused = !node.processingPaused;
    this.publish();
  }

  rotateNode(nodeId: string) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId);
    if (!node || !getNodeModule(node.kind).controls.rotatable) return;
    this.checkpoint();
    node.rotation = (node.rotation + 90) % 360;
    this.publish();
  }
  mirrorProductionConnectors(nodeId: string) {
    const node = this.getSector().nodes.find(candidate => candidate.id === nodeId);
    if (!node || node.disabled || !isProductionMachine(node) || !this.state.research.completed.includes(CONNECTOR_MIRRORING_RESEARCH)) return false;
    this.checkpoint();
    node.connectorsMirrored = !node.connectorsMirrored;
    this.publish();
    return true;
  }
  cycleNodeInputOrder(nodeId: string) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    const inputs = NODE_DEFINITIONS[node.kind].input;
    const canCycle = inputs.length > 1 && (getNodeCapabilities(node.kind).behavior === 'recipe' || new Set(inputs).size > 1);
    if (!canCycle) return;
    this.checkpoint();
    const current = node.inputPortOrder?.length === inputs.length ? [...node.inputPortOrder] : inputs.map((_, index) => index);
    const last = current.pop();
    if (last === undefined) return;
    node.inputPortOrder = [last, ...current];
    this.publish();
  }
  cycleNodeOutputPosition(nodeId: string) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    const definition = NODE_DEFINITIONS[node.kind];
    const canCycle = definition.input.length > 1 && (getNodeCapabilities(node.kind).behavior === 'recipe' || new Set(definition.input).size > 1);
    const rowCount = Math.max(definition.input.length, definition.output.length, 1);
    if (!canCycle || definition.output.length === 0 || rowCount < 2) return;
    this.checkpoint();
    const maximumOffset = Math.max(0, rowCount - definition.output.length);
    if (maximumOffset > 0) node.outputRowOffset = ((node.outputRowOffset ?? 0) + 1) % (maximumOffset + 1);
    else {
      const current = node.outputPortOrder?.length === definition.output.length ? [...node.outputPortOrder] : definition.output.map((_, index) => index);
      const last = current.pop();
      if (last === undefined) return;
      node.outputPortOrder = [last, ...current];
      node.outputRowOffset = 0;
    }
    this.publish();
  }
  duplicateNodes(ids: string[]) {
    const sector = this.getSector();
    const source = sector.nodes.filter((n) => ids.includes(n.id) && !n.protected && isPlayerMovableNode(n.kind) &&
      getNodeCapabilities(n.kind).duplicateAllowed !== false && (!n.recipeId || RECIPE_GROUPS[n.kind]?.includes(n.recipeId)) &&
      ((NODE_DEFINITIONS[n.kind].category !== 'Storage' && !isCartKind(n.kind)) || isNodeUnlocked(n.kind, this.state.research.unlocked)));
    if (!source.length) return [];
    const map = new Map<string, string>();
    const copyIds = new Map(source.map((node) => [node.id, makeId(node.kind)]));
    const field = getWorldFieldSize(this.state);
    const step = Math.max(150, ...source.map((node) => Math.max(getNodeSize(node).w, getNodeSize(node).h) + 30));
    const offsets: Array<{ x: number; y: number }> = [];
    for (let ring = 1; ring <= 12; ring++) {
      for (let x = -ring; x <= ring; x++) offsets.push({ x: x * step, y: -ring * step }, { x: x * step, y: ring * step });
      for (let y = -ring + 1; y < ring; y++) offsets.push({ x: -ring * step, y: y * step }, { x: ring * step, y: y * step });
    }
    let copies: MachineNode[] | undefined;
    for (const offset of offsets) {
      const candidates = source.map((node) => {
        const copy = clone(node); copy.id = copyIds.get(node.id)!; copy.x += offset.x; copy.y += offset.y; copy.input = {}; copy.output = {}; copy.batch=undefined;copy.growthCredit=0;copy.outputQueue=[];copy.inputQueue=[];copy.filterBlocked=undefined;copy.progressMs = 0; copy.constructedAt = Date.now(); return copy;
      });
      if (!candidates.every((copy) => canPlaceNode(copy, sector.nodes, field))) continue;
      const candidateBySourceId = new Map(source.map((node, index) => [node.id, candidates[index]]));
      const nodesAfterCopy = [...sector.nodes, ...candidates];
      const internalConnectionsValid = sector.connections.filter((connection) => candidateBySourceId.has(connection.from) && candidateBySourceId.has(connection.to)).every((connection) => {
        const from = candidateBySourceId.get(connection.from)!; const to = candidateBySourceId.get(connection.to)!;
        return !connectionBlockedByWorld(from, to, { fromPort: connection.fromPort ?? 0, toPort: connection.toPort ?? 0 }, nodesAfterCopy);
      });
      if (internalConnectionsValid) { copies = candidates; break; }
    }
    if (!copies) return [];
    source.forEach((node) => map.set(node.id, copyIds.get(node.id)!));
    this.checkpoint();
    sector.nodes.push(...copies);
    const copiedConnections = sector.connections.filter((c) => map.has(c.from) && map.has(c.to)).map((c) => ({ ...c, id: makeId('cable'), from: map.get(c.from)!, to: map.get(c.to)! }));
    sector.connections.push(...copiedConnections);
    sector.controlGroups = [...(sector.controlGroups ?? []), ...copyControlGroups(sector.controlGroups ?? [], map, () => makeId('control-group'))];
    this.publish();
    return copies.map((n) => n.id);
  }
  copyRecipe(sourceId: string, targetId: string) {
    const nodes = this.getSector().nodes;
    const source = nodes.find(node => node.id === sourceId);
    const target = nodes.find(node => node.id === targetId);
    if (!source?.recipeId || !target || source.id === target.id || source.kind !== target.kind || source.disabled || target.disabled) return false;
    return this.setRecipe(target.id, source.recipeId);
  }
  setRecipe(nodeId: string, recipeId: string) {
    const sector = this.getSector();
    const node = sector.nodes.find((n) => n.id === nodeId);
    if (!node || getNodeCapabilities(node.kind).behavior === 'bot-assembly' || node.batch || !RECIPES[recipeId] || !RECIPE_GROUPS[node.kind]?.includes(recipeId) || !isRecipeUnlocked(recipeId,this.state.research.completed) || !worldRecipeAllowed(recipeId,this.state)) return false;
    if (recipeId === 'automata-core' && !this.state.research.completed.includes('automataCore')) return false;
    if (['robot-frame', 'robot-gun', 'suppression-bot'].includes(recipeId) && !this.state.research.completed.includes('suppressionBot')) return false;
    if (node.recipeId === recipeId) return true;
    this.checkpoint();
    node.recipeId = recipeId;
    node.cycleMs = RECIPES[recipeId].cycleMs;
    node.input = {};
    node.output = {};
    node.progressMs = 0;

    // Recipe changes in the source game discard incompatible cables while generic
    // storage/logistics routes survive and adopt the new material type.
    const removed = new Set(sector.connections.filter((connection) => {
      if (connection.from !== node.id && connection.to !== node.id) return false;
      const source = sector.nodes.find((candidate) => candidate.id === connection.from);
      const target = sector.nodes.find((candidate) => candidate.id === connection.to);
      if (!source || !target) return true;
      if (!portFamiliesCompatible(source, connection.fromPort ?? 0, target, connection.toPort ?? 0, this.state.research.completed)) return true;
      return source.kind !== 'devSource' && connection.to === node.id && Boolean(connection.item) && !inputPortAcceptsItem(node, connection.toPort ?? 0, connection.item!, this.state.research.completed);
    }).map((connection) => connection.id));
    this.cancelTransfers(removed);
    if (removed.size) sector.connections = sector.connections.filter((connection) => !removed.has(connection.id));
    this.publish();
    return true;
  }
  saveFactoryTemplate(name: string, ids: string[]) { return this.templates.saveFactoryTemplate(name, ids); }
  getTemplatePreview(index: number, x: number, y: number) { return this.templates.getTemplatePreview(index, x, y); }
  placeFactoryTemplate(index: number, x: number, y: number) { return this.templates.placeFactoryTemplate(index, x, y); }
  acknowledgeRescue() { if(this.state.rescue?.pending){delete this.state.rescue.pending;this.rescueAccumulator=1000;this.publish();} }
  acknowledgeVictory() { if(this.state.endgame&&this.state.research.completed.includes('victory')) {this.state.endgame.victoryAcknowledged=true;this.publish();} }
  selectResearch(id?: string) { this.research.selectResearch(id); }

  setFilterItem(nodeId: string, filterItem: ItemId, outputPort?: FilterPort) {
    const sector = this.getSector();
    const node = sector.nodes.find((candidate) => candidate.id === nodeId && hasNodeBehavior(candidate.kind, 'filter'));
    if (!node || !FILTERABLE_ITEMS.includes(filterItem) || (outputPort !== undefined && outputPort !== 0 && outputPort !== 1)) return false;
    const port = outputPort ?? selectedFilterPort(node);
    if (node.filterItem === filterItem && selectedFilterPort(node) === port) return true;
    this.checkpoint();
    node.filterItem = filterItem;
    node.filterOutputPort = port;
    this.reconcileSectorExtractorStorage(sector);
    node.filterBlocked = this.filterBlockage(node, sector, new SimulationLookups(this.state));
    this.publish();
    return true;
  }
  setGoblinTributeItem(nodeId: string, item: TributeItem) {
    const sector = this.getSector();
    const node = sector.nodes.find(candidate => candidate.id === nodeId);
    const camp = node?.kind === 'monster-camp' ? node : node?.kind === 'goblinTribute' ? sector.nodes.find(candidate => candidate.id === node.tributeCampId && candidate.kind === 'monster-camp') : undefined;
    if (!camp || !getTributeItems(this.state, camp).includes(item)) return false;
    const tribute = sector.nodes.find(candidate => candidate.kind === 'goblinTribute' && candidate.tributeCampId === camp.id);
    const discardsStock = tribute && Object.entries(tribute.output).some(([stored, amount]) => stored !== item && (amount ?? 0) > 0);
    if (tributeMaterial(camp) === item && !discardsStock) return true;
    this.checkpoint();
    camp.tributeItem = item;
    if (tribute) {
      for (const stored of Object.keys(tribute.output) as ItemId[]) if (stored !== item) delete tribute.output[stored];
      tribute.tributeItem = item; tribute.progressMs = 0;
    }
    this.publish();
    return true;
  }
  setMiningTarget(nodeId: string, miningTarget: NonNullable<MachineNode['miningTarget']>) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId && hasNodeBehavior(candidate.kind, 'mining-drill'));
    if (!node || miningTarget === 'mythril' || (node.miningProgress ?? 0) > 0) return false;
    if (node.miningTarget === miningTarget) return true;
    this.checkpoint();
    node.miningTarget = miningTarget;
    this.publish();
    return true;
  }
  togglePause() {
    if (this.realtimeTickAt !== undefined) {
      const now = performance.now();
      // Carry the active fraction across the pause without running an extra simulation step.
      this.realtimePendingMs = Math.min(1000, this.realtimePendingMs + this.activeTimeSinceTick(now));
      this.realtimeTickAt = now;
    }
    this.state.paused = !this.state.paused;
    this.publish();
  }
  acknowledgeDwarvenDiscovery() {
    if (!firstSpottedDwarvenCamp(this.state)) return false;
    (this.state.tutorialPromptsSeen ??= []).push(DWARVEN_DISCOVERY_PROMPT);
    this.publish(); return true;
  }
  acknowledgeTutorialInvitation(kind: ProgressiveTutorialKind) {
    if (!isTutorialUnlocked(kind, this.state) || this.state.tutorialPromptsSeen?.includes(kind)) return false;
    (this.state.tutorialPromptsSeen ??= []).push(kind);
    this.publish();
    return true;
  }
  getRoadReversalError(nodeId: string) {
    const sector = this.getSector();
    const road = sector.nodes.find(node => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    const pairedSector = road?.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
    const pair = pairedSector?.nodes.find(node => node.id === road?.pairedRoadId);
    if (!road || !pair || !pairedSector || !hasNodeBehavior(pair.kind, 'road')) return 'The paired road endpoint is unavailable.';
    if ((pair.pairedRoadId && pair.pairedRoadId !== road.id) || (pair.pairedSectorId && pair.pairedSectorId !== sector.id)) return 'The paired road endpoint belongs to another Road.';
    // Reversal changes direction without adding endpoints or consuming another face slot.
    return undefined;
  }
  reverseRoad(nodeId: string) {
    const road = this.getSector().nodes.find(node => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    return road ? this.setRoadDirection(nodeId, road.roadMode === 'import' ? 'export' : 'import') : false;
  }
  /** Either endpoint selects the single direction for this entire pair. */
  setRoadDirection(nodeId: string, direction: 'export' | 'import') {
    if (direction !== 'export' && direction !== 'import') return false;
    const sector = this.getSector();
    const road = sector.nodes.find((node) => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    const pairedSector = road?.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
    const pair = pairedSector?.nodes.find((node) => node.id === road?.pairedRoadId);
    if (!road || !pair || !pairedSector) return false;
    if (this.getRoadReversalError(nodeId)) return false;
    const pairedDirection = direction === 'export' ? 'import' : 'export';
    if (road.roadMode === direction && pair.roadMode === pairedDirection) return true;
    this.checkpoint();
    for (const [owner, endpoint, mode] of [[sector, road, direction], [pairedSector, pair, pairedDirection]] as const) {
      const removed = new Set(owner.connections.filter((connection) => connection.from === endpoint.id || connection.to === endpoint.id).map((connection) => connection.id));
      this.cancelTransfers(removed);
      owner.connections = owner.connections.filter((connection) => !removed.has(connection.id));
      if (endpoint.roadMode !== mode) [endpoint.input, endpoint.output] = [endpoint.output, endpoint.input];
      endpoint.roadMode = mode;
      endpoint.progressMs = 0;
    }
    this.publish();
    return true;
  }
  updatePreferences(patch: Partial<GameState['preferences']>) { Object.assign(this.state.preferences, patch); this.publish(); }
  developerUnlockAllNodes() {
    this.checkpoint();
    const requirements = Object.values(NODE_DEFINITIONS).map((definition) => definition.unlockResearch).filter((id): id is string => Boolean(id));
    this.state.research.unlocked = [...new Set([...this.state.research.unlocked, ...requirements])];
    this.publish();
  }
  developerUnlockAllResearch() {
    this.checkpoint();
    this.state.devResearchUnlocked = true;
    const permanent = RESEARCH_PROJECTS.filter((project) => !project.repeatable).map((project) => project.id);
    this.state.research.unlocked = [...new Set([...this.state.research.unlocked, ...RESEARCH_PROJECTS.map((project) => project.id)])];
    this.state.research.completed = [...new Set([...this.state.research.completed, ...permanent])];
    this.state.research.selected = undefined;
    this.state.research.contributed = {};
    this.state.research.mapPoints = Math.max(this.state.research.mapPoints, worldGridSize(this.state) ** 2);
    this.research.resetResearchCycles();
    applyCartUpgrades(this.state);
    this.syncFieldLayouts();
    this.publish();
  }
  developerUnlockAllSectors() {
    this.checkpoint();
    const size = worldGridSize(this.state);
    const { min, max } = worldGridBounds(size);
    for (let y = min; y <= max; y++) for (let x = min; x <= max; x++) {
      const sector = this.ensureSector(x, y);
      sector.unlocked = true;
      this.state.sectors[sector.id] = sector;
    }
    this.state.devMapSurveysRevealed = true;
    this.state.research.mapPoints = Math.max(this.state.research.mapPoints, size ** 2);
    this.publish();
  }
  setTutorialStep(step: number) { this.state.tutorialStep = step; this.publish(); }
  setCamera(camera: SectorState['camera']) { this.getSector().camera = camera; }
  renameSector(name: string, label: string, sectorId = this.state.activeSectorId) { const s = this.state.sectors[sectorId]; if (!s?.unlocked) return; s.name = name.trim().slice(0, 30) || (s.id === '5,5' ? 'Home Sector' : `Sector ${s.x}.${s.y}`); s.label = label.trim().slice(0, 3).toUpperCase() || (s.id === '5,5' ? 'HME' : `S${sectorDistance(s.x, s.y)}`.slice(0, 3)); this.publish(); }
  undo() { const previous = this.history.pop(); if (previous) {
    previous.encounters = [...new Set([...(previous.encounters ?? []), ...(this.state.encounters ?? [])])];
    previous.tutorialPromptsSeen = [...new Set([...(previous.tutorialPromptsSeen ?? []), ...(this.state.tutorialPromptsSeen ?? [])])];
    for (const [id, sector] of Object.entries(this.state.sectors)) if (sector.visited && previous.sectors[id]) previous.sectors[id].visited = true;
    this.state = previous;
    if (this.realtimeTickAt !== undefined) this.startRealtimeClock();
    activateMod(this.state.mod); initializeProgression(this.state); applyCartUpgrades(this.state); applyModNames(this.state); this.evaluateMilestones(); this.publish();
  } }
  replaceState(state: GameState) { const next = clone(state); if (next.mod) next.mod = validateMod(next.mod); this.state = next; if (this.realtimeTickAt !== undefined) this.startRealtimeClock(); activateMod(this.state.mod); applyModNames(this.state); this.state.produced ??= {}; this.state.extracted ??= {}; this.state.hasCreatedConnection ??= false; this.state.research.completed ??= []; this.state.research.repeatableCompletions ??= {}; this.state.research.projectContributions ??= {}; this.state.inFlightTransfers ??= []; this.normalizeExtractorCycles(); applyModNames(this.state); this.research.reconcileResearchSelection(); this.pruneLockedForestInputs(); this.history = []; this.publish(); }
  unlockSector(x: number, y: number) {
    if (this.state.research.mapPoints < 1 || !isWorldGridCell(x, y, worldGridSize(this.state))) return false;
    const adjacent = Object.values(this.state.sectors).some((s) => s.unlocked && Math.abs(s.x - x) + Math.abs(s.y - y) === 1);
    if (!adjacent) return false;
    const id = sectorId(x, y);
    const sector = this.ensureSector(x, y);
    if (sector.unlocked) return false;
    this.checkpoint(); sector.unlocked = true; this.state.sectors[id] = sector; this.state.research.mapPoints--; this.publish(); return true;
  }
  switchSector(id: string, firstVisitCamera?: SectorState['camera']) {
    const sector = this.state.sectors[id]; if (!sector?.unlocked) return;
    syncCornerLayout(sector, getWorldFieldSize(this.state), this.state);
    if (!sector.visited && firstVisitCamera) sector.camera = { ...firstVisitCamera };
    this.state.activeSectorId = id; discoverActiveSector(this.state);this.evaluateMilestones();this.publish();
  }
  ensureSector(x: number, y: number) {
    activateMod(this.state.mod);
    return sectorForState(this.state, x, y);
  }
  sectorLevel() { const s = this.getSector(); return sectorDistance(s.x, s.y); }
}
