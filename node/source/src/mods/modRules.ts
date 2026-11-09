import type { ItemId, NodeKind } from '../domain/types';
import { DEFAULT_WORLD_GRID_SIZE } from '../domain/worldGrid';
import type { GameMod, ModNode, ModRules, ModWorldSpawn } from './modTypes';
import { MOD_NODE_TEMPLATES } from './modTypes';

export const BASE_MOD_RULES: Required<ModRules> = {
  cableTravelMs: 1000, cableLaunchMs: 400, roadTransferMs: 5000,
  constructionMultiplier: 1, forestRegenMs: 30000, mapResourceMultiplier: 1,
  mapWidthMultiplier: 1, mapHeightMultiplier: 1, worldGridSize: DEFAULT_WORLD_GRID_SIZE,
};
export function modWorldGridSize(mod?: GameMod) {
  const maps = mod?.profiles?.maps;
  return (maps?.selected ? maps.entries[maps.selected]?.rules.worldGridSize : undefined) ?? mod?.rules.worldGridSize;
}
let active: GameMod | undefined;
let rules: Required<ModRules> = BASE_MOD_RULES;
let worldVariants: Array<[NodeKind, NonNullable<GameMod['nodes'][NodeKind]>]> = [];
let worldSpawns: Array<[NodeKind, ModNode & { worldSpawn: ModWorldSpawn }]> = [];
let researchItems = new Set<string>();
let reserveItems: ItemId[] = [];
export function setActiveModRules(mod?: GameMod) {
  active = mod;
  const selected = (category: 'maps' | 'connections') => {
    const profiles = mod?.profiles?.[category];
    return profiles?.selected ? profiles.entries[profiles.selected]?.rules : undefined;
  };
  rules = { ...BASE_MOD_RULES, ...mod?.rules, ...selected('maps'), ...selected('connections') };
  const nodes = Object.entries(mod?.nodes ?? {}) as Array<[NodeKind, ModNode]>;
  worldVariants = nodes.filter(([, entry]) =>
    entry.template && (MOD_NODE_TEMPLATES.obstructions as readonly NodeKind[]).includes(entry.template));
  worldSpawns = nodes.filter((entry): entry is (typeof worldSpawns)[number] => Boolean(entry[1].worldSpawn))
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  researchItems = new Set(Object.values(mod?.research ?? {}).flatMap(project => Object.keys(project.costs ?? {})));
  reserveItems = [...new Set(worldVariants.flatMap(([, entry]) => entry.resourceItem ? [entry.resourceItem] : []))];
}
export const modRule = <K extends keyof ModRules>(key: K): Required<ModRules>[K] => rules[key];
export const modNode = (kind: NodeKind) => active?.nodes[kind];
export const modNodeTemplate = (kind: NodeKind) => modNode(kind)?.template ?? kind;
export const modWorldVariants = () => worldVariants;
export const modWorldSpawns = () => worldSpawns;
export const modReserveItems = () => reserveItems;
export const modResearch = (id: string) => active?.research[id];
export const modResearchAccepts = (item: string) => researchItems.has(item);
