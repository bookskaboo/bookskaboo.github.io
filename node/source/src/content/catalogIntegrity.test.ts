import { describe, expect, it } from 'vitest';
import { ITEM_COLORS, ITEM_NAMES } from './items';
import { NODE_CAPABILITIES } from './nodeCapabilities';
import { NODE_MODULES } from './nodeModules';
import { INVENTORY_UNLOCK_ID, NODE_DEFINITIONS } from './nodes';
import { RECIPES, RECIPE_GROUPS } from './recipes';
import { RESEARCH_PROJECTS } from './research';
import { expandPortFamily } from '../simulation/connectionRules';
import type { ItemId, NodeKind } from '../domain/types';

describe('content catalog integrity', () => {
  it('keeps definitions, visuals, and runtime capabilities in lockstep', () => {
    const definitions = Object.keys(NODE_DEFINITIONS).sort();
    expect(Object.keys(NODE_MODULES).sort()).toEqual(definitions);
    expect(Object.keys(NODE_CAPABILITIES).sort()).toEqual(definitions);
  });

  it('keeps every item named, colored, and routable through declared port families', () => {
    expect(Object.keys(ITEM_COLORS).sort()).toEqual(Object.keys(ITEM_NAMES).sort());
    Object.values(NODE_DEFINITIONS).forEach((definition) => {
      [...definition.input, ...definition.output].forEach((family) => {
        expect(expandPortFamily(family).length, `${definition.kind}:${family}`).toBeGreaterThan(0);
        expandPortFamily(family).forEach((item) => expect(ITEM_NAMES[item], `${definition.kind}:${item}`).toBeTruthy());
      });
    });
  });

  it('keeps recipes and recipe-machine defaults connected to valid catalogs', () => {
    const disposal = new Set(['recycle-iron', 'recycle-copper', 'recycle-wood', 'recycle-stone', 'recycle-mythril']);
    Object.values(RECIPES).forEach((recipe) => {
      expect(Object.keys(recipe.inputs).length, `${recipe.id}:inputs`).toBeGreaterThan(0);
      if (disposal.has(recipe.id)) expect(recipe.outputs).toEqual({});
      else expect(Object.keys(recipe.outputs).length, `${recipe.id}:outputs`).toBeGreaterThan(0);
      expect(recipe.cycleMs).toBeGreaterThan(0);
      [...Object.keys(recipe.inputs), ...Object.keys(recipe.outputs)].forEach((item) => expect(ITEM_NAMES[item as ItemId], `${recipe.id}:${item}`).toBeTruthy());
    });
    Object.entries(RECIPE_GROUPS).forEach(([kind, recipeIds]) => {
      expect(NODE_DEFINITIONS[kind as NodeKind], kind).toBeTruthy();
      recipeIds.forEach((recipeId) => expect(RECIPES[recipeId], `${kind}:${recipeId}`).toBeTruthy());
    });
    Object.entries(NODE_CAPABILITIES).forEach(([kind, capabilities]) => {
      if (!capabilities.defaultRecipeId) return;
      expect(RECIPES[capabilities.defaultRecipeId], `${kind}:default recipe`).toBeTruthy();
      expect(RECIPE_GROUPS[kind]?.includes(capabilities.defaultRecipeId), `${kind}:recipe group`).toBe(true);
    });
  });

  it('keeps research references valid and acyclic', () => {
    const projects = new Map(RESEARCH_PROJECTS.map((project) => [project.id, project]));
    RESEARCH_PROJECTS.forEach((project) => {
      if (project.prerequisite) expect(projects.has(project.prerequisite), `${project.id}:prerequisite`).toBe(true);
      Object.keys(project.costs).forEach((item) => expect(ITEM_NAMES[item as ItemId], `${project.id}:${item}`).toBeTruthy());
    });
    Object.values(NODE_DEFINITIONS).forEach((definition) => {
      if (!definition.unlockResearch || definition.unlockResearch === INVENTORY_UNLOCK_ID) return;
      expect(projects.has(definition.unlockResearch), `${definition.kind}:unlock`).toBe(true);
    });
    RESEARCH_PROJECTS.forEach((project) => {
      const visited = new Set<string>();
      let current = project;
      while (current.prerequisite) {
        expect(visited.has(current.id), `${project.id}:cycle`).toBe(false);
        visited.add(current.id);
        current = projects.get(current.prerequisite)!;
      }
    });
  });

  it('keeps capability combinations compatible with each node interface', () => {
    Object.entries(NODE_CAPABILITIES).forEach(([kind, capabilities]) => {
      const definition = NODE_DEFINITIONS[kind as NodeKind];
      if (capabilities.multiInput) expect(definition.input.length, `${kind}:multi input`).toBeGreaterThan(0);
      if (capabilities.multiOutput) expect(definition.output.length, `${kind}:multi output`).toBeGreaterThan(0);
      if (capabilities.passThrough) {
        expect(definition.input.length, `${kind}:pass-through input`).toBeGreaterThan(0);
        expect(definition.output.length, `${kind}:pass-through output`).toBeGreaterThan(0);
      }
      if (capabilities.globallyUnique) expect(capabilities.duplicateAllowed).toBe(false);
      if (NODE_MODULES[kind as NodeKind].controls.configuration === 'recipe') expect(capabilities.behavior).toBe('recipe');
      if (NODE_MODULES[kind as NodeKind].controls.configuration === 'filter') expect(capabilities.behavior).toBe('filter');
      if (NODE_MODULES[kind as NodeKind].controls.configuration === 'mining-target') expect(capabilities.behavior).toBe('mining-drill');
    });
  });
});
