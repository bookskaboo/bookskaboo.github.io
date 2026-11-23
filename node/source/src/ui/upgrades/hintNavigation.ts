import { getResearchProject } from '../../content/research';
import { BOT_UPGRADES } from '../../content/botUpgrades';
import type { GameState } from '../../domain/types';
import { researchCardDetails } from '../../ui/researchPresentation';
import type { MilestoneAction } from '../../ui/researchMilestones';
import { eligibleStatusHints } from './statusHints';
import { TUTORIAL_NAMES, type TutorialKind } from '../../tutorials/tutorialRuntime';
import { isTutorialUnlocked } from '../../tutorials/tutorialUnlocks';

export type HintDestination = Extract<MilestoneAction, { kind: 'research' }> | { kind: 'tutorial'; id: TutorialKind };
const TUTORIAL_HINTS: Record<string, TutorialKind> = {
  'Your assignment': 'basic', 'A promising Forest': 'basic', 'Copper prospects': 'basic', Charcoal: 'basic',
  'First Plate': 'basic', 'Research Center': 'basic', 'Simple Core': 'basic',
  'A useful detour': 'expansion', 'The factory is thirsty': 'expansion', 'The neighbours': 'expansion',
  'A metallic glint': 'expansion', 'The four corners': 'expansion', 'Some rocks have opinions': 'expansion',
  'Dwarven Mythril': 'monster-camps',
};

/** Resolve the live eligible clue, never an arbitrary saved title or hidden future action. */
export function hintDestination(game: GameState, title: string): HintDestination | undefined {
  const hint = eligibleStatusHints(game).find(candidate => candidate.title === title);
  const action = hint?.action;
  if (action?.kind === 'research') {
    const project = getResearchProject(action.id);
    return project && researchCardDetails(project, game).selectable ? action : undefined;
  }
  const tutorial = TUTORIAL_HINTS[title];
  if (hint && tutorial && isTutorialUnlocked(tutorial, game)) return { kind: 'tutorial', id: tutorial };
}

export function destinationDescription(destination: HintDestination) {
  const bot = destination.kind === 'research' && BOT_UPGRADES.find(upgrade => upgrade.id === destination.id);
  return destination.kind === 'research' ? `Show ${bot ? bot.label : getResearchProject(destination.id)?.name ?? 'project'} in Upgrades`
    : `Open ${TUTORIAL_NAMES[destination.id]} tutorial`;
}

