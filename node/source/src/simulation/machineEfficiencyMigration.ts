import type { GameState, ItemId } from '../domain/types';
import { MACHINE_EFFICIENCY, EFFICIENCY_CORES, efficiencyDefinition } from '../content/machineEfficiency';
import { getEfficiencyMultiplier } from '../content/efficiency';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { getResearchProject } from '../content/research';
import { LATE_RESEARCH } from '../content/progression';
import { RECIPES } from '../content/recipes';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';

const replacements: Record<string, [string, number]> = {
  pressureSystems: ['fluidLink', 5], highPressureIntakes: ['fluidLink', 6],
  planterThroughput: ['treePlanter', 6], mineralRecovery1: ['recycler', 4],
};
const oldRecipeFamilies: Record<string, string> = {
  'mithril-mesh': 'advancedAssembler', 'efficient-mythril-mesh': 'advancedAssembler',
  'composite-mythril-gear': 'assembler', 'composite-mythril-wire': 'assembler', 'recover-crust': 'separationFurnace',
};

/** Exchange retired purchases once, retain Core-tier identities and preserve paid batches. */
export function migrateMachineEfficiency(state: GameState) {
  if (state.machineEfficiencyVersion) return;
  const research = state.research, oldCompleted = [...research.completed];
  const oldMultiplier = (family: string | undefined) => {
    if (!family || ['fluidLink', 'recycler', 'treePlanter'].includes(family)) return 1;
    for (let tier = 6; tier >= 1; tier--) if (oldCompleted.includes(`${family}${tier}`)) return (10 - tier) / 10;
    return 1;
  };
  const oldProjectCost = (id: string): Partial<Record<ItemId, number>> => {
    const definition = MACHINE_EFFICIENCY.find(d => id.replace(/\d+$/, '') === d.family);
    const tier = Number(id.match(/\d+$/)?.[0]);
    if (definition && tier >= 1 && tier <= 6 && definition.family !== 'treePlanter') {
      return Object.fromEntries(EFFICIENCY_CORES.slice(0, tier).map(core => [core, 5 + tier * 5]));
    }
    return LATE_RESEARCH.find(p => p.id === id)?.costs ?? {};
  };
  const retired = (id: string) => Boolean(replacements[id]) || id === 'treePlanter1'
    || MACHINE_EFFICIENCY.some(d => id !== d.family && id.replace(/\d+$/, '') === d.family && Number(id.match(/\d+$/)?.[0]) < d.start);
  const refund = (costs: Partial<Record<ItemId, number>>) => {
    const lab = Object.values(state.sectors).flatMap(s => s.nodes).find(n => n.kind === 'researchCenter' || n.kind === 'research-center');
    const pool = lab?.input ?? (state.globalPool ??= {});
    for (const [item, amount] of Object.entries(costs)) if (amount && amount > 0) pool[item as ItemId] = (pool[item as ItemId] ?? 0) + amount;
  };
  research.completed = oldCompleted.filter(id => !retired(id));
  research.unlocked = research.unlocked.filter(id => !retired(id));
  const granted = new Set<string>(), specialCredit: Partial<Record<ItemId, number>> = {};
  for (const id of oldCompleted.filter(retired)) {
    const target = replacements[id];
    if (!target) { refund(oldProjectCost(id)); continue; }
    for (const [item, count] of Object.entries(oldProjectCost(id))) specialCredit[item as ItemId] = (specialCredit[item as ItemId] ?? 0) + count!;
    const definition = efficiencyDefinition(target[0])!;
    for (let tier = definition.start; tier <= target[1]; tier++) {
      const next = `${target[0]}${tier}`;
      if (!research.completed.includes(next)) { research.completed.push(next); granted.add(next); }
      if (!research.unlocked.includes(next)) research.unlocked.push(next);
    }
  }
  for (const id of granted) for (const [item, count] of Object.entries(getResearchProject(id)!.costs)) {
    specialCredit[item as ItemId] = (specialCredit[item as ItemId] ?? 0) - count!;
  }
  refund(specialCredit); // Older purchases may be grandfathered; never charge a migration deficit.
  const contributions = research.projectContributions ??= {};
  // The selected project's contribution bag aliases its saved payment ledger in normal saves.
  if (research.selected && retired(research.selected)) {
    const saved = contributions[research.selected] ?? {};
    for (const [item, count] of Object.entries(research.contributed)) saved[item as ItemId] = Math.max(saved[item as ItemId] ?? 0, count!);
    contributions[research.selected] = saved;
    research.selected = undefined; research.contributed = {};
  }
  for (const [id, paid] of Object.entries(contributions)) if (retired(id)) { refund(paid); delete contributions[id]; }
  for (const node of Object.values(state.sectors).flatMap(sector => sector.nodes)) {
    const family = getNodeCapabilities(node.kind).efficiencyFamily;
    const recipe = RECIPES[node.batch?.recipeId ?? node.recipeId ?? ''];
    if (node.kind === 'treePlanter' || node.kind === 'tree-planter') {
      const previous = (oldCompleted.includes('treePlanter1') ? 900 : 1000) / (oldCompleted.includes('planterThroughput') ? 10 : 1);
      node.progressMs *= 250 * getEfficiencyMultiplier('treePlanter', research.completed) / previous;
      node.cycleMs = 250;
    } else if (family && family !== 'fluidLink') {
      const oldFactor = oldMultiplier(oldRecipeFamilies[recipe?.id] ?? family) * (recipe?.recovery && oldCompleted.includes('mineralRecovery1') ? .9 : 1);
      const factor = getEfficiencyMultiplier(family, research.completed);
      node.progressMs *= factor / oldFactor;
      if ((node.kind === 'researchCenter' || node.kind === 'research-center') && !research.selected) node.progressMs = 0;
      if (node.researchConsumption) node.researchConsumption.cycleMs = RESEARCH_CENTER_BASE_CYCLE_MS * factor;
    }
  }
  state.machineEfficiencyVersion = 1;
}
