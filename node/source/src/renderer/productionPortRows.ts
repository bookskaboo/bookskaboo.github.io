import { modNode } from '../mods/modRules';
import { ITEM_COLORS, ITEM_NAMES, materialTypeName } from '../content/items';
import { BOT_FRAMES, BOT_GUNS, BOT_STRENGTH, SUPPRESSION_BOT, SUPPRESSION_BOT_NAME } from '../content/botAssembly';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { WASTE_ITEMS } from '../content/progression';
import { FOUNDRY_INPUTS } from '../content/endgame';
import type { Connection, ItemId, MachineNode, SectorState } from '../domain/types';
import { filterOutlet } from '../domain/filterRouting';
import { devExtractorMaterial } from '../simulation/devSource';

export { isProductionMachine } from '../content/productionNodes';

type ResourceSector = Pick<SectorState, 'nodes' | 'connections'>;
export interface MaterialRow { name: string; amount: number; capacity: number; color: number; detail?: string }

/** Extractors draw from the real reserve, including routes through logistics. */
function extractorSource(node: MachineNode, sector?: ResourceSector): MachineNode | undefined {
  if (!sector) return;
  const follow = (edge: Connection, visited = new Set<string>(), accepts = (_item: ItemId) => true): MachineNode | undefined => {
    if (visited.has(edge.from)) return;
    const source = sector.nodes.find(candidate => candidate.id === edge.from);
    if (!source || source.disabled) return;
    if (source.kind === 'devSource') {
      const resourceItem = devExtractorMaterial(node, sector);
      if (accepts(resourceItem)) return { ...source, resourceItem, infiniteResource: true };
      return;
    }
    if (source.resourceItem && source.kind !== 'lake') return accepts(source.resourceItem) ? source : undefined;
    if (!getNodeCapabilities(source.kind).passThrough) return;
    const path = new Set(visited).add(source.id);
    const throughOutlet = source.kind === 'filter' ? (item: ItemId) => accepts(item) && (edge.fromPort ?? 0) === filterOutlet(source, item) : accepts;
    for (const cable of sector.connections.filter(cable => cable.to === source.id)) {
      const resource = follow(cable, path, throughOutlet);
      if (resource && (resource.infiniteResource || (resource.resourceRemaining ?? 0) > 0)) return resource;
    }
  };
  const cable = sector.connections.find(cable => cable.to === node.id && (cable.toPort ?? 0) === 0);
  return cable ? follow(cable) : undefined;
}

/** Each visual row belongs to a semantic port, even when its position is swapped. */
export function productionPortRow(node: MachineNode, direction: 'input' | 'output', index: number, sector?: ResourceSector): MaterialRow {
  const capabilities = getNodeCapabilities(node.kind);
  if (capabilities.behavior === 'bot-assembly') {
    const bag = direction === 'input' ? node.input : node.output;
    const items = direction === 'output' ? Object.keys(BOT_STRENGTH) as ItemId[] : index === 0 ? BOT_FRAMES : BOT_GUNS;
    const stocked = items.filter(item => (bag[item] ?? 0) > 0);
    const amount = stocked.reduce((sum, item) => sum + (bag[item] ?? 0), 0);
    const capacity = direction === 'output' ? modNode(node.kind)?.capacity ?? node.capacity ?? 5 : (capabilities.inputCapacity ?? 5) * Math.max(1, stocked.length);
    const name = direction === 'output' ? SUPPRESSION_BOT_NAME : index === 0 ? 'Frame' : 'Gun';
    const detail = stocked.length ? stocked.map(item => `${bag[item]} × ${ITEM_NAMES[item]}`).join(' · ') : undefined;
    return { name, amount, capacity, color: direction === 'output' ? ITEM_COLORS[SUPPRESSION_BOT] : NODE_DEFINITIONS[node.kind].accent, detail };
  }
  if(node.kind==='recycler'||node.kind==='cornerChallenge') {
    const bag=direction==='input'?node.input:node.output;
    const family=(direction==='input'?getEffectiveNodeInputFamilies(node,[]):getEffectiveNodeOutputFamilies(node))[index];
    const perIngredient=node.kind==='cornerChallenge'&&node.cornerType==='foundry';
    const keys = (Object.keys(bag) as ItemId[]).filter(item => {
      if (node.kind === 'recycler' && direction === 'input') return (item === 'water') === (index === 1);
      return !perIngredient || item === family;
    });
    const amount = keys.reduce((n, i) => n + (bag[i] ?? 0), 0);
    const capacity = node.kind === 'recycler'
      ? direction === 'input' ? modNode(node.kind)?.inputCapacity ?? 10 : modNode(node.kind)?.capacity ?? 10
      : perIngredient ? FOUNDRY_INPUTS[family as ItemId] ?? 0 : 100;
    const name = perIngredient ? ITEM_NAMES[family as ItemId] : direction === 'output' ? 'Recovered materials'
      : family === 'ATTACK_POWER' ? SUPPRESSION_BOT_NAME
      : family && family in ITEM_NAMES ? materialTypeName(family as ItemId)
      : node.kind === 'recycler' ? 'Material' : 'Incoming supplies';
    return {name,amount,capacity,color:NODE_DEFINITIONS[node.kind].accent,detail:keys.filter(i=>(bag[i]??0)>0).map(i=>ITEM_NAMES[i]+': '+bag[i]).join(' · ')};
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
