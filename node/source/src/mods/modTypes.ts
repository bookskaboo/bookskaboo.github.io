import type { ItemId, NodeDefinition, NodeKind, Recipe, ResearchProject } from '../domain/types';

export interface ModNode extends Partial<Pick<NodeDefinition, 'name' | 'description' | 'icon' | 'accentCss' | 'input' | 'output' | 'unlockResearch'>> {
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

export interface ModRules {
  cableTravelMs?: number;
  cableLaunchMs?: number;
  roadTransferMs?: number;
  constructionMultiplier?: number;
  forestRegenMs?: number;
  mapResourceMultiplier?: number;
  mapWidthMultiplier?: number;
  mapHeightMultiplier?: number;
}

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
}

export const emptyMod = (): GameMod => ({ version: 1, name: 'My factory mod', author: '', description: '', resources: {}, nodes: {}, recipes: {}, research: {}, rules: {} });
