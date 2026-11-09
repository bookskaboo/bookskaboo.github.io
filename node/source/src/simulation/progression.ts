import { modNode } from '../mods/modRules';
import { endgameRank } from '../content/endgame';
import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { RECIPES } from '../content/recipes';
import { LATE_RECIPES, WASTE_ITEMS, BOT_STRENGTH } from '../content/progression';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import type { SimulationLookups } from './simulationLookups';
import { generateSector, getSectorWorldSize } from './worldGeneration';
import { canPlaceNode } from './collisions';
import { defeatResourceGolem, golemApCost } from '../content/resourceGolems';
import { normalizeControlGroups } from '../domain/controlGroups';
import { canonicalCoreText } from '../content/displayNameChanges';
import { queueOutputs, reconcileQueue } from './mixedOutput';
import { RETIRED_RECIPES } from '../content/recipes';

const total=(bag: Partial<Record<ItemId,number>>,waste?:boolean)=>Object.entries(bag).reduce((n,[i,q])=>n+((waste===undefined||WASTE_ITEMS.includes(i as ItemId)===waste)?q??0:0),0);
export const poolCapacity=(_state:GameState)=>1000;
export const placementLimit=(state:GameState,kind:'storage'|'inventory')=>1+(state.research.repeatableCompletions?.[`${kind}PlacementCapacity`]??0);
export const connectionLimit=(state:GameState,kind:'storage'|'inventory')=>(kind==='storage'?2:1)+(state.research.repeatableCompletions?.[`${kind}ConnectionCapacity`]??0);
export const roadChannels=(state:GameState)=>state.research.completed.includes('roadChannels2')?3+Math.min(2,endgameRank(state,'advancedRoadChannels')):state.research.completed.includes('roadChannels1')?2:1;
export const attackPower=(node:MachineNode)=>Object.entries(BOT_STRENGTH).reduce((n,[i,p])=>n+(node.input[i as ItemId]??0)*(p??0),0);
export function consumeBots(node:MachineNode){for(const i of Object.keys(BOT_STRENGTH))delete node.input[i as ItemId];}
/** Pay the minimum sufficient AP, then prefer fewer bots. Failed checks consume the insufficient supply. */
export function consumeCampBots(node: MachineNode, requirement: number): number {
 if (attackPower(node) < requirement) { consumeBots(node); return 0; }
 const bots = Object.entries(BOT_STRENGTH) as [ItemId, number][];
 const limit = Math.ceil(requirement) + Math.max(...bots.map(([, power]) => power)) - 1;
 const plans: Array<{ count: number; quantities: number[] } | undefined> = Array(limit + 1);
 plans[0] = { count: 0, quantities: bots.map(() => 0) };
 bots.forEach(([item, power], index) => {
  const available = Math.min(Math.floor(node.input[item] ?? 0), Math.floor(limit / power));
  for (let copy = 0; copy < available; copy++) for (let ap = limit; ap >= power; ap--) {
   const previous = plans[ap - power];
   if (!previous || (plans[ap]?.count ?? Infinity) <= previous.count + 1) continue;
   const quantities = [...previous.quantities]; quantities[index]++;
   plans[ap] = { count: previous.count + 1, quantities };
  }
 });
 const payment = plans.slice(Math.ceil(requirement)).find(Boolean);
 if (!payment) return 0;
 bots.forEach(([item], index) => {
  const remaining = (node.input[item] ?? 0) - payment.quantities[index];
  if (remaining > 0) node.input[item] = remaining; else delete node.input[item];
 });
 return bots.reduce((sum, [,power], index) => sum + power * payment.quantities[index], 0);
}
export function initializeProgression(state:GameState){
 const legacy=state.progressionVersion===undefined;
 state.encounters??=[];state.globalPool??={};state.factoryTemplates??=[];state.randomState??=state.seed||1;
 // Update saved display text while retaining item and research IDs for compatibility.
 const mythrilText=(text:string)=>canonicalCoreText(text.replace(/mithril/gi,word=>word===word.toUpperCase()?'MYTHRIL':word[0]==='M'?'Mythril':'mythril'));
 for(const sector of Object.values(state.sectors)){
  sector.controlGroups=normalizeControlGroups(sector.controlGroups,sector.nodes);
  sector.name=mythrilText(sector.name);
  for(const node of sector.nodes)node.name=mythrilText(node.name);
 }
 for(const template of state.factoryTemplates){
  template.name=mythrilText(template.name);
  for(const node of template.nodes)node.name=mythrilText(node.name);
 }
 for(const event of [...state.events,...(state.researchLog??[])])event.message=mythrilText(event.message);
 // Retained Mythril discovery is proof of the encounter even if an old deposit
 // depleted or a legacy save did not retain encounter history.
 const mythrilItems:ItemId[]=['mythril','mythril-plate','mythril-gear','mythril-wire','refined-mithril'];
 const hasMythril=(bag:Partial<Record<ItemId,number>>|undefined)=>mythrilItems.some(item=>(bag?.[item]??0)>0);
 const retainedMythril=state.research.completed.includes('mithrilTools')||hasMythril(state.produced)||hasMythril(state.extracted)||hasMythril(state.globalPool)||Object.values(state.sectors).some(sector=>sector.nodes.some(node=>hasMythril(node.input)||hasMythril(node.output)));
 if(retainedMythril&&!state.encounters.includes('mythril'))state.encounters.push('mythril');
 // Old saves retain their items; overfilled machines drain before accepting more.
 for(const sector of Object.values(state.sectors))for(const node of sector.nodes)
  if(['hydroProcessor','advancedAssembler','separationFurnace'].includes(node.kind))node.capacity=5;
 // Refresh revised base times without changing saved items or already-committed batch outputs.
 for(const sector of Object.values(state.sectors))for(const node of sector.nodes)
  if(node.recipeId&&['refined-mithril','mithril-mesh','precision-controller','logic-substrate','advanced-actuator','command-core','medium-suppression-bot','command-suppression-bot'].includes(node.recipeId))node.cycleMs=RECIPES[node.recipeId].cycleMs;
 for(const sector of Object.values(state.sectors))for(const node of sector.nodes)
  if(node.kind==='resourceGolem'&&node.defeated)defeatResourceGolem(node);
 for(const sector of Object.values(state.sectors))if(legacy&&sector.unlocked)sector.visited??=true;
 if(legacy)for(const [id,kinds]of [['7,5',['lake','mythril']],['5,7',['sortingStation']]]as const){
  const sector=state.sectors[id];if(!sector)continue;
  const [x,y]=id.split(',').map(Number),generated=generateSector(x,y,state.seed);
  for(const kind of kinds)if(!sector.nodes.some(n=>n.kind===kind)){
   const node=generated.nodes.find(n=>n.kind===kind);if(!node)continue;const field=getSectorWorldSize(sector,state.research.completed);
   for(let attempt=0;attempt<1000&&!canPlaceNode(node,sector.nodes,field);attempt++){node.x=220+(attempt*379)%(field.width-440);node.y=250+(attempt*197)%(field.height-500);}
   if(canPlaceNode(node,sector.nodes,field))sector.nodes.push(node);
  }
 }
 state.sectors[state.activeSectorId].visited=true;state.progressionVersion=1;
 if(state.research.completed.includes('precisionControl'))for(const list of [state.research.completed,state.research.unlocked])if(!list.includes('sortingTools'))list.push('sortingTools');
 discoverActiveSector(state);
}
export function discoverActiveSector(state:GameState){
 const sector=state.sectors[state.activeSectorId];sector.visited=true;
 for(const s of Object.values(state.sectors))if(s.visited)for(const node of s.nodes)if(!state.encounters!.includes(node.kind))state.encounters!.push(node.kind);
}
function random(state:GameState){let n=state.randomState??state.seed??1;n^=n<<13;n^=n>>>17;n^=n<<5;state.randomState=n>>>0;return state.randomState/4294967296;}
export function simulateExtendedRecipe(state:GameState,node:MachineNode,dt:number,multiplier:number):boolean {
 const recipe=node.recipeId?RECIPES[node.recipeId]:undefined;
 if(!recipe||(!recipe.chanceOutputs?.length&&!Object.hasOwn(LATE_RECIPES,recipe.id)&&!['advancedAssembler','hydroProcessor','separationFurnace'].includes(node.kind)))return false;
 if(recipe.unlockResearch&&!state.research.completed.includes(recipe.unlockResearch)&&!node.batch)return true;
 if(RETIRED_RECIPES.has(recipe.id)&&!node.batch){delete node.recipeId;node.progressMs=0;return true;}
 if(!node.batch){
  if(!Object.entries(recipe.inputs).every(([i,n])=>(node.input[i as ItemId]??0)>=(n??0))) {node.progressMs=0;return true;}
  const max={...recipe.outputs};for(const o of recipe.chanceOutputs??[])max[o.item]=(max[o.item]??0)+o.amount;
  if(total(node.output)+total(max)>(modNode(node.kind)?.capacity??node.capacity??getNodeCapabilities(node.kind).defaultCapacity??5)){node.progressMs=0;return true;}
  const outputs={...recipe.outputs};
  for(const o of recipe.chanceOutputs??[])if(random(state)<o.probability)outputs[o.item]=(outputs[o.item]??0)+o.amount;
  for(const [i,n]of Object.entries(recipe.inputs))node.input[i as ItemId]=(node.input[i as ItemId]??0)-(n??0);
  node.batch={recipeId:recipe.id,outputs};node.progressMs=0;
 }
 node.progressMs+=dt;
 const recovery=recipe.recovery&&state.research.completed.includes('mineralRecovery1')?.9:1;
 if(node.progressMs>=recipe.cycleMs*multiplier*recovery){
  queueOutputs(node,node.batch.outputs);
  for(const [i,n]of Object.entries(node.batch.outputs))state.produced![i as ItemId]=(state.produced![i as ItemId]??0)+(n??0);
  delete node.batch;node.progressMs=0;
  if(RETIRED_RECIPES.has(recipe.id))delete node.recipeId;
 }
 return true;
}
export function simulateProgressionNode(state:GameState,sector:SectorState,node:MachineNode,dt:number,lookups:SimulationLookups,canReceive?: (node:MachineNode,item:ItemId)=>boolean):boolean{
 if(node.kind==='abandonedFabricator'||node.kind==='sortingStation')return true;
 if(node.kind==='lakeIntake'){
  const edge=lookups.sector(sector).incoming.get(node.id)?.[0];const lake=edge?lookups.sector(sector).nodes.get(edge.from):undefined;
  if(lake?.kind!=='lake'&&lake?.kind!=='devSource'){node.progressMs=0;return true;}
  const rate=state.research.completed.includes('highPressureIntakes')?16:state.research.completed.includes('pressureSystems')?8:4;
  node.progressMs+=dt;
  while(node.progressMs>=1000){node.progressMs-=1000;const q=Math.min(rate,(modNode(node.kind)?.capacity??64)-(node.output.water??0));node.output.water=(node.output.water??0)+q;state.extracted!.water=(state.extracted!.water??0)+q;}
  return true;
 }
 if(node.kind==='resourceGolem'){
  if(!state.research.completed.includes('resourceGolemSurvey'))return true;
  node.health??=golemApCost(node);
  const damage=attackPower(node);
  if(damage){node.health=Math.max(0,node.health-damage);consumeBots(node);}
  if(node.health===0)defeatResourceGolem(node);
  return true;
 }
 if(node.kind==='storage'){
  for(const bag of [node.input,node.output])for(const i of Object.keys(bag)as ItemId[]){const q=Math.min(bag[i]??0,poolCapacity(state)-(state.globalPool![i]??0));if(q>0){state.globalPool![i]=(state.globalPool![i]??0)+q;bag[i]=(bag[i]??0)-q;}}
  return true;
 }
 if(node.kind==='inventory'){
  node.transferProgressMs=(node.transferProgressMs??0)+dt;if(node.transferProgressMs<1000)return true;node.transferProgressMs%=1000;
  for(const c of lookups.sector(sector).outgoing.get(node.id)??[]){const filter=lookups.sector(sector).nodes.get(c.to);if(filter?.kind!=='filter'||!filter.filterItem)continue;const i=filter.filterItem;
   if(canReceive&&!canReceive(filter,i))continue;
   const pending=lookups.target(sector.id,filter.id)?.transfers.length??0;
   if((state.globalPool![i]??0)>0&&total(filter.input)+pending<5){state.globalPool![i]!--;filter.input[i]=(filter.input[i]??0)+1;}}
  return true;
 }
 if(['slagHopper','wasteHopper','fluidStorage','warehouse'].includes(node.kind)){
  node.inputQueue=reconcileQueue(node.inputQueue,node.input);
  while(node.inputQueue.length&&total(node.output)<(node.capacity??200)){
   const item=node.inputQueue.shift()!;node.input[item]!--;queueOutputs(node,{[item]:1});
  }
  return true;
 }
 if(!node.infiniteResource&&getNodeCapabilities(node.kind).behavior==='resource'&&node.kind!=='forest'&&state.research.completed.includes('mineralRegeneration')){
  const ranks=state.research.repeatableCompletions?.mineralRegenerationRate??0;
  const period=(state.research.completed.includes('mineralRegeneration2')?15000:30000)/(1+.2*ranks)/(1+endgameRank(state,'resourceRegeneration'));
  if((node.resourceRemaining??0)<(node.resourceCapacity??0)){node.regenMs=(node.regenMs??0)+dt;const q=Math.floor(node.regenMs/period);node.regenMs%=period;node.resourceRemaining=Math.min(node.resourceCapacity??0,(node.resourceRemaining??0)+q);}else node.regenMs=0;
 }
 return false;
}
