import { SEVEN_CORES } from '../content/endgame';
import { getResearchCostsForState, RESEARCH_PROJECTS } from '../content/research';
import type { GameState, ResearchProject } from '../domain/types';
import { researchSection } from './researchPresentation';
import { buildResearchTree } from './researchTree';

const researchDepth = new Map(buildResearchTree().nodes.map(({ project, depth }) => [project.id, depth]));
const discoveryTier: Record<string, number> = {
  splitter: 1, merger: 2, suppressionBot: 2, lakeTools: 3, mithrilTools: 4,
  mineralRecovery: 6, sortingTools: 6, cornerComponents: 7, finalCoreProduction: 7,
};
const efficiencyUnlocks = new Set(['connectorMirroring', 'efficientIntermediates', 'efficientHigherIntermediates']);

export function researchCatalog(game: GameState) {
  const ranked = RESEARCH_PROJECTS.map(project => {
    const section = researchSection(project, game);
    const costs = getResearchCostsForState(project, game.research);
    const tier = discoveryTier[project.id] ?? SEVEN_CORES.reduce((highest, core, index) =>
      (costs[core] ?? 0) > 0 ? index + 1 : highest, 0);
    const isUpgrade = project.category === 'Efficiency' && !efficiencyUnlocks.has(project.id);
    const availableOrder = project.repeatable ? 2 : isUpgrade ? 1 : 0;
    return { project, section, tier, availableOrder };
  });
  const active = ranked.find(({ section }) => section === 'active')?.project;
  const completed: ResearchProject[] = [];
  const projects: ResearchProject[] = [];
  const orderByComplexity = (a: typeof ranked[number], b: typeof ranked[number]) =>
    a.tier - b.tier || (researchDepth.get(a.project.id) ?? 0) - (researchDepth.get(b.project.id) ?? 0);
  const isLocked = (entry: typeof ranked[number]) => entry.section === 'future';

  for (const entry of ranked.sort((a, b) => {
    const accessOrder = Number(isLocked(a)) - Number(isLocked(b));
    if (accessOrder) return accessOrder;
    if (!isLocked(a) && a.availableOrder !== b.availableOrder) return a.availableOrder - b.availableOrder;
    return orderByComplexity(a, b);
  })) {
    if (entry.section === 'completed') completed.push(entry.project);
    else if (entry.section !== 'active') projects.push(entry.project);
  }
  return { active, projects, completed };
}
