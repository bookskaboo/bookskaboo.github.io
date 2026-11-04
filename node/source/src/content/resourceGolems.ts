import type { MachineNode } from '../domain/types';

export const GOLEM_MINERALS = ['iron', 'copper', 'stone', 'mythril'] as const;
export type GolemMineral = typeof GOLEM_MINERALS[number];
export const GOLEM_AP_COST = 10000;
export const golemApCost = (node: MachineNode) => getGolemMineral(node) === 'mythril' ? 20000 : GOLEM_AP_COST;
export const GOLEM_NAMES: Record<GolemMineral, string> = { iron: 'Iron', copper: 'Copper', stone: 'Stone', mythril: 'Mythril' };

export function getGolemMineral(node: MachineNode): GolemMineral {
  return node.golemMineral ?? GOLEM_MINERALS.find(item => node.golemOutputs?.includes(item)) ?? 'iron';
}

/** Retain the node ID and position so victory becomes a permanent mineral anchor. */
export function defeatResourceGolem(node: MachineNode) {
  const item = getGolemMineral(node);
  node.golemMineral = item;
  node.defeated = true;
  node.health = 0;
  node.kind = item === 'stone' ? 'stoneDeposit' : item;
  node.name = `Infinite ${GOLEM_NAMES[item]}`;
  node.resourceItem = item;
  node.infiniteResource = true;
  node.progressMs = 0;
}
