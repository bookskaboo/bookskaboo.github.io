import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { BOT_UPGRADES } from '../../src/content/botUpgrades';
import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { getResearchProject, RESEARCH_PROJECTS, refreshResearchLookup } from '../../src/content/research';
import { researchCardDetails } from '../../src/ui/researchPresentation';
import { completeQueueExample, supplyQueueExample } from './queueExamples';
import { restoreStatusFactory } from './savedProgress';
import { ResearchListRow } from './ResearchListRow';
import { MAP_RESEARCH_IDS, MAP_SURVEYS, defaultSurveyPrices, installMapSurveyProposal, isMapSurvey, mapStudyResearchList, mapUpgradeExample, syncCombinedExploration } from './mapUpgrades';

afterEach(() => {
  for (let i = RESEARCH_PROJECTS.length - 1; i >= 0; i--) if (isMapSurvey(RESEARCH_PROJECTS[i].id)) RESEARCH_PROJECTS.splice(i, 1);
  refreshResearchLookup();
});

describe('author-only Map upgrades research', () => {
  it('requires the six named character upgrades and never grants surveys automatically', () => {
    for (const survey of MAP_SURVEYS) {
      const before = mapUpgradeExample(survey.tier - 1);
      const project = getResearchProject(survey.id)!;
      expect(project.costs).toEqual(Object.fromEntries(CORE_RESEARCH.slice(0, survey.tier).map(core => [core.item, 5])));
      expect(project.prerequisite).toBe(BOT_UPGRADES[survey.tier - 1].id);
      expect(researchCardDetails(project, before.getState()).selectable).toBe(false);
      expect(before.queueResearch(survey.id)).toBe('unavailable');
      const after = mapUpgradeExample(survey.tier);
      expect(after.getState().research.completed).not.toContain(survey.id);
      expect(researchCardDetails(project, after.getState()).selectable).toBe(true);
      expect(after.queueResearch(survey.id)).toBe('added');
    }
  });

  it('uses real lab payments, retains partial payment on snapshot reload, and hides completed surveys by default', () => {
    const engine = mapUpgradeExample(3);
    expect(engine.queueResearch('surveyLakes')).toBe('added');
    expect(engine.getState().research.completed).not.toContain('surveyLakes');
    const lab = engine.getState().sectors['5,5'].nodes.find(node => node.id === 'queue-test-lab')!;
    lab.input['automata-core'] = 5;
    for (let step = 0; step < 50; step++) engine.tick(100);
    expect(engine.getState().research.contributed).toEqual({});
    expect(lab.input['automata-core']).toBe(5);
    supplyQueueExample(engine);
    for (let step = 0; step < 50; step++) engine.tick(100);
    expect(engine.getState().research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1, 'automata-core': 1 });
    const loaded = restoreStatusFactory(JSON.parse(JSON.stringify(engine.getState())));
    expect(loaded?.research.contributed).toEqual({ 'simple-core': 1, 'basic-core': 1, 'automata-core': 1 });
    completeQueueExample(engine);
    expect(engine.getState().research.completed).toContain('surveyLakes');
    expect(mapStudyResearchList(engine.getState(), 'map').projects.map(p => p.id)).not.toContain('surveyLakes');
    expect(mapStudyResearchList(engine.getState(), 'map', '', true).projects.map(p => p.id)).toContain('surveyLakes');
    expect(engine.getState().research.queue).toEqual([]);
  });

  it('moves map research exclusively into Map upgrades and searches outcomes and prerequisites', () => {
    const game = mapUpgradeExample(7).getState();
    const map = mapStudyResearchList(game, 'map', '', true);
    expect(map.mapProject?.id).toBe('mapNode');
    expect(new Set(map.projects.map(p => p.id))).toEqual(new Set([...MAP_RESEARCH_IDS].filter(id => !['mapNode', 'road'].includes(id))));
    expect(map.projects.map(p => p.id)).not.toContain('mapNode');
    for (const view of ['nodes', 'upgrades'] as const) {
      const list = mapStudyResearchList(game, view, '', true);
      expect(list.mapProject).toBeUndefined();
      expect(list.projects.some(p => MAP_RESEARCH_IDS.has(p.id))).toBe(false);
    }
    expect(new Set(mapStudyResearchList(game, 'map', 'river').projects.map(p => p.id))).toEqual(new Set(['riverBridges', 'surveyBorderObstructions']));
    expect(mapStudyResearchList(game, 'map', 'Hydro upgrade').projects.map(p => p.id)).toContain('surveyDwarvenSettlements');
    expect(mapStudyResearchList(game, 'nodes', '', true).projects.some(p => p.id === 'trucks')).toBe(true);
  });

  it('applies provisional price edits without duplicating projects or completing them', () => {
    const prices = { ...defaultSurveyPrices(), surveyLakes: 2 };
    const engine = mapUpgradeExample(3, prices);
    installMapSurveyProposal(prices);
    expect(RESEARCH_PROJECTS.filter(p => isMapSurvey(p.id))).toHaveLength(6);
    expect(engine.queueResearch('surveyLakes')).toBe('added');
    completeQueueExample(engine);
    expect(engine.getState().research.completed).toContain('surveyLakes');
    expect(getResearchProject('surveyLakes')!.costs).toEqual({ 'simple-core': 2, 'basic-core': 2, 'automata-core': 2 });
    expect(() => installMapSurveyProposal({ ...prices, surveyLakes: 0 })).toThrow();
  });

  it('uses compact shared rows with exact costs and tooltip requirements instead of extra body copy', () => {
    const game = mapUpgradeExample(3).getState();
    const html = renderToStaticMarkup(createElement(ResearchListRow, {
      project: getResearchProject('surveyDwarvenSettlements')!, game,
      onInspect() {}, onQueue() {}, onOpenRecipe() {},
    }));
    expect(html).toContain('including unexplored maps');
    expect(html).toContain('Requires Hydro upgrade');
    expect(html).toContain('5 Hydro Cores; view recipe');
    expect(html).not.toContain('<p>');
    expect(html).not.toContain('map-survey-copy');
  });

  it('combines Exploration and Road under Exploration, followed by the Goblin survey', () => {
    const engine = mapUpgradeExample(3);
    const list = mapStudyResearchList(engine.getState(), 'map');
    expect(list.projects.slice(0, 2).map(p => p.id)).toEqual(['exploration', 'surveyGoblinCamps']);
    expect(getResearchProject('exploration')!.name).toBe('Exploration');
    expect(getResearchProject('exploration')!.costs).toEqual({ 'simple-core': 5, 'basic-core': 5 });
    expect(list.projects.some(p => p.id === 'road')).toBe(false);
    expect(engine.queueResearch('exploration')).toBe('added');
    completeQueueExample(engine);
    syncCombinedExploration(engine.getState());
    expect(engine.getState().research.completed).toEqual(expect.arrayContaining(['exploration', 'road']));
    expect(engine.getState().research.unlocked).toContain('road');
    expect(engine.getState().research.mapPoints).toBe(1);
    expect(engine.queueResearch('mapNode')).toBe('added');
    completeQueueExample(engine);
    expect(engine.getState().research.mapPoints).toBe(2);
  });
});
