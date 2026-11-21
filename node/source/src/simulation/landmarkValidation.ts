import type { GameState, MachineNode } from '../domain/types';
import { CORE_ITEMS } from '../content/landmarks';
import { worldGridSize } from '../domain/worldGrid';

const kinds: Record<NonNullable<MachineNode['landmark']>,readonly string[]> = {
  rapid:['refiner','smelter','assembler','advancedAssembler'],tri:['extractor'],
  doubler:['refiner','assembler','advancedAssembler'],reclaimer:['recycler'],unknown:['refiner'],
};
function validateNode(node: MachineNode) {
  if (!node.landmark) return;
  if (!kinds[node.landmark]?.includes(node.kind)) throw new Error('Invalid landmark family.');
  if (node.landmark==='tri' && (!Array.isArray(node.triOutput)||node.triOutput.length!==3||node.triOutput.some(n=>!Number.isInteger(n)||n<0))) throw new Error('Invalid landmark output buffers.');
  if (node.activeCore && (node.landmark!=='unknown'||!CORE_ITEMS.includes(node.activeCore))) throw new Error('Invalid active Core.');
  if (node.landmark==='unknown' && (node.recipeId||node.batch||[...Object.entries(node.input),...Object.entries(node.output)].some(([item,n])=>!CORE_ITEMS.includes(item as typeof CORE_ITEMS[number])||!Number.isInteger(n)||n!<0))) throw new Error('Invalid Unknown Device stock.');
}
/** Never generates or repairs a missing assignment during loading. */
export function validateLandmarks(state: GameState) {
  if (state.landmarkVersion!==undefined && state.landmarkVersion!==0 && state.landmarkVersion!==1) throw new Error('Unsupported landmark layout.');
  const nodes=Object.values(state.sectors).flatMap(s=>s.nodes);
  nodes.forEach(validateNode);
  if (state.landmarkVersion!==1) {
    if (state.landmarkLayout?.length || nodes.some(n=>n.landmark)) throw new Error('Landmarks require their saved layout version.');
    return;
  }
  const layout=state.landmarkLayout;
  if (worldGridSize(state)!==11 || !Array.isArray(layout)||layout.length!==17) throw new Error('Invalid landmark world size or count.');
  const sectors=new Set<string>(), totals:Record<string,number>={},bands=[0,0,0,0],families:Record<string,number>={};
  for (const entry of layout) {
    const sector=entry?.sector;
    if (!sector||!Array.isArray(sector.nodes)||!Array.isArray(sector.connections)||sector.id!==`${sector.x},${sector.y}`||!Number.isInteger(sector.x)||!Number.isInteger(sector.y)||sector.x<0||sector.x>10||sector.y<0||sector.y>10||sectors.has(sector.id)) throw new Error('Invalid landmark sector.');
    sectors.add(sector.id);
    const tier=Math.abs(sector.x-5)+Math.abs(sector.y-5);
    const landmark=sector.nodes.filter(n=>n.landmark);
    if(tier<1||tier>9||landmark.length!==1||landmark[0].id!==entry.nodeId)throw new Error('Invalid landmark placement.');
    const node=landmark[0];validateNode(node);
    if(node.landmark==='unknown'&&tier!==8||node.landmark==='reclaimer'&&(tier<5||tier>6))throw new Error('Invalid landmark tier.');
    totals[node.landmark!]=(totals[node.landmark!]??0)+1;
    families[`${node.landmark}:${node.kind}`]=(families[`${node.landmark}:${node.kind}`]??0)+1;
    bands[tier<=2?0:tier<=4?1:tier<=6?2:3]++;
  }
  if (['rapid:6','tri:6','doubler:3','reclaimer:1','unknown:1'].some(rule=>{const [type,n]=rule.split(':');return totals[type]!==Number(n);})||bands.join()!=='2,5,5,5')throw new Error('Invalid landmark allocation.');
  for(const [key,n]of Object.entries({'rapid:refiner':2,'rapid:smelter':2,'rapid:assembler':1,'rapid:advancedAssembler':1,'doubler:refiner':1,'doubler:assembler':1,'doubler:advancedAssembler':1}))if(families[key]!==n)throw new Error('Invalid landmark family allocation.');
}
