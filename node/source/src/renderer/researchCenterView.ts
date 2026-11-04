import { ITEM_NAMES } from '../content/items';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import { outstandingResearchCores } from '../simulation/researchStatus';

/** Keep total project progress visible while the Center waits for more Cores. */
export function researchCenterView(node: MachineNode, game: GameState) {
  const project = getResearchProject(game.research.selected);
  if (!project || project.trigger) return { progress: 0, summary: 'Choose a research project. Deliver Cores to this Center to fund it.' };
  const costs = Object.entries(getResearchCostsForState(project, game.research)) as Array<[ItemId, number]>;
  const total = costs.reduce((sum, [, cost]) => sum + cost, 0);
  const paid = costs.reduce((sum, [item, cost]) => sum + Math.min(cost, Math.max(0, game.research.contributed[item] ?? 0)), 0);
  const outstanding = outstandingResearchCores(game.research);
  const missing = outstanding.filter(item => (node.input[item] ?? 0) < 1);
  const progress = total > 0 ? Math.max(0, Math.min(1, paid / total)) : 0;
  const status = missing.length ? `Waiting for ${missing.map(item => ITEM_NAMES[item]).join(' + ')}.`
    : outstanding.length ? 'Processing complete Core sets.' : 'Research complete.';
  return { progress, projectName: project.name, summary: `${project.name}: ${paid}/${total} Cores processed. ${status}` };
}
