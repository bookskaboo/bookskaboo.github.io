import { NODE_DEFINITIONS } from './nodes';
import { getNodeCapabilities } from './nodeCapabilities';
import type { NodeKind } from '../domain/types';
import { LATE_MODULES } from './progression';

/** Icon names intentionally mirror the visual language used by the original game. */
export type NodeIconId =
  | 'gem' | 'mountain' | 'tree' | 'lake' | 'pickaxe' | 'mining-drill'
  | 'flame' | 'smelter' | 'cog' | 'hammer' | 'atom'
  | 'split' | 'merge' | 'cable' | 'road' | 'zap' | 'filter'
  | 'package' | 'archive' | 'sprout' | 'flask' | 'camp' | 'hole';

export type NodeShape = 'resource' | 'standard' | 'research' | 'compact' | 'joint' | 'road' | 'chest' | 'lake' | 'hole' | 'camp';
export type NodeConfiguration = 'recipe' | 'filter' | 'mining-target' | 'research';

export interface NodeModule {
  appearance: {
    icon: NodeIconId;
    shape: NodeShape;
  };
  controls: {
    deletable: boolean;
    movable: boolean;
    pauseable: boolean;
    rotatable: boolean;
    configuration?: NodeConfiguration;
  };
}

const controls = (overrides: Partial<NodeModule['controls']> = {}): NodeModule['controls'] => ({
  deletable: true,
  movable: true,
  pauseable: true,
  rotatable: false,
  ...overrides,
});

const module = (icon: NodeIconId, shape: NodeShape = 'standard', overrides?: Partial<NodeModule['controls']>): NodeModule => ({
  appearance: { icon, shape },
  controls: controls(overrides),
});

const worldControls = { deletable: false, movable: false, pauseable: false } as const;

/**
 * Single edit point for every node's appearance and embedded controls.
 * Simulation recipes and ports remain in nodes.ts/recipes.ts, while renderer and UI
 * both consume this catalog so visual edits stay consistent everywhere.
 */
export const NODE_MODULES: Record<NodeKind, NodeModule> = {
  ...LATE_MODULES,
  forest: module('tree', 'resource', worldControls),
  deposit: module('gem', 'resource', worldControls),
  iron: module('gem', 'resource', worldControls),
  copper: module('gem', 'resource', worldControls),
  mythril: module('gem', 'resource', worldControls),
  stoneDeposit: module('mountain', 'resource', worldControls),
  lake: module('lake', 'lake', worldControls),
  extractor: module('pickaxe'),
  miningDrill: module('mining-drill', 'standard', { configuration: 'mining-target', pauseable: false }),
  kiln: module('flame'),
  smelter: module('smelter'),
  refiner: module('cog', 'standard', { configuration: 'recipe' }),
  assembler: module('hammer', 'standard', { configuration: 'recipe' }),
  splitter: module('split', 'compact', { rotatable: true }),
  merger: module('merge', 'compact', { rotatable: true }),
  joint: module('cable', 'joint', { pauseable: false }),
  road: module('road', 'road'),
  powerSplitter: module('zap', 'compact'),
  filter: module('filter', 'compact', { configuration: 'filter' }),
  inventory: module('package'),
  woodenChest: module('archive', 'chest'),
  storage: module('package'),
  charcoalGenerator: module('zap'),
  treePlanter: module('sprout'),
  researchCenter: module('flask', 'research', { configuration: 'research', pauseable: false }),
  'monster-camp': module('camp', 'camp', worldControls),
  goblinTribute: module('package', 'standard', worldControls),
  'big-hole': module('hole', 'hole', worldControls),

  // Save-file aliases share the same modules as their canonical node kinds.
  chest: module('archive', 'chest'),
  generator: module('zap'),
  'tree-planter': module('sprout'),
  'research-center': module('flask', 'research', { configuration: 'research', pauseable: false }),
};

for (const kind of Object.keys(NODE_MODULES) as NodeKind[]) {
  if (NODE_DEFINITIONS[kind].category !== 'Logistics') continue;
  NODE_MODULES[kind].controls.pauseable = false;
  if (getNodeCapabilities(kind).passThrough) NODE_MODULES[kind].controls.rotatable = true;
}

export const getNodeModule = (kind: NodeKind) => NODE_MODULES[kind];
export const isPlayerMovableNode = (kind: NodeKind) => getNodeModule(kind).controls.movable;
