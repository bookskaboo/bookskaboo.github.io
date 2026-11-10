import type { MachineNode } from '../domain/types';

export const GOLEM_MINERALS = ['iron', 'copper', 'stone', 'mythril'] as const;
export type GolemMineral = typeof GOLEM_MINERALS[number];
export const GOLEM_PLACEMENT_TIER = 5;
export const LEGACY_GOLEM_PLACEMENT_TIER = 6;
export type GolemPlacementTier = typeof GOLEM_PLACEMENT_TIER | typeof LEGACY_GOLEM_PLACEMENT_TIER;
export const GOLEM_AP_COST = 100;
export const MYTHRIL_GOLEM_AP_COST = 150;
export const GOLEM_COST_VERSION = 3;
type GolemIdentity = Pick<MachineNode, 'golemMineral' | 'golemOutputs'>;
export const golemApCost = (node: GolemIdentity) => getGolemMineral(node) === 'mythril' ? MYTHRIL_GOLEM_AP_COST : GOLEM_AP_COST;
export const GOLEM_NAMES: Record<GolemMineral, string> = { iron: 'Iron', copper: 'Copper', stone: 'Stone', mythril: 'Mythril' };

export function getGolemMineral(node: GolemIdentity): GolemMineral {
  return node.golemMineral ?? GOLEM_MINERALS.find(item => node.golemOutputs?.includes(item)) ?? 'iron';
}

/** Retain the node ID and position so victory becomes a permanent mineral anchor. */
export function defeatResourceGolem(node: MachineNode) {
  const item = getGolemMineral(node);
  node.golemMineral = item;
  node.defeated = true;
  node.health = 0;
  node.kind = item === 'stone' ? 'stoneDeposit' : item;
  node.name = GOLEM_NAMES[item];
  node.resourceItem = item;
  node.infiniteResource = true;
  node.progressMs = 0;
}
