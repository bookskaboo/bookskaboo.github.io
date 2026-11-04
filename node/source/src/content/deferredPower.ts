import type { NodeKind } from '../domain/types';

/** Keep serialized identifiers loadable while Power is outside the playable game. */
export const DEFERRED_POWER_NODES = new Set<NodeKind>(['charcoalGenerator', 'generator', 'powerSplitter', 'powerConduit']);
export const DEFERRED_POWER_RESEARCH = new Set(['basicElectricity', 'powerDistribution']);
