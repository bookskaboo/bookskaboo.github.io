import type { ItemId, MachineNode, Recipe } from '../domain/types';
import { LATE_RECIPES, LATE_GROUPS } from './progression';

export const RECIPES: Record<string, Recipe> = {
  ...LATE_RECIPES,
  charcoal: { id: 'charcoal', name: 'Charcoal', inputs: { wood: 1 }, outputs: { charcoal: 1 }, cycleMs: 3500 },
  'smelt-iron': { id: 'smelt-iron', name: 'Iron Plate', inputs: { iron: 2, charcoal: 1 }, outputs: { 'iron-plate': 1 }, cycleMs: 6000 },
  'smelt-copper': { id: 'smelt-copper', name: 'Copper Plate', inputs: { copper: 2, charcoal: 1 }, outputs: { 'copper-plate': 1 }, cycleMs: 6000 },
  'smelt-mythril': { id: 'smelt-mythril', name: 'Mythril Plate', inputs: { mythril: 2, charcoal: 1 }, outputs: { 'mythril-plate': 1 }, cycleMs: 6000, unlockResearch: 'mithrilTools' },
  'iron-gear': { id: 'iron-gear', name: 'Iron Gear', inputs: { 'iron-plate': 2 }, outputs: { 'iron-gear': 1 }, cycleMs: 3000 },
  'copper-gear': { id: 'copper-gear', name: 'Copper Gear', inputs: { 'copper-plate': 2 }, outputs: { 'copper-gear': 1 }, cycleMs: 3000 },
  'mythril-gear': { id: 'mythril-gear', name: 'Mythril Gear', inputs: { 'mythril-plate': 2 }, outputs: { 'mythril-gear': 1 }, cycleMs: 3000, unlockResearch: 'mithrilTools' },
  'iron-wire': { id: 'iron-wire', name: 'Iron Wire', inputs: { 'iron-plate': 3 }, outputs: { 'iron-wire': 1 }, cycleMs: 3000 },
  'copper-wire': { id: 'copper-wire', name: 'Copper Wire', inputs: { 'copper-plate': 3 }, outputs: { 'copper-wire': 1 }, cycleMs: 3000 },
  'mythril-wire': { id: 'mythril-wire', name: 'Mythril Wire', inputs: { 'mythril-plate': 3 }, outputs: { 'mythril-wire': 1 }, cycleMs: 3000, unlockResearch: 'mithrilTools' },
  'composite-mythril-gear': { id: 'composite-mythril-gear', name: 'Composite Mythril Gear', inputs: { 'copper-gear': 4, 'mythril-plate': 1 }, outputs: { 'mythril-gear': 4 }, cycleMs: 12000, unlockResearch: 'precisionControl' },
  'composite-mythril-wire': { id: 'composite-mythril-wire', name: 'Composite Mythril Wire', inputs: { 'iron-wire': 4, 'mythril-plate': 1 }, outputs: { 'mythril-wire': 4 }, cycleMs: 12000, unlockResearch: 'precisionControl' },
  brick: { id: 'brick', name: 'Brick', inputs: { stone: 1 }, outputs: { brick: 1 }, cycleMs: 4000 },
  'simple-core': { id: 'simple-core', name: 'Simple Core', inputs: { 'copper-gear': 2 }, outputs: { 'simple-core': 1 }, cycleMs: 5000 },
  motor: { id: 'motor', name: 'Motor', inputs: { 'iron-gear': 1, 'copper-wire': 1 }, outputs: { motor: 1 }, cycleMs: 6500 },
  'circuit-a': { id: 'circuit-a', name: 'Circuit A', inputs: { 'copper-wire': 1, 'iron-plate': 1 }, outputs: { 'circuit-a': 1 }, cycleMs: 5000 },
  'basic-core': { id: 'basic-core', name: 'Basic Core', inputs: { 'copper-plate': 1, 'iron-wire': 1 }, outputs: { 'basic-core': 1 }, cycleMs: 10000 },
  'automata-core': { id: 'automata-core', name: 'Automata Core', inputs: { 'circuit-a': 1, brick: 1 }, outputs: { 'automata-core': 1 }, cycleMs: 15000 },
  'robot-frame': { id: 'robot-frame', name: 'Robot Frame', inputs: { 'iron-plate': 2, motor: 1 }, outputs: { 'simple-robot-frame': 1 }, cycleMs: 6500 },
  'robot-gun': { id: 'robot-gun', name: 'Robot Gun', inputs: { 'copper-wire': 1, 'iron-plate': 2 }, outputs: { 'simple-robot-gun': 1 }, cycleMs: 6500 },
  'suppression-bot': { id: 'suppression-bot', name: 'Small Suppression Bot', inputs: { 'simple-robot-frame': 1, 'simple-robot-gun': 1 }, outputs: { 'suppression-bot': 1 }, cycleMs: 10000 },
};

export const RECIPE_GROUPS: Record<string, string[]> = {
  kiln: ['charcoal'],
  smelter: ['smelt-iron', 'smelt-copper', 'smelt-mythril'],
  ...LATE_GROUPS,
  refiner: ['iron-gear', 'copper-gear', 'mythril-gear', 'iron-wire', 'copper-wire', 'mythril-wire', 'brick', 'simple-core', ...(LATE_GROUPS.refiner ?? [])],
  assembler: ['composite-mythril-gear', 'composite-mythril-wire', 'motor', 'circuit-a', 'basic-core', 'automata-core', 'robot-frame', 'robot-gun', 'suppression-bot'],
};

const SMELTER_RECIPE_BY_METAL: Partial<Record<ItemId, string>> = {
  iron: 'smelt-iron', copper: 'smelt-copper', mythril: 'smelt-mythril',
};
/** Smelters adapt to incoming ore; Refiner recipes keep the chosen material. */
export function getSmartRecipeForInput(node: MachineNode, item: ItemId) {
  if (node.kind === 'smelter') return SMELTER_RECIPE_BY_METAL[item];
  return undefined;
}

export function isSmartRecipeInput(node: MachineNode, port: number) {
  return port === 0 && node.kind === 'smelter';
}

export function isRecipeUnlocked(id: string, completed: readonly string[]) {
  const recipe=RECIPES[id];if(!recipe)return false;
  if(recipe.unlockResearch&&!completed.includes(recipe.unlockResearch))return false;
  if(id==='automata-core'&&!completed.includes('automataCore'))return false;
  if(['robot-frame','robot-gun','suppression-bot'].includes(id)&&!completed.includes('suppressionBot'))return false;
  return true;
}
