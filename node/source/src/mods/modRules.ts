import type { NodeKind } from '../domain/types';
import type { GameMod, ModRules } from './modTypes';

export const BASE_MOD_RULES: Required<ModRules> = {
  cableTravelMs: 1000, cableLaunchMs: 400, roadTransferMs: 5000,
  constructionMultiplier: 1, forestRegenMs: 30000, mapResourceMultiplier: 1,
  mapWidthMultiplier: 1, mapHeightMultiplier: 1,
};
let active: GameMod | undefined;
export function setActiveModRules(mod?: GameMod) { active = mod; }
export const modRule = <K extends keyof ModRules>(key: K): Required<ModRules>[K] => active?.rules[key] ?? BASE_MOD_RULES[key];
export const modNode = (kind: NodeKind) => active?.nodes[kind];
export const modResearch = (id: string) => active?.research[id];
export const modResearchAccepts = (item: string) => Object.values(active?.research ?? {}).some(project => project.costs && Object.hasOwn(project.costs, item));
