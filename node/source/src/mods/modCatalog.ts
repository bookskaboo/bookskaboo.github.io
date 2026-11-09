import { DEFERRED_POWER_NODES } from '../content/deferredPower';
import { RETIRED_RECIPES } from '../content/recipes';
import type { CustomContentId, ItemId, NodeKind } from '../domain/types';
import { BASE_MOD_CONTENT as BASE } from './modContent';
import { isCustomContentId, MOD_NODE_TEMPLATES, type GameMod, type ProfileCategory } from './modTypes';

export type NodeCategory = keyof typeof MOD_NODE_TEMPLATES;
export type EntryCategory = NodeCategory | 'resources' | 'research' | 'recipes';
export type ModCategory = EntryCategory | ProfileCategory;
export type ModOption = readonly [id: string, name: string];

export const entrySection = (category: EntryCategory) => category === 'resources' || category === 'recipes' || category === 'research' ? category : 'nodes';
export const isProfileCategory = (category: string): category is ProfileCategory => category === 'maps' || category === 'connections';
export const isNodeCategory = (category: ModCategory): category is NodeCategory => Object.hasOwn(MOD_NODE_TEMPLATES, category);

const nodeGroup = (kind: NodeKind): NodeCategory | undefined => {
  const category = BASE.nodes[kind]?.category;
  if (category === 'World') return 'obstructions';
  if (category === 'Logistics' || category === 'Storage') return 'logistics';
  if (category === 'Production' || category === 'Research' || category === 'Extraction') return 'production';
};

const baseResearch = new Map(BASE.research.map(project => [project.id, project]));
const compatibilityItems = new Set(['power', 'mineral-aggregate', 'metal-residue']);
const assignedRecipes = new Set(Object.values(BASE.groups).flat());
const baseRecipes = Object.values(BASE.recipes).filter(recipe => assignedRecipes.has(recipe.id) && !RETIRED_RECIPES.has(recipe.id));
const baseNodes = Object.values(BASE.nodes).filter(node => !node.legacyAlias && !DEFERRED_POWER_NODES.has(node.kind) &&
  !['lakeIntake', 'abandonedFabricator', 'fluidRoad'].includes(node.kind));

export function entriesFor(category: ModCategory, draft: GameMod): ModOption[] {
  if (isProfileCategory(category)) return Object.entries(draft.profiles?.[category]?.entries ?? {}).map(([id, entry]) => [id, entry.name]);
  const entries: ModOption[] = [];
  const section = draft[entrySection(category)];
  const edited = section as Record<string, { name?: string; template?: NodeKind }>;
  if (category === 'resources') {
    for (const [id, name] of Object.entries(BASE.names)) if (!compatibilityItems.has(id) || edited[id]) entries.push([id, edited[id]?.name || name]);
  } else if (category === 'research') {
    for (const project of BASE.research) entries.push([project.id, edited[project.id]?.name || project.name]);
  } else if (category === 'recipes') {
    for (const recipe of baseRecipes) entries.push([recipe.id, edited[recipe.id]?.name || recipe.name]);
  } else {
    for (const node of baseNodes) if (nodeGroup(node.kind) === category) entries.push([node.kind, edited[node.kind]?.name || node.name]);
  }
  for (const [id, entry] of Object.entries(edited)) {
    if (!isCustomContentId(id)) continue;
    if (isNodeCategory(category) && (!entry.template || nodeGroup(entry.template) !== category)) continue;
    entries.push([id, entry.name || 'Untitled']);
  }
  return entries.sort((a, b) => a[1].localeCompare(b[1]));
}

export function entryBase(category: EntryCategory, id: string, template?: NodeKind) {
  if (category === 'resources') {
    if (isCustomContentId(id)) return { name: '', color: '#b9c7ce' };
    const item = id as ItemId;
    return { name: BASE.names[item], color: `#${BASE.colors[item].toString(16).padStart(6, '0')}` };
  }
  if (category === 'recipes') return BASE.recipes[id] ?? { name: '', inputs: {}, outputs: {}, cycleMs: 5000 };
  if (category === 'research') return baseResearch.get(id) ?? { name: '', description: '', unlock: '', costs: {} };
  return BASE.nodes[template ?? id as NodeKind];
}

export function createEntry(draft: GameMod, category: ModCategory, name: string, template?: NodeKind): CustomContentId {
  const slug = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48).replace(/-$/, '') || 'entry';
  const stem = `mod-${slug}` as const;
  const catalogs = [draft.resources, draft.nodes, draft.recipes, draft.research, draft.profiles?.maps?.entries, draft.profiles?.connections?.entries];
  let id: CustomContentId = stem;
  for (let index = 2; catalogs.some(catalog => catalog && Object.hasOwn(catalog, id)); index++) id = `${stem}-${index}`;

  if (isProfileCategory(category)) {
    const profiles = (draft.profiles ??= {})[category] ??= { entries: {} };
    profiles.entries[id] = { name, rules: {} };
    profiles.selected = id;
  } else if (category === 'resources') draft.resources[id] = { name, color: '#b9c7ce' };
  else if (category === 'recipes') draft.recipes[id] = { name, inputs: { wood: 1 }, outputs: { charcoal: 1 }, cycleMs: 5000 };
  else if (category === 'research') draft.research[id] = { name, costs: { 'simple-core': 5 } };
  else if (template) draft.nodes[id] = { name, template };
  else throw new Error('Choose a node template.');
  return id;
}
