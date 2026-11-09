import { ITEM_NAMES, ITEM_COLORS, BASE_ITEM_NAMES, BASE_ITEM_COLORS, FILTERABLE_ITEMS } from '../content/items';
import { BUILDABLE_NODES, NODE_DEFINITIONS, BASE_NODE_DEFINITIONS } from '../content/nodes';
import { NODE_CAPABILITIES, BASE_NODE_CAPABILITIES } from '../content/nodeCapabilities';
import { RECIPES, RECIPE_GROUPS, BASE_RECIPES, BASE_RECIPE_GROUPS } from '../content/recipes';
import { RESEARCH_PROJECTS, BASE_RESEARCH_PROJECTS, refreshResearchLookup } from '../content/research';
import type { ItemId, NodeKind, Recipe } from '../domain/types';
import { isCustomContentId, type GameMod } from './modTypes';
import { setActiveModRules } from './modRules';

function freezeCatalog<T extends object>(value: T): T {
  for (const entry of Object.values(value)) {
    if (entry && typeof entry === 'object' && !Object.isFrozen(entry)) freezeCatalog(entry);
  }
  return Object.freeze(value);
}

/** The editor can copy base templates. Only the separate runtime catalog accepts overrides. */
export const BASE_MOD_CONTENT = freezeCatalog({ names: BASE_ITEM_NAMES, colors: BASE_ITEM_COLORS, nodes: BASE_NODE_DEFINITIONS, capabilities: BASE_NODE_CAPABILITIES, recipes: BASE_RECIPES, groups: BASE_RECIPE_GROUPS, research: BASE_RESEARCH_PROJECTS });
let active: GameMod | undefined;
let initialized = false;

function replaceEntries<T extends object>(target: T, source: T) {
  for (const key of Object.keys(target)) delete (target as Record<string, unknown>)[key];
  Object.assign(target, structuredClone(source));
}

/** The visible factory owns the shared catalogs. Engine entry points reactivate their own package. */
export function activateMod(mod?: GameMod) {
  if (initialized && active === mod) return;
  initialized = true; active = mod;
  replaceEntries(ITEM_NAMES, BASE_MOD_CONTENT.names);
  replaceEntries(ITEM_COLORS, BASE_MOD_CONTENT.colors);
  // Keep node/research objects stable: build lists and research lookups retain references.
  for (const kind of Object.keys(NODE_DEFINITIONS) as NodeKind[]) if (isCustomContentId(kind)) delete NODE_DEFINITIONS[kind];
  for (const [kind, base] of Object.entries(BASE_MOD_CONTENT.nodes)) replaceEntries(NODE_DEFINITIONS[kind as NodeKind], base);
  replaceEntries(NODE_CAPABILITIES, BASE_MOD_CONTENT.capabilities);
  replaceEntries(RECIPES, BASE_MOD_CONTENT.recipes);
  replaceEntries(RECIPE_GROUPS, BASE_MOD_CONTENT.groups);
  RESEARCH_PROJECTS.length = BASE_MOD_CONTENT.research.length;
  const projects = new Map(RESEARCH_PROJECTS.map((project, index) => {
    replaceEntries(project, BASE_MOD_CONTENT.research[index]);
    return [project.id, project];
  }));
  if (mod) {
    for (const [id, value] of Object.entries(mod.resources)) {
      if (!value) continue;
      const item = id as keyof typeof ITEM_NAMES;
      if (value.name !== undefined) ITEM_NAMES[item] = value.name;
      if (value.color !== undefined) ITEM_COLORS[item] = parseInt(value.color.slice(1), 16);
    }
    for (const [id, patch] of Object.entries(mod.nodes)) {
      if (!patch) continue;
      const kind = id as keyof typeof NODE_DEFINITIONS;
      if (patch.template) {
        NODE_DEFINITIONS[kind] = { ...structuredClone(BASE_MOD_CONTENT.nodes[patch.template]), kind };
        NODE_CAPABILITIES[kind] = structuredClone(BASE_MOD_CONTENT.capabilities[patch.template]);
        if (BASE_MOD_CONTENT.groups[patch.template]) RECIPE_GROUPS[kind] = [...BASE_MOD_CONTENT.groups[patch.template]];
      }
      const definition = NODE_DEFINITIONS[kind];
      for (const key of ['name', 'description', 'icon', 'accentCss', 'input', 'output', 'unlockResearch'] as const) {
        if (patch[key] !== undefined) Object.assign(definition, { [key]: structuredClone(patch[key]) });
      }
      if (patch.accentCss) definition.accent = parseInt(patch.accentCss.slice(1), 16);
      if (patch.resourceItem && !patch.output) definition.output = [patch.resourceItem];
      for (const key of ['inputCapacity', 'multiInput', 'multiOutput', 'worldObstacle'] as const) {
        if (patch[key] !== undefined) Object.assign(NODE_CAPABILITIES[kind], { [key]: patch[key] });
      }
      if (patch.capacity !== undefined) NODE_CAPABILITIES[kind].defaultCapacity = patch.capacity;
      if (patch.recipeIds) RECIPE_GROUPS[kind] = [...patch.recipeIds];
    }
    for (const [id, patch] of Object.entries(mod.recipes)) {
      if (isCustomContentId(id)) RECIPES[id] = { ...structuredClone(patch), id } as Recipe;
      else Object.assign(RECIPES[id], structuredClone(patch));
    }
    for (const [id, patch] of Object.entries(mod.research)) {
      const project = projects.get(id);
      if (project) Object.assign(project, structuredClone(patch));
      else RESEARCH_PROJECTS.push({ id, name: id, category: 'Mod research', description: '', unlock: '', costs: {}, ...structuredClone(patch) });
    }
  }
  refreshResearchLookup();
  FILTERABLE_ITEMS.splice(0, FILTERABLE_ITEMS.length, ...(Object.keys(ITEM_NAMES) as ItemId[]).filter(item => item !== 'power' && item !== 'forest-growth'));
  BUILDABLE_NODES.splice(0, BUILDABLE_NODES.length, ...Object.values(NODE_DEFINITIONS).filter(node => !node.hidden));
  setActiveModRules(mod);
}
