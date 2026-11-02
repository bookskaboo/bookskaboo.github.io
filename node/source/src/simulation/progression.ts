import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { RECIPES } from '../content/recipes';
import { LATE_RECIPES, WASTE_ITEMS, BOT_STRENGTH } from '../content/progression';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import type { SimulationLookups } from './simulationLookups';
import { generateSector, getSectorWorldSize } from './worldGeneration';
import { canPlaceNode } from './collisions';
import { defeatResourceGolem, GOLEM_AP_COST } from '../content/resourceGolems';
import { normalizeControlGroups } from '../domain/controlGroups';

const total=(bag: Partial<Record<ItemId,number>>,waste?:boolean)=>Object.entries(bag).reduce((n,[i,q])=>n+((waste===undefined||WASTE_ITEMS.includes(i as ItemId)===waste)?q??0:0),0);
export const poolCapacity=(_state:GameState)=>1000;
export const placementLimit=(state:GameState,kind:'storage'|'inventory')=>1+(state.research.repeatableCompletions?.[`${kind}PlacementCapacity`]??0);
export const connectionLimit=(state:GameState,kind:'storage'|'inventory')=>(kind==='storage'?2:1)+(state.research.repeatableCompletions?.[`${kind}ConnectionCapacity`]??0);
export const roadChannels=(state:GameState)=>state.research.completed.includes('roadChannels2')?4:state.research.completed.includes('roadChannels1')?2:1;
export const attackPower=(node:MachineNode)=>Object.entries(BOT_STRENGTH).reduce((n,[i,p])=>n+(node.input[i as ItemId]??0)*(p??0),0);
export function consumeBots(node:MachineNode){for(const i of Object.keys(BOT_STRENGTH))delete node.input[i as ItemId];}
export function initializeProgression(state:GameState){
 const legacy=state.progressionVersion===undefined;
 state.encounters??=[];state.globalPool??={};state.factoryTemplates??=[];state.randomState??=state.seed||1;
 // Update saved display text while retaining item and research IDs for compatibility.
 const mythrilText=(text:string)=>text.replace(/mithril/gi,word=>word===word.toUpperCase()?'MYTHRIL':word[0]==='M'?'Mythril':'mythril');
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
  if(node.recipeId&&['refined-mithril','mithril-mesh','precision-controller','logic-substrate','advanced-actuator','command-core'].includes(node.recipeId))node.cycleMs=RECIPES[node.recipeId].cycleMs;
 for(const sector of Object.values(state.sectors))for(const node of sector.nodes)
  if(node.kind==='resourceGolem'&&node.defeated)defeatResourceGolem(node);
 for(const sector of Object.values(state.sectors))if(legacy&&sector.unlocked)sector.visited=true;
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
 if(!recipe||(!Object.hasOwn(LATE_RECIPES,recipe.id)&&!['advancedAssembler','hydroProcessor','separationFurnace'].includes(node.kind)))return false;
 if(recipe.unlockResearch&&!state.research.completed.includes(recipe.unlockResearch))return true;
 if(!node.batch){
  if(!Object.entries(recipe.inputs).every(([i,n])=>(node.input[i as ItemId]??0)>=(n??0))) {node.progressMs=0;return true;}
  const max={...recipe.outputs};for(const o of recipe.chanceOutputs??[])max[o.item]=(max[o.item]??0)+o.amount;
  if(total(node.output)+total(max)>(node.capacity??getNodeCapabilities(node.kind).defaultCapacity??5)){node.progressMs=0;return true;}
  const outputs={...recipe.outputs};
  for(const o of recipe.chanceOutputs??[])if(random(state)<o.probability)outputs[o.item]=(outputs[o.item]??0)+o.amount;
  for(const [i,n]of Object.entries(recipe.inputs))node.input[i as ItemId]=(node.input[i as ItemId]??0)-(n??0);
  node.batch={recipeId:recipe.id,outputs};node.progressMs=0;
 }
 node.progressMs+=dt;
 const recovery=recipe.recovery&&state.research.completed.includes('mineralRecovery1')?.9:1;
 if(node.progressMs>=recipe.cycleMs*multiplier*recovery){
  for(const [i,n]of Object.entries(node.batch.outputs)){node.output[i as ItemId]=(node.output[i as ItemId]??0)+(n??0);state.produced![i as ItemId]=(state.produced![i as ItemId]??0)+(n??0);}
  delete node.batch;node.progressMs=0;
 }
 return true;
}
export function simulateProgressionNode(state:GameState,sector:SectorState,node:MachineNode,dt:number,lookups:SimulationLookups):boolean{
 if(node.kind==='abandonedFabricator'||node.kind==='sortingStation')return true;
 if(node.kind==='lakeIntake'){
  const edge=lookups.sector(sector).incoming.get(node.id)?.[0];const lake=edge?lookups.sector(sector).nodes.get(edge.from):undefined;
  if(lake?.kind!=='lake'){node.progressMs=0;return true;}
  const rate=state.research.completed.includes('highPressureIntakes')?16:state.research.completed.includes('pressureSystems')?8:4;
  node.progressMs+=dt;
  while(node.progressMs>=1000){node.progressMs-=1000;const q=Math.min(rate,64-(node.output.water??0));node.output.water=(node.output.water??0)+q;state.extracted!.water=(state.extracted!.water??0)+q;}
  return true;
 }
 if(node.kind==='resourceGolem'){
  if(!state.research.completed.includes('resourceGolemSurvey'))return true;
  node.health??=GOLEM_AP_COST;
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
   const pending=lookups.target(sector.id,filter.id)?.transfers.length??0;
   if((state.globalPool![i]??0)>0&&total(filter.input)+pending<5){state.globalPool![i]!--;filter.input[i]=(filter.input[i]??0)+1;}}
  return true;
 }
 if(['slagHopper','wasteHopper','fluidStorage','warehouse'].includes(node.kind)){
  for(const i of Object.keys(node.input)as ItemId[]){const q=Math.min(node.input[i]??0,(node.capacity??200)-total(node.output));node.input[i]=(node.input[i]??0)-q;node.output[i]=(node.output[i]??0)+q;}
  return true;
 }
 if(getNodeCapabilities(node.kind).behavior==='resource'&&node.kind!=='forest'&&state.research.completed.includes('mineralRegeneration')){
  const ranks=state.research.repeatableCompletions?.mineralRegenerationRate??0;
  const period=(state.research.completed.includes('mineralRegeneration2')?15000:30000)/(1+.2*ranks);
  if((node.resourceRemaining??0)<(node.resourceCapacity??0)){node.regenMs=(node.regenMs??0)+dt;const q=Math.floor(node.regenMs/period);node.regenMs%=period;node.resourceRemaining=Math.min(node.resourceCapacity??0,(node.resourceRemaining??0)+q);}else node.regenMs=0;
 }
 return false;
}
