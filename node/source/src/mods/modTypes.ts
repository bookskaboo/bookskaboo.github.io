import type { CustomContentId, ItemId, NodeDefinition, NodeKind, Recipe, ResearchProject } from '../domain/types';
import { MAX_WORLD_GRID_SIZE } from '../domain/worldGrid';

export interface ModNode extends Partial<Pick<NodeDefinition, 'name' | 'description' | 'icon' | 'accentCss' | 'input' | 'output' | 'unlockResearch'>> {
  template?: NodeKind;
  worldChance?: number;
  worldSpawn?: ModWorldSpawn;
  resourceItem?: ItemId;
  constructionMs?: number;
  cycleMultiplier?: number;
  capacity?: number;
  inputCapacity?: number;
  multiInput?: boolean;
  multiOutput?: boolean;
  customSockets?: boolean;
  maxInputConnections?: number;
  maxOutputConnections?: number;
  resourceCapacity?: number;
  obstructionScale?: number;
  worldObstacle?: boolean;
  recipeIds?: string[];
}

export const WORLD_SPAWN_KINDS = ['forest', 'iron', 'copper', 'mythril', 'stoneDeposit', 'lake', 'big-hole', 'monster-camp'] as const satisfies readonly NodeKind[];
export const WORLD_SPAWN_REGIONS = {
  anywhere: 'Anywhere', center: 'Center', northwest: 'Northwest', northeast: 'Northeast', southwest: 'Southwest', southeast: 'Southeast',
} as const;
export const WORLD_SPAWN_MAX_COUNT = 8;
export const WORLD_SPAWN_MAX_TIER = MAX_WORLD_GRID_SIZE - 2;
export interface ModWorldSpawn {
  mode?: 'add' | 'replace';
  minTier?: number;
  maxTier?: number;
  chance?: number;
  count?: number;
  region?: keyof typeof WORLD_SPAWN_REGIONS;
}

export const supportsWorldSpawn = (kind: NodeKind) => WORLD_SPAWN_KINDS.some(candidate => candidate === kind);

export interface ModRules {
  cableTravelMs?: number;
  cableLaunchMs?: number;
  roadTransferMs?: number;
  constructionMultiplier?: number;
  forestRegenMs?: number;
  worldGridSize?: number;
  mapResourceMultiplier?: number;
  mapWidthMultiplier?: number;
  mapHeightMultiplier?: number;
}

export const MAP_RULE_KEYS = ['worldGridSize', 'forestRegenMs', 'mapResourceMultiplier', 'mapWidthMultiplier', 'mapHeightMultiplier'] as const;
export const CONNECTION_RULE_KEYS = ['cableTravelMs', 'cableLaunchMs', 'roadTransferMs', 'constructionMultiplier'] as const;
export const MOD_NODE_TEMPLATES = {
  production: ['refiner', 'assembler', 'advancedAssembler', 'hydroProcessor', 'separationFurnace'],
  logistics: ['joint', 'splitter', 'merger', 'warehouse', 'fluidStorage'],
  obstructions: ['iron', 'copper', 'mythril', 'stoneDeposit'],
} as const satisfies Record<string, readonly NodeKind[]>;
export type ProfileCategory = 'maps' | 'connections';
export interface ModProfile { name: string; rules: ModRules }

/** Data only. Stable base IDs remain the save compatibility boundary. */
export interface GameMod {
  version: 1;
  name: string;
  author: string;
  description: string;
  resources: Partial<Record<ItemId, { name?: string; color?: string }>>;
  nodes: Partial<Record<NodeKind, ModNode>>;
  recipes: Record<string, Partial<Omit<Recipe, 'id'>>>;
  research: Record<string, Partial<Pick<ResearchProject, 'name' | 'description' | 'unlock' | 'costs' | 'prerequisite' | 'prerequisites' | 'costGrowth' | 'repeatable'>>>;
  rules: ModRules;
  profiles?: Partial<Record<ProfileCategory, { selected?: string; entries: Record<string, ModProfile> }>>;
}

export const isCustomContentId = (id: string): id is CustomContentId => /^mod-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id.length <= 64;

export const emptyMod = (): GameMod => ({ version: 1, name: 'My factory mod', author: '', description: '', resources: {}, nodes: {}, recipes: {}, research: {}, rules: {} });
