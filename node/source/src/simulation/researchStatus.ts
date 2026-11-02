import { getNodeCapabilities } from '../content/nodeCapabilities';
import { isRecipeUnlocked } from '../content/recipes';
import { getResearchProject, getResearchCostsForState, isResearchAvailable } from '../content/research';
import type { ItemId, MachineNode, ResearchState } from '../domain/types';

export const RESEARCH_CORE_TYPES = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'] as const;

export function outstandingResearchCores(research: ResearchState): ItemId[] {
  const project = getResearchProject(research.selected);
  if (!project || project.trigger || !isResearchAvailable(project, research.completed) ||
    (!project.repeatable && research.completed.includes(project.id))) return [];
  const costs = getResearchCostsForState(project, research);
  return (Object.keys(costs) as ItemId[]).filter((item) => (research.contributed[item] ?? 0) < (costs[item] ?? 0));
}

export function isResearchCycleActive(node: MachineNode, research: ResearchState) {
  if (node.disabled || node.processingPaused) return false;
  const required = outstandingResearchCores(research);
  return required.length > 0 && required.every((item) => (node.input[item] ?? 0) >= 1);
}

export function researchCoreStorage(node: MachineNode, research: ResearchState) {
  const required = outstandingResearchCores(research);
  const capacity = getNodeCapabilities(node.kind).inputCapacity ?? 5;
  return RESEARCH_CORE_TYPES.filter((item) => {
    const unlocked = item === 'simple-core' ? research.completed.includes('refiner') :
      item === 'basic-core' ? research.completed.includes('assembler') : isRecipeUnlocked(item, research.completed);
    return unlocked || (node.input[item] ?? 0) > 0 || required.includes(item);
  }).map((item) => ({ item, amount: node.input[item] ?? 0, capacity }));
}
