import type { MachineNode } from '../domain/types';
import { getDwarvenSettlement } from './lizardSettlements';

export const GOBLIN_CHECK_INTERVAL_MS = 60000;

export const GOBLIN_SETTLEMENTS = {
  camp: { name: 'Small Goblin Camp', research: 'Suppression Bot', maxRadius: 600, attackRequirement: 3, tributePerCycle: 6 },
  village: { name: 'Goblin Village', research: 'Sealed Robotics', maxRadius: 600, attackRequirement: 9, tributePerCycle: 18 },
  kingdom: { name: 'Goblin Kingdom', research: 'Heavy Robotics', maxRadius: 600, attackRequirement: 16, tributePerCycle: 36 },
} as const;

/** Both families retain the established Monster Camp simulation and save kind. */
export const getMonsterSettlementDefinition = (node: MachineNode) => node.lizardSettlement
  ? getDwarvenSettlement(node)
  : GOBLIN_SETTLEMENTS[node.goblinSettlement ?? 'camp'];

export function getGoblinSettlementForMapTier(tier: number) {
  const mapTier = Math.max(1, Math.min(9, Math.floor(tier)));
  const settlement: NonNullable<MachineNode['goblinSettlement']> = mapTier >= 7 ? 'kingdom' : mapTier >= 4 ? 'village' : 'camp';
  return { settlement, ...GOBLIN_SETTLEMENTS[settlement] };
}

export const getGoblinAttackRequirement = (node: MachineNode) =>
  node.attackRequirement ?? Math.max(1, Math.ceil((node.campStrength ?? 25) / 10));
