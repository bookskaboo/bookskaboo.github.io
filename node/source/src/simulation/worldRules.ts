import type { GameState, MachineNode, SectorState } from '../domain/types';
import { isCampFullySuppressed } from './goblinTribute';

export const usesNewWorldRules = (state: Pick<GameState, 'worldRulesVersion'>) => state.worldRulesVersion === 2;

export function guardedResourceAccessible(node: MachineNode, nodes: readonly MachineNode[]) {
  return !node.guardedCampId || isCampFullySuppressed(nodes.find(camp => camp.id === node.guardedCampId && camp.kind === 'monster-camp'));
}

export function syncGuardedResources(sector: SectorState) {
  for (const node of sector.nodes) if (node.guardedCampId) node.guardedLocked = !guardedResourceAccessible(node, sector.nodes);
}

export function lakeIntakeLimit(state: Pick<GameState, 'worldRulesVersion' | 'research'>) {
  if (!usesNewWorldRules(state)) return 2;
  const research = state.research.completed;
  return research.includes('fluidLink6') || research.includes('fluidLink7') ? 4 : research.includes('fluidLink5') ? 3 : 2;
}
