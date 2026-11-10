import { NODE_DEFINITIONS } from './nodes';
import { getNodeCapabilities } from './nodeCapabilities';
import type { NodeKind } from '../domain/types';
import { LATE_MODULES } from './progression';
import type { LineArtId } from '../art/lineArt';
import { modNode, modNodeTemplate } from '../mods/modRules';

export type NodeShape = 'resource' | 'standard' | 'research' | 'compact' | 'joint' | 'road' | 'chest' | 'lake' | 'hole' | 'camp' | 'corner-camp' | 'golem';
export type NodeConfiguration = 'recipe' | 'filter' | 'mining-target' | 'research' | 'tribute' | 'road';

export interface NodeModule {
  appearance: {
    icon: LineArtId;
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

const module = (icon: LineArtId, shape: NodeShape = 'standard', overrides?: Partial<NodeModule['controls']>): NodeModule => ({
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
  recycler: module('recycler'),
  cornerChallenge: module('dragon', 'corner-camp', worldControls),
  cornerTribute: module('package', 'standard', worldControls),
  devSource: module('infinity', 'standard', { pauseable: false }),
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
  smelter: module('smelter', 'standard', { configuration: 'recipe' }),
  refiner: module('cog', 'standard', { configuration: 'recipe' }),
  assembler: module('hammer', 'standard', { configuration: 'recipe' }),
  botPlant: module('bot', 'standard'),
  splitter: module('split', 'compact', { rotatable: true }),
  merger: module('merge', 'compact', { rotatable: true }),
  joint: module('cable', 'joint', { pauseable: false }),
  road: module('road', 'road', { configuration: 'road' }),
  powerSplitter: module('zap', 'compact'),
  filter: module('filter', 'compact', { configuration: 'filter' }),
  inventory: module('inventory'),
  woodenChest: module('cart', 'chest'),
  storage: module('storage'),
  charcoalGenerator: module('zap'),
  treePlanter: module('sprout'),
  researchCenter: module('flask', 'research', { configuration: 'research', pauseable: false }),
  'monster-camp': module('goblin-camp', 'camp', worldControls),
  goblinTribute: module('package', 'standard', { ...worldControls, configuration: 'tribute' }),
  'big-hole': module('hole', 'hole', worldControls),

  // Save-file aliases share the same modules as their canonical node kinds.
  chest: module('cart', 'chest'),
  generator: module('zap'),
  'tree-planter': module('sprout'),
  'research-center': module('flask', 'research', { configuration: 'research', pauseable: false }),
};

for (const kind of Object.keys(NODE_MODULES) as NodeKind[]) {
  if (NODE_DEFINITIONS[kind].category !== 'Logistics') continue;
  NODE_MODULES[kind].controls.pauseable = false;
  if (getNodeCapabilities(kind).passThrough) NODE_MODULES[kind].controls.rotatable = true;
}

const configurableKiln = { ...NODE_MODULES.kiln, controls: { ...NODE_MODULES.kiln.controls, configuration: 'recipe' as const } };
export const getNodeModule = (kind: NodeKind) => kind === 'kiln' && modNode(kind)?.recipeIds ? configurableKiln : NODE_MODULES[modNodeTemplate(kind)];
export function isPlayerMovableNode(kind: NodeKind, state?: import('../domain/types').GameState, node?: import('../domain/types').MachineNode) {
  if(getNodeModule(kind).controls.movable)return true;
  const completed=state?.research.completed??[];
  if(kind==='lake')return completed.includes('lakeRelocation');
  if(kind==='monster-camp'||kind==='goblinTribute')return completed.includes('campRelocation');
  if(['forest','deposit','iron','copper','mythril','stoneDeposit'].includes(kind))return completed.includes('resourceRelocation')&&(!node?.golemMineral||Boolean(node.defeated||node.infiniteResource));
  return false;
}
