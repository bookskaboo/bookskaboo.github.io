import type { MachineNode } from '../domain/types';

export const LIZARD_SETTLEMENTS = {
  camp: { name: 'Lizard Camp', research: 'Sealed Robotics and Heavy Robotics', maxRadius: 600, tributePerCycle: 20 },
  village: { name: 'Lizard Village', research: 'Heavy Robotics and Command Robotics', maxRadius: 600, tributePerCycle: 40 },
  kingdom: { name: 'Lizard Kingdom', research: 'Command Robotics', maxRadius: 600, tributePerCycle: 60 },
} as const;

const AP_BY_MAP_TIER: Record<number, number> = { 4: 24, 5: 40, 6: 60, 7: 80, 8: 120, 9: 160 };

export function getLizardSettlementForMapTier(tier: number) {
  const mapTier = Math.max(4, Math.min(9, Math.floor(tier)));
  const settlement: NonNullable<MachineNode['lizardSettlement']> = mapTier >= 8 ? 'kingdom' : mapTier >= 6 ? 'village' : 'camp';
  return { settlement, ...LIZARD_SETTLEMENTS[settlement], attackRequirement: AP_BY_MAP_TIER[mapTier] };
}
