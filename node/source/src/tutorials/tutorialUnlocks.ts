import type { GameState } from '../domain/types';
import type { TutorialKind } from './tutorialRuntime';

export type ProgressiveTutorialKind = 'expansion' | 'monster-camps';
export const TUTORIAL_ORDER: readonly TutorialKind[] = ['basic', 'logistics', 'control-groups', 'expansion', 'monster-camps'];

export function isTutorialUnlocked(kind: TutorialKind, game: GameState) {
  if (kind === 'expansion') return game.research.completed.includes('exploration');
  if (kind === 'monster-camps') return Boolean(game.encounters?.includes('monster-camp') ||
    Object.values(game.sectors).some(sector => sector.unlocked && sector.visited && sector.nodes.some(node => node.kind === 'monster-camp')));
  return true;
}

export function availableTutorials(game: GameState) {
  return TUTORIAL_ORDER.filter(kind => isTutorialUnlocked(kind, game));
}

export function nextTutorialInvitation(game: GameState): ProgressiveTutorialKind | undefined {
  if (automaticTutorialPromptsSuppressed(game)) return;
  return (['expansion', 'monster-camps'] as const).find(kind =>
    isTutorialUnlocked(kind, game) && !game.tutorialPromptsSeen?.includes(kind),
  );
}

/** Legacy dev grants/sources also identify debug factories without marking lessons seen. */
export function automaticTutorialPromptsSuppressed(game: GameState) {
  return game.devTutorialPromptsSuppressed === true || game.devResearchUnlocked === true || game.devMapSurveysRevealed === true
    || Object.values(game.sectors).some(sector => sector.nodes.some(node => node.kind === 'devSource'));
}
