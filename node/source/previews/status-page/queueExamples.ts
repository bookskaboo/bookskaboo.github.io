import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { getResearchCostsForState, getResearchProject } from '../../src/content/research';
import type { MachineNode } from '../../src/domain/types';
import { GameEngine } from '../../src/simulation/engine';
import { installBotUpgradeProposal, previewState } from './model';

/** Explicit synthetic lab for queue review; no browser save or production grant. */
export function queueLabExample() {
  installBotUpgradeProposal();
  const state = previewState(1);
  const lab: MachineNode = { id: 'queue-test-lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000,
    rotation: 0, input: { 'simple-core': 5, 'basic-core': 5 }, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [lab];
  state.paused = false;
  return new GameEngine(state, { autosave: false });
}

export function supplyQueueExample(engine: GameEngine) {
  const lab = engine.getState().sectors['5,5'].nodes.find(node => node.id === 'queue-test-lab');
  if (!lab) return;
  for (const core of CORE_RESEARCH) lab.input[core.item] = 5;
}

/** Completes only the current test project, using ordinary 100 ms engine steps. */
export function completeQueueExample(engine: GameEngine) {
  const state = engine.getState();
  const id = state.research.selected;
  const project = getResearchProject(id);
  const lab = state.sectors['5,5'].nodes.find(node => node.id === 'queue-test-lab');
  if (!project || !lab || state.paused || state.research.paused) return;
  engine.stopRealtimeClock();
  try {
    for (let step = 0; step < 10000 && state.research.selected === id; step++) {
      for (const [item, needed] of Object.entries(getResearchCostsForState(project, state.research))) {
        const core = item as keyof typeof lab.input;
        if ((state.research.contributed[core] ?? 0) < (needed ?? 0)) lab.input[core] = Math.max(lab.input[core] ?? 0, 1);
      }
      engine.tick(100);
    }
  } finally { engine.startRealtimeClock(); }
}
