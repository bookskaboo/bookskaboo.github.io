import type { HintVariant } from './hintNavigationCatalog';
import { HINT_TITLES, PRODUCTION_HINT_TITLES } from '../../src/content/hintTitles';
export function hintPreviewTitle(id: string, variant: HintVariant = 'default') {
  const title = variant === 'production' ? PRODUCTION_HINT_TITLES[id] ?? HINT_TITLES[id] : HINT_TITLES[id];
  if (!title) throw new Error(`Missing preview hint title: ${id}`);
  return title;
}
