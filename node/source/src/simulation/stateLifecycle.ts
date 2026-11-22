import type { GameState } from '../domain/types';
import { mergeResearchHintHistory } from '../domain/researchHintHistory';
import { migrateUpgrades } from './upgradesMigration';

/** Shared load preconditions only. Callers retain catalog, normalization and publication order. */
export function initializeStateCollections(state: GameState) {
  state.produced ??= {};
  state.extracted ??= {};
  state.hasCreatedConnection ??= false;
  state.research.completed ??= [];
  state.research.repeatableCompletions ??= {};
  state.research.projectContributions ??= {};
  migrateUpgrades(state);
  state.inFlightTransfers ??= [];
}

/** Carry earned knowledge into a command snapshot; developer reveal has its own rewind policy. */
export function retainUndoKnowledge(previous: GameState, current: GameState, options: { restoringMapReveal: boolean }) {
  if (current.devTutorialPromptsSuppressed) previous.devTutorialPromptsSuppressed = true;
  if (previous.researchHintHistory || current.researchHintHistory) previous.researchHintHistory = mergeResearchHintHistory(previous.researchHintHistory, current.researchHintHistory);
  if (!options.restoringMapReveal) previous.encounters = [...new Set([...(previous.encounters ?? []), ...(current.encounters ?? [])])];
  previous.tutorialPromptsSeen = [...new Set([...(previous.tutorialPromptsSeen ?? []), ...(current.tutorialPromptsSeen ?? [])])];
  previous.resourceDepletionLog = current.resourceDepletionLog;
  for (const [id, sector] of Object.entries(current.sectors)) {
    const previousSector = previous.sectors[id];
    if (!previousSector) continue;
    if (sector.visited && !options.restoringMapReveal) previousSector.visited = true;
    previousSector.resourceDepletionPending = sector.resourceDepletionPending;
  }
}
