import { cartUpgrade, isCartKind } from '../content/cartUpgrades';
import type { CornerType } from '../content/endgame';
import { getNodeModule } from '../content/nodeModules';
import type { MachineNode, NodeKind } from '../domain/types';
import type { LineArtId } from './lineArt';

const CORNER_ART: Record<CornerType, LineArtId> = {
  alpha: 'dragon',
  foundry: 'foundry',
  reclamation: 'reclamation',
  grove: 'grove',
};

const VEHICLE_ART = { Cart: 'cart', Truck: 'truck', Train: 'train' } as const;

type Encounter = Pick<MachineNode, 'cornerType' | 'goblinSettlement' | 'lizardSettlement'>;

export function getNodeArt(kind: NodeKind, node?: Encounter, completedResearch: readonly string[] = []): LineArtId {
  if (isCartKind(kind)) return VEHICLE_ART[cartUpgrade(completedResearch).name];
  if (kind === 'cornerChallenge' && node?.cornerType) return CORNER_ART[node.cornerType];
  if (kind === 'monster-camp') {
    return node?.lizardSettlement ? `dwarven-${node.lizardSettlement}` : `goblin-${node?.goblinSettlement ?? 'camp'}`;
  }
  return getNodeModule(kind).appearance.icon;
}
