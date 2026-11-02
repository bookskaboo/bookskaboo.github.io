import type { MachineNode } from '../domain/types';
import { LIZARD_SETTLEMENTS } from './lizardSettlements';

export const GOBLIN_CHECK_INTERVAL_MS = 60000;

/** Fixed map difficulty follows the existing robotics progression; research never raises a settled map's cost. */
export const GOBLIN_SETTLEMENTS = {
  camp: { name: 'Small Goblin Camp', research: 'Suppression Bot', maxRadius: 600, tributePerCycle: 5 },
  village: { name: 'Goblin Village', research: 'Sealed Robotics and Heavy Robotics', maxRadius: 600, tributePerCycle: 15 },
  kingdom: { name: 'Goblin Kingdom', research: 'Command Robotics', maxRadius: 600, tributePerCycle: 30 },
} as const;

const AP_BY_MAP_TIER = [0, 3, 3, 3, 9, 16, 24, 40, 60, 80] as const;

/** Both families retain the established Monster Camp simulation and save kind. */
export const getMonsterSettlementDefinition = (node: MachineNode) => node.lizardSettlement
  ? LIZARD_SETTLEMENTS[node.lizardSettlement]
  : GOBLIN_SETTLEMENTS[node.goblinSettlement ?? 'camp'];

export function getGoblinSettlementForMapTier(tier: number) {
  const mapTier = Math.max(1, Math.min(9, Math.floor(tier)));
  const settlement: NonNullable<MachineNode['goblinSettlement']> = mapTier >= 7 ? 'kingdom' : mapTier >= 4 ? 'village' : 'camp';
  return { settlement, ...GOBLIN_SETTLEMENTS[settlement], attackRequirement: AP_BY_MAP_TIER[mapTier] };
}

export const getGoblinAttackRequirement = (node: MachineNode) =>
  node.attackRequirement ?? Math.max(1, Math.ceil((node.campStrength ?? 25) / 10));
