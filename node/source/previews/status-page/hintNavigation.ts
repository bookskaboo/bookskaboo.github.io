export { hintDestination, destinationDescription, type HintDestination } from '../../src/ui/upgrades/hintNavigation';
import { GameEngine } from '../../src/simulation/engine';
import { createTutorialState, type TutorialKind } from '../../src/tutorials/tutorialRuntime';
/** Author practice stays separate from every snapshot and campaign. */
export function hintTutorialPractice(kind: TutorialKind) {
  return new GameEngine(createTutorialState(kind), { autosave: false });
}
