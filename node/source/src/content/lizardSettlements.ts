import type { MachineNode } from '../domain/types';

export const LIZARD_SETTLEMENTS = {
  camp: { name: 'Dwarven Camp', research: 'Sealed Robotics', maxRadius: 600, attackRequirement: 6, tributePerCycle: 1 },
  village: { name: 'Dwarven Village', research: 'Heavy Robotics', maxRadius: 600, attackRequirement: 16, tributePerCycle: 5 },
  kingdom: { name: 'Dwarven Kingdom', research: 'Heavy Robotics', maxRadius: 600, attackRequirement: 32, tributePerCycle: 12 },
} as const;

type DwarvenSettlement = NonNullable<MachineNode['lizardSettlement']>;

function settlementSpec(settlement: DwarvenSettlement, mapTier: number) {
  const definition = LIZARD_SETTLEMENTS[settlement];
  return { settlement, ...definition, mapTier, capacity: Math.max(100, definition.tributePerCycle * 24) };
}

export function getLizardSettlementForMapTier(tier: number) {
  const mapTier = Math.max(4, Math.min(9, Math.floor(tier)));
  const settlement = mapTier >= 8 ? 'kingdom' : mapTier >= 6 ? 'village' : 'camp';
  return settlementSpec(settlement, mapTier);
}

export function getDwarvenSettlement(node: MachineNode) {
  const settlement = node.lizardSettlement;
  if (!settlement) return getLizardSettlementForMapTier(node.settlementMapTier ?? 4);
  return settlementSpec(settlement, node.settlementMapTier ?? { camp: 4, village: 6, kingdom: 8 }[settlement]);
}
