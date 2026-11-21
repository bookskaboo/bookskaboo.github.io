import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { getResearchProject, RESEARCH_PROJECTS } from '../../src/content/research';
import type { GameState, ResearchProject } from '../../src/domain/types';
import { createInitialState } from '../../src/simulation/engine';
import { researchCardDetails } from '../../src/ui/researchPresentation';
import type { RequirementFilter } from '../../src/ui/researchUiConfig';

export { ASSIGNMENT, STAGES, BOT_UPGRADES, botUpgradeBenefits, presentProject, nextBotUpgrade, characterStage } from '../../src/content/botUpgrades';
import { BOT_UPGRADES } from '../../src/content/botUpgrades';

export function installBotUpgradeProposal() { createInitialState(204); }

export function projectStage(project: ResearchProject, game: GameState): RequirementFilter {
  const upgrade = BOT_UPGRADES.find(upgrade => upgrade.id === project.id);
  if (upgrade) return upgrade.item;
  return researchCardDetails(project, game).requirement;
}

export function previewState(stage: number): GameState {
  const state = createInitialState(204);
  state.mapResearchMode = 'points';
  state.paused = true;
  const completed = new Set(state.research.completed);
  const visit = (id: string) => {
    if (completed.has(id)) return;
    completed.add(id);
    const project = getResearchProject(id);
    if (project?.prerequisite) visit(project.prerequisite);
    project?.prerequisites?.forEach(visit);
  };
  BOT_UPGRADES.slice(0, stage).forEach(upgrade => visit(upgrade.id));
  if (stage > 0) ['kiln', 'smelter', 'refiner', 'researchCenter'].forEach(visit);
  // Stage fixtures seed ordinary technology for inspection; it does not gate character upgrades.
  const exampleTechnology = CORE_RESEARCH[Math.min(stage + 1, CORE_RESEARCH.length - 1)]?.prerequisite;
  if (stage > 0 && exampleTechnology) visit(exampleTechnology);
  state.research.completed = [...completed].filter(id => RESEARCH_PROJECTS.some(project => project.id === id));
  state.research.unlocked = ['extractor', ...state.research.completed];
  state.produced = Object.fromEntries(CORE_RESEARCH.slice(0, stage ? Math.min(stage + 1, 7) : 0).map(core => [core.item, 1]));
  return state;
}
