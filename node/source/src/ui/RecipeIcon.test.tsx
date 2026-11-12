import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ITEM_ART } from '../art/itemArt';
import { BOT_BUILDS } from '../content/botAssembly';
import { BASE_ITEM_NAMES } from '../content/items';
import { RECIPES } from '../content/recipes';
import { InventoryPanel } from './panels/InventoryPanel';
import { RecipeIcon } from './RecipeIcon';

it('has art for every built-in item and every distinct Bot Plant build', () => {
  expect([...ITEM_ART.keys()].sort()).toEqual(Object.keys(BASE_ITEM_NAMES).sort());
  for (const { recipe, legacyId } of BOT_BUILDS) {
    const html = renderToStaticMarkup(<RecipeIcon recipe={recipe} node="botPlant" />);
    expect(html).toContain(`data-item-art="${legacyId}"`);
  }
});

it('shows the discarded material for a Recycler recipe with no output', () => {
  const html = renderToStaticMarkup(<RecipeIcon recipe={RECIPES['recycle-stone']} node="recycler" />);
  expect(html).toContain('data-item-art="stone"');
});

it('shows shared bot art and the stored AP value in the stock overview', () => {
  const { item, recipe } = BOT_BUILDS.find(build => build.recipe.id === 'assemble-bot-f5-g5')!;
  const html = renderToStaticMarkup(<InventoryPanel inventory={{ [item]: 2 }} onClose={() => {}} />);
  expect(html).toContain('data-item-art="suppression-bot"');
  expect(html).toContain(recipe.name);
});
