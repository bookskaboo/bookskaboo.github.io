import { ITEM_NAMES } from '../content/items';
import { WASTE_ITEMS } from '../content/progression';
import { FOUNDRY_INPUTS } from '../content/endgame';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { getNodeCapabilities, hasNodeBehavior, isResourceBehavior, needsRecipeSelection } from '../content/nodeCapabilities';
import { RECIPES, recyclerRecipeForMaterial } from '../content/recipes';
import { cartCapacity, isCartKind, vehiclePayload } from '../content/cartUpgrades';
import { hasForestryCapacity } from '../content/machineEfficiency';
import { cargoMaterial } from '../content/botAssembly';
import { getGoblinAttackRequirement } from '../content/goblinSettlements';
import { modNode, modNodeTemplate, modRule } from '../mods/modRules';
import type { Connection, GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { filterOutlet, selectedFilterPort } from '../domain/filterRouting';
import { cornerInputAllowed } from './endgameRuntime';
import { inputPortAcceptsItem, portFamilyAcceptsItem, portFamiliesCompatible, nonItemFamilies } from './connectionRules';
import { roadInputAccepts } from './roadMaterials';
import { outputHead, returnOutput, takeOutput } from './mixedOutput';
import { usesNewWorldRules } from './worldRules';
import { logisticsRoute } from './logisticsRoutes';
import { SimulationLookups } from './simulationLookups';

const sum = (bag: Partial<Record<ItemId, number>>) => Object.values(bag).reduce<number>((a, b) => a + (b ?? 0), 0);

/** Physical delivery, refunds, launches and shared input readiness read the current factory on every call. */
export class TransportRuntime {
  // Retain the original object-keyed fairness history. Replaced/undone cables are new objects.
  private readonly lastExtractorDispatch = new WeakMap<Connection, number>();
  constructor(
    private readonly getState: () => GameState,
    private readonly makeId: (prefix: string) => string,
    private readonly event: (type: 'TransferStarted', message: string) => void,
  ) {}
  private get state() { return this.getState(); }

  inputCapacity(node: MachineNode, item: ItemId) {
    if (isCartKind(node.kind)) return Math.max(0, Math.min(modNode(node.kind)?.inputCapacity ?? Infinity, cartCapacity(node) - sum(node.output)));
    if(node.kind==='cornerChallenge')return node.cornerType==='foundry'?(FOUNDRY_INPUTS[item]??0):100;
    if (node.kind === 'road') return 0;
    if (modNode(node.kind)?.inputCapacity !== undefined) return modNode(node.kind)!.inputCapacity!;
    if (node.kind === 'forest' && hasForestryCapacity(this.state.research.completed)) return 20;
    if (node.kind === 'monster-camp') return Math.max(5, getGoblinAttackRequirement(node));
    return getNodeCapabilities(node.kind).inputCapacity ?? 5;
  }

  inputUsesPerItemCapacity(node: MachineNode) {
    if (node.landmark === 'unknown') return false;
    return Boolean((node.kind==='cornerChallenge'&&node.cornerType==='foundry') || getNodeCapabilities(node.kind).perItemInputCapacity || (node.recipeId && RECIPES[node.recipeId]));
  }

  inputOccupancy(node: MachineNode, item: ItemId) {
    if (node.kind === 'recycler') return item === 'water' ? node.input.water ?? 0 : sum(node.input) - (node.input.water ?? 0);
    return this.inputUsesPerItemCapacity(node) ? (node.input[item] ?? 0) : sum(node.input);
  }

  reservedInput(node: MachineNode, item: ItemId, pending: ReturnType<SimulationLookups['target']>) {
    if (!pending) return 0;
    if (node.kind === 'recycler') return item === 'water' ? pending.counts.water ?? 0
      : pending.transfers.reduce((total, transfer) => total + (transfer.item !== 'water' ? transfer.amount ?? 1 : 0), 0);
    if (this.inputUsesPerItemCapacity(node)) return pending.counts[item] ?? 0;
    const reserved = pending.transfers.reduce((total, transfer) => total + (transfer.amount ?? 1), 0);
    return reserved;
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

  selectRecyclerRecipeFromMaterial(node: MachineNode, item: ItemId) {
    if (node.kind !== 'recycler' || item === 'water') return;
    const id = recyclerRecipeForMaterial(item, this.state.research.completed);
    if (!id || id === node.recipeId) return;
    node.recipeId = id;
    node.cycleMs = RECIPES[id].cycleMs;
    node.progressMs = 0;
  }

  canAcceptAtInputPort(node: MachineNode, port: number, item: ItemId, sector: SectorState, lookups: SimulationLookups, ignoredTransferId?: string, routingPath = new Set<string>()) {
    if(node.kind==='cornerChallenge'&&!cornerInputAllowed(sector,node))return false;
    if (!inputPortAcceptsItem(node, port, item, this.state.research.completed)) return false;
    if (!roadInputAccepts(this.state, sector, node, item)) return false;
    if (port === 0 && node.kind === 'recycler') {
      if (node.recipeId === recyclerRecipeForMaterial(item, this.state.research.completed)) return true;
      // Finish the active recipe and drain its stock before allowing another material.
      return !node.batch && !this.inputOccupancy(node, item) && !sum(node.output) &&
        !lookups.target(sector.id, node.id)?.transfers.some(transfer => transfer.id !== ignoredTransferId && transfer.item !== 'water');
    }
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
        space += Math.max(0, this.inputCapacity(target, item) - this.inputOccupancy(target, item) - (this.reservedInput(target, item, pending)));
      }
      return space > queued;
    }
    if (modNodeTemplate(node.kind) === 'merger') {
      const retained = this.mergerItem(node, sector, lookups);
      return !retained || cargoMaterial(retained) === cargoMaterial(item);
    }
    return this.accepts(node, item);
  }

  filterBlockage(node: MachineNode, sector: SectorState, lookups: SimulationLookups, path = new Set([node.id]), candidate?: ItemId): MachineNode['filterBlocked'] {
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
        const reserved = this.reservedInput(target, item, pending);
        return this.inputOccupancy(target, item) + reserved < this.inputCapacity(target, item);
      }, index));
      if (!ready) return outlet === selectedFilterPort(node) ? 'selected' : 'remainder';
    }
    return undefined;
  }

  deliverTransfers(nowMs: number, sectorId?: string) {
    const lookups = new SimulationLookups(this.state);
    const pending = this.state.inFlightTransfers ??= [];
    const remaining = [] as typeof pending;
    const refunds: Array<{ source: MachineNode; item: ItemId; amount: number; port?: number }> = [];
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
        this.selectRecyclerRecipeFromMaterial(target, transfer.item);
        target.input[transfer.item] = (target.input[transfer.item] ?? 0) + (transfer.amount ?? 1);
        if ((getNodeCapabilities(target.kind).behavior === 'buffer' || target.landmark === 'unknown')) (target.inputQueue ??= []).push(...Array<ItemId>(transfer.amount ?? 1).fill(transfer.item));
      } else if (source) {
        refunds.push({ source, item: transfer.item, amount: transfer.amount ?? 1, port: transfer.sourcePort });
      }
    }
    // Prepending in reverse restores the original dispatch order ahead of newer stock.
    for (const { source, item, amount, port } of refunds.reverse()) returnOutput(source, item, amount, port);
    this.state.inFlightTransfers = remaining;
  }

  cancelTransfers(connectionIds: Set<string>) {
    const retained = [] as NonNullable<GameState['inFlightTransfers']>;
    for (const transfer of [...this.state.inFlightTransfers ?? []].reverse()) {
      if (!(transfer.routeConnectionIds ?? [transfer.connectionId]).some(id => connectionIds.has(id))) { retained.push(transfer); continue; }
      if (transfer.cosmeticOnly) continue;
      const source = this.state.sectors[transfer.sectorId]?.nodes.find((node) => node.id === transfer.from);
      if (source) returnOutput(source, transfer.item, transfer.amount ?? 1, transfer.sourcePort);
      else if (usesNewWorldRules(this.state)) {
        this.state.globalPool ??= {};
        this.state.globalPool[transfer.item] = (this.state.globalPool[transfer.item] ?? 0) + (transfer.amount ?? 1);
      }
    }
    this.state.inFlightTransfers = retained.reverse();
  }

  resolveDeliveryRoute(connection: Connection, item: ItemId, sector: SectorState, lookups: SimulationLookups) {
    return logisticsRoute(connection, item, sector, this.state.research.completed, (destination, port) => {
      if (!this.canAcceptAtInputPort(destination, port, item, sector, lookups)) return false;
      const pending = lookups.target(sector.id, destination.id);
      const reserved = this.reservedInput(destination, item, pending);
      return this.inputOccupancy(destination, item) + reserved < this.inputCapacity(destination, item);
    }, lookups.sector(sector));
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

  routeSector(sector: SectorState, nowMs = this.state.playTimeMs, lookups = new SimulationLookups(this.state)) {
    let launched = false;
    const index = lookups.sector(sector);
    const isExtractorCable = (cable: Connection) => index.nodes.get(cable.from)?.kind === 'extractor';
    // A shared destination can free only one space at a time. Give it to the
    // longest-waiting eligible Extractor while keeping other cable priorities.
    const extractors = sector.connections.filter(isExtractorCable).sort((a, b) =>
      (this.lastExtractorDispatch.get(a) ?? -1) - (this.lastExtractorDispatch.get(b) ?? -1));
    let nextExtractor = 0;
    for (const node of sector.nodes) if (node.kind === 'filter') node.filterBlocked = this.filterBlockage(node, sector, lookups);
    for (const cable of sector.connections) {
      const connection = isExtractorCable(cable) ? extractors[nextExtractor++] : cable;
      if (!index.connections.has(connection.id)) continue;
      const source = index.nodes.get(connection.from);
      let target = index.nodes.get(connection.to);
      if (!source || !target || source.disabled || target.disabled) continue;
      if (usesNewWorldRules(this.state) && source.kind === 'lake') continue;
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
            const reserved = this.reservedInput(destination, item, pending);
            return this.inputOccupancy(destination, item) + reserved < this.inputCapacity(destination, item);
          });
        });
        if (chosen?.id !== connection.id) continue;
      }
      const resolveRoute = (key: ItemId) => this.resolveDeliveryRoute(connection, key, sector, lookups);
      const head = outputHead(source);
      const item = (head ? [head] : Object.keys(source.output) as ItemId[]).find((key) =>
        (source.output[key] ?? 0) > 0 && (source.landmark !== 'tri' || (source.triOutput?.[connection.fromPort ?? 0] ?? 0) > 0) && Boolean(resolveRoute(key)) && portFamilyAcceptsItem(getEffectiveNodeOutputFamilies(source)[connection.fromPort??0]??'ANY',key) && this.canAcceptAtInputPort(target!, connection.toPort ?? 0, key, sector, lookups)
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
      const pending = lookups.target(sector.id, target.id);
      const pendingForTarget = this.reservedInput(target, item, pending);
      const occupied = this.inputOccupancy(target, item);
      if (occupied + pendingForTarget >= cap) continue;
      const fastRate=source.kind==='goblinTribute'?10:(item==='water'||(item==='coolant'&&[source.kind,target.kind].includes('fluidLink')))&&(source.kind!=='lake')?16:(WASTE_ITEMS.includes(item)&&[source.kind,target.kind].includes('wasteHopper'))?40:item==='power'&&[source.kind,target.kind].includes('powerConduit')?25:0;
      if (fastRate) {
        connection.batchCredit = Math.min(fastRate, (connection.batchCredit ?? 0) + fastRate * .4);
        const nextItemIndex = source.outputQueue?.findIndex(key => key !== item) ?? -1;
        const queuedAmount = nextItemIndex >= 0 ? nextItemIndex : source.outputQueue?.length ?? Infinity;
        const amount = Math.min(Math.floor(connection.batchCredit), source.output[item] ?? 0, queuedAmount, cap - occupied - pendingForTarget);
        if (amount > 0) {
          this.selectRecyclerRecipeFromMaterial(target, item);
          takeOutput(source, item, amount, connection.fromPort ?? 0);
          target.input[item] = (target.input[item] ?? 0) + amount;
          if ((getNodeCapabilities(target.kind).behavior === 'buffer' || target.landmark === 'unknown')) (target.inputQueue ??= []).push(...Array<ItemId>(amount).fill(item));
          connection.batchCredit -= amount;
          connection.item = item;
          launched = true;
          if (sourceCapabilities.alternatingOutputs) source.alternator = index.outgoing.get(source.id)!.findIndex(candidate => candidate.id === connection.id) + 1;
        }
        continue;
      }
      const payload = item === 'forest-growth' && hasForestryCapacity(this.state.research.completed) ? 10 : isCartKind(source.kind) || isCartKind(target.kind) ? vehiclePayload(this.state.research.completed) : 1;
      const runLength = source.outputQueue ? source.outputQueue.findIndex(key => key !== item) : -1;
      const amount = Math.min(payload, source.output[item] ?? 0, source.landmark === 'tri' ? source.triOutput?.[connection.fromPort ?? 0] ?? 0 : Infinity, cap - occupied - pendingForTarget, source.outputQueue ? runLength < 0 ? source.outputQueue.length : runLength : Infinity);
      if (amount <= 0) continue;
      this.selectRecyclerRecipeFromMaterial(target, item);
      takeOutput(source, item, amount, connection.fromPort ?? 0);
      route.connections.forEach(cable => { cable.item = item; });
      route.routers.forEach(({ node, outputIndex }) => { if (getNodeCapabilities(node.kind).alternatingOutputs) node.alternator = outputIndex + 1; });
      const transfer = { id: this.makeId('transfer'), sourcePort: connection.fromPort ?? 0, sectorId: sector.id, connectionId: connection.id, routeConnectionIds: route.connections.length > 1 ? route.connections.map(cable => cable.id) : undefined, from: source.id, to: target.id, item, amount, launchedAtMs: nowMs, arrivesAtMs: nowMs + modRule('cableTravelMs') };
      (this.state.inFlightTransfers ??= []).push(transfer);
      lookups.launched(transfer);
      if (source.kind === 'extractor') this.lastExtractorDispatch.set(connection, nowMs);
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
        return this.inputOccupancy(target, item) + (this.reservedInput(target, item, pending)) < this.inputCapacity(target, item);
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
}
