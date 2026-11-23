import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import { getResearchProject } from '../../src/content/research';
import type { GameState } from '../../src/domain/types';
import { nodeUpgradeFamily } from '../../src/ui/upgrades/researchList';
import { hintDestination, type HintDestination } from './hintNavigation';
import { HINT_EXAMPLES, hintCatalogExample, hintExampleClue, hintRecommendation, type HintVariant } from './hintNavigationCatalog';
import { MAP_RESEARCH_IDS, installMapSurveyProposal, syncCombinedExploration, type MapStudyFilter } from './mapUpgrades';

/** The user-authorized exception exposes every ordered context, never a campaign save. */
export function implementationHintSnapshot(id: string, variant: HintVariant = 'default') {
  const engine = hintCatalogExample(id, variant);
  const game = engine.getState();
  // Capture the existing Road clue before combined Exploration retires that research step.
  const clue = hintExampleClue(game, id, variant);
  installMapSurveyProposal();
  syncCombinedExploration(game);
  return { id, variant, engine, clue };
}

export function implementationHintDestination(game: GameState, id: string, title: string): HintDestination | undefined {
  // The old Road thought remains reviewable in its established position, with no second bill.
  if (id === 'road' && game.research.completed.includes('exploration')) return { kind: 'tutorial', id: 'expansion' };
  return hintDestination(game, title);
}

export function implementationHintRecommendation(game: GameState, id: string, title: string) {
  const entry = HINT_EXAMPLES.find(hint => hint.id === id)!;
  if (id === 'road') return { label: 'Offer Expansion; no separate Road research', status: 'Combined Exploration',
    why: 'Exploration now includes Roads and Carts. This retained review clue offers the existing transport lesson instead of charging for another project.',
    next: 'Retire the separate Road-research hint when adopting the combined progression. It remains in its original review position here so the change can be inspected.' };
  return hintRecommendation(entry, game, title);
}

/** Destination chooses its real category; it never queues, pays, enables or rewrites a clue. */
export function implementationResearchView(id: string): MapStudyFilter {
  return MAP_RESEARCH_IDS.has(id) ? 'map' : nodeUpgradeFamily(id) ? 'upgrades' : 'nodes';
}

export function isCharacterDestination(id: string) { return BOT_UPGRADES.some(bot => bot.id === id); }
export function implementationDestinationName(id: string) {
  return BOT_UPGRADES.find(bot => bot.id === id)?.label ?? getResearchProject(id)?.name ?? id;
}
