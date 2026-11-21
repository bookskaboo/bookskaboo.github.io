import type { GameState, ItemId, MachineNode, Recipe } from '../domain/types';
import { getEfficiencyMultiplier } from './efficiency';

export const LANDMARK_COLORS = { ordinary: 0xb584ef, unknown: 0xf29ac2 } as const;
export const CORE_ITEMS: readonly ItemId[] = ['simple-core','basic-core','automata-core','hydro-core','shiny-core','command-core','final-core'];
export const landmarkName = (node: Pick<MachineNode, 'kind' | 'landmark'>) => node.landmark === 'unknown' ? 'Unknown Device'
  : node.landmark === 'tri' ? 'Tri Extractor' : node.landmark === 'doubler' ? 'Doubler'
  : node.landmark === 'reclaimer' ? 'Reclaimer' : `Rapid ${{refiner:'Refiner',smelter:'Smelter',assembler:'Assembler',advancedAssembler:'Fabricator'}[node.kind as string] ?? node.kind}`;
export const landmarkRecipeAllowed = (node: MachineNode, recipe: Recipe) => node.landmark !== 'unknown'
  && (node.landmark !== 'doubler' || ![...Object.keys(recipe.outputs),...(recipe.chanceOutputs??[]).map(o=>o.item)].some(item => CORE_ITEMS.includes(item as ItemId) || item === 'core-half-a' || item === 'core-half-b'));
export const landmarkYield = (node: MachineNode) => node.landmark === 'doubler' ? 2 : 1;
/** Instance-specific recipe presentation; catalog definitions remain ordinary recipes. */
export function landmarkRecipe(node: MachineNode, recipe: Recipe): Recipe {
  return {...recipe,inputs:Object.fromEntries(Object.entries(recipe.inputs).filter(([item])=>node.landmark!=='reclaimer'||item!=='water')),
    outputs:Object.fromEntries(Object.entries(recipe.outputs).map(([item,q])=>[item,(q??0)*landmarkYield(node)])),
    chanceOutputs:recipe.chanceOutputs?.map(o=>({...o,amount:o.amount*landmarkYield(node)}))};
}
export function landmarkMultiplier(node: MachineNode, game: GameState, ordinary: number) {
  if (node.landmark === 'rapid') return .1;
  if (node.landmark === 'reclaimer') return .25;
  if (node.landmark === 'unknown') return 1;
  if (node.landmark === 'tri') return getEfficiencyMultiplier('extractor', game.research.completed);
  return ordinary;
}
export function landmarkDescription(node: MachineNode) {
  if (node.landmark === 'unknown') return '';
  if (node.landmark === 'rapid') return '10× base processing speed. Speed research does not stack.';
  if (node.landmark === 'tri') return 'One reserve unit supplies all three outputs each cycle. Any full output pauses the shared cycle.';
  if (node.landmark === 'reclaimer') return '4× base Recycler speed, without Water. Speed research does not stack.';
  return 'Ordinary ingredients produce twice every output, including waste. Chance rolls occur once.';
}
