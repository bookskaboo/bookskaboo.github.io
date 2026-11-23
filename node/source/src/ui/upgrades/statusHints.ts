import type { GameState } from '../../domain/types';
import { normalizeResearchHintHistory, type ResearchHintCopy, type ResearchHintHistory } from '../../domain/researchHintHistory';
import { getResearchMilestones, type ResearchMilestone } from '../researchMilestones';
import { ASSIGNMENT } from '../../content/botUpgrades';
import { isRetiredResearchHint, reconcileMythrilHint, reconcileSuppressionBotHint } from '../../content/researchGuidance';

/** Acknowledgement belongs to this factory; existing opening progress also skips it. */
export function assignmentComplete(game: GameState, assignmentSeen = false) {
  return assignmentSeen || game.researchHintHistory?.assignmentAcknowledged === true || (game.extracted?.wood ?? 0) > 0 || game.research.completed.includes('kiln');
}

export function hintKey(hint: ResearchHintCopy) {
  return hint.title === 'Your assignment' ? 'assignment' : hint.title;
}

/** Preserve the selector's exact conditions, exposing every eligible candidate. */
export function eligibleStatusHints(game: GameState, assignment = ASSIGNMENT): ResearchMilestone[] {
  const eligible = getResearchMilestones(game, { allCandidates: true });
  return assignmentComplete(game) ? eligible
    : [{ title: 'Your assignment', detail: assignment, action: { kind: 'build', id: 'extractor' } }, ...eligible];
}

/** Match the selector's title identity so copy changes do not duplicate a clue. */
export function mergeUnlockedHints<T extends ResearchHintCopy>(previous: T[], eligible: T[]) {
  const entries = new Map(previous.map(hint => [hintKey(hint), hint]));
  for (const hint of eligible) entries.set(hintKey(hint), hint);
  return [...entries.values()];
}

/** Old factories seed only currently eligible clues; unreached review entries stay hidden. */
export function readStatusHintHistory(game: GameState, assignment = ASSIGNMENT): ResearchHintHistory {
  const saved = normalizeResearchHintHistory(game.researchHintHistory);
  const previous = (saved?.unlocked ?? []).filter(hint => !isRetiredResearchHint(hint)).map(hint => hint.title === 'Your assignment' ? { ...hint, detail: assignment } : reconcileSuppressionBotHint(reconcileMythrilHint(hint, game)));
  return { assignmentAcknowledged: assignmentComplete(game),
    unlocked: mergeUnlockedHints<ResearchHintCopy>(previous, eligibleStatusHints(game, assignment))
      .map(({ title, detail }) => ({ title, detail })) };
}

/** Called on engine publications, even while the modal is closed. No browser key is used. */
export function syncStatusHintHistory(game: GameState, assignment = ASSIGNMENT) {
  game.researchHintHistory = readStatusHintHistory(game, assignment);
}

export function acknowledgeStatusAssignment(game: GameState, assignment = ASSIGNMENT) {
  syncStatusHintHistory(game, assignment);
  game.researchHintHistory!.assignmentAcknowledged = true;
}

export function statusHint(game: GameState, assignment = ASSIGNMENT, assignmentSeen = false): ResearchMilestone | undefined {
  return assignmentComplete(game, assignmentSeen) ? getResearchMilestones(game)[0]
    : { title: 'Your assignment', detail: assignment, action: { kind: 'build', id: 'extractor' } };
}
