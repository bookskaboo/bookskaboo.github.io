import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MACHINE_EFFICIENCY } from '../../src/content/machineEfficiency';
import { getResearchProject, RESEARCH_PROJECTS } from '../../src/content/research';
import { BOT_UPGRADES, installBotUpgradeProposal, previewState } from './model';
import { nodeUpgradeFamily, statusResearchList } from './researchList';
import { ResearchListRow } from './ResearchListRow';

installBotUpgradeProposal();

describe('Upgrades research list', () => {
  it('keeps Extra Map Point first independently of the two exclusive views and search', () => {
    const game = previewState(1);
    for (const view of ['nodes', 'upgrades'] as const) {
      expect(statusResearchList(game, view, 'no matching project').mapProject?.id).toBe('mapNode');
      expect(statusResearchList(game, view).projects.some(project => project.id === 'mapNode')).toBe(false);
    }
    const nodes = statusResearchList(game, 'nodes').projects;
    const upgrades = statusResearchList(game, 'upgrades').projects;
    expect(nodes.every(project => !nodeUpgradeFamily(project.id))).toBe(true);
    expect(upgrades.every(project => nodeUpgradeFamily(project.id))).toBe(true);
    expect(nodes.some(project => project.id === 'fluidRouting')).toBe(true);
    expect(upgrades.length).toBeGreaterThan(0);
    for (const project of [...nodes, ...upgrades]) expect(BOT_UPGRADES.some(upgrade => upgrade.id === project.id)).toBe(false);
  });

  it('shows only the lowest eligible rank per family, advances after completion and keeps active ranks', () => {
    const game = previewState(0);
    game.research.completed = RESEARCH_PROJECTS.filter(project => !nodeUpgradeFamily(project.id) && !project.repeatable).map(project => project.id);
    const first = statusResearchList(game, 'upgrades').projects;
    expect(first).toHaveLength(MACHINE_EFFICIENCY.length);
    for (const family of MACHINE_EFFICIENCY) expect(first.some(project => project.id === `${family.family}${family.start}`)).toBe(true);
    game.research.completed.push('extractor2');
    game.research.selected = 'smelter2';
    const next = statusResearchList(game, 'upgrades', '', true).projects;
    expect(next.some(project => project.id === 'extractor2')).toBe(false);
    expect(next.some(project => project.id === 'extractor3')).toBe(true);
    expect(next.filter(project => nodeUpgradeFamily(project.id) === 'smelter').map(project => project.id)).toEqual(['smelter2']);
    expect(new Set(next.map(project => nodeUpgradeFamily(project.id))).size).toBe(next.length);
    expect(statusResearchList(game, 'upgrades', getResearchProject('extractor3')!.name).projects.map(project => project.id)).toEqual(['extractor3']);
    expect(statusResearchList(game, 'upgrades', getResearchProject('extractor4')!.name).projects).toEqual([]);
  });

  it('hides locked and completed upgrade ranks while preserving the completed-project option for nodes', () => {
    const game = previewState(0);
    expect(statusResearchList(game, 'upgrades').projects).toEqual([]);
    game.research.completed.push('kiln');
    expect(statusResearchList(game, 'nodes').projects.some(project => project.id === 'kiln')).toBe(false);
    expect(statusResearchList(game, 'nodes', '', true).projects.some(project => project.id === 'kiln')).toBe(true);
  });

  it('renders the exact bill with quantity before each Core name, including saved map quotes', () => {
    const game = previewState(1);
    game.research.mapNodeQuote = { completion: 0, costs: { 'simple-core': 9, 'basic-core': 11 } };
    const html = renderToStaticMarkup(createElement(ResearchListRow, {
      project: getResearchProject('mapNode')!, game, onInspect() {}, onOpenRecipe() {},
    }));
    expect(html).toContain('9 Simple Cores; view recipe');
    expect(html).toContain('11 Basic Cores; view recipe');
    expect(html).toMatch(/status-cost-number">9<\/span><i><\/i><span>Simple<\/span>/);
    expect(html).toContain('data-project-row="mapNode"');
    const free = renderToStaticMarkup(createElement(ResearchListRow, {
      project: getResearchProject('kiln')!, game, onInspect() {}, onOpenRecipe() {},
    }));
    expect(free).toContain('Extract 1 Wood with an Extractor');
    expect(free).toContain('Kiln unlock requirement');
    expect(free).not.toContain('0</span> Cores');
  });

  it('shows discovery actions and prerequisite names instead of zero-Core prices', () => {
    const game = previewState(0);
    const cases = [
      ['joint', 'Connect two nodes'], ['smelter', 'Extract 1 metal with an Extractor'],
      ['researchCenter', 'Unlock the Refiner'],
      ['splitter', 'Produce 1 Simple Core'], ['merger', 'Produce 1 Simple Core'],
      ['lakeTools', 'Visit a map with a Lake'],
    ];
    for (const [id, requirement] of cases) {
      const html = renderToStaticMarkup(createElement(ResearchListRow, {
        project: getResearchProject(id)!, game, onInspect() {}, onOpenRecipe() {},
      }));
      expect(html).toContain(requirement);
      expect(html).not.toContain('0</span> Cores');
    }
    const html = renderToStaticMarkup(createElement(ResearchListRow, {
      project: { ...getResearchProject('kiln')!, trigger: undefined, prerequisite: 'refiner', prerequisites: ['assembler', 'refiner'] },
      game, onInspect() {}, onOpenRecipe() {},
    }));
    expect(html).toContain('Complete Refiner and Assembler');
  });
});
