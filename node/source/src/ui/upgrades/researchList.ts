import { MACHINE_EFFICIENCY } from '../../content/machineEfficiency';
import { getResearchProject, RESEARCH_PROJECTS } from '../../content/research';
import type { GameState } from '../../domain/types';
import { researchCatalog } from '../researchCatalog';
import { researchSection, searchResearch } from '../researchPresentation';
import { BOT_UPGRADES } from '../../content/botUpgrades';

export type ResearchListFilter = 'nodes' | 'upgrades';

export function nodeUpgradeFamily(id: string) {
  return MACHINE_EFFICIENCY.find(({ family }) => id.startsWith(family) && /^\d+$/.test(id.slice(family.length)))?.family;
}

/** Select next eligible ranks before searching, so a query cannot expose later ranks. */
export function statusResearchList(game: GameState, filter: ResearchListFilter, query = '', showCompleted = false) {
  const catalog = researchCatalog(game);
  const botIds = new Set(BOT_UPGRADES.map(upgrade => upgrade.id));
  const nextUpgrades = new Map<string, string>();
  for (const { family } of MACHINE_EFFICIENCY) {
    const next = RESEARCH_PROJECTS.filter(project => nodeUpgradeFamily(project.id) === family
      && ['available', 'active'].includes(researchSection(project, game)))
      .sort((a, b) => Number(a.id.slice(family.length)) - Number(b.id.slice(family.length)))[0];
    if (next) nextUpgrades.set(family, next.id);
  }
  const matches = query.trim() ? new Set(searchResearch(game, query).map(project => project.id)) : undefined;
  const projects = [...(catalog.active ? [catalog.active] : []), ...catalog.projects, ...(showCompleted ? catalog.completed : [])]
    .filter(project => {
      if (botIds.has(project.id) || project.id === 'mapNode') return false;
      const family = nodeUpgradeFamily(project.id);
      return (filter === 'upgrades' ? family && nextUpgrades.get(family) === project.id : !family)
        && (!matches || matches.has(project.id));
    });
  return { active: catalog.active, mapProject: getResearchProject('mapNode'), projects };
}
