import type { GameState, ItemId, Recipe } from '../domain/types';
import { CORE_RESEARCH } from '../content/coreResearch';
import { RECIPES, RECIPE_GROUPS, isRecipeUnlocked } from '../content/recipes';
import { NODE_DEFINITIONS } from '../content/nodes';
import { getResearchProject, getResearchCostsForState } from '../content/research';
import { getNodeCapabilities } from '../content/nodeCapabilities';

export const RECOVERY_MINERALS = ['iron', 'copper', 'stone'] as const;
type Bag = Partial<Record<ItemId, number>>;
const raw = new Set<ItemId>(['iron', 'copper', 'stone', 'wood', 'water', 'mythril']);
interface Budget { stock: Bag; missing: Bag }
const copy = (budget: Budget): Budget => ({ stock: { ...budget.stock }, missing: { ...budget.missing } });
const add = (bag: Bag, item: ItemId, amount: number) => { bag[item] = (bag[item] ?? 0) + amount; };
const completedPool = (state: GameState): Bag => state.research.completed.includes('autonomousLogistics') ? { ...state.globalPool } : {};
const score = (budget: Budget) => Object.entries(budget.missing).reduce((sum, [item, count]) =>
  sum + (RECOVERY_MINERALS.includes(item as typeof RECOVERY_MINERALS[number]) ? count! : count! * 1e9), 0);

/** First unpaid prerequisite, including Core access inferred from the actual bill. */
function requiredResearchPath(state: GameState, target: string, costs?: Bag) {
  const visited = new Set<string>(), ordered: string[] = [];
  const visit = (id: string) => {
    if (visited.has(id) || state.research.completed.includes(id)) return;
    visited.add(id);
    const project = getResearchProject(id); if (!project) return;
    if (project.prerequisite) visit(project.prerequisite);
    project.prerequisites?.forEach(visit);
    const bill = id === target && costs ? costs : getResearchCostsForState(project, state.research);
    for (const [item, amount] of Object.entries(bill)) if (amount! > 0) {
      const core = CORE_RESEARCH.find(core => core.item === item); if (core) visit(core.id);
    }
    if (!project.trigger && Object.values(bill).some(amount => amount! > 0)) ordered.push(id);
  };
  // Map Points are repeatable even when their ID is recorded in older completed lists.
  if (target === 'mapNode') {
    const project = getResearchProject(target)!;
    if (project.prerequisite) visit(project.prerequisite);
    for (const [item, amount] of Object.entries(costs ?? project.costs)) if (amount! > 0) {
      const core = CORE_RESEARCH.find(core => core.item === item); if (core) visit(core.id);
    }
    ordered.push(target);
  } else visit(target);
  return ordered;
}
export function nextRequiredResearch(state: GameState, target: string, costs?: Bag) { return requiredResearchPath(state, target, costs)[0]; }

/** A stock ledger preserves intermediate types: Wire cannot count as Gears before recycling. */
export function progressionDeficits(state: GameState, target: string, quotedCosts?: Bag, access?: { stock: Bag; completed: string[] }): Bag | undefined {
  const planningState = access ? { ...state, research: { ...state.research, completed: access.completed } } : state;
  const projectId = nextRequiredResearch(planningState, target, quotedCosts);
  if (!projectId) return {};
  const project = getResearchProject(projectId)!;
  const costs = projectId === target && quotedCosts ? quotedCosts : getResearchCostsForState(project, state.research);
  const nodes = Object.values(state.sectors).filter(sector => sector.unlocked).flatMap(sector => sector.nodes);
  const stock: Bag = access ? { ...access.stock } : completedPool(state);
  if (!access) for (const node of nodes) {
    for (const bag of [node.input, node.output, node.batch?.outputs ?? {}]) for (const [item, amount] of Object.entries(bag)) if (amount! > 0) add(stock, item as ItemId, amount!);
    if (node.resourceItem) {
      const renewable = node.infiniteResource || node.kind === 'forest' && (node.resourceCapacity ?? 0) > 0
        || state.research.completed.includes('mineralRegeneration') && (node.resourceCapacity ?? 0) > 0 && getNodeCapabilities(node.kind).behavior === 'resource';
      add(stock, node.resourceItem, renewable ? Infinity : node.resourceRemaining ?? 0);
    }
  }
  if (!access) for (const shipment of state.inFlightTransfers ?? []) if (!shipment.cosmeticOnly && state.sectors[shipment.sectorId]?.unlocked) add(stock, shipment.item, shipment.amount ?? 1);
  if (nodes.some(node => node.kind === 'lake') && state.research.completed.includes('lakeTools')) stock.water = Infinity;
  const completed = [...(access?.completed ?? state.research.completed)];
  const producers = new Map<ItemId, Recipe[]>();
  const refreshProducers = () => {
   producers.clear();
   for (const [kind, ids] of Object.entries(RECIPE_GROUPS)) {
    const definition = NODE_DEFINITIONS[kind as keyof typeof NODE_DEFINITIONS];
    if (!definition || definition.unlockResearch && !completed.includes(definition.unlockResearch)) continue;
    for (const id of ids) {
      if (!isRecipeUnlocked(id, completed)) continue;
      const recipe = RECIPES[id];
      for (const [item, quantity] of Object.entries(recipe.outputs)) if (quantity! > 0) {
        const list = producers.get(item as ItemId) ?? [];
        if (!list.includes(recipe)) list.push(recipe);
        producers.set(item as ItemId, list);
      }
    }
   }
  };
  refreshProducers();
  let operations = 0;
  const supply = (budget: Budget, item: ItemId, count: number, path: Set<ItemId>): Budget | undefined => {
    if (++operations > 12000) return; // An inconclusive plan must never grant resources.
    const held = budget.stock[item] ?? 0, used = Math.min(held, count);
    if (Number.isFinite(held)) budget.stock[item] = held - used;
    count -= used;
    if (count <= 1e-9) return budget;
    if (path.has(item)) return;
    const next = new Set(path).add(item), options: Budget[] = [];
    // Raw deficits are the fallback. Recycling can beat them only using an unlocked, funded recipe.
    if (raw.has(item)) { const fallback = copy(budget); add(fallback.missing, item, count); options.push(fallback); }
    for (const recipe of producers.get(item) ?? []) {
      let candidate: Budget | undefined = copy(budget);
      const batches = Math.ceil(count / recipe.outputs[item]!);
      for (const [ingredient, amount] of Object.entries(recipe.inputs)) {
        candidate = candidate && supply(candidate, ingredient as ItemId, amount! * batches, next);
        if (!candidate) break;
      }
      if (!candidate) continue;
      for (const [output, amount] of Object.entries(recipe.outputs)) add(candidate.stock, output as ItemId, amount! * batches);
      candidate.stock[item]! -= count;
      options.push(candidate);
    }
    return options.sort((a, b) => score(a) - score(b))[0];
  };
  const paid = { ...state.research.projectContributions?.[projectId] };
  if (state.research.selected === projectId) for (const [item, count] of Object.entries(state.research.contributed)) paid[item as ItemId] = Math.max(paid[item as ItemId] ?? 0, count!);
  const originalStock = { ...stock };
  let budget: Budget | undefined = { stock, missing: {} };
  for (const [item, count] of Object.entries(costs)) {
    const outstanding = Math.max(0, count! - (paid[item as ItemId] ?? 0));
    if (outstanding) budget = budget && supply(budget, item as ItemId, outstanding, new Set());
    if (!budget) return;
  }
  if (operations > 12000) return;
  // A reachable and affordable regeneration unlock repairs all finite minerals without a refill.
  if (!access && target !== 'mineralRegeneration' && !completed.includes('mineralRegeneration') && score(budget) > 0) {
    const regeneration = getResearchProject('mineralRegeneration');
    if (regeneration && (!regeneration.prerequisite || completed.includes(regeneration.prerequisite))
      && (regeneration.prerequisites ?? []).every(id => completed.includes(id))) {
      const alternate = progressionDeficits(state, 'mineralRegeneration');
      if (alternate && !Object.values(alternate).some(amount => amount! > 0)) return {};
    }
  }
  if (!access && !completed.includes('recycler') && score(budget) > 0) {
    let unlockBudget: Budget | undefined = { stock: { ...originalStock }, missing: {} };
    for (const id of requiredResearchPath(state, 'recycler')) {
      const unlock = getResearchProject(id)!;
      const credited = { ...state.research.projectContributions?.[id] };
      if (state.research.selected === id) for (const [item, count] of Object.entries(state.research.contributed)) credited[item as ItemId] = Math.max(credited[item as ItemId] ?? 0, count!);
      for (const [item, count] of Object.entries(getResearchCostsForState(unlock, state.research))) {
        const due = Math.max(0, count! - (credited[item as ItemId] ?? 0));
        if (due) unlockBudget = unlockBudget && supply(unlockBudget, item as ItemId, due, new Set());
      }
      if (!unlockBudget || score(unlockBudget) > 0) break;
      completed.push(id); refreshProducers();
    }
    if (unlockBudget && score(unlockBudget) === 0 && completed.includes('recycler')) {
      const alternate = progressionDeficits(state, target, quotedCosts, { stock: unlockBudget.stock, completed });
      if (alternate && score({ stock: {}, missing: alternate }) < score(budget)) return alternate;
    }
  }
  return budget.missing;
}
