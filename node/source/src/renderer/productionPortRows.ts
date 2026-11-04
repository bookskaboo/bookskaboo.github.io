import { modNode } from '../mods/modRules';
import { ITEM_COLORS, ITEM_NAMES } from '../content/items';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { WASTE_ITEMS } from '../content/progression';
import type { ItemId, MachineNode, SectorState } from '../domain/types';
import { devExtractorMaterial } from '../simulation/devSource';

export { isProductionMachine } from '../content/productionNodes';

type ResourceSector = Pick<SectorState, 'nodes' | 'connections'>;
export interface MaterialRow { name: string; amount: number; capacity: number; color: number; detail?: string }

/** Extractors draw from the real reserve, including routes through logistics. */
function extractorSource(node: MachineNode, sector?: ResourceSector): MachineNode | undefined {
  if (!sector) return;
  const visited = new Set<string>();
  const follow = (id: string): MachineNode | undefined => {
    if (visited.has(id)) return;
    visited.add(id);
    const source = sector.nodes.find(candidate => candidate.id === id);
    if (!source || source.disabled) return;
    if (source.kind === 'devSource') return { ...source, resourceItem: devExtractorMaterial(node, sector), infiniteResource: true };
    if (source.resourceItem && source.kind !== 'lake') return source;
    if (!getNodeCapabilities(source.kind).passThrough) return;
    for (const cable of sector.connections.filter(cable => cable.to === id)) {
      const resource = follow(cable.from);
      if (resource && (resource.infiniteResource || (resource.resourceRemaining ?? 0) > 0) && (source.kind !== 'filter' || !source.filterItem || source.filterItem === resource.resourceItem)) return resource;
    }
  };
  const cable = sector.connections.find(cable => cable.to === node.id && (cable.toPort ?? 0) === 0);
  return cable ? follow(cable.from) : undefined;
}

/** Each visual row belongs to a semantic port, even when its position is swapped. */
export function productionPortRow(node: MachineNode, direction: 'input' | 'output', index: number, sector?: ResourceSector): MaterialRow {
  const capabilities = getNodeCapabilities(node.kind);
  if(node.kind==='recycler'||node.kind==='cornerChallenge') {
    const bag=direction==='input'?node.input:node.output;
    const family=(direction==='input'?getEffectiveNodeInputFamilies(node,[]):getEffectiveNodeOutputFamilies(node))[index];
    const perIngredient=node.kind==='cornerChallenge'&&node.cornerType==='foundry';
    const keys=Object.keys(bag).filter(i=>!perIngredient||i===family) as ItemId[];
    const amount=keys.reduce((n,i)=>n+(bag[i]??0),0),capacity=node.kind==='recycler'?10:perIngredient?3000:100;
    return {name:perIngredient?ITEM_NAMES[family as ItemId]:direction==='input'?'Incoming supplies':'Recovered solids',amount,capacity,color:NODE_DEFINITIONS[node.kind].accent,detail:keys.filter(i=>(bag[i]??0)>0).map(i=>ITEM_NAMES[i]+': '+bag[i]).join(' · ')};
  }
  if (node.kind === 'extractor') {
    const source = extractorSource(node, sector), sourceItem = source?.resourceItem;
    const contents = (Object.keys(node.output) as ItemId[]).filter(item => (node.output[item] ?? 0) > 0);
    const item = direction === 'input' ? sourceItem : contents[0] ?? sourceItem ?? node.resourceItem;
    const name = direction === 'output' && contents.length > 1 ? 'Mixed resources' : item ? ITEM_NAMES[item] : direction === 'input' ? 'Resource' : 'Output';
    if (direction === 'input') {
      const amount = source?.infiniteResource ? 1 : source?.resourceRemaining ?? 0;
      const capacity = source?.infiniteResource ? 1 : source?.resourceCapacity ?? amount;
      const detail = !source ? 'Connect a resource source.' : source.infiniteResource ? `Infinite ${name} reserve at ${source.name}.` : `${amount}/${capacity} remaining at ${source.name}.`;
      return { name, amount, capacity, color: item ? ITEM_COLORS[item] : NODE_DEFINITIONS[node.kind].accent, detail };
    }
    const amount = contents.reduce((sum, item) => sum + (node.output[item] ?? 0), 0), capacity = node.capacity ?? 5;
    return { name, amount, capacity, color: item ? ITEM_COLORS[item] : NODE_DEFINITIONS[node.kind].accent,
      detail: `${amount}/${capacity} stored${contents.length > 1 ? ` · ${contents.map(item => `${ITEM_NAMES[item]} ${node.output[item]}`).join(' · ')}` : ''}.` };
  }
  const recipe = RECIPES[node.batch?.recipeId ?? node.recipeId ?? capabilities.defaultRecipeId ?? ''];
  const families = direction === 'input' ? getEffectiveNodeInputFamilies(node, []) : getEffectiveNodeOutputFamilies(node);
  const family = families[index];
  const candidates = !recipe && family && family in ITEM_NAMES ? [family as ItemId] : direction === 'input' ? Object.keys(recipe?.inputs ?? {}) as ItemId[]
    : [...new Set([...Object.keys(recipe?.outputs ?? {}), ...(recipe?.chanceOutputs ?? []).map(output => output.item)])] as ItemId[];
  const items = family === 'ANY' ? candidates : family === 'WASTE' ? candidates.filter(item => WASTE_ITEMS.includes(item))
    : candidates.filter(item => item === family || (family === 'METAL' && ['iron', 'copper', 'mythril'].includes(item)) || (family === 'PLATE' && item.endsWith('-plate')));
  const item = items[0];
  const bag = direction === 'input' ? node.input : node.output;
  const amount = items.reduce((sum, item) => sum + (bag[item] ?? 0), 0);
  const capacity = direction === 'input' ? capabilities.inputCapacity ?? 5 : modNode(node.kind)?.capacity ?? node.capacity ?? capabilities.defaultCapacity ?? 5;
  const name = family === 'ANY' && items.length > 1 ? 'Mixed output' : family === 'WASTE' ? 'Waste' : item ? ITEM_NAMES[item] : !recipe ? 'Choose recipe' : direction === 'input' ? 'Input' : 'Output';
  return { name, amount, capacity, color: item ? ITEM_COLORS[item] : NODE_DEFINITIONS[node.kind].accent };
}

export function productionBufferSummary(node: MachineNode, sector?: ResourceSector) {
  return (['input', 'output'] as const).map(direction => {
    const families = direction === 'input' ? getEffectiveNodeInputFamilies(node, []) : getEffectiveNodeOutputFamilies(node);
    return `${direction === 'input' ? 'Inputs' : 'Outputs'}: ${families.map((_, index) => {
      const row = productionPortRow(node, direction, index, sector);
      return row.detail ? `${row.name}: ${row.detail}` : `${row.name} ${row.amount}/${row.capacity}`;
    }).join(' · ')}`;
  }).join('. ');
}
