import { afterEach, describe, expect, it } from 'vitest';
import type { ItemId, Recipe } from '../domain/types';
import { RECIPES } from '../content/recipes';
import { RECYCLER_RETURNS } from '../content/recycling';
import { activateMod } from '../mods/modContent';
import { emptyMod } from '../mods/modTypes';
import { createResourcePotential, RESCUE_RESOURCES } from './expansionRescue';

// Pre-optimization exhaustive lookup, retained here as a numerical equivalence
// oracle. Unlike the production evaluator, it searches the catalog at each step.
function exhaustive(item: ItemId, resource: typeof RESCUE_RESOURCES[number], seen = new Set<ItemId>()): number {
  if (['iron', 'copper', 'stone', 'wood', 'water', 'mythril'].includes(item)) return item === resource ? 1 : 0;
  if (seen.has(item)) return 0;
  const next = new Set(seen).add(item);
  const recipes = Object.values(RECIPES).filter(r => (r.outputs[item] ?? 0) > 0 && !/^(recycle|efficient|composite)-/.test(r.id) && !r.recovery);
  return Math.max(RECYCLER_RETURNS[item]?.[resource] ?? 0, ...recipes.map(r =>
    Object.entries(r.inputs).reduce((n, [i, q]) => n + q! * exhaustive(i as ItemId, resource, next), 0) / (r.outputs[item] ?? 1)), 0);
}

function withRecipes(recipes: Recipe[], run: () => void) {
  const previous = recipes.map(r => [r.id, RECIPES[r.id]] as const);
  try { for (const recipe of recipes) RECIPES[recipe.id] = recipe; run(); }
  finally { for (const [id, recipe] of previous) { if (recipe) RECIPES[id] = recipe; else delete RECIPES[id]; } }
}
const recipe = (id: string, inputs: Recipe['inputs'], outputs: Recipe['outputs'], extra: Partial<Recipe> = {}): Recipe =>
  ({ id, name: id, cycleMs: 1000, inputs, outputs, ...extra });
afterEach(() => activateMod());

describe('per-evaluation recovery recipe lookup', () => {
  it.each(RESCUE_RESOURCES)('preserves exhaustive %s budgets across the assembled catalog without mutation', resource => {
    activateMod();
    const before = structuredClone(RECIPES), potential = createResourcePotential();
    const items = new Set<ItemId>(Object.keys(RECYCLER_RETURNS) as ItemId[]);
    for (const r of Object.values(RECIPES)) for (const item of [...Object.keys(r.inputs), ...Object.keys(r.outputs)]) items.add(item as ItemId);
    for (const item of items) expect(potential(item, resource), item).toBe(exhaustive(item, resource));
    expect(RECIPES).toEqual(before);
  });

  it('preserves yields, alternative producers, multi-output recipes and excluded producer classes', () => {
    const a: ItemId = 'mod-budget-a', b: ItemId = 'mod-budget-b';
    withRecipes([
      recipe('mod-budget-main', { iron: 6 }, { [a]: 2, [b]: 4 }),
      recipe('mod-budget-alternative', { stone: 11 }, { [a]: 1 }),
      ...['recycle-', 'efficient-', 'composite-'].map(prefix => recipe(prefix + 'budget-test', { iron: 999 }, { [a]: 1 })),
      recipe('mod-budget-recovery', { iron: 999 }, { [a]: 1 }, { recovery: true }),
      recipe('mod-budget-zero', { iron: 999 }, { [a]: 0 }),
      recipe('mod-budget-negative', { iron: 999 }, { [a]: -1 }),
      recipe('mod-budget-chance', { iron: 999 }, {}, { chanceOutputs: [{ item: a, amount: 1, probability: 1 }] }),
    ], () => {
      const potential = createResourcePotential();
      expect(potential(a, 'iron')).toBe(3); expect(potential(b, 'iron')).toBe(1.5);
      expect(potential(a, 'stone')).toBe(11);
      for (const resource of RESCUE_RESOURCES) for (const item of [a, b]) expect(potential(item, resource)).toBe(exhaustive(item, resource));
    });
  });

  it('keeps cycle results path-dependent rather than reusing a budget from a different branch', () => {
    const a: ItemId = 'mod-cycle-a', b: ItemId = 'mod-cycle-b';
    withRecipes([
      recipe('mod-cycle-a', { [b]: 1 }, { [a]: 1 }),
      recipe('mod-cycle-b', { [a]: 1 }, { [b]: 1 }),
      recipe('mod-cycle-seed', { iron: 2 }, { [b]: 1 }),
    ], () => {
      const potential = createResourcePotential();
      expect(potential(a, 'iron')).toBe(2);
      expect(potential(a, 'iron', new Set([b]))).toBe(0);
      expect(potential(b, 'iron')).toBe(2);
      for (const item of [a, b]) for (const path of [new Set<ItemId>(), new Set([a]), new Set([b])]) {
        expect(potential(item, 'iron', path)).toBe(exhaustive(item, 'iron', path));
      }
    });
  });

  it('returns raw-resource identity and unknown stock without changing the catalog', () => {
    const potential = createResourcePotential();
    expect(potential('iron', 'iron')).toBe(1);
    expect(potential('iron', 'copper')).toBe(0);
    expect(potential('wood', 'iron')).toBe(0);
    expect(potential('mod-missing-producer', 'iron')).toBe(0);
  });

  it('builds a fresh lookup after catalog replacement, removal and return from a mod', () => {
    const item: ItemId = 'mod-changing-budget', mod = emptyMod();
    mod.recipes['mod-changing-budget'] = recipe('mod-changing-budget', { iron: 3 }, { [item]: 1 });
    activateMod(mod);
    expect(createResourcePotential()(item, 'iron')).toBe(3);
    const nextMod = structuredClone(mod);
    nextMod.recipes['mod-changing-budget'].inputs = { copper: 7 };
    activateMod(nextMod);
    expect(createResourcePotential()(item, 'iron')).toBe(0);
    expect(createResourcePotential()(item, 'copper')).toBe(7);
    activateMod();
    expect(createResourcePotential()(item, 'copper')).toBe(0);
    expect(createResourcePotential()('simple-core', 'copper')).toBe(exhaustive('simple-core', 'copper'));
  });
});
