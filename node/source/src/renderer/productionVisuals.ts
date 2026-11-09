import { groveProgress } from './groveProgress';
import { ALPHA_AP, CORNER_ITEMS, FOUNDRY_INPUTS, GROVE_GROWTH, RECLAMATION_QUOTAS } from '../content/endgame';
import { modNode } from '../mods/modRules';
import { getNodeCapabilities, isResourceBehavior } from '../content/nodeCapabilities';
import { getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { WASTE_ITEMS } from '../content/progression';
import { researchCenterView } from './researchCenterView';
import { isStorageNode } from './bufferSlots';
import { ITEM_NAMES } from '../content/items';
import { isProductionMachine, productionBufferSummary } from './productionPortRows';
import { outstandingResearchCores } from '../simulation/researchStatus';
import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';

export interface ProductionVisual { working: boolean; missingInputs: number[]; blockedOutputs: number[]; fill: number; }
const total = (bag: MachineNode['output']) => Object.values(bag).reduce<number>((sum, n) => sum + (n ?? 0), 0);

export function productionExplanation(node: MachineNode, game: GameState, sector: SectorState) {
  const recipe = RECIPES[node.batch?.recipeId ?? node.recipeId ?? ''];
  const capacity = modNode(node.kind)?.capacity ?? node.capacity ?? getNodeCapabilities(node.kind).defaultCapacity ?? 5;
  const ingredients = recipe ? Object.entries(recipe.inputs).map(([item, required]) => ({ item: item as ItemId, available: node.input[item as ItemId] ?? 0, required: required ?? 0, capacity: getNodeCapabilities(node.kind).inputCapacity ?? 5 })) : [];
  const possible = { ...recipe?.outputs };
  for (const output of recipe?.chanceOutputs ?? []) possible[output.item] = (possible[output.item] ?? 0) + output.amount;
  const requiredRoom = total(possible);
  const used = total(node.output);
  const missing = ingredients.filter(input => input.available < input.required);
  const cue = productionVisual(node, game, sector);
  let summary = '';
  if(node.kind==='recycler')summary='Recycle one item every 2s. Mixed recovered solids need filtering; basic resources return nothing.';
  else if (node.kind === 'cornerChallenge') {
    const piece = ITEM_NAMES[CORNER_ITEMS[node.cornerType ?? 'reclamation']];
    switch (node.cornerType) {
      case 'foundry':
        summary = `Deliver ${Object.entries(FOUNDRY_INPUTS).map(([item, count]) => `${count} ${ITEM_NAMES[item as ItemId]}`).join(', ')} for one ${piece} immediately. All three ingredient streams are required.`;
        break;
      case 'alpha':
        summary = `Cumulative AP: ${(node.cornerProgress ?? 0).toLocaleString()} / ${ALPHA_AP}. Bots supply AP. Surplus carries toward the next ${piece}. Full Tribute pauses consumption.`;
        break;
      case 'grove':
        summary = `Forest Growth: ${groveProgress(node)?.label}. Every ${GROVE_GROWTH.toLocaleString('en-US')} growth produces one ${piece} immediately. Tree Planters supply growth. It accumulates without a timeout and surplus is preserved. Collect Tribute when all 10 spaces are full to resume intake.`;
        break;
      default:
        summary = `Reclamation: ${((node.cornerProgress ?? 0) * 100).toFixed(3)}%. One ${piece} needs ${Object.entries(RECLAMATION_QUOTAS).map(([item, count]) => `${count} ${ITEM_NAMES[item as ItemId]}`).join(' or ')}. Mixed waste adds proportional progress. Standard Controllers produce one Metallic Fines per batch. Drain the Controller output to keep the line running.`;
    }
  }
  else if (node.disabled) summary = 'Node disabled.';
  else if (Date.now() - node.constructedAt < node.constructionMs) summary = 'Under construction.';
  else if (node.processingPaused && NODE_DEFINITIONS[node.kind].category !== 'Logistics') summary = 'Production paused.';
  else if (node.batch) summary = `Producing ${recipe?.name ?? 'a committed batch'}. Batch ingredients already consumed; output room reserved.`;
  else if (recipe?.unlockResearch && !game.research.completed.includes(recipe.unlockResearch)) summary = 'Required recipe research is incomplete.';
  else if (recipe && used + requiredRoom > capacity) summary = `Output/waste buffer full: ${used}/${capacity} stored; next batch needs ${requiredRoom} free spaces. Drain the output or waste route.`;
  else if (missing.length) summary = `Waiting for ${missing.map(input => `${ITEM_NAMES[input.item]} (${input.available}/${input.required})`).join(', ')}.`;
  else if (getNodeCapabilities(node.kind).behavior === 'research') summary = researchCenterView(node, game).summary;
  else if (recipe) summary = `${node.progressMs > 0 ? 'Producing' : 'Ready to produce'} ${recipe.name}.`;
  else if (cue.blockedOutputs.length) summary = `Output buffer full: ${used}/${capacity}. Check the downstream route.`;
  else if (node.kind === 'extractor' && cue.missingInputs.length) summary = 'Waiting for an available resource source. Check its connection and remaining reserve.';
  else if (getNodeCapabilities(node.kind).behavior === 'recipe') summary = 'Choose a production recipe.';
  if (isStorageNode(node.kind)) {
    const contents = (Object.keys({ ...node.input, ...node.output }) as ItemId[])
      .map(item => ({ item, amount: (node.input[item] ?? 0) + (node.output[item] ?? 0) }))
      .filter(entry => entry.amount > 0);
    const stored = contents.reduce((sum, entry) => sum + entry.amount, 0);
    const inventory = contents.length ? contents.map(({ item, amount }) => `${ITEM_NAMES[item]}: ${amount}`).join(' · ') : 'Empty';
    summary = `${inventory} · ${stored}/${capacity} stored.${summary ? ' ' + summary : ''}`;
  }
  if (isProductionMachine(node)) summary += ` ${productionBufferSummary(node, sector)}.`;
  if (game.paused && summary) summary = `Simulation paused. ${summary}`;
  return { summary, ingredients, capacity, used, requiredRoom, committed: Boolean(node.batch), recipe };
}
export function productionVisualContext(sector: SectorState) {
  const nodes = new Map(sector.nodes.map(node => [node.id, node]));
  const incoming = new Map<string, string>();
  sector.connections.forEach(c => { if ((c.toPort ?? 0) === 0 && !incoming.has(c.to)) incoming.set(c.to, c.from); });
  return { nodes, incoming };
}

/** Visuals follow simulation readiness; no inferred production or throughput. */
export function productionVisual(node: MachineNode, game: GameState, sector: SectorState, context = productionVisualContext(sector)): ProductionVisual {
  if (node.kind === 'devSource') return { working: false, missingInputs: [], blockedOutputs: [], fill: 0 };
  const capacity = modNode(node.kind)?.capacity ?? node.capacity ?? getNodeCapabilities(node.kind).defaultCapacity ?? 5;
  const visual: ProductionVisual = { working: false, missingInputs: [], blockedOutputs: [], fill: Math.min(1, total(node.output) / capacity) };
  if (node.disabled || (node.processingPaused && NODE_DEFINITIONS[node.kind].category !== 'Logistics') || Date.now() - node.constructedAt < node.constructionMs) return visual;
  const behavior = getNodeCapabilities(node.kind).behavior;
  if (isResourceBehavior(node.kind) && node.kind !== 'lake') return visual;
  let demands: Array<[ItemId, number]> = [];
  let products: Partial<Record<ItemId, number>> = {};
  if (node.kind === 'extractor') {
    let sourceId = context.incoming.get(node.id);
    const seen = new Set<string>(); let source: MachineNode | undefined;
    while (sourceId && !seen.has(sourceId)) {
      seen.add(sourceId); source = context.nodes.get(sourceId);
      if (!source || isResourceBehavior(source.kind) || source.kind === 'devSource') break;
      if (source.kind !== 'joint') { source = undefined; break; }
      sourceId = context.incoming.get(source.id);
      if (!sourceId || seen.has(sourceId)) source = undefined;
    }
    if (!source || source.disabled || (source.kind !== 'devSource' && (!source.resourceItem || (!source.infiniteResource && (source.resourceRemaining ?? 0) <= 0)))) visual.missingInputs = [0];
    if (total(node.output) >= (modNode(node.kind)?.capacity ?? 5)) visual.blockedOutputs = [0];
  } else if (behavior === 'research') {
    const required = outstandingResearchCores(game.research);
    if (!required.length) return visual;
    visual.missingInputs = required.some(item => (node.input[item] ?? 0) < 1) ? [0] : [];
  } else if (node.recipeId && RECIPES[node.recipeId]) {
    const recipe = RECIPES[node.recipeId];
    if (!node.batch) demands = Object.entries(recipe.inputs) as Array<[ItemId, number]>;
    products = { ...recipe.outputs };
    if (!node.batch) for (const output of recipe.chanceOutputs ?? []) products[output.item] = (products[output.item] ?? 0) + output.amount;
    // An in-flight batch already paid its ingredients and reserved output room.
    if (node.batch) products = {};
  } else if (behavior === 'generator') {
    demands = [['charcoal', 1]];
    if ((node.output.power ?? 0) > 50) visual.blockedOutputs = [0];
  } else if (behavior === 'planter') {
    if ((node.growthCredit ?? 0) <= 0) demands = [['wood', 10], ['iron-plate', 1], ['stone', 1]];
    products = { 'forest-growth': 1 };
  } else if (node.kind === 'lake') {
    if (total(node.output) >= capacity) visual.blockedOutputs = [0, 1, 2, 3];
  } else if (getEffectiveNodeOutputFamilies(node).length && total(node.output) >= capacity) {
    visual.blockedOutputs = getEffectiveNodeOutputFamilies(node).map((_, index) => index);
  }
  demands.forEach(([item, amount], index) => { if ((node.input[item] ?? 0) < amount) visual.missingInputs.push(index); });
  if (total(node.output) + total(products) > capacity && total(products) > 0) {
    // Show the bank holding the stock that must drain, including waste sockets.
    const families = getEffectiveNodeOutputFamilies(node);
    visual.blockedOutputs = families.flatMap((family, index) => {
      return Object.entries(node.output).some(([item, n]) => (n ?? 0) > 0 && (family === 'ANY' || family === item || (family === 'WASTE' && WASTE_ITEMS.includes(item as ItemId)))) ? [index] : [];
    });
    if (!visual.blockedOutputs.length) visual.blockedOutputs = families.map((_, index) => index);
  }
  visual.working = node.progressMs > 0 && !visual.missingInputs.length && !visual.blockedOutputs.length;
  return visual;
}
