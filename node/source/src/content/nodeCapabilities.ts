import type { ItemId, NodeKind } from '../domain/types';
import { LATE_CAPABILITIES } from './progression';

export type NodeBehavior =
  | 'intake' | 'landmark' | 'golem'
  | 'resource' | 'lake' | 'extractor' | 'recipe' | 'router'
  | 'buffer' | 'storage' | 'research' | 'generator' | 'planter'
  | 'inventory' | 'filter' | 'road' | 'mining-drill'
  | 'monster-camp' | 'tribute' | 'big-hole';

export type EfficiencyFamily = 'hydroProcessor' | 'advancedAssembler' | 'separationFurnace' | 'extractor' | 'kiln' | 'smelter' | 'refiner' | 'assembler' | 'researchCenter';

/**
 * Runtime capabilities shared by simulation, routing, placement, and validation.
 * New nodes should reuse an existing behavior whenever possible. A genuinely new
 * interaction adds one behavior handler, while ordinary variants only need a new
 * catalog entry, visual module, and capability entry.
 */
export interface NodeCapabilities {
  behavior: NodeBehavior;
  inputCapacity?: number;
  perItemInputCapacity?: boolean;
  defaultCapacity?: number;
  defaultRecipeId?: string;
  defaultFilterItem?: ItemId;
  defaultMiningTarget?: NonNullable<import('../domain/types').MachineNode['miningTarget']>;
  efficiencyFamily?: EfficiencyFamily;
  multiInput?: boolean;
  multiOutput?: boolean;
  passThrough?: boolean;
  alternatingOutputs?: boolean;
  routesOwnOutput?: boolean;
  acceptsPowerRelay?: boolean;
  globallyUnique?: boolean;
  pairedSectorPlacement?: boolean;
  worldObstacle?: boolean;
  duplicateAllowed?: boolean;
}

const capability = (behavior: NodeBehavior, overrides: Omit<NodeCapabilities, 'behavior'> = {}): NodeCapabilities => ({ behavior, ...overrides });
const passiveResource = (): NodeCapabilities => capability('resource', { multiOutput: true });
const recipe = (defaultRecipeId: string | undefined, efficiencyFamily: EfficiencyFamily): NodeCapabilities => capability('recipe', {
  defaultRecipeId, efficiencyFamily, perItemInputCapacity: true,
});
const passThrough = (overrides: Omit<NodeCapabilities, 'behavior' | 'passThrough'> = {}): NodeCapabilities => capability('router', { passThrough: true, ...overrides });

export const NODE_CAPABILITIES: Record<NodeKind, NodeCapabilities> = {
  ...LATE_CAPABILITIES,
  forest: passiveResource(),
  deposit: passiveResource(),
  iron: passiveResource(),
  copper: passiveResource(),
  mythril: passiveResource(),
  stoneDeposit: passiveResource(),
  lake: capability('lake', { multiOutput: true, alternatingOutputs: true, routesOwnOutput: true, worldObstacle: true }),

  extractor: capability('extractor', { efficiencyFamily: 'extractor' }),
  miningDrill: capability('mining-drill', { defaultMiningTarget: 'iron' }),

  kiln: recipe('charcoal', 'kiln'),
  smelter: recipe('smelt-iron', 'smelter'),
  refiner: recipe(undefined, 'refiner'),
  assembler: recipe(undefined, 'assembler'),

  splitter: passThrough({ alternatingOutputs: true }),
  merger: passThrough(),
  joint: passThrough({ acceptsPowerRelay: true }),
  road: capability('road', { pairedSectorPlacement: true, duplicateAllowed: false }),
  powerSplitter: passThrough(),
  filter: capability('filter', { passThrough: true, defaultFilterItem: 'wood' }),
  inventory: capability('inventory', { multiOutput: true, duplicateAllowed: false }),

  woodenChest: capability('buffer', { inputCapacity: 20, defaultCapacity: 20, multiInput: true, multiOutput: true }),
  storage: capability('storage', { inputCapacity: 64, perItemInputCapacity:true, multiInput: true, duplicateAllowed: false }),

  charcoalGenerator: capability('generator', { inputCapacity: 5, defaultCapacity: 100, multiOutput: true }),
  treePlanter: capability('planter', { inputCapacity: 10 }),
  researchCenter: capability('research', { inputCapacity: 5, perItemInputCapacity: true, multiInput: true, efficiencyFamily: 'researchCenter', globallyUnique: true, duplicateAllowed: false }),

  'monster-camp': capability('monster-camp', { worldObstacle: true, duplicateAllowed: false }),
  goblinTribute: capability('tribute', { multiOutput: true, defaultCapacity: 100, duplicateAllowed: false }),
  'big-hole': capability('big-hole', { worldObstacle: true, duplicateAllowed: false }),

  // Save-file aliases deliberately preserve the canonical runtime behavior.
  chest: capability('buffer', { inputCapacity: 20, defaultCapacity: 20, multiInput: true, multiOutput: true }),
  generator: capability('generator', { inputCapacity: 5, defaultCapacity: 100, multiOutput: true }),
  'tree-planter': capability('planter', { inputCapacity: 10 }),
  'research-center': capability('research', { inputCapacity: 5, perItemInputCapacity: true, multiInput: true, efficiencyFamily: 'researchCenter', globallyUnique: true, duplicateAllowed: false }),
};

export const getNodeCapabilities = (kind: NodeKind) => NODE_CAPABILITIES[kind];
export const hasNodeBehavior = (kind: NodeKind, behavior: NodeBehavior) => getNodeCapabilities(kind).behavior === behavior;
export const isResourceBehavior = (kind: NodeKind) => ['resource', 'lake'].includes(getNodeCapabilities(kind).behavior);
export const isWorldObstacle = (kind: NodeKind) => Boolean(getNodeCapabilities(kind).worldObstacle);
