import type { GameState, MachineNode } from '../domain/types';
import { modNode } from '../mods/modRules';
import { getEfficiencyMultiplier } from './efficiency';
import { hasForestryCapacity } from './machineEfficiency';

/** Q78A: one paid set funds exactly one hundred regeneration units. */
export function simulatePlanter(state: GameState, node: MachineNode, dt: number) {
  node.cycleMs = 250;
  node.capacity = hasForestryCapacity(state.research.completed) ? 20 : 5;
  const capacity = modNode(node.kind)?.capacity ?? node.capacity;
  if ((node.growthCredit ?? 0) <= 0) {
    if ((node.input.wood ?? 0) < 10 || (node.input['iron-plate'] ?? 0) < 1 || (node.input.stone ?? 0) < 1) return;
    node.input.wood! -= 10; node.input['iron-plate']!--; node.input.stone!--;
    node.growthCredit = 100;
  }
  const period = 250 * getEfficiencyMultiplier('treePlanter', state.research.completed);
  if ((node.output['forest-growth'] ?? 0) >= capacity) return;
  node.progressMs += dt;
  while (node.progressMs >= period && (node.growthCredit ?? 0) > 0 && (node.output['forest-growth'] ?? 0) < capacity) {
    node.progressMs -= period; node.growthCredit = (node.growthCredit ?? 0) - 1;
    node.output['forest-growth'] = (node.output['forest-growth'] ?? 0) + 1;
  }
}
