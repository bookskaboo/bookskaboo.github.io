import type { MachineNode } from '../../src/domain/types';
import { getResearchProject } from '../../src/content/research';
import { GameEngine } from '../../src/simulation/engine';
import { BOT_UPGRADES, installBotUpgradeProposal, previewState } from './model';

/** Explicit synthetic fixture: real Core payments at the ordinary five-second interval. */
export function upgradePaymentExample(stage: number, sets: 2 | 5) {
  installBotUpgradeProposal();
  const state = previewState(stage);
  const upgrade = BOT_UPGRADES[stage];
  if (!upgrade) return new GameEngine(state, { autosave: false });
  const done = new Set(state.research.completed);
  const allow = (id: string) => {
    if (done.has(id)) return;
    done.add(id);
    const project = getResearchProject(id);
    if (project?.prerequisite) allow(project.prerequisite);
    project?.prerequisites?.forEach(allow);
  };
  if (upgrade.prerequisite) allow(upgrade.prerequisite);
  allow(upgrade.currentCoreId);
  state.research.completed = [...done];
  state.research.unlocked = ['extractor', ...done];
  const lab: MachineNode = { id: 'upgrade-example-lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0,
    input: { ...getResearchProject(upgrade.id)!.costs }, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [lab];
  state.paused = false;
  const engine = new GameEngine(state, { autosave: false });
  engine.selectResearch(upgrade.id);
  for (let elapsed = 0; elapsed < sets * 5000; elapsed += 100) engine.tick(100);
  engine.getState().paused = true;
  return engine;
}
