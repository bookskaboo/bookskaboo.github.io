import type { GameState, ItemId, MachineNode } from '../domain/types';
import { getResearchCostsForState, getResearchProject, isResearchAvailable, remainingMapNodePurchases } from '../content/research';
import { RECIPES } from '../content/recipes';
import { RECYCLER_RETURNS } from '../content/recycling';
import { BOT_STRENGTH } from '../content/progression';
import { defeatResourceGolem, getGolemMineral, golemApCost } from '../content/resourceGolems';
import { getEncounterLayoutVersion, getGolemPlacementTier, sectorDistance, sectorForState, sectorId } from './worldGeneration';
import { isWorldGridCell, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import { destinationMapCosts, pendingMapPayment, usesDestinationMapPricing, mapExplorationBlockers, mapPurchaseProtected } from './mapExpansion';
import { progressionDeficits } from './progressionRecovery';
import { returnOutput } from './mixedOutput';

export const RESCUE_RESOURCES = ['iron', 'copper', 'stone'] as const;
type Resource = typeof RESCUE_RESOURCES[number];
const RAW: ItemId[] = ['iron','copper','stone','wood','water','mythril'];

/** Optimistic lower costs permit every recipe, free other resources and free unlocks.
 * Failure of this relaxation proves a shortage; success is deliberately inconclusive.
 * This avoids punishing a slow/disconnected factory or an unselected cheaper recipe. */
function minimumCosts(resource: Resource) {
  const cost: Partial<Record<ItemId, number>> = Object.fromEntries(RAW.map(i => [i, i === resource ? 1 : 0]));
  for (let round = 0; round < 120; round++) {
    let changed = false;
    const offer = (i: ItemId, value: number) => { if (Number.isFinite(value) && value + 1e-10 < (cost[i] ?? Infinity)) { cost[i] = value; changed = true; } };
    for (const recipe of Object.values(RECIPES)) {
      if (recipe.id.startsWith('recycle-')) continue; // Breakdown returns are counted below for every bot strength.
      const inputCost = Object.entries(recipe.inputs).reduce((n,[i,q]) => n + (q ?? 0) * (cost[i as ItemId] ?? Infinity),0);
      for (const [i,q] of Object.entries(recipe.outputs)) if (q) offer(i as ItemId,inputCost/q);
      for (const output of recipe.chanceOutputs ?? []) offer(output.item,inputCost/output.amount);
    }
    for (const [item, returns] of Object.entries(RECYCLER_RETURNS)) for (const [i,q] of Object.entries(returns ?? {})) if (q) offer(i as ItemId,(cost[item as ItemId] ?? Infinity)/q);
    if (!changed) break;
  }
  return cost;
}

/** Full standard constituent budgets overestimate actual capped Recycler returns.
 * Stocks are counted once as items, never also as their original ingredients. */
function resourcePotential(item: ItemId, resource: Resource, seen = new Set<ItemId>()): number {
  if (RAW.includes(item)) return item === resource ? 1 : 0;
  if (seen.has(item)) return 0;
  const next = new Set(seen).add(item);
  const recipes = Object.values(RECIPES).filter(r => (r.outputs[item] ?? 0) > 0 && !/^(recycle|efficient|composite)-/.test(r.id) && !r.recovery);
  // Take the most generous finite composition. Unknown stock disables proof below.
  return Math.max(RECYCLER_RETURNS[item]?.[resource] ?? 0, ...recipes.map(r => Object.entries(r.inputs).reduce((n,[i,q]) => n + q! * resourcePotential(i as ItemId,resource,next),0)/(r.outputs[item] ?? 1)), 0);
}

export function nextExpansionShortages(state: GameState): Resource[] {
  if(state.isTraining||state.mod||Object.values(state.sectors).some(s=>s.unlocked&&s.nodes.some(n=>n.kind==='devSource')))return [];
  const project = getResearchProject('mapNode')!;
  if (state.rescue?.pending || state.research.mapPoints > 0 || !isResearchAvailable(project,state.research.completed) || !remainingMapNodePurchases(state)) return [];
  const paid = state.research.selected === 'mapNode' ? state.research.contributed : state.research.projectContributions?.mapNode ?? {};
  const sectors = Object.values(state.sectors).filter(s=>s.unlocked);
  const quotes = usesDestinationMapPricing(state) && !pendingMapPayment(state)
    ? sectors.flatMap(({ x, y }) => [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
      .map(([nx, ny]) => destinationMapCosts(state, nx, ny)).filter(cost => cost !== undefined))
    : [getResearchCostsForState(project, state.research)];
  const nodes = sectors.flatMap(s=>s.nodes).filter(n=>!n.guardedCampId||n.guardedLocked===false);
  const plans = quotes.map(quote => progressionDeficits(state, 'mapNode', quote));
  const exact = plans.every(plan => plan !== undefined);
  const bags = nodes.flatMap(n=>[n.input,n.output,...(n.batch?[n.batch.outputs]:[])]);
  bags.push(state.globalPool ?? {});
  // Pending transfers have already left their sources. Cosmetic pulses contain no stock.
  for (const t of state.inFlightTransfers ?? []) if(!t.cosmeticOnly) bags.push({[t.item]:t.amount??1});
  return RESCUE_RESOURCES.filter(resource => {
    if (state.rescue?.resources.includes(resource)) return false;
    if (nodes.some(n=>n.resourceItem===resource&&(n.infiniteResource || (state.research.completed.includes('mineralRegeneration')&&(n.resourceCapacity??0)>0)))) return false;
    const cost=minimumCosts(resource);
    const needed = Math.min(...quotes.map(quote => Object.entries(quote).reduce((n, [i, q]) => {
      const remaining = Math.max(0, q! - (paid[i as ItemId] ?? 0));
      return remaining > 0 ? n + remaining * (cost[i as ItemId] ?? Infinity) : n;
    }, 0)));
    if (!Number.isFinite(needed) || needed<=1e-9) return false; // Unknown is never proof.
    let available=nodes.filter(n=>n.resourceItem===resource&&!n.infiniteResource).reduce((n,node)=>n+(node.resourceRemaining??0),0);
    for(const bag of bags)for(const [i,q]of Object.entries(bag))if(q&&q>0)available+=q*resourcePotential(i as ItemId,resource);
    if (exact ? plans.some(plan => (plan![resource] ?? 0) <= 1e-9) : available+1e-9>=needed) return false;
    // An affordable regeneration unlock can repair supply without exploration.
    const regeneration=getResearchProject('mineralRegeneration');
    if(regeneration&&nodes.some(n=>n.resourceItem===resource&&(n.resourceCapacity??0)>0)&&isResearchAvailable(regeneration,state.research.completed)){
      const price=Object.entries(getResearchCostsForState(regeneration,state.research)).reduce((n,[i,q])=>n+q!*(cost[i as ItemId]??Infinity),0);
      if(price<=available+1e-9)return false;
    }
    // Conservatively allow settlement-funded recovery or an affordable Golem fight.
    const botCost=Math.min(...Object.keys(BOT_STRENGTH).map(i=>cost[i as ItemId]??Infinity));
    const bufferedAp=nodes.reduce((sum,n)=>sum+Object.entries(BOT_STRENGTH).reduce((a,[i,p])=>a+(n.input[i as ItemId]??0)*(p??0)+(n.output[i as ItemId]??0)*(p??0),0),0);
    if(nodes.some(n=>n.kind==='monster-camp'&&!n.lizardSettlement)&&(bufferedAp>0 || botCost<=available))return false;
    const perAp=Math.min(...Object.entries(BOT_STRENGTH).map(([i,p])=>(cost[i as ItemId]??Infinity)/p!));
    if(nodes.some(n=>n.kind==='resourceGolem'&&getGolemMineral(n)===resource&&Math.max(0,(n.health??golemApCost(n))-bufferedAp)*perAp<=available))return false;
    return true;
  });
}

export function shortestRescuePath(state: GameState, target: string) {
  const gridSize = worldGridSize(state);
  const queue=Object.keys(state.sectors).filter(k=>state.sectors[k].unlocked).sort();
  const previous=new Map<string,string|undefined>(queue.map(k=>[k,undefined]));
  for(let index=0;index<queue.length;index++){
    const key=queue[index];if(key===target)break;
    const [x,y]=key.split(',').map(Number);
    for(const [nx,ny]of [[x,y-1],[x+1,y],[x,y+1],[x-1,y]]){const next=`${nx},${ny}`;if(!isWorldGridCell(nx,ny,gridSize)||previous.has(next)||mapExplorationBlockers(state,nx,ny).length>0&&!mapPurchaseProtected(state,next))continue;previous.set(next,key);queue.push(next);}
  }
  if (!previous.has(target)) return [];
  const path:string[]=[];let key:string|undefined=target;
  while(key!==undefined){if(!state.sectors[key]?.unlocked)path.unshift(key);key=previous.get(key);}
  return path;
}

export function applyExpansionRescue(state: GameState) {
  if (!state.research.completed.includes('exploration')) return applyStartingRecovery(state);
  const shortages=nextExpansionShortages(state);if(!shortages.length)return false;
  const candidates:Array<{resource:Resource;sectorId:string;node:MachineNode;path:string[]}>=[];
  const golemTier = getGolemPlacementTier(state);
  const { min, max } = worldGridBounds(worldGridSize(state));
  for(let y=min;y<=max;y++)for(let x=min;x<=max;x++){
    if(sectorDistance(x,y)!==golemTier)continue;
    const key=sectorId(x,y),sector=sectorForState(state,x,y);
    for(const node of sector.nodes)if(node.kind==='resourceGolem'&&shortages.includes(getGolemMineral(node) as Resource))candidates.push({resource:getGolemMineral(node) as Resource,sectorId:key,node,path:shortestRescuePath(state,key)});
  }
  candidates.sort((a,b)=>a.path.length-b.path.length||RESCUE_RESOURCES.indexOf(a.resource)-RESCUE_RESOURCES.indexOf(b.resource));
  const choice=candidates.find(candidate=>state.sectors[candidate.sectorId]?.unlocked||candidate.path.length>0);if(!choice)return false;
  state.golemPlacementTier ??= golemTier;
  state.encounterLayoutVersion ??= getEncounterLayoutVersion(state);
  for(const key of choice.path){const [x,y]=key.split(',').map(Number);state.sectors[key]=sectorForState(state,x,y);state.sectors[key].unlocked=true;}
  const target=state.sectors[choice.sectorId]?.nodes.find(n=>n.id===choice.node.id);if(!target)return false;
  defeatResourceGolem(target); // Target-specific clearance bypasses Survey without granting unrelated tech.
  state.rescue??={resources:[]};state.rescue.resources.push(choice.resource);
  state.rescue.pending={resource:choice.resource,sectorId:choice.sectorId,newMaps:choice.path.length};
  if (RESCUE_RESOURCES.every(resource => state.rescue!.resources.includes(resource)) && !state.achievements.includes('destructive-testing')) {
    state.achievements.push('destructive-testing');
    (state.achievementTimes ??= {})['destructive-testing'] = state.playTimeMs;
  }
  return true;
}

/** Replenish only the missing early bill; a second production dead end can recover again. */
export function applyStartingRecovery(state: GameState) {
  if (state.isTraining || state.mod || state.rescue?.pending || Object.values(state.sectors).some(s => s.unlocked && s.nodes.some(n => n.kind === 'devSource'))) return false;
  const missing = progressionDeficits(state, 'exploration');
  if (!missing) return false;
  const sectors = Object.values(state.sectors).filter(sector => sector.unlocked);
  for (const resource of RESCUE_RESOURCES) {
    const amount = Math.ceil((missing[resource] ?? 0) - 1e-9);
    if (!(amount > 0)) continue;
    const sector = sectors.find(sector => sector.nodes.some(node => node.resourceItem === resource && node.resourceCapacity
      || sector.id === '5,5' && node.id === resource && node.kind === 'big-hole'));
    const deposit = sector?.nodes.find(node => node.resourceItem === resource && node.resourceCapacity
      || sector.id === '5,5' && node.id === resource && node.kind === 'big-hole');
    if (!sector || !deposit) continue;
    if (deposit.kind === 'big-hole') {
      // Original Home IDs identify already-collapsed legacy starting deposits.
      // Reuse the same object and position. Return any buffered Stone to its supplier.
      const incoming = new Set(sector.connections.filter(edge => edge.to === deposit.id).map(edge => edge.id));
      const edge = sector.connections.find(edge => edge.to === deposit.id);
      const source = edge && sector.nodes.find(node => node.id === edge.from);
      if (source) for (const [item, count] of Object.entries(deposit.input)) returnOutput(source, item as ItemId, count!);
      else for (const [item, count] of Object.entries(deposit.input)) (state.globalPool ??= {})[item as ItemId] = (state.globalPool![item as ItemId] ?? 0) + count!;
      if ((deposit.holeStoneConsumed ?? 0) > 0) {
        if (source) returnOutput(source, 'stone', deposit.holeStoneConsumed!);
        else (state.globalPool ??= {}).stone = (state.globalPool!.stone ?? 0) + deposit.holeStoneConsumed!;
      }
      for (const shipment of state.inFlightTransfers ?? []) if (incoming.has(shipment.connectionId) && !shipment.cosmeticOnly) {
        const connection = sector.connections.find(edge => edge.id === shipment.connectionId);
        const sender = connection && sector.nodes.find(node => node.id === connection.from);
        if (sender) returnOutput(sender, shipment.item, shipment.amount ?? 1);
      }
      state.inFlightTransfers = (state.inFlightTransfers ?? []).filter(shipment => !incoming.has(shipment.connectionId));
      sector.connections = sector.connections.filter(edge => !incoming.has(edge.id));
      deposit.kind = resource === 'stone' ? 'stoneDeposit' : resource;
      deposit.name = resource[0].toUpperCase() + resource.slice(1);
      deposit.resourceItem = resource; deposit.resourceCapacity = 1000; deposit.resourceRemaining = 0;
      deposit.input = {}; deposit.output = {}; deposit.progressMs = 0;
      delete deposit.holeBaseStone; delete deposit.holeStoneConsumed; delete deposit.obstructionRadius;
    }
    deposit.resourceRemaining = (deposit.resourceRemaining ?? 0) + amount;
    deposit.resourceCapacity = Math.max(deposit.resourceCapacity ?? 0, deposit.resourceRemaining);
    const rescue = state.rescue ??= { resources: [] };
    rescue.restored ??= {};
    rescue.restored[resource] = (rescue.restored[resource] ?? 0) + amount;
    rescue.pending = { resource, sectorId: sector.id, newMaps: 0, kind: 'local', amount };
    return true;
  }
  return false;
}
