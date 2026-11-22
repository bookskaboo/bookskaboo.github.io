import type { GameState, ResearchProject } from '../domain/types';
import type { ResearchHintCopy } from '../domain/researchHintHistory';
import { usesNewWorldRules } from '../simulation/worldRules';

const legacyMythril = {
  pending: 'Produce Mythril Tribute at a Dwarven settlement',
  complete: 'First Dwarven Mythril Tribute produced',
  hint: { title: 'Dwarven Tribute', detail: 'The factory’s future depends on their cooperation.' },
};
const guardedMythril = {
  pending: 'Extract Mythril from a Dwarven deposit while its settlement is fully suppressed.',
  complete: 'First Dwarven Mythril extracted',
  hint: { title: 'Dwarven Mythril', detail: 'Keep the Dwarven settlement fully suppressed, then connect an Extractor to its Mythril deposit. Cooperation now comes with a cable.' },
};
type World = Pick<GameState, 'worldRulesVersion'>;
export const mythrilGuidance = (world: World) => usesNewWorldRules(world) ? guardedMythril : legacyMythril;

/** Present the saved world's mechanic without mutating the catalog or custom mod copy. */
export function researchTriggerCopy(project: ResearchProject, world: World) {
  const trigger = project.trigger;
  if (!trigger || project.id !== 'mithrilTools' || trigger.id !== 'dwarven-mythril-produced' || !usesNewWorldRules(world)) return trigger;
  return { ...trigger,
    pending: trigger.pending === legacyMythril.pending ? guardedMythril.pending : trigger.pending,
    complete: trigger.complete === legacyMythril.complete ? guardedMythril.complete : trigger.complete,
  };
}

/** Correct only the known obsolete copy, retaining earned clues and custom text. */
export function reconcileMythrilHint(hint: ResearchHintCopy, world: World): ResearchHintCopy {
  return usesNewWorldRules(world) && hint.title === legacyMythril.hint.title && hint.detail === legacyMythril.hint.detail
    ? { ...guardedMythril.hint } : hint;
}
