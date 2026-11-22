import { applyExpansionRescue } from './expansionRescue';
import { expandMapsAroundCenter } from './unvisitedMapExpansion';
import { focusedFieldCamera, sectorTravelCamera, type FieldViewport } from '../domain/camera';
import { roadTravelPair } from '../domain/roadNavigation';
import { forestTerrainRate, generateMapTerrains, normalizeMapTerrains } from './mapTerrain';
import { borderRoadPermissionsValid, generateBorderObstructions, normalizeBorderLayout } from './borderObstructions';
import { firstSpottedDwarvenCamp, DWARVEN_DISCOVERY_PROMPT } from '../tutorials/dwarvenDiscovery';
import { cornerDiscoveryPending, endgameRank, reconcileHole, worldRecipeAllowed, SEVEN_CORES } from '../content/endgame';
import { initializeEndgame, simulateCorner, syncCornerLayout } from './endgameRuntime';
import { simulatePlanter } from '../content/forestry';
import { activateMod } from '../mods/modContent';
import { validateMod } from '../mods/modValidation';
import { applyModNames, modCompatibilityError } from '../mods/modRuntime';
import { modNode, modNodeTemplate, modRule, modWorldGridSize } from '../mods/modRules';
import { HOME_SECTOR_ID, mapNodePosition, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import { canPurchaseMap, mapPurchaseProtected } from './mapExpansion';
import { usesNewWorldRules, syncGuardedResources, guardedResourceAccessible } from './worldRules';
import { regenerateGuardedResources, isDwarvenGuardedDeposit } from './guardedResources';
import type { GameMod } from '../mods/modTypes';
import { FactoryTemplateRuntime } from './factoryTemplateRuntime';
import { RoadCommandRuntime } from './roadCommandRuntime';
import { TransportRuntime } from './transportRuntime';
import { planNodeDeletion } from './nodeDeletion';
import { ConnectionPlanner } from './connectionPlanner';
import { NodeMovementPlanner } from './nodeMovementPlanner';
import { NodePlacementPlanner } from './nodePlacementPlanner';
import { freshLayoutNode } from './nodeLayoutCopy';
import { writeAutosave } from '../persistence/autosave';
import { ResearchRuntime } from './researchRuntime';
import type { QueueResearchOptions } from '../content/researchQueue';
import { initializeStateCollections, retainUndoKnowledge } from './stateLifecycle';
import { getEffectiveNodeOutputFamilies, isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, isResourceBehavior } from '../content/nodeCapabilities';
import { isRecipeUnlocked, RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { BOT_BUILD_BY_ID, MATCHED_BOTS } from '../content/botAssembly';
import { RESEARCH_PROJECTS } from '../content/research';
import { getRecipeEfficiencyMultiplier } from '../content/efficiency';
import { landmarkMultiplier, landmarkRecipeAllowed } from '../content/landmarks';
import { simulateUnknownDevice } from './landmarkRuntime';
import { initializeLandmarks } from './landmarkGeneration';
import { migrateMachineEfficiency } from './machineEfficiencyMigration';
import { migrateUpgrades } from './upgradesMigration';
import { migrateRetiredNodes } from '../content/retiredNodes';
import { canonicalNodeName } from '../content/displayNameChanges';
import { planControlGroupCreation, planControlGroupDisband, copyControlGroups, normalizeControlGroups, regroupControlNodes } from '../domain/controlGroups';
import type { Connection, GameEvent, GameState, InFlightTransfer, ItemId, MachineNode, NodeKind, SectorState } from '../domain/types';
import { getEncounterLayoutVersion, getGolemPlacementTier, getWorldFieldSize, normalizeWorldFieldSize, sectorDistance, sectorForState, sectorId, syncCornerLayouts } from './worldGeneration';
import { isTutorialUnlocked, type ProgressiveTutorialKind } from '../tutorials/tutorialUnlocks';
import { nodeInsideField, nodesOverlap } from './collisions';
import { applyCartUpgrades, cartCapacity, isCartKind, vehiclePayload } from '../content/cartUpgrades';
import { updateCampEncroachment } from './campEffects';
import { obstructedConnections } from './obstructedConnections';
import { devExtractorMaterial, supplyDevInputs } from './devSource';
import { dispatchRoadItem, recoverRoadStock } from './roadTransport';
import { connectionBlockedByWorld, nonItemFamilies, inputPortAcceptsItem, portFamiliesCompatible } from './connectionRules';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { CONNECTOR_MIRRORING_RESEARCH, isProductionMachine } from '../content/productionNodes';

import { getNodeSize } from '../domain/nodeGeometry';
import { FILTERABLE_ITEMS, ITEM_NAMES } from '../content/items';
import { SimulationLookups } from './simulationLookups';
import { migrateReviewedProduction } from './reviewedProductionMigration';
import { filterOutlet, selectedFilterPort, type FilterPort } from '../domain/filterRouting';
import { queueOutputs, reconcileQueue, returnOutput } from './mixedOutput';
import { getGoblinAttackRequirement, getMonsterSettlementDefinition, GOBLIN_CHECK_INTERVAL_MS } from '../content/goblinSettlements';
import { createGoblinTribute, getTributeItems, isCampFullySuppressed, produceGoblinTribute, tributeMaterial, type TributeItem } from './goblinTribute';
import { roadMaterialState } from './roadMaterials';
import { initializeProgression, discoverActiveSector, simulateProgressionNode, simulateExtendedRecipe, attackPower, consumeCampBots } from './progression';

const clone = <T,>(value: T): T => structuredClone(value);
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
const sum = (bag: Partial<Record<ItemId, number>>) => Object.values(bag).reduce<number>((a, b) => a + (b ?? 0), 0);
type NodeLayoutCopy = Pick<SectorState, 'nodes' | 'connections' | 'controlGroups'>;
export type { RoadPlacementTarget } from './nodePlacementPlanner';

const concreteOutputItem = (node: MachineNode, port: number) => {
  if (node.kind === 'refiner' && node.recipeId?.match(/-(gear|wire)$/) &&
    sum(node.input) === 0 && sum(node.output) === 0 && node.progressMs === 0) return undefined;
  const family = getEffectiveNodeOutputFamilies(node)[port];
  return family && !nonItemFamilies.has(family) ? family as ItemId : undefined;
};

export { createInitialState } from './createInitialState';
import { createInitialState } from './createInitialState';

export class GameEngine {
  private readonly connectionPlanner = new ConnectionPlanner(() => this.state, () => this.getSector());
  private readonly nodeMovementPlanner = new NodeMovementPlanner(() => this.state, () => this.getSector());
  private readonly nodePlacementPlanner = new NodePlacementPlanner(() => this.state, () => this.getSector(), makeId);
  private readonly transport = new TransportRuntime(
    () => this.state, makeId, (type, message) => this.event(type, message),
  );
  private readonly roadCommands = new RoadCommandRuntime(
    () => this.getState(), () => this.checkpoint(), ids => this.cancelTransfers(ids), () => this.publish(),
  );
  private readonly templates = new FactoryTemplateRuntime(
    () => this.getState(), () => this.checkpoint(), () => this.publish(), makeId,
  );
  private readonly research = new ResearchRuntime(
    () => this.getState(),
    () => this.publish(),
    (type, message, projectId, elapsedMs) => this.event(type, message, projectId, elapsedMs),
    () => this.journalElapsedMs(),
    kind => this.efficiencyMultiplier(kind),
    projectId => this.expandFieldLayouts(projectId),
    destination => this.openFundedSector(destination),
  );
  private state: GameState;
  private listeners = new Set<() => void>();
  private history: GameState[] = [];
  private developerMapRevealUndo = new WeakSet<GameState>();
  private copiedLayout?: NodeLayoutCopy;
  private transferAccumulator = 0;
  private publishAccumulator = 0;
  private autosaveAccumulator = 0;
  private autosaveFailed = false;
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
    initializeStateCollections(this.state);
    this.normalizeExtractorCycles();
    applyModNames(this.state);
    this.research.reconcileResearchSelection();
    this.pruneLockedForestInputs();
    this.evaluateMilestones();
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getState = () => { activateMod(this.state.mod); return this.state; };
  getSector = () => { activateMod(this.state.mod); return this.state.sectors[this.state.activeSectorId]; };
  hasAutosaveFailure = () => this.autosaveFailed;
  /** Also works while paused. Keep failure status outside saved and undo state. */
  retryAutosave = () => {
    if (this.options.autosave === false) return false;
    this.autosaveAccumulator = 0;
    let failed = false;
    try { writeAutosave(this.state); } catch { failed = true; }
    const changed = this.autosaveFailed !== failed;
    this.autosaveFailed = failed;
    if (changed) this.publish();
    return !failed;
  };
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
    if (gridSize !== undefined) {
      const changed = gridSize !== worldGridSize(this.state);
      this.state.worldGridSize = gridSize;
      if (gridSize !== 11) { this.state.landmarkVersion = 0; delete this.state.landmarkLayout; }
      if (changed && this.state.borderObstructionVersion === 1) this.state.borderObstructions = generateBorderObstructions(this.state.seed, gridSize);
      if (changed && this.state.mapTerrainVersion === 1) this.state.mapTerrains = generateMapTerrains(this.state.seed, gridSize, this.state.endgame?.cornerOrder);
    }
    activateMod(candidate);
    if (this.state.landmarkEligible && worldGridSize(this.state) === 11 && this.state.landmarkVersion === 0 && Object.keys(this.state.sectors).every(id => id === HOME_SECTOR_ID)) initializeLandmarks(this.state);
    migrateUpgrades(this.state);
    this.syncFieldLayouts();
    applyModNames(this.state);
    applyCartUpgrades(this.state);
    applyModNames(this.state);
    if (!this.state.research.mapNodeQuote?.destination) delete this.state.research.mapNodeQuote;
    this.transferAccumulator = 0;
    this.research.reconcileResearchSelection();
    this.publish();
  }
  private normalizeExtractorCycles() {
    this.state.worldRulesVersion ??= 1;
    if (this.state.isTraining || worldGridSize(this.state) !== 11) { this.state.landmarkVersion = 0; delete this.state.landmarkLayout; if(this.state.isTraining)delete this.state.landmarkEligible; }
    normalizeMapTerrains(this.state);
    Object.assign(this.state, normalizeBorderLayout(this.state.borderObstructionVersion, this.state.borderObstructions, worldGridSize(this.state)));
    if (!borderRoadPermissionsValid(this.state)) throw new Error('A saved Road crosses terrain without its crossing research.');
    normalizeWorldFieldSize(this.state);
    this.state.golemPlacementTier ??= getGolemPlacementTier(this.state);
    this.state.encounterLayoutVersion ??= getEncounterLayoutVersion(this.state);
    migrateRetiredNodes(this.state);
    initializeProgression(this.state);
    migrateMachineEfficiency(this.state);
    migrateReviewedProduction(this.state);
    this.migrateBotAssembly();
    this.migrateBasicGunRecipe();
    initializeEndgame(this.state);
    applyCartUpgrades(this.state);
    for (const node of [...Object.values(this.state.sectors).flatMap(sector => sector.nodes), ...(this.state.factoryTemplates ?? []).flatMap(template => template.nodes)]) {
      if (getNodeCapabilities(node.kind).behavior === 'planter') node.cycleMs = 250;
      node.name = canonicalNodeName(node.kind, node.name);
      if (node.modBaseName) node.modBaseName = canonicalNodeName(node.kind, node.modBaseName);
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
      syncGuardedResources(sector);
      for (const node of sector.nodes) {
        if (node.kind === 'lake') node.lakeIntakeOnly = usesNewWorldRules(this.state);
        // A committed Bot Plant batch still identifies its exact parts, even when its old AP bucket was shared.
        const botBuild = node.kind === 'botPlant' && node.batch && BOT_BUILD_BY_ID.get(node.batch.recipeId);
        if (botBuild && node.batch) node.batch.outputs = { ...botBuild.recipe.outputs };
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
      const reserved = this.reservedInput(target, item, pending);
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
    if (type === 'DepositDepleted') this.state.resourceDepletionLog = [event, ...(this.state.resourceDepletionLog ?? [])].slice(0, 16);
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
    let publishImmediately = false;
    for (const sector of sectors) publishImmediately = this.simulateSector(sector, dt, simulationLookups) || publishImmediately;
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
    if (publishImmediately || this.publishAccumulator >= 750) { this.publishAccumulator %= 750; this.publish(); }
    if (this.options.autosave !== false && this.autosaveAccumulator >= this.state.preferences.autosaveMinutes * 60000) {
      this.retryAutosave();
    }
  }

  private simulateSector(sector: SectorState, dt: number, lookups = new SimulationLookups(this.state)) {
    const baseDt = dt;
    syncGuardedResources(sector);
    updateCampEncroachment(sector.nodes);
    for (const supply of supplyDevInputs(this.state, sector, lookups, (target, item) => this.inputCapacity(target, item), {
      perItemCapacity: target => this.inputUsesPerItemCapacity(target),
      onSupply: (target,item) => this.selectRecyclerRecipeFromMaterial(target,item),
    })) {
      (this.state.inFlightTransfers ??= []).push({ ...supply, id: makeId('dev-pulse'), sectorId: sector.id, launchedAtMs: this.state.playTimeMs, arrivesAtMs: this.state.playTimeMs + modRule('cableTravelMs'), cosmeticOnly: true });
    }
    const depleted: string[] = [];
    let resourceDepleted = false;
    const filledHoles: MachineNode[] = [];
    const checkedCamps: MachineNode[] = [];
    for (const node of sector.nodes) {
      const dt = baseDt / (modNode(node.kind)?.cycleMultiplier ?? 1);
      if (node.disabled || Date.now() - node.constructedAt < node.constructionMs) continue;
      if (NODE_DEFINITIONS[node.kind].category === 'Logistics') node.processingPaused = false;
      if (node.processingPaused) continue;
      if (node.landmark === 'unknown') { simulateUnknownDevice(this.state, node, baseDt); continue; }
      if (node.landmark && !isNodeUnlocked(node.kind, this.state.research.unlocked)) continue;
      if(node.kind==='cornerChallenge'){simulateCorner(this.state,sector,node);continue;}
      if(node.kind==='cornerTribute')continue;
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
          syncGuardedResources(sector);
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
          node.name = `${target[0].toUpperCase()}${target.slice(1)}`;
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
            const period=modRule('forestRegenMs')/(1+endgameRank(this.state,'resourceRegeneration'))/forestTerrainRate(this.state, sector.id);
            if (node.regenMs >= period) { const q=Math.floor(node.regenMs/period);node.regenMs %= period; node.resourceRemaining = Math.min(node.resourceCapacity ?? 0, (node.resourceRemaining ?? 0) + q); }
          }
        }
        // The original deposits are passive reserves. Extractors mine them directly;
        // only lakes create a freely routed resource on their own timer.
        if (node.kind !== 'lake') {
          node.progressMs = 0;
          if (!node.guardedCampId && !node.infiniteResource && (node.resourceRemaining ?? 1) <= 0 && node.kind !== 'forest' && !this.state.research.completed.includes('mineralRegeneration')) depleted.push(node.id);
          continue;
        }
        if (usesNewWorldRules(this.state)) { node.output = {}; node.progressMs = 0; continue; }
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
        if (source?.guardedCampId && !guardedResourceAccessible(source, sector.nodes)) continue;
        const tri = node.landmark === 'tri';
        if (tri) node.triOutput ??= [0,0,0];
        if (tri && node.triOutput!.some(count => count >= 5)) continue;
        if (!resourceEdge || !source || !item || (!source.infiniteResource && (source.resourceRemaining ?? 0) <= 0) || (!tri && sum(node.output) >= 5)) { node.progressMs = 0; continue; }
        node.progressMs += dt;
        const duration = node.cycleMs * this.efficiencyMultiplier('extractor');
        if (node.progressMs >= duration) {
          node.progressMs %= duration;
          if (!source.infiniteResource) {
            source.resourceRemaining = Math.max(0, (source.resourceRemaining ?? 0) - 1);
            if (source.resourceRemaining === 0) {
              sector.resourceDepletionPending = true;
              resourceDepleted = true;
              this.event('DepositDepleted', `${ITEM_NAMES[item]} reserve depleted at ${mapNodePosition(sector.x, sector.y)}.`);
            }
          }
          node.output[item] = (node.output[item] ?? 0) + (tri ? 3 : 1);
          if (tri) node.triOutput = node.triOutput!.map(count => count + 1) as [number,number,number];
          if (isDwarvenGuardedDeposit(source, sector)) this.state.dwarvenMythrilProduced = true;
          const route = [...resourceRoute!.connections, resourceEdge];
          route.forEach(cable => { cable.item = item; });
          (this.state.inFlightTransfers ??= []).push({ id: makeId('pulse'), sectorId: sector.id, connectionId: route[0].id, routeConnectionIds: route.length > 1 ? route.map(cable => cable.id) : undefined, from: source.id, to: node.id, item, launchedAtMs: this.state.playTimeMs, arrivesAtMs: this.state.playTimeMs + modRule('cableTravelMs'), cosmeticOnly: true });
          this.recordProduced(item, tri ? 3 : 1, true);
          this.event('ItemProduced', `${node.name} extracted 1 ${item}.`);
        }
        continue;
      }
      if (hasNodeBehavior(node.kind, 'research')) { this.research.simulateResearch(node, dt); continue; }
      if (hasNodeBehavior(node.kind, 'planter')) { simulatePlanter(this.state, node, dt); continue; }
      if (node.kind === 'recycler' && !node.recipeId && !node.batch) {
        for (const [item, amount] of Object.entries(node.input) as [ItemId, number][]) {
          if (amount > 0) this.selectRecyclerRecipeFromMaterial(node, item);
          if (node.recipeId) break;
        }
      }
      const multiplier = landmarkMultiplier(node, this.state, this.efficiencyMultiplier(node.kind, node.batch?.recipeId ?? node.recipeId));
      if (simulateExtendedRecipe(this.state, node, dt, multiplier)) {
        if (node.kind === 'recycler' && node.recipeId && !node.batch) {
          const recipe = RECIPES[node.recipeId];
          const waitingMaterial = Object.entries(node.input).some(([item, amount]) => item !== 'water' && (amount ?? 0) > 0);
          const incomingMaterial = lookups.target(sector.id, node.id)?.transfers.some(transfer => transfer.item !== 'water');
          if (recipe && !sum(recipe.outputs) && !recipe.chanceOutputs?.length && !waitingMaterial && !incomingMaterial) {
            delete node.recipeId;
          }
        }
        continue;
      }
      const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
      if (!recipe || (SEVEN_CORES.includes(recipe.id as ItemId) && !isRecipeUnlocked(recipe.id, this.state.research.completed))) continue;
      const hasInputs = Object.entries(recipe.inputs).every(([item, count]) => (node.input[item as ItemId] ?? 0) >= (count ?? 0));
      const hasOutputRoom = sum(node.output) + sum(recipe.outputs) <= (modNode(node.kind)?.capacity ?? 5);
      if (!hasInputs || !hasOutputRoom) { node.progressMs = 0; continue; }
      node.progressMs += dt;
      const duration = recipe.cycleMs * multiplier;
      if (node.progressMs >= duration) {
        node.progressMs %= duration;
        Object.entries(recipe.inputs).forEach(([item, count]) => { node.input[item as ItemId] = (node.input[item as ItemId] ?? 0) - (count ?? 0); });
        Object.entries(recipe.outputs).forEach(([item, count]) => { node.output[item as ItemId] = (node.output[item as ItemId] ?? 0) + (count ?? 0); });
        Object.entries(recipe.outputs).forEach(([item, count]) => this.recordProduced(item as ItemId, count ?? 0));
        if (modNodeTemplate(node.kind) === 'refiner' && sum(recipe.outputs) > 0) this.state.hasProducedWithRefiner = true;
        this.event('ItemProduced', `${node.name} completed ${recipe.name}.`);
      }
    }
    depleted.forEach((id) => {
      if (!this.state.mod && !this.state.isTraining && !this.state.research.completed.includes('exploration')) return;
      if(this.state.research.completed.includes('mineralRegeneration'))return;
      const source = sector.nodes.find((node) => node.id === id);
      if (!source || sum(source.output) > 0) return;
      this.cancelTransfers(new Set(sector.connections.filter((connection) => connection.from === id || connection.to === id).map((connection) => connection.id)));
      source.kind = 'big-hole'; source.name = 'Deep Hole'; source.resourceItem = undefined; source.resourceRemaining = 250; source.holeBaseStone=250;source.holeStoneConsumed=0; source.resourceCapacity = undefined; source.obstructionRadius = 38 * Math.sqrt(10); source.input = {}; source.output = {}; source.progressMs = 0;
      source.holeOrigin = 'depletion';
      sector.connections = sector.connections.filter((connection) => connection.from !== id && connection.to !== id);
    });
    this.clearFilledHoles(sector, usesNewWorldRules(this.state) ? sector.nodes.filter(node=>node.kind==='big-hole'&&node.resourceRemaining===0) : filledHoles);
    if (usesNewWorldRules(this.state)) regenerateGuardedResources(this.state, sector, baseDt);
    this.removeDefeatedGolemCables(sector);
    this.removeInactiveTribute(sector);
    for (const camp of checkedCamps) {
      if (usesNewWorldRules(this.state)) continue;
      if (!isCampFullySuppressed(camp) || sector.nodes.some(node => node.kind === 'goblinTribute' && node.tributeCampId === camp.id)) continue;
      const tribute = createGoblinTribute(camp, sector.nodes, getWorldFieldSize(this.state));
      if (tribute) { sector.nodes.push(tribute); this.event('NodePlaced', `${camp.name} is suppressed and now supplies configurable tribute.`); }
    }
    sector.lastSimulatedAt = Date.now();
    return resourceDepleted || filledHoles.length > 0;
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
    if (node.landmark === 'tri') {
      if (node.resourceItem && node.resourceItem !== item) { node.triOutput = [0,0,0]; node.output = {}; node.progressMs = 0; }
      node.resourceItem = item;
    }
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
    if (extractor.landmark === 'tri' && (node.guardedCampId || node.infiniteResource || !['wood','stone','copper','iron'].includes(node.resourceItem ?? ''))) return;
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

  private efficiencyMultiplier(kind: NodeKind, recipeId?: string) {
    const prefix = getNodeCapabilities(kind).efficiencyFamily;
    return getRecipeEfficiencyMultiplier(recipeId, prefix, this.state.research.completed);
  }

  /** Commit one item only when both local wiring and the remote destination are ready. */
  private dispatchRoadItem(sector: SectorState, road: MachineNode, lookups: SimulationLookups) {
    return dispatchRoadItem(this.state, sector, road, lookups,
      (connection, item, owner, indexes) => this.resolveDeliveryRoute(connection, item, owner, indexes), makeId);
  }

  private inputCapacity(node: MachineNode, item: ItemId) {
    return this.transport.inputCapacity(node, item);
  }

  /** Original processors reserve a full ingredient buffer for every recipe input. */
  private inputUsesPerItemCapacity(node: MachineNode) {
    return this.transport.inputUsesPerItemCapacity(node);
  }

  private inputOccupancy(node: MachineNode, item: ItemId) {
    return this.transport.inputOccupancy(node, item);
  }

  private reservedInput(node: MachineNode, item: ItemId, pending: ReturnType<SimulationLookups['target']>) {
    return this.transport.reservedInput(node, item, pending);
  }

  private selectRecyclerRecipeFromMaterial(node: MachineNode, item: ItemId) {
    return this.transport.selectRecyclerRecipeFromMaterial(node, item);
  }

  private canAcceptAtInputPort(node: MachineNode, port: number, item: ItemId, sector: SectorState, lookups: SimulationLookups, ignoredTransferId?: string, routingPath = new Set<string>()) {
    return this.transport.canAcceptAtInputPort(node, port, item, sector, lookups, ignoredTransferId, routingPath);
  }

  /** Classify immediately; any required blocked outlet stops this whole Filter. */
  private filterBlockage(node: MachineNode, sector: SectorState, lookups: SimulationLookups, path = new Set([node.id]), candidate?: ItemId): MachineNode['filterBlocked'] {
    return this.transport.filterBlockage(node, sector, lookups, path, candidate);
  }

  private deliverTransfers(nowMs: number, sectorId?: string) {
    return this.transport.deliverTransfers(nowMs, sectorId);
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

  private migrateBasicGunRecipe() {
    if (this.state.basicGunRecipeVersion) return;
    const removed = new Set<string>();
    const layouts = [...Object.values(this.state.sectors), ...(this.state.factoryTemplates ?? [])];
    for (const layout of layouts) {
      const guns = new Set(layout.nodes.filter(node => node.recipeId === 'robot-gun').map(node => node.id));
      for (const node of layout.nodes.filter(node => guns.has(node.id))) {
        const iron = node.input['iron-plate'] ?? 0;
        const feed = layout.connections.find(edge => edge.to === node.id && edge.toPort === 1);
        const source = feed && layout.nodes.find(candidate => candidate.id === feed.from);
        if (iron > 0 && 'id' in layout) {
          if (source && (getNodeCapabilities(source.kind).behavior === 'buffer' || source.recipeId && RECIPES[source.recipeId]?.outputs['iron-plate'])) {
            returnOutput(source, 'iron-plate', iron);
          } else {
            const pool = this.state.globalPool ??= {};
            pool['iron-plate'] = (pool['iron-plate'] ?? 0) + iron;
          }
        }
        delete node.input['iron-plate'];
        if (node.inputPortOrder) node.inputPortOrder = node.inputPortOrder.filter(port => port !== 1).map(port => port === 2 ? 1 : port);
      }
      for (const edge of layout.connections.filter(edge => guns.has(edge.to))) {
        if (edge.toPort === 1) removed.add(edge.id);
        if (edge.toPort === 2) edge.toPort = 1;
      }
    }
    this.cancelTransfers(removed);
    for (const layout of layouts) layout.connections = layout.connections.filter(edge => !removed.has(edge.id));
    this.state.basicGunRecipeVersion = 1;
  }

  private cancelTransfers(connectionIds: Set<string>) {
    return this.transport.cancelTransfers(connectionIds);
  }

  private resolveDeliveryRoute(connection: Connection, item: ItemId, sector: SectorState, lookups: SimulationLookups) {
    return this.transport.resolveDeliveryRoute(connection, item, sector, lookups);
  }

  private routeSector(sector: SectorState, nowMs = this.state.playTimeMs, lookups = new SimulationLookups(this.state)) {
    return this.transport.routeSector(sector, nowMs, lookups);
  }


  private planNodePlacement(kind: NodeKind, x: number, y: number, preview = false) {
    return this.nodePlacementPlanner.planNodePlacement(kind, x, y, preview);
  }

  /** Returns the held node, placement validity, and the destination for a Road near its wall. */
  getNodePlacementPreview(kind: NodeKind, x: number, y: number) {
    return this.nodePlacementPlanner.getNodePlacementPreview(kind, x, y);
  }

  getNodePlacementError(kind: NodeKind, x: number, y: number) {
    return this.nodePlacementPlanner.getNodePlacementError(kind, x, y);
  }

  placeNode(kind: NodeKind, x: number, y: number) {
    const def = NODE_DEFINITIONS[kind]; const plan = this.planNodePlacement(kind, x, y);
    if (!def || !plan?.valid) return;
    this.checkpoint();
    if (plan.roadPair && plan.pairedNode) plan.roadPair.sector.nodes.push(plan.pairedNode);
    const node = plan.node;
    this.getSector().nodes.push(node);
    if (kind === 'devSource') this.state.devTutorialPromptsSuppressed = true;
    this.insertNodeOnCable(node);
    this.evaluateMilestones();
    this.event('NodePlaced', `${node.name} placed. Construction started.`);
    this.publish();
    return node.id;
  }
  createControlGroup(ids: string[], colorValue: string) {
    const sector = this.getSector();
    const plan = planControlGroupCreation(sector.nodes, ids, colorValue);
    if (!plan) return;
    const { nodeIds, color } = plan;
    this.checkpoint();
    const group = { id: makeId('control-group'), nodeIds, color: color.value, colorName: color.name };
    sector.controlGroups = regroupControlNodes(sector.controlGroups ?? [], group);
    this.publish();
    return group;
  }
  disbandControlGroup(id: string) {
    const sector = this.getSector();
    const groups = planControlGroupDisband(sector.controlGroups, id);
    if (!groups) return false;
    this.checkpoint();
    sector.controlGroups = groups;
    this.publish();
    return true;
  }


  private roadPairLayout(sector: SectorState, node: MachineNode, point: { x: number; y: number }) {
    return this.nodeMovementPlanner.roadPairLayout(sector, node, point);
  }


  getRoadMovePreview(id: string, point: { x: number; y: number }) {
    return this.nodeMovementPlanner.getRoadMovePreview(id, point);
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
    const plan = this.nodeMovementPlanner.planMove(positions);
    if (!plan) return false;
    if (!apply) return true;
    this.checkpoint();
    if (plan.kind === 'road') this.applyRoadMove(plan.sector, plan.node, plan.plan);
    else {
      const { sector, selected, proposals } = plan;
      proposals.forEach(({ node, proposed }) => { node.x = proposed.x; node.y = proposed.y; });
      updateCampEncroachment(sector.nodes);
      if (selected.length === 1 && getNodeModule(selected[0].kind).controls.movable) this.insertNodeOnCable(selected[0]);
    }
    return true;
  }

  private applyRoadMove(sector: SectorState, node: MachineNode, plan: NonNullable<ReturnType<GameEngine['roadPairLayout']>>) {
    node.x = plan.node.x; node.y = plan.node.y; node.roadFacing = plan.node.roadFacing;
    const { sector: neighbor, endpoint } = plan.road;
    plan.pair.x = endpoint.x; plan.pair.y = endpoint.y; plan.pair.roadFacing = endpoint.roadFacing;
    updateCampEncroachment(sector.nodes);
    updateCampEncroachment(neighbor.nodes);
  }

  private expandFieldLayouts(projectId: 'areaExpansion1'|'areaExpansion2') {
    const previousResearch={...this.state.research,completed:this.state.research.completed.filter(id=>id!==projectId)};
    const before=getWorldFieldSize({research:previousResearch,fieldSizeScale:this.state.fieldSizeScale});
    expandMapsAroundCenter(this.state,before,getWorldFieldSize(this.state));
    this.syncFieldLayouts();
  }

  private syncFieldLayouts() {
    syncCornerLayouts(this.state);
    const aligned = new Set<MachineNode>();
    for (const sector of Object.values(this.state.sectors)) {
      for (const node of sector.nodes) {
        if (!hasNodeBehavior(node.kind, 'road') || aligned.has(node)) continue;
        // A world resize reanchors existing endpoints; it is not a new placement.
        // Preserve their cables even when the stretched route crosses an obstruction.
        const plan = this.roadPairLayout(sector, node, node);
        if (!plan) continue;
        aligned.add(node); aligned.add(plan.pair);
        if ([plan.node.x - node.x, plan.node.y - node.y,
          plan.road.endpoint.x - plan.pair.x, plan.road.endpoint.y - plan.pair.y].some(delta => Math.abs(delta) > 1e-6)) {
          this.applyRoadMove(sector, node, plan);
        }
      }
    }
  }

  getCableInsertionPreview(node: MachineNode): { replacedConnectionId: string; connections: [Connection, Connection] } | undefined {
    return this.connectionPlanner.getCableInsertionPreview(node);
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
    const plan = this.connectionPlanner.planAutomaticConnection(from, to);
    return plan ? this.connectPorts(from, plan.fromPort, to, plan.toPort) : false;
  }

  getRoadTransportStatus(nodeId: string) {
    const sector = this.getSector(); const node = sector.nodes.find(n => n.id === nodeId);
    return node && hasNodeBehavior(node.kind, 'road') ? roadMaterialState(this.state, sector, node) : undefined;
  }

  getRoadConnectionError(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string) {
    return this.connectionPlanner.getRoadConnectionError(from, fromPort, to, toPort, replaceConnectionId);
  }

  /** Read-only explanation using the same checks as a committed cable. */
  getConnectionFailure(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string): { title: string; detail: string } | undefined {
    return this.connectionPlanner.getConnectionFailure(from, fromPort, to, toPort, replaceConnectionId);
  }

  connectPorts(from: string, fromPort: number, to: string, toPort: number, replaceConnectionId?: string) {
    const plan = this.connectionPlanner.planConnection(from, fromPort, to, toPort, replaceConnectionId);
    if (!plan) return false;
    const { sector, sourceNode, replaced } = plan;
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
  deleteNodes(ids: string[]) {
    const plan = planNodeDeletion(this.getSector(), ids);
    if (!plan) return;
    const { sector, deletable, removedConnectionIds } = plan;
    this.checkpoint();
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
    if (usesNewWorldRules(this.state)) for (const hole of holes) {
      const unused = (hole.input.stone ?? 0) + (hole.output.stone ?? 0);
      if (unused > 0) {
        const queue = sector.connections.filter(c => c.to === hole.id).map(c => c.from), visited = new Set<string>();
        let supplier: MachineNode | undefined;
        while (queue.length && !supplier) {
          const id = queue.shift()!;
          if (visited.has(id)) continue;
          visited.add(id);
          const node = sector.nodes.find(n => n.id === id);
          if (!node) continue;
          if (!getNodeCapabilities(node.kind).passThrough && !ids.has(id)) supplier = node;
          else queue.push(...sector.connections.filter(c => c.to === id).map(c => c.from));
        }
        if (supplier) returnOutput(supplier, 'stone', unused);
        else { this.state.globalPool ??= {}; this.state.globalPool.stone = (this.state.globalPool.stone ?? 0) + unused; }
      }
      sector.filledHoles ??= [];
      if (!sector.filledHoles.some(patch => patch.id === hole.id)) sector.filledHoles.push({ id: hole.id, x: hole.x, y: hole.y, rotation: hole.rotation, radius: hole.obstructionRadius ?? 38 });
      hole.input = {}; hole.output = {};
    }
    // Discard buffered surplus with the filled hole instead of creating a node.
    sector.nodes = sector.nodes.filter(node => !ids.has(node.id));
    sector.connections = sector.connections.filter(connection => !removedConnectionIds.has(connection.id));
    holes.forEach(() => {
      this.event('NodePlaced', 'Deep Hole filled in. The obstruction has been cleared.');
    });
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
  private captureNodeLayout(ids: readonly string[]): NodeLayoutCopy | undefined {
    const sector = this.getSector();
    const selected = new Set(ids);
    const nodes = sector.nodes.filter((n) => selected.has(n.id) && !n.landmark && !n.protected && isPlayerMovableNode(n.kind) &&
      getNodeCapabilities(n.kind).duplicateAllowed !== false && (!n.recipeId || RECIPE_GROUPS[n.kind]?.includes(n.recipeId)) &&
      ((NODE_DEFINITIONS[n.kind].category !== 'Storage' && !isCartKind(n.kind)) || isNodeUnlocked(n.kind, this.state.research.unlocked)));
    if (!nodes.length) return;
    const copied = new Set(nodes.map(node => node.id));
    return clone({ nodes: nodes.map(node => ({ ...freshLayoutNode(node), groupId: undefined })),
      connections: sector.connections.filter(cable => copied.has(cable.from) && copied.has(cable.to)),
      controlGroups: sector.controlGroups?.filter(group => group.nodeIds.every(id => copied.has(id))),
    });
  }

  copyNodes(ids: readonly string[]) {
    const layout = this.captureNodeLayout(ids);
    if (!layout) return false;
    this.copiedLayout = layout;
    return true;
  }

  hasCopiedNodes() { return this.copiedLayout !== undefined; }

  getPastePreview(center: { x: number; y: number }) {
    const layout = this.copiedLayout;
    if (!layout) return;
    const offset = {
      x: center.x - (Math.min(...layout.nodes.map(node => node.x)) + Math.max(...layout.nodes.map(node => node.x))) / 2,
      y: center.y - (Math.min(...layout.nodes.map(node => node.y)) + Math.max(...layout.nodes.map(node => node.y))) / 2,
    };
    const nodes = this.offsetLayoutNodes(layout, offset);
    const unlocked = layout.nodes.every(({ kind, recipeId }) => isNodeUnlocked(kind, this.state.research.unlocked) &&
      (!recipeId || (RECIPE_GROUPS[kind]?.includes(recipeId) && isRecipeUnlocked(recipeId, this.state.research.completed) &&
        worldRecipeAllowed(recipeId, this.state))));
    return { nodes, connections: layout.connections, valid: unlocked && this.canPlaceNodeLayout(nodes, layout.connections) };
  }

  pasteNodes(center: { x: number; y: number }) {
    const preview = this.getPastePreview(center);
    return preview?.valid && this.copiedLayout ? this.placeNodeLayout(this.copiedLayout, preview.nodes) : [];
  }

  duplicateNodes(ids: string[]) {
    const layout = this.captureNodeLayout(ids);
    if (!layout) return [];
    const step = Math.max(150, ...layout.nodes.map((node) => Math.max(getNodeSize(node).w, getNodeSize(node).h) + 30));
    const offsets: Array<{ x: number; y: number }> = [];
    for (let ring = 1; ring <= 12; ring++) {
      for (let x = -ring; x <= ring; x++) offsets.push({ x: x * step, y: -ring * step }, { x: x * step, y: ring * step });
      for (let y = -ring + 1; y < ring; y++) offsets.push({ x: -ring * step, y: y * step }, { x: ring * step, y: y * step });
    }
    for (const offset of offsets) {
      const nodes = this.offsetLayoutNodes(layout, offset);
      if (this.canPlaceNodeLayout(nodes, layout.connections)) return this.placeNodeLayout(layout, nodes);
    }
    return [];
  }

  private offsetLayoutNodes(layout: NodeLayoutCopy, offset: { x: number; y: number }) {
    return layout.nodes.map(node => ({ ...node, x: node.x + offset.x, y: node.y + offset.y }));
  }

  private canPlaceNodeLayout(nodes: MachineNode[], connections: Connection[]) {
    const sector = this.getSector();
    const field = getWorldFieldSize(this.state);
    if (!nodes.every(node => nodeInsideField(node, field) && !sector.nodes.some(other => nodesOverlap(node, other)))) return false;
    const byId = new Map(nodes.map(node => [node.id, node]));
    return connections.every(({ from, to, fromPort = 0, toPort = 0 }) =>
      !connectionBlockedByWorld(byId.get(from)!, byId.get(to)!, { fromPort, toPort }, sector.nodes));
  }

  private placeNodeLayout(layout: NodeLayoutCopy, nodes: MachineNode[]) {
    const sector = this.getSector();
    const now = Date.now();
    const copyIds = new Map(nodes.map(node => [node.id, makeId(node.kind)]));
    const copies = nodes.map(node => ({ ...clone(node), id: copyIds.get(node.id)!, constructedAt: now }));
    this.checkpoint();
    sector.nodes.push(...copies);
    const copiedConnections = layout.connections.map(c => ({ ...c, id: makeId('cable'), from: copyIds.get(c.from)!, to: copyIds.get(c.to)!, createdAt: now, batchCredit: undefined }));
    sector.connections.push(...copiedConnections);
    sector.controlGroups = [...(sector.controlGroups ?? []), ...copyControlGroups(layout.controlGroups ?? [], copyIds, () => makeId('control-group'))];
    this.publish();
    return copies.map((n) => n.id);
  }
  copyRecipe(sourceId: string, targetId: string) {
    const nodes = this.getSector().nodes;
    const source = nodes.find(node => node.id === sourceId);
    const target = nodes.find(node => node.id === targetId);
    if (!source?.recipeId || !target || source.id === target.id || source.kind !== target.kind || source.kind === 'recycler' || source.disabled || target.disabled) return false;
    return this.setRecipe(target.id, source.recipeId);
  }
  setRecipe(nodeId: string, recipeId: string) {
    const sector = this.getSector();
    const node = sector.nodes.find((n) => n.id === nodeId);
    if (!node || (node.landmark && (!isNodeUnlocked(node.kind, this.state.research.unlocked) || !RECIPES[recipeId] || !landmarkRecipeAllowed(node, RECIPES[recipeId]))) || getNodeCapabilities(node.kind).behavior === 'bot-assembly' || node.batch || !RECIPES[recipeId] || !RECIPE_GROUPS[node.kind]?.includes(recipeId) || !isRecipeUnlocked(recipeId,this.state.research.completed) || !worldRecipeAllowed(recipeId,this.state)) return false;
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
  acknowledgeCornerDiscovery(cornerId?: string) {
    if (!cornerDiscoveryPending(this.state, cornerId)) return;
    const endgame = this.state.endgame!;
    if (cornerId === undefined) endgame.cornerMapAcknowledged = true;
    else (endgame.acknowledgedCorners ??= []).push(cornerId);
    this.publish();
  }
  acknowledgeVictory() { if(this.state.endgame&&this.state.research.completed.includes('victory')) {this.state.endgame.victoryAcknowledged=true;this.publish();} }
  selectResearch(id?: string) { this.research.selectResearch(id); }
  queueResearch(id: string, options?: QueueResearchOptions) { return this.research.queueResearch(id, options); }
  removeQueuedResearch(id: string) { this.research.removeQueuedResearch(id); }
  releasePriorityResearch(id: string) { this.research.releasePriorityResearch(id); }
  setResearchPaused(paused: boolean) { this.research.setResearchPaused(paused); }
  startMapResearch(x: number, y: number) { return this.research.startMapResearch(x, y); }

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
    return this.roadCommands.getRoadReversalError(nodeId);
  }
  reverseRoad(nodeId: string) {
    return this.roadCommands.reverseRoad(nodeId);
  }
  /** Either endpoint selects the single direction for this entire pair. */
  setRoadDirection(nodeId: string, direction: 'export' | 'import') {
    return this.roadCommands.setRoadDirection(nodeId, direction);
  }
  updatePreferences(patch: Partial<GameState['preferences']>) { Object.assign(this.state.preferences, patch); this.publish(); }
  developerSuppressTutorialPrompts() {
    if (this.state.devTutorialPromptsSuppressed) return;
    this.state.devTutorialPromptsSuppressed = true;
    this.publish();
  }
  developerUnlockAllNodes() {
    this.checkpoint();
    this.state.devTutorialPromptsSuppressed = true;
    const requirements = Object.values(NODE_DEFINITIONS).map((definition) => definition.unlockResearch).filter((id): id is string => Boolean(id));
    this.state.research.unlocked = [...new Set([...this.state.research.unlocked, ...requirements])];
    this.publish();
  }
  developerUnlockAllResearch() {
    this.checkpoint();
    const previousField=getWorldFieldSize(this.state);
    this.state.devTutorialPromptsSuppressed = true;
    this.state.devResearchUnlocked = true;
    const permanent = RESEARCH_PROJECTS.filter((project) => !project.repeatable).map((project) => project.id);
    this.state.research.unlocked = [...new Set([...this.state.research.unlocked, ...RESEARCH_PROJECTS.map((project) => project.id)])];
    this.state.research.completed = [...new Set([...this.state.research.completed, ...permanent])];
    this.state.research.selected = undefined;
    this.state.research.contributed = {};
    this.state.research.mapPoints = Math.max(this.state.research.mapPoints, worldGridSize(this.state) ** 2);
    this.research.resetResearchCycles();
    applyCartUpgrades(this.state);
    expandMapsAroundCenter(this.state,previousField,getWorldFieldSize(this.state));
    this.syncFieldLayouts();
    this.publish();
  }
  developerUnlockAllSectors() {
    this.checkpoint();
    this.state.devTutorialPromptsSuppressed = true;
    this.developerMapRevealUndo.add(this.history[this.history.length-1]);
    const size = worldGridSize(this.state);
    const { min, max } = worldGridBounds(size);
    for (let y = min; y <= max; y++) for (let x = min; x <= max; x++) {
      const sector = this.ensureSector(x, y);
      sector.unlocked = true;
      sector.visited = true;
      this.state.sectors[sector.id] = sector;
    }
    this.state.devMapSurveysRevealed = true;
    discoverActiveSector(this.state);
    this.state.research.mapPoints = Math.max(this.state.research.mapPoints, size ** 2);
    this.publish();
  }
  setTutorialStep(step: number) { this.state.tutorialStep = step; this.publish(); }
  setCamera(camera: SectorState['camera']) { this.getSector().camera = camera; }
  renameSector(name: string, label: string, sectorId = this.state.activeSectorId) { const s = this.state.sectors[sectorId]; if (!s?.unlocked) return; s.name = name.trim().slice(0, 30) || (s.id === '5,5' ? 'Home Sector' : `Sector ${s.x}.${s.y}`); s.label = label.trim().slice(0, 3).toUpperCase() || (s.id === '5,5' ? 'HME' : `S${sectorDistance(s.x, s.y)}`.slice(0, 3)); this.publish(); }
  undo() { const previous = this.history.pop(); if (previous) {
    retainUndoKnowledge(previous, this.state, { restoringMapReveal: this.developerMapRevealUndo.has(previous) });
    this.state = previous;
    if (this.realtimeTickAt !== undefined) this.startRealtimeClock();
    activateMod(this.state.mod); initializeProgression(this.state); applyCartUpgrades(this.state); applyModNames(this.state); this.evaluateMilestones(); this.publish();
  } }
  replaceState(state: GameState) {
    const next = clone(state);
    if (next.mod) next.mod = validateMod(next.mod);
    this.state = next;
    if (this.realtimeTickAt !== undefined) this.startRealtimeClock();
    activateMod(this.state.mod);
    applyModNames(this.state);
    initializeStateCollections(this.state);
    this.normalizeExtractorCycles();
    applyModNames(this.state);
    this.research.reconcileResearchSelection();
    this.pruneLockedForestInputs();
    this.history = [];
    this.publish();
  }
  unlockSector(x: number, y: number) {
    if (usesNewWorldRules(this.state) && mapPurchaseProtected(this.state,sectorId(x,y))) return false;
    if (this.state.research.mapPoints < 1 || !canPurchaseMap(this.state, x, y)) return false;
    this.checkpoint();
    if (!this.openFundedSector(sectorId(x, y))) return false;
    this.state.research.mapPoints--;
    this.publish();
    return true;
  }
  private openFundedSector(destination: string) {
    const [x, y] = destination.split(',').map(Number);
    if (!canPurchaseMap(this.state, x, y)) return false;
    const sector = this.ensureSector(x, y);
    sector.unlocked = true;
    this.state.sectors[destination] = sector;
    return true;
  }
  /** Road travel focuses its reciprocal endpoint instead of the map's saved center. */
  travelThroughRoad(nodeId: string, viewport: FieldViewport, overviewSize?: {width:number;height:number}) {
    const pair=roadTravelPair(this.state,nodeId);
    if(!pair) return;
    pair.sector.camera=focusedFieldCamera(this.getSector().camera.zoom,pair.road,getWorldFieldSize(this.state),viewport,overviewSize);
    this.switchSector(pair.sector.id);
    return pair.road.id;
  }
  /** Player navigation carries zoom; scripted switches retain their authored views. */
  travelToSector(id: string, viewport: FieldViewport, overviewSize?: { width: number; height: number }) {
    const sector = this.state.sectors[id];
    if (!sector?.unlocked || id === this.state.activeSectorId) return;
    sector.camera = sectorTravelCamera(this.getSector().camera.zoom, getWorldFieldSize(this.state), viewport, sector.visited ? sector.camera : undefined, overviewSize);
    this.switchSector(id);
  }
  switchSector(id: string, firstVisitCamera?: SectorState['camera']) {
    const sector = this.state.sectors[id]; if (!sector?.unlocked) return;
    syncCornerLayout(sector, getWorldFieldSize(this.state), this.state);
    if (!sector.visited && firstVisitCamera) sector.camera = { ...firstVisitCamera };
    if (id !== this.state.activeSectorId) delete sector.resourceDepletionPending;
    this.state.activeSectorId = id; discoverActiveSector(this.state);this.evaluateMilestones();this.publish();
  }
  ensureSector(x: number, y: number) {
    activateMod(this.state.mod);
    return sectorForState(this.state, x, y);
  }
  sectorLevel() { const s = this.getSector(); return sectorDistance(s.x, s.y); }
}
