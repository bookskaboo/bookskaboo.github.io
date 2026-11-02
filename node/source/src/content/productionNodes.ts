import type { MachineNode } from '../domain/types';
import { NODE_DEFINITIONS } from './nodes';

export const CONNECTOR_MIRRORING_RESEARCH = 'connectorMirroring';

/** Use the same production classification for the catalog, rendering, and controls. */
export const isProductionMachine = (node: Pick<MachineNode, 'kind'>) => NODE_DEFINITIONS[node.kind].category === 'Production';
