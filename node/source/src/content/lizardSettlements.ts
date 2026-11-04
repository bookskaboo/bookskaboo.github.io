import type { MachineNode } from '../domain/types';

export const LIZARD_SETTLEMENTS = {
  camp: { name: 'Dwarven Camp', research: 'Sealed Robotics and Heavy Robotics', maxRadius: 600, tributePerCycle: 20 },
  village: { name: 'Dwarven Village', research: 'Heavy Robotics and Command Robotics', maxRadius: 600, tributePerCycle: 40 },
  kingdom: { name: 'Dwarven Kingdom', research: 'Command Robotics', maxRadius: 600, tributePerCycle: 60 },
} as const;

const AP_BY_MAP_TIER: Record<number, number> = { 4: 6, 5: 12, 6: 18, 7: 30, 8: 48, 9: 72 };
const TRIBUTE_BY_MAP_TIER: Record<number, number> = { 4: 1, 5: 3, 6: 5, 7: 9, 8: 15, 9: 24 };

export function getLizardSettlementForMapTier(tier: number) {
  const mapTier = Math.max(4, Math.min(9, Math.floor(tier)));
  const settlement: NonNullable<MachineNode['lizardSettlement']> = mapTier >= 8 ? 'kingdom' : mapTier >= 6 ? 'village' : 'camp';
  const tributePerCycle = TRIBUTE_BY_MAP_TIER[mapTier];
  return { settlement, ...LIZARD_SETTLEMENTS[settlement], mapTier, tributePerCycle, capacity: Math.max(100, tributePerCycle * 24), attackRequirement: AP_BY_MAP_TIER[mapTier] };
}

export function getDwarvenSettlement(node: MachineNode) {
  return getLizardSettlementForMapTier(node.settlementMapTier ?? ({ camp: 4, village: 6, kingdom: 8 }[node.lizardSettlement ?? 'camp']));
}
