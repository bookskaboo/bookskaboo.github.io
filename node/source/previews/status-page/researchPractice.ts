import type { MachineNode } from '../../src/domain/types';
import { GameEngine } from '../../src/simulation/engine';
import { installBotUpgradeProposal, previewState } from './model';

/** The research segment of Basics after its production/delivery steps, with explicit test stock. */
export function researchPracticeExample() {
  installBotUpgradeProposal();
  const state = previewState(0);
  state.isTraining = true;
  state.paused = false;
  state.research.completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter'];
  state.research.unlocked = ['extractor', ...state.research.completed];
  state.produced = { 'simple-core': 1 };
  const lab: MachineNode = { id: 'queue-test-lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000,
    rotation: 0, input: { 'simple-core': 5 }, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [lab];
  state.sectors['5,5'].connections = [];
  return new GameEngine(state, { autosave: false });
}
