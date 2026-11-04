import type { GameState, MachineNode, NodeKind } from '../domain/types';
import { modNode } from '../mods/modRules';

export const isCartKind = (kind: NodeKind) => kind === 'woodenChest' || kind === 'chest';
export function cartUpgrade(completed: readonly string[], rank = 0) {
  return completed.includes('trains') ? { name: 'Train', capacity: 80 + 20 * rank }
    : completed.includes('trucks') ? { name: 'Truck', capacity: 40 } : { name: 'Cart', capacity: 20 };
}

/** Upgrade the existing saved nodes and templates without replacing their IDs, stock or wiring. */
export function applyCartUpgrades(state: GameState) {
  const upgrade = cartUpgrade(state.research.completed, state.research.repeatableCompletions?.trainFreightCapacity ?? 0);
  const nodes = [...Object.values(state.sectors).flatMap(sector => sector.nodes), ...(state.factoryTemplates ?? []).flatMap(template => template.nodes)];
  for (const node of nodes) if (isCartKind(node.kind)) {
    const generated = node.name.match(/^(?:Wooden Chest|Chest|Cart|Truck|Train)( \d+)?$/);
    if (generated) node.name = upgrade.name + (generated[1] ?? '');
    node.capacity = upgrade.capacity;
  }
}

export const cartCapacity = (node: MachineNode) => modNode(node.kind)?.capacity ?? node.capacity ?? 20;
export const vehiclePayload = (completed: readonly string[], rank = 0) => completed.includes('trains') ? 4 + rank : completed.includes('trucks') ? 2 : 1;
