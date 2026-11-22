import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { getResearchProject, RESEARCH_PROJECTS, refreshResearchLookup } from '../../src/content/research';
import type { GameState, ResearchProject } from '../../src/domain/types';
import { GameEngine } from '../../src/simulation/engine';
import { researchSection, searchResearch } from '../../src/ui/researchPresentation';
import { researchCatalog } from '../../src/ui/researchCatalog';
import { statusResearchList, type ResearchListFilter } from './researchList';
import { previewState } from './model';

/** Author-only catalog. Production never imports this module. */
export const MAP_SURVEYS = [
  { id: 'surveyGoblinCamps', name: 'Goblin camp survey', tier: 2, core: 'basic-core', outcome: 'Reveal every Goblin Camp, Village and Kingdom, including unexplored maps.', flavor: 'The neighbours have been counted. They were not consulted.' },
  { id: 'surveyLakes', name: 'Lake survey', tier: 3, core: 'automata-core', outcome: 'Reveal every Lake location, including unexplored maps.', flavor: 'A comprehensive list of places to get wet.' },
  { id: 'surveyDwarvenSettlements', name: 'Dwarven settlement survey', tier: 4, core: 'hydro-core', outcome: 'Reveal every Dwarven Camp, Village and Kingdom, including unexplored maps.', flavor: 'Potential suppliers. Actual opinions may vary.' },
  { id: 'surveyBorderObstructions', name: 'Border obstruction survey', tier: 5, core: 'shiny-core', outcome: 'Reveal every river, mountain and chasm border across the world.', flavor: 'The route has several constructive objections.' },
  { id: 'surveyLandmarks', name: 'Landmark survey', tier: 6, core: 'command-core', outcome: 'Reveal every permanent Landmark location, including unexplored maps.', flavor: 'Useful equipment. Inconveniently distributed.' },
  { id: 'surveyGolemCamps', name: 'Golem camp survey', tier: 7, core: 'final-core', outcome: 'Reveal every Golem camp and defeated Golem reserve, including unexplored maps.', flavor: 'The mineral deposits have appointed security.' },
] as const;

export type MapStudyFilter = ResearchListFilter | 'map';
export type SurveyPrices = Record<string, number>;
export const defaultSurveyPrices = (): SurveyPrices => Object.fromEntries(MAP_SURVEYS.map(survey => [survey.id, 5]));
const ids = new Set<string>(MAP_SURVEYS.map(survey => survey.id));
export const isMapSurvey = (id: string) => ids.has(id);
export const MAP_RESEARCH_IDS = new Set<string>([
  ...MAP_SURVEYS.map(survey => survey.id),
  'exploration', 'mapNode', 'road', 'riverBridges', 'mountainTunnels', 'chasmSpans',
  'areaExpansion1', 'areaExpansion2', 'roadChannels1', 'roadChannels2', 'advancedRoadChannels',
  'resourceRelocation', 'lakeRelocation', 'campRelocation', 'efficientLandfill',
]);

export function installMapSurveyProposal(prices = defaultSurveyPrices()) {
  for (const survey of MAP_SURVEYS) {
    const amount = prices[survey.id] ?? 5;
    if (!Number.isInteger(amount) || amount < 1 || amount > 50) throw new Error('Survey prices must be whole numbers from 1 to 50.');
    const project: ResearchProject = {
      id: survey.id, name: survey.name, category: 'Map upgrades',
      description: survey.outcome, unlock: survey.outcome, flavorText: survey.flavor,
      costs: Object.fromEntries(CORE_RESEARCH.slice(0, survey.tier).map(core => [core.item, amount])), prerequisite: BOT_UPGRADES[survey.tier - 1].id,
      // Each survey explicitly requires its named CHARACTER upgrade.
      coreAccessPrerequisites: false,
    };
    const existing = RESEARCH_PROJECTS.find(entry => entry.id === survey.id);
    if (existing) Object.assign(existing, project); else RESEARCH_PROJECTS.push(project);
  }
  const exploration = getResearchProject('exploration')!;
  Object.assign(exploration, {
    name: 'Exploration',
    description: 'Open the world map, gain 1 Map Point and unlock Roads and Carts for transport between maps.',
    unlock: 'Unlocks the Map, Roads and Carts, and awards 1 Map Point.',
  });
  refreshResearchLookup();
}

/** Preview-only combined project; production retains separate Exploration/Road research. */
export function syncCombinedExploration(game: GameState) {
  if (!game.research.completed.includes('exploration')) return;
  if (!game.research.completed.includes('road')) game.research.completed.push('road');
  if (!game.research.unlocked.includes('road')) game.research.unlocked.push('road');
}

export function mapStudyResearchList(game: GameState, filter: MapStudyFilter, query = '', showCompleted = false) {
  if (filter !== 'map') {
    const list = statusResearchList(game, filter, query, showCompleted);
    return { ...list, mapProject: undefined, projects: list.projects.filter(project => !MAP_RESEARCH_IDS.has(project.id)) };
  }
  const catalog = researchCatalog(game);
  const matches = query.trim() ? new Set(searchResearch(game, query).map(project => project.id)) : undefined;
  const projects = [...(catalog.active ? [catalog.active] : []), ...catalog.projects, ...(showCompleted ? catalog.completed : [])]
    .filter(project => project.id !== 'mapNode' && project.id !== 'road' && MAP_RESEARCH_IDS.has(project.id)
      && (showCompleted || researchSection(project, game) !== 'completed') && (!matches || matches.has(project.id)));
  // Keep the introductory project and first survey together before the ordinary ranked list.
  const priority = (project: ResearchProject) => project.id === 'exploration' ? 0 : project.id === 'surveyGoblinCamps' ? 1 : 2;
  projects.sort((a, b) => priority(a) - priority(b));
  return { active: catalog.active, mapProject: getResearchProject('mapNode'), projects };
}

export function mapUpgradeExample(tier: number, prices = defaultSurveyPrices()) {
  const state = previewState(tier);
  installMapSurveyProposal(prices);
  state.paused = false;
  state.research.paused = false;
  state.research.queue = [];
  state.research.selected = undefined;
  state.research.contributed = {};
  state.sectors['5,5'].nodes = [{
    id: 'queue-test-lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000,
    rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0,
  }];
  const engine = new GameEngine(state, { autosave: false });
  const synchronize = () => syncCombinedExploration(engine.getState());
  synchronize();
  engine.subscribe(synchronize);
  return engine;
}
