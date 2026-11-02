import { FactoryTemplateRuntime } from './factoryTemplateRuntime';
import { ResearchRuntime } from './researchRuntime';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, isResourceBehavior } from '../content/nodeCapabilities';
import { getSmartRecipeForInput, isSmartRecipeInput, isRecipeUnlocked, RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { RESEARCH_PROJECTS } from '../content/research';
import { getEfficiencyMultiplier } from '../content/efficiency';
import { migrateRetiredNodes } from '../content/retiredNodes';
import { CONTROL_GROUP_COLORS, copyControlGroups, normalizeControlGroups, regroupControlNodes } from '../domain/controlGroups';
import type { Connection, GameEvent, GameState, InFlightTransfer, ItemId, MachineNode, NodeKind, SectorState } from '../domain/types';
import { generateSector, sectorDistance, sectorId } from './worldGeneration';
import { logisticsRoute } from './logisticsRoutes';
import { isTutorialUnlocked, type ProgressiveTutorialKind } from '../tutorials/tutorialUnlocks';
import { cablesUnderNode } from './cableInsertion';
import { canPlaceNode } from './collisions';
import { getSectorWorldSize } from './worldGeneration';
import { connectionBlockedByWorld, connectionObstruction, inputPortAcceptsItem, portFamilyAcceptsItem, portFamiliesCompatible, resolveConnectionPlan, resolveExactConnectionPlan } from './connectionRules';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { CONNECTOR_MIRRORING_RESEARCH, isProductionMachine } from '../content/productionNodes';
import { CABLE_TRANSFER_DURATION_MS } from './transfers';
import { getNodeSize } from '../domain/nodeGeometry';
import { FILTERABLE_ITEMS, ITEM_NAMES } from '../content/items';
import { SimulationLookups } from './simulationLookups';
import { WASTE_ITEMS } from '../content/progression';
import { getGoblinAttackRequirement, GOBLIN_CHECK_INTERVAL_MS } from '../content/goblinSettlements';
import { createGoblinTribute, getTributeItems, produceGoblinTribute, type TributeItem } from './goblinTribute';
import { roadConnectionError, roadInputAccepts, roadMaterialState } from './roadMaterials';
import { initializeProgression, discoverActiveSector, simulateProgressionNode, simulateExtendedRecipe, attackPower, consumeBots, placementLimit, connectionLimit, roadChannels } from './progression';

const clone = <T,>(value: T): T => structuredClone(value);
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
const sum = (bag: Partial<Record<ItemId, number>>) => Object.values(bag).reduce((a, b) => a + (b ?? 0), 0);
const nonItemFamilies = new Set(['FLUID', 'WASTE','ANY', 'RESOURCE', 'METAL', 'PLATE', 'GEAR', 'CORE', 'ROBOT_FRAME', 'ROBOT_WEAPON', 'ATTACK_POWER', 'POWER']);
const concreteOutputItem = (node: MachineNode, port: number) => {
  if ((node.kind === 'smelter' || (node.kind === 'refiner' && node.recipeId?.match(/-(gear|wire)$/))) &&
    sum(node.input) === 0 && sum(node.output) === 0 && node.progressMs === 0) return undefined;
  const family = getEffectiveNodeOutputFamilies(node)[port];
  return family && !nonItemFamilies.has(family) ? family as ItemId : undefined;
};

export { createInitialState } from './createInitialState';
import { createInitialState } from './createInitialState';
import { AUTOSAVE_KEY } from '../persistence/storageKeys';

export class GameEngine {
  private readonly templates = new FactoryTemplateRuntime(
    () => this.state, () => this.checkpoint(), () => this.publish(), makeId,
  );
  private readonly research = new ResearchRuntime(
    () => this.state,
    () => this.publish(),
    (type, message, projectId) => this.event(type, message, projectId),
    kind => this.efficiencyMultiplier(kind),
  );
  private state: GameState;
  private listeners = new Set<() => void>();
  private history: GameState[] = [];
  private transferAccumulator = 0;
  private publishAccumulator = 0;
  private autosaveAccumulator = 0;
  private visibleTransferSource?: InFlightTransfer[];
  private visibleTransferCount = -1;
  private visibleTransferSectorId?: string;
  private visibleTransfers: InFlightTransfer[] = [];

  constructor(initial?: GameState, private readonly options: { autosave?: boolean } = {}) {
    this.state = initial ? clone(initial) : createInitialState();
    this.state.produced ??= {};
    this.state.extracted ??= {};
    this.state.hasCreatedConnection ??= false;
    this.state.research.completed ??= [];
    this.state.research.repeatableCompletions ??= {};
    this.state.research.projectContributions ??= {};
    this.state.inFlightTransfers ??= [];
    this.normalizeExtractorCycles();
    this.research.reconcileResearchSelection();
    this.pruneLockedForestInputs();
    this.evaluateMilestones();
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getState = () => this.state;
  getSector = () => this.state.sectors[this.state.activeSectorId];
  private normalizeExtractorCycles() {
    migrateRetiredNodes(this.state);
    initializeProgression(this.state);
    for (const sector of Object.values(this.state.sectors)) {
      for (const node of sector.nodes) {
        if (NODE_DEFINITIONS[node.kind].category === 'Logistics') node.processingPaused = false;
        if (node.kind === 'extractor') node.cycleMs = 5000;
        if (node.kind === 'forest' && node.name === 'Wild Forest') node.name = 'Forest';
        if (node.kind === 'big-hole' && ['Big Hole', 'Depletion Hole'].includes(node.name)) node.name = 'Deep Hole';
        if (['woodenChest', 'chest'].includes(node.kind) && /^Wooden Chest(?: \d+)?$/.test(node.name)) node.name = node.name.replace('Wooden Chest', 'Chest');
        if (hasNodeBehavior(node.kind, 'road') && !node.roadFacing && node.pairedSectorId) {
          const [x, y] = node.pairedSectorId.split(',').map(Number);
          node.roadFacing = x < sector.x ? 'east' : x > sector.x ? 'west' : y < sector.y ? 'south' : 'north';
        }
      }
    }
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
  private event(type: GameEvent['type'], message: string, projectId?: string) {
    const event: GameEvent = { id: makeId('event'), type, message, at: Date.now(), ...(projectId ? { projectId, elapsedMs: this.state.playTimeMs } : {}) };
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

  tick(deltaMs: number) {
    if (this.state.paused) return;
    const dt = Math.min(deltaMs, 1000);
    this.state.playTimeMs += dt;
    this.transferAccumulator += dt;
    this.publishAccumulator += dt;
    this.autosaveAccumulator += dt;
    this.deliverTransfers(this.state.playTimeMs);
    const sectors = Object.values(this.state.sectors).filter((s) => s.unlocked);
    const simulationLookups = new SimulationLookups(this.state);
    sectors.forEach((sector) => this.simulateSector(sector, dt, simulationLookups));
    this.evaluateMilestones();
    if (this.transferAccumulator >= 400) {
      this.transferAccumulator %= 400;
      let launched = false;
      const routingLookups = new SimulationLookups(this.state);
      sectors.forEach((sector) => { launched = this.routeSector(sector, this.state.playTimeMs, routingLookups) || launched; });
      if (launched) this.publish();
    }
    if (this.publishAccumulator >= 750) { this.publishAccumulator %= 750; this.publish(); }
    if (this.options.autosave !== false && this.autosaveAccumulator >= this.state.preferences.autosaveMinutes * 60000) {
      this.autosaveAccumulator = 0;
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(this.state));
    }
  }

  private simulateSector(sector: SectorState, dt: number, lookups = new SimulationLookups(this.state)) {
    const depleted: string[] = [];
    const filledHoles: string[] = [];
    const checkedCamps: MachineNode[] = [];
    for (const node of sector.nodes) {
      if (node.disabled || Date.now() - node.constructedAt < node.constructionMs) continue;
      if (NODE_DEFINITIONS[node.kind].category === 'Logistics') node.processingPaused = false;
      if (node.processingPaused) continue;
      if (node.kind === 'goblinTribute') {
        produceGoblinTribute(this.state, node, sector.nodes.find(camp => camp.id === node.tributeCampId && camp.kind === 'monster-camp'), dt);
        continue;
      }
      if (simulateProgressionNode(this.state,sector,node,dt,lookups)) continue;
      if (node.kind === 'monster-camp') {
        node.progressMs += dt;
        if (node.progressMs >= GOBLIN_CHECK_INTERVAL_MS) {
          node.progressMs %= GOBLIN_CHECK_INTERVAL_MS;
          const attack = attackPower(node);
          const requirement = getGoblinAttackRequirement(node);
          node.suppressed = attack >= requirement;
          checkedCamps.push(node);
          node.campStrength = attack >= requirement ? Math.max(10, (node.campStrength ?? 25) - 10) : Math.min(100, (node.campStrength ?? 25) + 10);
          consumeBots(node);
          const radius = 65 + (node.campStrength ?? 25) * 3.2;
          sector.nodes.forEach((candidate) => {
            if (candidate.id === node.id || isResourceBehavior(candidate.kind)) return;
            candidate.disabled = Math.hypot(candidate.x - node.x, candidate.y - node.y) < radius;
          });
        }
        continue;
      }
      if (node.kind === 'big-hole') {
        const stone = node.input.stone ?? 0;
        if (stone > 0) { node.input.stone = stone - 1; node.resourceRemaining = Math.max(0, (node.resourceRemaining ?? 250) - 1); }
        if ((node.resourceRemaining ?? 1) <= 0) filledHoles.push(node.id);
        continue;
      }
      if (hasNodeBehavior(node.kind,'road')) {
        if (node.kind === 'fluidRoad') continue;
        if (node.roadMode === 'export') {
          node.progressMs += dt;
          if (node.progressMs >= 5000) {
            node.progressMs %= 5000;
            const pairSector = node.pairedSectorId ? this.state.sectors[node.pairedSectorId] : undefined;
            const pair = pairSector && node.pairedRoadId ? lookups.sector(pairSector).nodes.get(node.pairedRoadId) : undefined;
            if (pair && !pair.disabled) {
              const material = roadMaterialState(this.state, sector, node);
              if (material.mixed || material.fluid) continue;
              const chestEdge=lookups.sector(sector).incoming.get(node.id)?.find(c=>Boolean(lookups.sector(sector).nodes.get(c.from) && hasNodeBehavior(lookups.sector(sector).nodes.get(c.from)!.kind,'buffer')));
              const chest=chestEdge?lookups.sector(sector).nodes.get(chestEdge.from):undefined;
              const bags=chest?[chest.input,chest.output]:[node.input];
              const limit=20;
              // Every material uses the same single-item, five-second dispatch.
              // Missed trips never accumulate into a catch-up batch.
              const amount=Math.max(0,Math.min(1,limit-sum(pair.output),bags.reduce((n,b)=>n+sum(b),0)));
              if(amount>0){
                let remaining=amount;
                for(const bag of bags)for(const item of Object.keys(bag)as ItemId[]){
                  if (material.materials.length && material.materials[0] !== item) continue;
                  const moved=Math.min(remaining,bag[item]??0);
                  if(moved<=0)continue;
                  pair.output[item]=(pair.output[item]??0)+moved;
                  bag[item]=(bag[item]??0)-moved;
                  remaining-=moved;
                }
              }
            }
          }
        }
        continue;
      }
      if (node.kind === 'storage') continue;
      if (hasNodeBehavior(node.kind, 'buffer')) {
        node.transferProgressMs = (node.transferProgressMs ?? 0) + dt;
        if (node.transferProgressMs >= 2000) {
          node.transferProgressMs %= 2000;
          const keys = Object.keys(node.input) as ItemId[];
          const start = (node.bufferAlternator ?? 0) % Math.max(1, keys.length);
          const item = keys.map((_, offset) => keys[(start + offset) % keys.length]).find((key) => (node.input[key] ?? 0) > 0);
          if (item && sum(node.output) < 20) { node.input[item]!--; node.output[item] = (node.output[item] ?? 0) + 1; node.bufferAlternator = (keys.indexOf(item) + 1) % keys.length; }
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
          if (growth > 0 && (node.resourceRemaining ?? 0) < (node.resourceCapacity ?? 0)) { node.input['forest-growth'] = growth - 1; node.resourceRemaining = (node.resourceRemaining ?? 0) + 1; }
          if ((node.resourceRemaining ?? 0) >= (node.resourceCapacity ?? 0)) node.regenMs = 0;
          else {
            node.regenMs = (node.regenMs ?? 0) + dt;
            if (node.regenMs >= 30000) { node.regenMs %= 30000; node.resourceRemaining = Math.min(node.resourceCapacity ?? 0, (node.resourceRemaining ?? 0) + 1); }
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
        if (sum(node.output) >= (node.capacity ?? 5)) continue;
        node.progressMs += dt;
        if (node.progressMs >= node.cycleMs) {
          node.progressMs %= node.cycleMs;
          node.output[item] = (node.output[item] ?? 0) + 1;
        }
        continue;
      }
      if (node.kind === 'extractor') {
        const resourceEdge = lookups.sector(sector).incoming.get(node.id)?.find((connection) => (connection.toPort ?? 0) === 0);
        const resourceRoute = resourceEdge ? this.resolveResourceRoute(sector, resourceEdge.from, lookups) : undefined;
        const source = resourceRoute?.source;
        const item = source?.resourceItem;
        if (!resourceEdge || !source || !item || (!source.infiniteResource && (source.resourceRemaining ?? 0) <= 0) || sum(node.output) >= 5) { node.progressMs = 0; continue; }
        node.progressMs += dt;
        const duration = node.cycleMs * this.efficiencyMultiplier('extractor');
        if (node.progressMs >= duration) {
          node.progressMs %= duration;
          if (!source.infiniteResource) source.resourceRemaining = Math.max(0, (source.resourceRemaining ?? 0) - 1);
          node.output[item] = (node.output[item] ?? 0) + 1;
          const route = [...resourceRoute!.connections, resourceEdge];
          route.forEach(cable => { cable.item = item; });
          (this.state.inFlightTransfers ??= []).push({ id: makeId('pulse'), sectorId: sector.id, connectionId: route[0].id, routeConnectionIds: route.length > 1 ? route.map(cable => cable.id) : undefined, from: source.id, to: node.id, item, launchedAtMs: this.state.playTimeMs, arrivesAtMs: this.state.playTimeMs + CABLE_TRANSFER_DURATION_MS, cosmeticOnly: true });
          this.recordProduced(item, 1, true);
          this.event('ItemProduced', `${node.name} extracted 1 ${item}.`);
        }
        continue;
      }
      if (hasNodeBehavior(node.kind, 'research')) { this.research.simulateResearch(node, dt); continue; }
      if (hasNodeBehavior(node.kind, 'generator')) {
        if ((node.input.charcoal ?? 0) > 0 && (node.output.power ?? 0) <= 50) {
          node.progressMs += dt;
          if (node.progressMs >= 1000) { node.progressMs %= 1000; node.input.charcoal!--; node.output.power = (node.output.power ?? 0) + 50; }
        }
        continue;
      }
      if (hasNodeBehavior(node.kind, 'planter')) {
        if ((node.input.power ?? 0) >= 5 && sum(node.output) < 5) {
          node.progressMs += dt;
          const cycle=this.state.research.completed.includes('treePlanter1')?900:1000;
          if (node.progressMs >= cycle) { node.progressMs %= cycle; node.input.power = (node.input.power ?? 0) - 5; node.output['forest-growth'] = (node.output['forest-growth'] ?? 0) + 1; }
        }
        continue;
      }
      if(simulateExtendedRecipe(this.state,node,dt,this.efficiencyMultiplier(node.kind)))continue;
      const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
      if (!recipe) continue;
      const hasInputs = Object.entries(recipe.inputs).every(([item, count]) => (node.input[item as ItemId] ?? 0) >= (count ?? 0));
      const hasOutputRoom = sum(node.output) + sum(recipe.outputs) <= 5;
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
      source.kind = 'big-hole'; source.name = 'Deep Hole'; source.resourceItem = undefined; source.resourceRemaining = 250; source.resourceCapacity = undefined; source.obstructionRadius = 38 * Math.sqrt(10); source.input = {}; source.output = {}; source.progressMs = 0;
      sector.connections = sector.connections.filter((connection) => connection.from !== id && connection.to !== id);
      this.event('DepositDepleted', 'A depleted deposit collapsed into a Deep Hole.');
    });
    if (filledHoles.length) {
      const filledConnectionIds = new Set(sector.connections.filter((connection) => filledHoles.includes(connection.to)).map((connection) => connection.id));
      this.cancelTransfers(filledConnectionIds);
      sector.connections = sector.connections.filter((connection) => !filledHoles.includes(connection.to));
    }
    const defeatedGolemIds = new Set(sector.nodes.filter(node => node.infiniteResource && node.golemMineral).map(node => node.id));
    const defeatedGolemCables = new Set(sector.connections.filter(connection => defeatedGolemIds.has(connection.to)).map(connection => connection.id));
    if (defeatedGolemCables.size) {
      this.cancelTransfers(defeatedGolemCables);
      sector.connections = sector.connections.filter(connection => !defeatedGolemCables.has(connection.id));
    }
    const expiredTribute = new Set(sector.nodes.filter(node => node.kind === 'goblinTribute' &&
      !sector.nodes.some(camp => camp.kind === 'monster-camp' && camp.id === node.tributeCampId && camp.suppressed)).map(node => node.id));
    if (expiredTribute.size) {
      this.cancelTransfers(new Set(sector.connections.filter(c => expiredTribute.has(c.from) || expiredTribute.has(c.to)).map(c => c.id)));
      sector.nodes = sector.nodes.filter(node => !expiredTribute.has(node.id));
      sector.connections = sector.connections.filter(c => !expiredTribute.has(c.from) && !expiredTribute.has(c.to));
    }
    for (const camp of checkedCamps) {
      if (!camp.suppressed || sector.nodes.some(node => node.kind === 'goblinTribute' && node.tributeCampId === camp.id)) continue;
      const tribute = createGoblinTribute(camp, sector.nodes, getSectorWorldSize(sector, this.state.research.completed));
      if (tribute) { sector.nodes.push(tribute); this.event('NodePlaced', `${camp.name} is suppressed and now supplies configurable tribute.`); }
    }
    sector.lastSimulatedAt = Date.now();
  }

  private resolveResourceRoute(sector: SectorState, nodeId: string, lookups: SimulationLookups, visited = new Set<string>()): { source: MachineNode; connections: Connection[] } | undefined {
    if (visited.has(nodeId)) return undefined;
    visited.add(nodeId);
    const index = lookups.sector(sector);
    const node = index.nodes.get(nodeId);
    if (!node || node.disabled) return;
    if (node.resourceItem && node.kind !== 'lake') return { source: node, connections: [] };
    if (!getNodeCapabilities(node.kind).passThrough) return;
    for (const incoming of index.incoming.get(nodeId) ?? []) {
      const route = this.resolveResourceRoute(sector, incoming.from, lookups, visited);
      if (route && (route.source.infiniteResource || (route.source.resourceRemaining ?? 0) > 0) && (node.kind !== 'filter' || !node.filterItem || node.filterItem === route.source.resourceItem)) return { source: route.source, connections: [...route.connections, incoming] };
    }
    return undefined;
  }

  private efficiencyMultiplier(kind: NodeKind) {
    const prefix = getNodeCapabilities(kind).efficiencyFamily;
    return getEfficiencyMultiplier(prefix, this.state.research.completed);
  }

  private inputCapacity(node: MachineNode, _item: ItemId) {
    if (node.kind === 'monster-camp') return Math.max(5, getGoblinAttackRequirement(node));
    if(node.kind==='lakeIntake')return 64;
    return getNodeCapabilities(node.kind).inputCapacity ?? 5;
  }

  /** Original processors reserve a full ingredient buffer for every recipe input. */
  private inputUsesPerItemCapacity(node: MachineNode) {
    return Boolean(getNodeCapabilities(node.kind).perItemInputCapacity || (node.recipeId && RECIPES[node.recipeId]));
  }

  private inputOccupancy(node: MachineNode, item: ItemId) {
    return this.inputUsesPerItemCapacity(node) ? (node.input[item] ?? 0) : sum(node.input);
  }

  private smartInputLocked(node: MachineNode, sector: SectorState, lookups: SimulationLookups, ignoredTransferId?: string) {
    if (sum(node.output) > 0 || node.progressMs > 0) return true;
    const smartBuffered = (Object.keys(node.input) as ItemId[]).some((item) =>
      (node.input[item] ?? 0) > 0 && Boolean(getSmartRecipeForInput(node, item))
    );
    if (smartBuffered) return true;
    return (lookups.target(sector.id, node.id)?.transfers ?? []).some((transfer) =>
      transfer.id !== ignoredTransferId &&
      isSmartRecipeInput(node, lookups.sector(sector).connections.get(transfer.routeConnectionIds?.at(-1) ?? transfer.connectionId)?.toPort ?? 0)
    );
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
    if (!inputPortAcceptsItem(node, port, item, this.state.research.completed)) return false;
    if (!roadInputAccepts(this.state, sector, node, port, item)) return false;
    if (node.kind === 'splitter') {
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
        space += Math.max(0, this.inputCapacity(target, item) - this.inputOccupancy(target, item) - (this.inputUsesPerItemCapacity(target) ? pending?.counts[item] ?? 0 : pending?.transfers.length ?? 0));
      }
      return space > queued;
    }
    if (node.kind === 'merger') {
      const retained = this.mergerItem(node, sector, lookups);
      return !retained || retained === item;
    }
    const smartRecipe = isSmartRecipeInput(node, port) ? getSmartRecipeForInput(node, item) : undefined;
    if (!smartRecipe) return this.accepts(node, item);
    return smartRecipe === node.recipeId || !this.smartInputLocked(node, sector, lookups, ignoredTransferId);
  }

  private applySmartRecipe(node: MachineNode, port: number, item: ItemId) {
    if (!isSmartRecipeInput(node, port)) return;
    const recipeId = getSmartRecipeForInput(node, item);
    if (!recipeId || recipeId === node.recipeId) return;
    node.recipeId = recipeId;
    node.cycleMs = RECIPES[recipeId].cycleMs;
    node.progressMs = 0;
  }

  private deliverTransfers(nowMs: number, sectorId?: string) {
    const lookups = new SimulationLookups(this.state);
    const pending = this.state.inFlightTransfers ??= [];
    const remaining = [] as typeof pending;
    for (const transfer of pending) {
      if ((sectorId && transfer.sectorId !== sectorId) || transfer.arrivesAtMs > nowMs) { remaining.push(transfer); continue; }
      if (transfer.cosmeticOnly) continue;
      const sector = this.state.sectors[transfer.sectorId];
      const index = sector ? lookups.sector(sector) : undefined;
      const target = index?.nodes.get(transfer.to);
      const source = index?.nodes.get(transfer.from);
      const routeIds = transfer.routeConnectionIds ?? [transfer.connectionId];
      const routeValid = routeIds.every((id, position) => { const cable = index?.connections.get(id); const previous = position ? index?.connections.get(routeIds[position - 1]) : undefined; const routeNode = cable && index?.nodes.get(cable.from); return Boolean(cable && routeNode && !routeNode.disabled && (!position || (previous?.to === cable.from && (!routeNode.filterItem || routeNode.kind !== 'filter' || routeNode.filterItem === transfer.item)))); });
      const connection = routeValid ? index?.connections.get(routeIds.at(-1)!) : undefined;
      const occupied = target ? this.inputOccupancy(target, transfer.item) : 0;
      const validSocket = Boolean(target && connection && sector && this.canAcceptAtInputPort(target, connection.toPort ?? 0, transfer.item, sector, lookups, transfer.id));
      if (target && connection && validSocket && occupied < this.inputCapacity(target, transfer.item)) {
        this.applySmartRecipe(target, connection.toPort ?? 0, transfer.item);
        target.input[transfer.item] = (target.input[transfer.item] ?? 0) + 1;
      } else if (source) {
        source.output[transfer.item] = (source.output[transfer.item] ?? 0) + 1;
      }
    }
    this.state.inFlightTransfers = remaining;
  }

  private cancelTransfers(connectionIds: Set<string>) {
    const retained = [] as NonNullable<GameState['inFlightTransfers']>;
    for (const transfer of this.state.inFlightTransfers ?? []) {
      if (!(transfer.routeConnectionIds ?? [transfer.connectionId]).some(id => connectionIds.has(id))) { retained.push(transfer); continue; }
      if (transfer.cosmeticOnly) continue;
      const source = this.state.sectors[transfer.sectorId]?.nodes.find((node) => node.id === transfer.from);
      if (source) source.output[transfer.item] = (source.output[transfer.item] ?? 0) + 1;
    }
    this.state.inFlightTransfers = retained;
  }

  private resolveDeliveryRoute(connection: Connection, item: ItemId, sector: SectorState, lookups: SimulationLookups) {
    return logisticsRoute(connection, item, sector, this.state.research.completed, (destination, port) => {
      if (!this.canAcceptAtInputPort(destination, port, item, sector, lookups)) return false;
      const pending = lookups.target(sector.id, destination.id);
      const reserved = this.inputUsesPerItemCapacity(destination) ? pending?.counts[item] ?? 0 : pending?.transfers.length ?? 0;
      return this.inputOccupancy(destination, item) + reserved < this.inputCapacity(destination, item);
    }, lookups.sector(sector));
  }

  private routeSector(sector: SectorState, nowMs = this.state.playTimeMs, lookups = new SimulationLookups(this.state)) {
    let launched = false;
    const fastUsed=new Map<string,number>();
    const index = lookups.sector(sector);
    for (const connection of sector.connections) {
      const source = index.nodes.get(connection.from);
      let target = index.nodes.get(connection.to);
      if (!source || !target || source.disabled || target.disabled) continue;
      if(target.kind==='lakeIntake' || (hasNodeBehavior(target.kind,'road')&&hasNodeBehavior(source.kind,'buffer')))continue;
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
            const reserved = this.inputUsesPerItemCapacity(destination) ? pending?.counts[item] ?? 0 : pending?.transfers.length ?? 0;
            return this.inputOccupancy(destination, item) + reserved < this.inputCapacity(destination, item);
          });
        });
        if (chosen?.id !== connection.id) continue;
      }
      const resolveRoute = (key: ItemId) => this.resolveDeliveryRoute(connection, key, sector, lookups);
      const item = (Object.keys(source.output) as ItemId[]).find((key) =>
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
      const destinationConnection = route.connections.at(-1)!;
      const cap = this.inputCapacity(target, item);
      const perItemCapacity = this.inputUsesPerItemCapacity(target);
      const pending = lookups.target(sector.id, target.id);
      const pendingForTarget = perItemCapacity ? pending?.counts[item] ?? 0 : pending?.transfers.length ?? 0;
      const occupied = this.inputOccupancy(target, item);
      if (occupied + pendingForTarget >= cap) continue;
      const fastRate=source.kind==='goblinTribute'?10:(item==='water'||(item==='coolant'&&[source.kind,target.kind].includes('fluidLink')))&&(source.kind!=='lake')?16:(WASTE_ITEMS.includes(item)&&[source.kind,target.kind].some(k=>['wasteLink','wasteSorter','wasteHopper'].includes(k)))?40:item==='power'&&[source.kind,target.kind].includes('powerConduit')?25:0;
      if(fastRate){connection.batchCredit=Math.min(fastRate,(connection.batchCredit??0)+fastRate*.4);const shared=source.kind==='wasteSorter'||source.kind==='wasteLink'?16-(fastUsed.get(source.id)??0):Infinity;const amount=Math.min(shared,Math.floor(connection.batchCredit),source.output[item]??0,cap-occupied-pendingForTarget);if(amount>0){source.output[item]!-=amount;target.input[item]=(target.input[item]??0)+amount;connection.batchCredit-=amount;fastUsed.set(source.id,(fastUsed.get(source.id)??0)+amount);connection.item=item;launched=true;if(sourceCapabilities.alternatingOutputs)source.alternator=index.outgoing.get(source.id)!.findIndex(candidate=>candidate.id===connection.id)+1;}continue;}
      this.applySmartRecipe(target, destinationConnection.toPort ?? 0, item);
      source.output[item]!--;
      route.connections.forEach(cable => { cable.item = item; });
      route.routers.forEach(({ node, outputIndex }) => { if (getNodeCapabilities(node.kind).alternatingOutputs) node.alternator = outputIndex + 1; });
      const transfer = { id: makeId('transfer'), sectorId: sector.id, connectionId: connection.id, routeConnectionIds: route.connections.length > 1 ? route.connections.map(cable => cable.id) : undefined, from: source.id, to: target.id, item, launchedAtMs: nowMs, arrivesAtMs: nowMs + CABLE_TRANSFER_DURATION_MS };
      (this.state.inFlightTransfers ??= []).push(transfer);
      lookups.launched(transfer);
      launched = true;
      if (sourceCapabilities.alternatingOutputs) source.alternator = index.outgoing.get(source.id)!.findIndex(candidate => candidate.id === connection.id) + 1;
      this.event('TransferStarted', `${item} routed to ${target.name}.`);
    }
    for (const node of sector.nodes) {
      if (node.disabled || node.processingPaused || !getNodeCapabilities(node.kind).passThrough) continue;
      const inputs = (Object.keys(node.input) as ItemId[]).filter((key) => (node.input[key] ?? 0) > 0 && (node.kind !== 'filter' || !node.filterItem || node.filterItem === key));
      const canRoute = (item: ItemId) => (index.outgoing.get(node.id) ?? []).some(cable => {
        const target = index.nodes.get(cable.to);
        if (!target || target.disabled || !this.canAcceptAtInputPort(target, cable.toPort ?? 0, item, sector, lookups)) return false;
        const pending = lookups.target(sector.id, target.id);
        return this.inputOccupancy(target, item) + (this.inputUsesPerItemCapacity(target) ? pending?.counts[item] ?? 0 : pending?.transfers.length ?? 0) < this.inputCapacity(target, item);
      });
      const preferred = node.kind === 'splitter' ? inputs.find(canRoute) : undefined;
      const item = preferred ?? inputs[0];
      if (preferred && sum(node.output) >= (node.capacity ?? 5)) {
        const blocked = (Object.keys(node.output) as ItemId[]).find(key => (node.output[key] ?? 0) > 0 && !canRoute(key));
        if (blocked) {
          // Exchange buffered items atomically; neither bag exceeds capacity.
          node.input[preferred]!--; node.output[blocked]!--;
          node.input[blocked] = (node.input[blocked] ?? 0) + 1;
          node.output[preferred] = (node.output[preferred] ?? 0) + 1;
          continue;
        }
      }
      if(node.kind==='wasteSorter'){let budget=16;for(let k=0;k<WASTE_ITEMS.length;k++){const i=WASTE_ITEMS[((node.alternator??0)+k)%WASTE_ITEMS.length];const amount=Math.min(node.input[i]??0,32-(node.output[i]??0),budget);node.input[i]=(node.input[i]??0)-amount;node.output[i]=(node.output[i]??0)+amount;budget-=amount;}node.alternator=((node.alternator??0)+1)%WASTE_ITEMS.length;continue;}
      if (item && sum(node.output) < (node.capacity ?? 5)) { const q=['fluidLink','wasteLink','powerConduit'].includes(node.kind)?Math.min(node.input[item]??0,(node.capacity??64)-sum(node.output)):1;node.input[item]!-=q; node.output[item] = (node.output[item] ?? 0) + q; }
    }
    return launched;
  }

  private accepts(node: MachineNode, item: ItemId) {
    if (hasNodeBehavior(node.kind, 'filter') && node.filterItem && node.filterItem !== item) return false;
    if (hasNodeBehavior(node.kind, 'big-hole')) return item === 'stone' && (node.resourceRemaining ?? 0) > 0;
    if (node.kind === 'forest') return item === 'forest-growth' && this.state.research.completed.includes('treePlanter');
    const inputs = getEffectiveNodeInputFamilies(node, this.state.research.completed);
    if (inputs.some((_family, port) => inputPortAcceptsItem(node, port, item, this.state.research.completed))) return true;
    const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
    return recipe ? item in recipe.inputs : false;
  }

  private planNodePlacement(kind: NodeKind, x: number, y: number, preview = false) {
    const def = NODE_DEFINITIONS[kind];
    if (kind === 'fluidRoad') return;
    if (!def || (def.hidden && !def.legacyAlias)) return;
    const lockedStorage = def.category === 'Storage' && !isNodeUnlocked(kind, this.state.research.unlocked);
    if (lockedStorage && !preview) return;
    const capabilities = getNodeCapabilities(kind);
    if(capabilities.globallyUnique&&this.state.activeSectorId!=='5,5')return;
    if((kind==='storage'||kind==='inventory')&&Object.values(this.state.sectors).flatMap(s=>s.nodes).filter(n=>n.kind===kind).length>=placementLimit(this.state,kind))return;
    const uniqueNodeBlocked = capabilities.globallyUnique && Object.values(this.state.sectors).some((sector) => sector.nodes.some((node) => getNodeCapabilities(node.kind).globallyUnique));
    if (uniqueNodeBlocked && !preview) return;
    const roadPair = capabilities.pairedSectorPlacement ? this.findRoadPair(x, y) : undefined;
    const channelsFull = Boolean(roadPair && this.getSector().nodes.filter(n=>hasNodeBehavior(n.kind,'road')&&n.roadMode==='export'&&n.pairedSectorId===roadPair.sector.id).length>=roadChannels(this.state));
    if (capabilities.pairedSectorPlacement && !roadPair && !preview) return;
    // The original configurable machines are inert until the player chooses a recipe.
    const recipeId = capabilities.defaultRecipeId;
    const node: MachineNode = {
      id: preview ? '__placement-preview__' : makeId(kind), kind, name: def.name, x, y, rotation: 0, recipeId, input: {}, output: {}, progressMs: 0,
      cycleMs: recipeId ? RECIPES[recipeId].cycleMs : kind === 'extractor' ? 5000 : capabilities.behavior === 'recipe' ? 0 : 1000, constructedAt: Date.now(), constructionMs: 1500,
      capacity: capabilities.defaultCapacity,
      ...(capabilities.defaultFilterItem ? { filterItem: capabilities.defaultFilterItem } : {}),
      ...(capabilities.defaultMiningTarget ? { miningTarget: capabilities.defaultMiningTarget, miningProgress: 0 } : {}),
    };
    let pairedNode: MachineNode | undefined;
    if (roadPair) {
      node.x = roadPair.localX; node.y = roadPair.localY; node.roadMode = 'export'; node.pairedSectorId = roadPair.sector.id; node.roadFacing = roadPair.side;
      const pair: MachineNode = { ...clone(node), id: preview ? '__placement-preview-pair__' : makeId('road'), x: roadPair.pairX, y: roadPair.pairY, roadMode: 'import', pairedSectorId: this.getSector().id, input: {}, output: {}, progressMs: 0 };
      node.pairedRoadId = pair.id; pair.pairedRoadId = node.id; pairedNode = pair;
      pair.roadFacing = ({ north: 'south', south: 'north', east: 'west', west: 'east' } as const)[roadPair.side];
    }
    const field = getSectorWorldSize(this.getSector(), this.state.research.completed);
    const pairField = roadPair ? getSectorWorldSize(roadPair.sector, this.state.research.completed) : undefined;
    const localClear = canPlaceNode(node, this.getSector().nodes, field);
    const pairClear = !(pairedNode && pairField && !canPlaceNode(pairedNode, roadPair!.sector.nodes, pairField));
    const error = lockedStorage ? 'Research this storage node before building it.' : uniqueNodeBlocked ? 'This unique node already exists.'
      : capabilities.pairedSectorPlacement && !roadPair ? 'Unlock an adjacent map before placing a road to it.'
      : channelsFull ? `Map ${this.getSector().id} already uses all ${roadChannels(this.state)} outgoing road channels to map ${roadPair!.sector.id}. Use another boundary or research additional Road Channels.`
      : !localClear ? `The endpoint on map ${this.getSector().id} needs clearance from the field boundary, other nodes and obstructions. Choose another position.`
      : !pairClear ? `The paired endpoint on adjacent map ${roadPair!.sector.id} is blocked. Move this road along the boundary, or clear room on that map.` : undefined;
    return { node, pairedNode, roadPair, valid: !error, error };
  }

  /** Returns the snapped node and validity used by the cursor-held build preview. */
  getNodePlacementPreview(kind: NodeKind, x: number, y: number) {
    const plan = this.planNodePlacement(kind, x, y, true);
    return plan ? { node: plan.node, valid: plan.valid } : undefined;
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
    this.event('NodePlaced', `${def.name} placed. Construction started.`);
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
    const field = getSectorWorldSize(current, this.state.research.completed);
    const roadSize = 135;
    const candidates = [
      { score: x, x: current.x - 1, y: current.y, localX: roadSize / 2, localY: y, side: 'east' as const },
      { score: field.width - x, x: current.x + 1, y: current.y, localX: field.width - roadSize / 2, localY: y, side: 'west' as const },
      { score: y, x: current.x, y: current.y - 1, localX: x, localY: roadSize / 2, side: 'south' as const },
      { score: field.height - y, x: current.x, y: current.y + 1, localX: x, localY: field.height - roadSize / 2, side: 'north' as const },
    ].sort((a, b) => a.score - b.score);
    for (const candidate of candidates) {
      const sector = this.state.sectors[sectorId(candidate.x, candidate.y)]; if (!sector?.unlocked) continue;
      const pairField = getSectorWorldSize(sector, this.state.research.completed);
      const pairX = candidate.side === 'west' ? roadSize / 2 : candidate.side === 'east' ? pairField.width - roadSize / 2 : Math.max(roadSize / 2, Math.min(pairField.width - roadSize / 2, x));
      const pairY = candidate.side === 'north' ? roadSize / 2 : candidate.side === 'south' ? pairField.height - roadSize / 2 : Math.max(roadSize / 2, Math.min(pairField.height - roadSize / 2, y));
      return { ...candidate, pairX, pairY, sector };
    }
    return undefined;
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
    const selected = sector.nodes.filter((node) => positions[node.id] && isPlayerMovableNode(node.kind));
    if (!selected.length) return false;
    if (selected.some((node) => hasNodeBehavior(node.kind,'road')) && (selected.length !== 1 || !hasNodeBehavior(selected[0].kind,'road'))) return false;
    const field = getSectorWorldSize(sector, this.state.research.completed);
    const ignored = new Set(selected.map((node) => node.id));
    let roadPair: { node: MachineNode; x: number; y: number; sector: SectorState } | undefined;
    const proposals = selected.map((node) => ({ node, proposed: { ...node, ...positions[node.id] } }));
    const regularProposals = proposals.filter(({ node }) => !hasNodeBehavior(node.kind,'road'));
    if (regularProposals.length) {
      const minimumShiftX = Math.max(...regularProposals.map(({ proposed }) => getNodeSize(proposed).w / 2 + 12 - proposed.x));
      const maximumShiftX = Math.min(...regularProposals.map(({ proposed }) => field.width - getNodeSize(proposed).w / 2 - 12 - proposed.x));
      const minimumShiftY = Math.max(...regularProposals.map(({ proposed }) => getNodeSize(proposed).h / 2 + 52 - proposed.y));
      const maximumShiftY = Math.min(...regularProposals.map(({ proposed }) => field.height - getNodeSize(proposed).h / 2 - 12 - proposed.y));
      const shiftX = Math.max(minimumShiftX, Math.min(maximumShiftX, 0)); const shiftY = Math.max(minimumShiftY, Math.min(maximumShiftY, 0));
      regularProposals.forEach(({ proposed }) => { proposed.x += shiftX; proposed.y += shiftY; });
    }
    if (hasNodeBehavior(selected[0].kind,'road')) {
      const road = selected[0]; const proposed = proposals[0].proposed; const half = 67.5;
      const edges = [{ edge: 'west', distance: road.x }, { edge: 'east', distance: field.width - road.x }, { edge: 'north', distance: road.y }, { edge: 'south', distance: field.height - road.y }] as const;
      const edge = [...edges].sort((a, b) => a.distance - b.distance)[0].edge;
      if (edge === 'west' || edge === 'east') { proposed.x = edge === 'west' ? half : field.width - half; proposed.y = Math.max(half + 12, Math.min(field.height - half - 12, proposed.y)); }
      else { proposed.y = edge === 'north' ? half : field.height - half; proposed.x = Math.max(half + 12, Math.min(field.width - half - 12, proposed.x)); }
      const pairSector = road.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
      const pair = pairSector?.nodes.find((node) => node.id === road.pairedRoadId);
      if (!pairSector || !pair) return false;
      const pairField = getSectorWorldSize(pairSector, this.state.research.completed);
      const parallel = edge === 'west' || edge === 'east' ? proposed.y / field.height * pairField.height : proposed.x / field.width * pairField.width;
      const pairX = edge === 'west' ? pairField.width - half : edge === 'east' ? half : Math.max(half + 12, Math.min(pairField.width - half - 12, parallel));
      const pairY = edge === 'north' ? pairField.height - half : edge === 'south' ? half : Math.max(half + 12, Math.min(pairField.height - half - 12, parallel));
      const pairProposed = { ...pair, x: pairX, y: pairY };
      if (!canPlaceNode(pairProposed, pairSector.nodes, pairField, new Set([pair.id]))) return false;
      roadPair = { node: pair, x: pairX, y: pairY, sector: pairSector };
    }
    if (proposals.some(({ proposed }) => !canPlaceNode(proposed, sector.nodes, field, ignored))) return false;
    const proposedById = new Map(proposals.map(({ proposed }) => [proposed.id, proposed]));
    const nodesAfterMove = sector.nodes.map((node) => proposedById.get(node.id) ?? node);
    const cableBlocked = sector.connections.some((connection) => {
      if (!ignored.has(connection.from) && !ignored.has(connection.to)) return false;
      const source = proposedById.get(connection.from) ?? sector.nodes.find((node) => node.id === connection.from);
      const target = proposedById.get(connection.to) ?? sector.nodes.find((node) => node.id === connection.to);
      return Boolean(source && target && connectionBlockedByWorld(source, target, { fromPort: connection.fromPort ?? 0, toPort: connection.toPort ?? 0 }, nodesAfterMove));
    });
    if (cableBlocked) return false;
    if (!apply) return true;
    proposals.forEach(({ node, proposed }) => { node.x = proposed.x; node.y = proposed.y; });
    if (selected.length === 1) this.insertNodeOnCable(selected[0]);
    if (roadPair) { roadPair.node.x = roadPair.x; roadPair.node.y = roadPair.y; roadPair.sector.lastSimulatedAt = Date.now(); }
    return true;
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
    const plan = resolveConnectionPlan(sourceNode, targetNode, sector.connections, this.state.research.completed);
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
    if (!portFamiliesCompatible(source, fromPort, target, toPort, this.state.research.completed)) {
      const family = getEffectiveNodeInputFamilies(target, this.state.research.completed)[toPort];
      const name = family && family in ITEM_NAMES ? ITEM_NAMES[family as ItemId] : family ?? 'a compatible material';
      return { title: 'Incompatible socket', detail: `${target.name}'s selected input requires ${name}. Choose the matching output and input, or use a Filter to select a material.` };
    }
    const connections = sector.connections.filter(c => c.id !== replaceConnectionId);
    if (!this.canAddProgressionConnection(source, target, connections)) return { title: 'Connection limit reached', detail: 'This node has reached its researched connection limit. Remove a connection or research more capacity.' };
    const plan = resolveExactConnectionPlan(source, fromPort, target, toPort, connections, this.state.research.completed);
    if (!plan) return { title: 'Connection unavailable', detail: 'These sockets are already connected or the receiving Merger holds a different material. Drain that material or choose another socket.' };
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
    if (roadConnectionError(this.state, sector, { id: '__road-validation', from, to, fromPort, toPort, createdAt: 0 }, replaced)) return false;
    this.checkpoint();
    this.cancelTransfers(replaced);
    sector.connections = sector.connections.filter((connection) => !replaced.has(connection.id));
    sector.connections.push({ id: makeId('cable'), from, to, fromPort, toPort, item: concreteOutputItem(sourceNode, fromPort), createdAt: Date.now() });
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
    this.publish();
  }
  private canAddProgressionConnection(source:MachineNode,target:MachineNode,connections:Connection[]){
    if(source.kind==='lake'&&target.kind==='lakeIntake'&&connections.filter(c=>c.from===source.id&&c.to!==target.id&&this.getSector().nodes.some(n=>n.id===c.to&&n.kind==='lakeIntake')).length>=2)return false;
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

  clearFilledBigHole(nodeId: string) {
    const sector = this.getSector();
    const hole = sector.nodes.find((node) => node.id === nodeId && node.kind === 'big-hole');
    if (!hole || (hole.resourceRemaining ?? 1) > 0) return false;
    this.checkpoint();
    const removedConnectionIds = new Set(sector.connections.filter((connection) => connection.from === nodeId || connection.to === nodeId).map((connection) => connection.id));
    this.cancelTransfers(removedConnectionIds);
    sector.nodes = sector.nodes.filter((node) => node.id !== nodeId);
    sector.connections = sector.connections.filter((connection) => connection.from !== nodeId && connection.to !== nodeId);
    this.event('NodePlaced', 'Deep Hole filled in. The obstruction has been cleared.');
    this.publish();
    return true;
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
    const source = sector.nodes.filter((n) => ids.includes(n.id) && !n.protected && isPlayerMovableNode(n.kind) && getNodeCapabilities(n.kind).duplicateAllowed !== false && (NODE_DEFINITIONS[n.kind].category !== 'Storage' || isNodeUnlocked(n.kind, this.state.research.unlocked)));
    if (!source.length) return [];
    const map = new Map<string, string>();
    const copyIds = new Map(source.map((node) => [node.id, makeId(node.kind)]));
    const field = getSectorWorldSize(sector, this.state.research.completed);
    const step = Math.max(150, ...source.map((node) => Math.max(getNodeSize(node).w, getNodeSize(node).h) + 30));
    const offsets: Array<{ x: number; y: number }> = [];
    for (let ring = 1; ring <= 12; ring++) {
      for (let x = -ring; x <= ring; x++) offsets.push({ x: x * step, y: -ring * step }, { x: x * step, y: ring * step });
      for (let y = -ring + 1; y < ring; y++) offsets.push({ x: -ring * step, y: y * step }, { x: ring * step, y: y * step });
    }
    let copies: MachineNode[] | undefined;
    for (const offset of offsets) {
      const candidates = source.map((node) => {
        const copy = clone(node); copy.id = copyIds.get(node.id)!; copy.x += offset.x; copy.y += offset.y; copy.input = {}; copy.output = {}; copy.batch=undefined;copy.progressMs = 0; copy.constructedAt = Date.now(); return copy;
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
  setRecipe(nodeId: string, recipeId: string) {
    const sector = this.getSector();
    const node = sector.nodes.find((n) => n.id === nodeId);
    if (!node || node.batch || !RECIPES[recipeId] || !RECIPE_GROUPS[node.kind]?.includes(recipeId) || !isRecipeUnlocked(recipeId,this.state.research.completed)) return false;
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
      return connection.to === node.id && Boolean(connection.item) && !inputPortAcceptsItem(node, connection.toPort ?? 0, connection.item!, this.state.research.completed);
    }).map((connection) => connection.id));
    this.cancelTransfers(removed);
    if (removed.size) sector.connections = sector.connections.filter((connection) => !removed.has(connection.id));
    this.publish();
    return true;
  }
  saveFactoryTemplate(name: string, ids: string[]) { return this.templates.saveFactoryTemplate(name, ids); }
  getTemplatePreview(index: number, x: number, y: number) { return this.templates.getTemplatePreview(index, x, y); }
  placeFactoryTemplate(index: number, x: number, y: number) { return this.templates.placeFactoryTemplate(index, x, y); }
  selectResearch(id?: string) { this.research.selectResearch(id); }

  setFilterItem(nodeId: string, filterItem: ItemId) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId && hasNodeBehavior(candidate.kind, 'filter'));
    if (!node || !FILTERABLE_ITEMS.includes(filterItem)) return false;
    if (node.filterItem === filterItem) return true;
    this.checkpoint();
    node.filterItem = filterItem;
    node.input = {};
    node.output = {};
    node.progressMs = 0;
    this.publish();
    return true;
  }
  setGoblinTributeItem(nodeId: string, item: TributeItem) {
    const sector = this.getSector();
    const node = sector.nodes.find(candidate => candidate.id === nodeId);
    const camp = node?.kind === 'monster-camp' ? node : node?.kind === 'goblinTribute' ? sector.nodes.find(candidate => candidate.id === node.tributeCampId && candidate.kind === 'monster-camp') : undefined;
    if (!camp || !getTributeItems(this.state, camp).includes(item)) return false;
    if ((camp.tributeItem ?? 'iron') === item) return true;
    const tribute = sector.nodes.find(candidate => candidate.kind === 'goblinTribute' && candidate.tributeCampId === camp.id);
    if (tribute && (sum(tribute.output) > 0 || this.state.inFlightTransfers?.some(transfer => transfer.from === tribute.id))) return false;
    this.checkpoint();
    camp.tributeItem = item;
    if (tribute) { tribute.tributeItem = item; tribute.progressMs = 0; }
    this.publish();
    return true;
  }
  setMiningTarget(nodeId: string, miningTarget: NonNullable<MachineNode['miningTarget']>) {
    const node = this.getSector().nodes.find((candidate) => candidate.id === nodeId && hasNodeBehavior(candidate.kind, 'mining-drill'));
    if (!node || (node.miningProgress ?? 0) > 0) return false;
    if (node.miningTarget === miningTarget) return true;
    this.checkpoint();
    node.miningTarget = miningTarget;
    this.publish();
    return true;
  }
  togglePause() { this.state.paused = !this.state.paused; this.publish(); }
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
    if (!road || !pair || !pairedSector) return 'The paired road endpoint is unavailable.';
    const exportingSector = road.roadMode === 'import' ? sector : pairedSector;
    const receivingSector = road.roadMode === 'import' ? pairedSector : sector;
    return exportingSector.nodes.filter(node => hasNodeBehavior(node.kind, 'road') && node.roadMode === 'export' && node.pairedSectorId === receivingSector.id).length >= roadChannels(this.state)
      ? `Map ${exportingSector.id} already uses all ${roadChannels(this.state)} outgoing road channels to map ${receivingSector.id}. Remove an outgoing road or research more Road Channels before reversing this pair.` : undefined;
  }
  reverseRoad(nodeId: string) {
    const sector = this.getSector();
    const road = sector.nodes.find((node) => node.id === nodeId && hasNodeBehavior(node.kind, 'road'));
    const pairedSector = road?.pairedSectorId ? this.state.sectors[road.pairedSectorId] : undefined;
    const pair = pairedSector?.nodes.find((node) => node.id === road?.pairedRoadId);
    if (!road || !pair || !pairedSector) return false;
    if (this.getRoadReversalError(nodeId)) return false;
    this.checkpoint();
    for (const [owner, endpoint] of [[sector, road], [pairedSector, pair]] as const) {
      const removed = new Set(owner.connections.filter((connection) => connection.from === endpoint.id || connection.to === endpoint.id).map((connection) => connection.id));
      this.cancelTransfers(removed);
      owner.connections = owner.connections.filter((connection) => !removed.has(connection.id));
      endpoint.roadMode = endpoint.roadMode === 'import' ? 'export' : 'import';
      [endpoint.input, endpoint.output] = [endpoint.output, endpoint.input];
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
    const permanent = RESEARCH_PROJECTS.filter((project) => !project.repeatable).map((project) => project.id);
    this.state.research.unlocked = [...new Set([...this.state.research.unlocked, ...RESEARCH_PROJECTS.map((project) => project.id)])];
    this.state.research.completed = [...new Set([...this.state.research.completed, ...permanent])];
    this.state.research.selected = undefined;
    this.state.research.contributed = {};
    this.state.research.mapPoints = Math.max(this.state.research.mapPoints, 121);
    this.research.resetResearchCycles();
    this.publish();
  }
  developerUnlockAllSectors() {
    this.checkpoint();
    for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
      const id = sectorId(x, y); const sector = this.state.sectors[id] ?? generateSector(x, y, this.state.seed, Date.now(), this.state.research.completed); sector.unlocked = true; this.state.sectors[id] = sector;
    }
    this.state.research.mapPoints = Math.max(this.state.research.mapPoints, 121);
    this.publish();
  }
  setTutorialStep(step: number) { this.state.tutorialStep = step; this.publish(); }
  setCamera(camera: SectorState['camera']) { this.getSector().camera = camera; }
  renameSector(name: string, label: string, sectorId = this.state.activeSectorId) { const s = this.state.sectors[sectorId]; if (!s?.unlocked) return; s.name = name.trim().slice(0, 30) || (s.id === '5,5' ? 'Home Sector' : `Sector ${s.x}.${s.y}`); s.label = label.trim().slice(0, 3).toUpperCase() || (s.id === '5,5' ? 'HME' : `S${sectorDistance(s.x, s.y)}`.slice(0, 3)); this.publish(); }
  undo() { const previous = this.history.pop(); if (previous) {
    previous.encounters = [...new Set([...(previous.encounters ?? []), ...(this.state.encounters ?? [])])];
    previous.tutorialPromptsSeen = [...new Set([...(previous.tutorialPromptsSeen ?? []), ...(this.state.tutorialPromptsSeen ?? [])])];
    for (const [id, sector] of Object.entries(this.state.sectors)) if (sector.visited && previous.sectors[id]) previous.sectors[id].visited = true;
    this.state = previous; initializeProgression(this.state); this.evaluateMilestones(); this.publish();
  } }
  replaceState(state: GameState) { this.state = clone(state); this.state.produced ??= {}; this.state.extracted ??= {}; this.state.hasCreatedConnection ??= false; this.state.research.completed ??= []; this.state.research.repeatableCompletions ??= {}; this.state.research.projectContributions ??= {}; this.state.inFlightTransfers ??= []; this.normalizeExtractorCycles(); this.research.reconcileResearchSelection(); this.pruneLockedForestInputs(); this.history = []; this.publish(); }
  unlockSector(x: number, y: number) {
    if (this.state.research.mapPoints < 1 || x < 0 || y < 0 || x > 10 || y > 10) return false;
    const adjacent = Object.values(this.state.sectors).some((s) => s.unlocked && Math.abs(s.x - x) + Math.abs(s.y - y) === 1);
    if (!adjacent) return false;
    const id = sectorId(x, y);
    const sector = this.state.sectors[id] ?? generateSector(x, y, this.state.seed, Date.now(), this.state.research.completed);
    if (sector.unlocked) return false;
    this.checkpoint(); sector.unlocked = true; this.state.sectors[id] = sector; this.state.research.mapPoints--; this.publish(); return true;
  }
  switchSector(id: string, firstVisitCamera?: SectorState['camera']) {
    const sector = this.state.sectors[id]; if (!sector?.unlocked) return;
    if (!sector.visited && firstVisitCamera) sector.camera = { ...firstVisitCamera };
    this.state.activeSectorId = id; discoverActiveSector(this.state);this.evaluateMilestones();this.publish();
  }
  ensureSector(x: number, y: number) { const id = sectorId(x, y); return this.state.sectors[id] ?? generateSector(x, y, this.state.seed, Date.now(), this.state.research.completed); }
  sectorLevel() { const s = this.getSector(); return sectorDistance(s.x, s.y); }
}
