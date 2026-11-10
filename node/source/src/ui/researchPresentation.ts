import { atResearchCap, FINAL_CORE_PRODUCTION } from '../content/endgame';
import { getResearchProject, getResearchCostsForState, isResearchAvailable, remainingMapNodePurchases, RESEARCH_PROJECTS } from '../content/research';
import { ITEM_NAMES } from '../content/items';
import type { GameState, ItemId, ResearchProject } from '../domain/types';
import type { RequirementFilter } from './researchUiConfig';

export type ResearchSection = 'active' | 'milestones' | 'available' | 'future' | 'completed';
export const researchPrerequisiteName = (id: string) =>
  id === FINAL_CORE_PRODUCTION ? 'first Final Core' : getResearchProject(id)?.name ?? id;

const CORE_ACCESS: Partial<Record<ItemId, string>> = { 'simple-core': 'refiner', 'basic-core': 'assembler', 'automata-core': 'automataCore', 'hydro-core': 'hydraulicAssembly', 'shiny-core': 'oreSeparation', 'command-core': 'precisionControl', 'final-core': FINAL_CORE_PRODUCTION };
const milestoneAccess: Partial<Record<NonNullable<ResearchProject['trigger']>['id'], string>> = {
  'plate-produced': 'smelter', 'refiner-unlocked': 'refiner', 'assembler-built': 'assembler',
  'basic-core-produced': 'assembler', 'motor-produced': 'assembler', 'monster-camp': 'exploration',
  encounter: 'exploration', 'dwarven-mythril-produced': 'exploration',
  'precision-control': 'precisionControl', 'complex-core-produced': 'precisionControl',
};

export function researchDependencies(project: ResearchProject, costs = project.costs) {
  const ids = [project.prerequisite, ...(project.prerequisites ?? [])].filter((id): id is string => Boolean(id));
  if (project.trigger) {
    const access = milestoneAccess[project.trigger.id];
    if (access) ids.push(access);
  } else {
    for (const item of Object.keys(costs) as ItemId[]) {
      const access = CORE_ACCESS[item];
      if (access) ids.push(access);
    }
  }
  return [...new Set(ids)];
}

function missingResearchAccess(project: ResearchProject, game: GameState) {
  return researchDependencies(project, getResearchCostsForState(project, game.research)).filter(id => !game.research.completed.includes(id));
}

/** Keep the next independent steps visible without changing the access check. */
export function visibleResearchRequirements(project: ResearchProject, game: GameState) {
  const missing = missingResearchAccess(project, game);
  if (missing.length < 2) return missing;
  const predecessors = new Set<string>();
  function requirementsFor(id: string): string[] {
    if (id === FINAL_CORE_PRODUCTION) return ['cornerComponents'];
    const prerequisite = getResearchProject(id);
    return prerequisite ? researchDependencies(prerequisite, getResearchCostsForState(prerequisite, game.research)) : [];
  }
  function visit(id: string) {
    if (predecessors.has(id)) return;
    predecessors.add(id);
    requirementsFor(id).forEach(visit);
  }
  for (const id of missing) requirementsFor(id).forEach(visit);
  return missing.filter(id => !predecessors.has(id));
}

export function researchSection(project: ResearchProject, game: GameState): ResearchSection {
  if (atResearchCap(project, game.research) || (!project.repeatable && game.research.completed.includes(project.id)) || (project.id === 'mapNode' && remainingMapNodePurchases(game) === 0)) return 'completed';
  if (game.research.selected === project.id) return 'active';
  if (!isResearchAvailable(project, game.research.completed) || missingResearchAccess(project, game).length) return 'future';
  return project.trigger ? 'milestones' : 'available';
}

/** Search spans every progression section; project names outrank related mentions. */
export function searchResearch(game: GameState, query: string): ResearchProject[] {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return [...RESEARCH_PROJECTS];
  return RESEARCH_PROJECTS.map((project, index) => {
    const name = project.name.toLowerCase();
    const prerequisites = [project.prerequisite, ...(project.prerequisites ?? [])].filter((id): id is string => Boolean(id));
    const related = [project.category, project.description, project.unlock, project.flavorText,
      ...prerequisites, ...prerequisites.map(researchPrerequisiteName),
      project.trigger?.pending, project.trigger?.complete,
      ...Object.keys(getResearchCostsForState(project, game.research)).map(item => ITEM_NAMES[item as ItemId]),
    ].filter(Boolean).join(' ').toLowerCase();
    const rank = name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : related.includes(normalized) ? 3 : -1;
    return { project, index, rank };
  }).filter(result => result.rank >= 0).sort((a, b) => a.rank - b.rank || a.index - b.index).map(result => result.project);
}

/** Card metadata is independent of rendering and shares the browser's access rules. */
export function researchCardDetails(project: ResearchProject, game: GameState) {
  const section = researchSection(project, game);
  const active = game.research.selected === project.id;
  const complete = atResearchCap(project,game.research) || (!project.repeatable && game.research.completed.includes(project.id));
  const expansionFunded = project.id === 'mapNode' && remainingMapNodePurchases(game) === 0;
  const available = !complete && !expansionFunded && isResearchAvailable(project, game.research.completed);
  const costs = getResearchCostsForState(project, game.research);
  const milestone = Boolean(project.trigger);
  const requirement: RequirementFilter = milestone ? 'trigger' : costs['final-core'] ? 'final-core' : costs['command-core'] ? 'command-core'
    : costs['shiny-core'] ? 'shiny-core' : costs['hydro-core'] ? 'hydro-core'
    : costs['automata-core'] ? 'automata-core' : costs['basic-core'] ? 'basic-core' : 'simple-core';
  const missingAccess = visibleResearchRequirements(project, game).map(researchPrerequisiteName);
  const status = complete ? project.trigger?.complete ?? 'Complete'
    : section === 'future' ? (missingAccess.length ? `Requires ${missingAccess.join(', ')}` : 'Requires progress')
    : project.trigger ? project.trigger.pending
    : expansionFunded ? 'All maps unlocked or covered by saved Map Points'
    : active ? 'Active project'
    : project.repeatable ? `Repeatable · ${game.research.repeatableCompletions?.[project.id] ?? 0} completed`
    : 'Available research';
  const paid = active ? game.research.contributed : game.research.projectContributions?.[project.id] ?? {};
  const totalRequired = Object.values(costs).reduce<number>((sum, count) => sum + (count ?? 0), 0);
  const totalPaid = complete && !project.repeatable ? totalRequired : Object.entries(costs).reduce((sum, [item, count]) =>
    sum + Math.min(count ?? 0, paid[item as ItemId] ?? 0), 0);
  const coreNames = project.trigger ? '' : Object.keys(costs).map(item => ITEM_NAMES[item as ItemId]).join(' + ');
  const costSummary = coreNames ? `${coreNames} · ${totalPaid}/${totalRequired}` : '';
  const requirements = costSummary ? `${status}\n${costSummary}` : status;
  return {
    section, active, complete, milestone, requirement, status, totalRequired, totalPaid,
    selectable: available && section !== 'future' && !milestone && !complete,
    tooltip: [requirements, project.description || project.unlock].filter(Boolean).join('\n\n'),
    tooltipTone: complete ? '#77b5e6' : active ? '#74c9a2' : '#d5b666',
  };
}
