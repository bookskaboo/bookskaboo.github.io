import { ITEM_NAMES, ITEM_COLORS, BASE_ITEM_NAMES, BASE_ITEM_COLORS } from '../content/items';
import { BUILDABLE_NODES, NODE_DEFINITIONS, BASE_NODE_DEFINITIONS } from '../content/nodes';
import { NODE_CAPABILITIES, BASE_NODE_CAPABILITIES } from '../content/nodeCapabilities';
import { RECIPES, RECIPE_GROUPS, BASE_RECIPES, BASE_RECIPE_GROUPS } from '../content/recipes';
import { RESEARCH_PROJECTS, BASE_RESEARCH_PROJECTS } from '../content/research';
import type { GameMod } from './modTypes';
import { setActiveModRules } from './modRules';

/** Owners retain source templates independently of mod activation and hot reloads. */
export const BASE_MOD_CONTENT = { names: BASE_ITEM_NAMES, colors: BASE_ITEM_COLORS, nodes: BASE_NODE_DEFINITIONS, capabilities: BASE_NODE_CAPABILITIES, recipes: BASE_RECIPES, groups: BASE_RECIPE_GROUPS, research: BASE_RESEARCH_PROJECTS };
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
  for (const [kind, base] of Object.entries(BASE_MOD_CONTENT.nodes)) replaceEntries(NODE_DEFINITIONS[kind as keyof typeof NODE_DEFINITIONS], base);
  replaceEntries(NODE_CAPABILITIES, BASE_MOD_CONTENT.capabilities);
  replaceEntries(RECIPES, BASE_MOD_CONTENT.recipes);
  replaceEntries(RECIPE_GROUPS, BASE_MOD_CONTENT.groups);
  for (let index = 0; index < RESEARCH_PROJECTS.length; index++) replaceEntries(RESEARCH_PROJECTS[index], BASE_MOD_CONTENT.research[index]);
  if (mod) {
    for (const [id, value] of Object.entries(mod.resources)) {
      const item = id as keyof typeof ITEM_NAMES;
      if (value.name !== undefined) ITEM_NAMES[item] = value.name;
      if (value.color !== undefined) ITEM_COLORS[item] = parseInt(value.color.slice(1), 16);
    }
    for (const [id, patch] of Object.entries(mod.nodes)) {
      const kind = id as keyof typeof NODE_DEFINITIONS;
      const definition = NODE_DEFINITIONS[kind];
      for (const key of ['name', 'description', 'icon', 'accentCss', 'input', 'output', 'unlockResearch'] as const) {
        if (patch[key] !== undefined) Object.assign(definition, { [key]: structuredClone(patch[key]) });
      }
      if (patch.accentCss) definition.accent = parseInt(patch.accentCss.slice(1), 16);
      for (const key of ['inputCapacity', 'multiInput', 'multiOutput', 'worldObstacle'] as const) {
        if (patch[key] !== undefined) Object.assign(NODE_CAPABILITIES[kind], { [key]: patch[key] });
      }
      if (patch.capacity !== undefined) NODE_CAPABILITIES[kind].defaultCapacity = patch.capacity;
      if (patch.recipeIds) RECIPE_GROUPS[kind] = [...patch.recipeIds];
    }
    for (const [id, patch] of Object.entries(mod.recipes)) Object.assign(RECIPES[id], structuredClone(patch));
    for (const [id, patch] of Object.entries(mod.research)) Object.assign(RESEARCH_PROJECTS.find(project => project.id === id)!, structuredClone(patch));
  }
  BUILDABLE_NODES.splice(0, BUILDABLE_NODES.length, ...Object.values(NODE_DEFINITIONS).filter(node => !node.hidden));
  setActiveModRules(mod);
}
