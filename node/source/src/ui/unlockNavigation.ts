import { BUILDABLE_NODES } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { RESEARCH_PROJECTS } from '../content/research';
import type { GameEvent, NodeKind } from '../domain/types';

export type UnlockDestination = { panel: 'build'; nodeKind: NodeKind } | { panel: 'recipes'; recipeId: string } | { panel: 'research'; projectId: string };
export function researchEventProject(event: GameEvent) {
  return event.projectId ?? (event.message.startsWith('Map Node research complete.')
    ? 'mapNode'
    : RESEARCH_PROJECTS.find(project => event.message.startsWith(`${project.name} research complete.`))?.id);
}
export function unlockDestination(projectId: string, nodeKind?: NodeKind): UnlockDestination {
  if (nodeKind) return { panel: 'build', nodeKind };
  if (projectId === 'mithrilTools') return { panel: 'recipes', recipeId: 'mythril-gear' };
  const node = BUILDABLE_NODES.find(node => node.unlockResearch === projectId);
  if (node) return { panel: 'build', nodeKind: node.kind };
  const recipe = projectId === 'automataCore' ? 'automata-core' : projectId === 'suppressionBot' ? 'robot-frame' : Object.values(RECIPES).find(recipe => recipe.unlockResearch === projectId)?.id;
  return recipe ? { panel: 'recipes', recipeId: recipe } : { panel: 'research', projectId };
}
