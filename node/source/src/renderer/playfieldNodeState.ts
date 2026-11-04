import { ITEM_NAMES } from '../content/items';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { NODE_DEFINITIONS } from '../content/nodes';
import { getNodeModule } from '../content/nodeModules';
import { getEfficiencyMultiplier } from '../content/efficiency';
import { modNode } from '../mods/modRules';
import { RECIPES } from '../content/recipes';
import { getGoblinAttackRequirement } from '../content/goblinSettlements';
import type { ItemId, MachineNode } from '../domain/types';

export const outputTotal = (node: MachineNode) => Object.values(node.output).reduce((sum, value) => sum + (value ?? 0), 0);
export const inputTotal = (node: MachineNode) => Object.values(node.input).reduce((sum, value) => sum + (value ?? 0), 0);
export const outputCapacity = (node: MachineNode) => NODE_DEFINITIONS[node.kind].output.length > 0 ? (modNode(node.kind)?.capacity ?? node.capacity ?? getNodeCapabilities(node.kind).defaultCapacity ?? 5) : 0;
export const resourceCapacityReadout = (node: MachineNode) => node.infiniteResource ? 'INFINITE' : `${Math.floor(node.resourceRemaining ?? 0).toLocaleString()} / ${Math.floor(node.resourceCapacity ?? node.resourceRemaining ?? 0).toLocaleString()}`;
export const resourceReserveFraction = (node: MachineNode) => {
  if (node.infiniteResource) return 1;
  const capacity = node.resourceCapacity ?? node.resourceRemaining ?? 0;
  return capacity > 0 ? Math.max(0, Math.min(1, (node.resourceRemaining ?? 0) / capacity)) : 0;
};
export const nodeTextScale = (zoom: number) => Math.min(1.55, 1.12 + Math.max(0, 1 - zoom) * .9);

export const isItemId = (value: string): value is ItemId => value in ITEM_NAMES;
export const familyLabel = (family: string) => ({
  ANY: 'Item', RESOURCE: 'Resource', METAL: 'Metal', PLATE: 'Metal Plate', GEAR: 'Gear', CORE: 'All Cores',
  ROBOT_FRAME: 'Robot Frame', ROBOT_WEAPON: 'Robot Weapon', ATTACK_POWER: 'Attack Power', POWER: 'Power',
}[family] ?? (isItemId(family) ? ITEM_NAMES[family] : family));
export const portRoleLabel = (node: MachineNode, direction: 'input' | 'output', index: number, family: string, routedItem?: ItemId) => {
  if (node.kind === 'devSource') return 'Auto';
  if (node.kind === 'monster-camp' && direction === 'input') return `${getGoblinAttackRequirement(node)} AP / 60s`;
  if (getNodeCapabilities(node.kind).behavior === 'recipe' && !node.recipeId) return 'Choose recipe';
  if (node.kind === 'splitter') return direction === 'input' ? 'Item' : index === 0 ? 'A' : 'B';
  if (node.kind === 'merger') return direction === 'input' ? (index === 0 ? 'A' : 'B') : 'Item';
  if (node.kind === 'joint') return direction === 'input' ? 'In' : 'Out';
  if (node.kind === 'road') return direction === 'input' ? 'Local In' : 'Remote Out';
  if (node.kind === 'powerSplitter') return direction === 'input' ? 'Power In' : ['Power Top', 'Power Out', 'Power Bottom'][index] ?? 'Power';
  if (node.kind === 'extractor') return routedItem ? ITEM_NAMES[routedItem] : direction === 'input' ? 'Resource' : 'Output';
  if (node.kind === 'filter' && direction === 'output') return index === 0 ? (node.filterItem ? ITEM_NAMES[node.filterItem] : 'Choose') : 'Remainder';
  if (node.kind === 'smelter' && !routedItem) return direction === 'input' ? (index === 0 ? 'Metal' : 'Charcoal') : 'Plate';
  return routedItem ? ITEM_NAMES[routedItem] : familyLabel(family);
};
export const canDeleteNode = (node: MachineNode) => !node.protected && getNodeModule(node.kind).controls.deletable;
export const canCyclePortPositions = (node: MachineNode) => {
  const inputs = NODE_DEFINITIONS[node.kind].input;
  return inputs.length > 1 && (getNodeCapabilities(node.kind).behavior === 'recipe' || new Set(inputs).size > 1);
};
export const nodeCycleDuration = (node: MachineNode, unlocked: readonly string[]) => {
  const prefix = getNodeCapabilities(node.kind).efficiencyFamily;
  const multiplier = getEfficiencyMultiplier(prefix, unlocked);
  return (RECIPES[node.recipeId ?? '']?.cycleMs ?? node.cycleMs) * multiplier;
};

