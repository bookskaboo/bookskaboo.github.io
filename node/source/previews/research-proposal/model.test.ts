import { describe, expect, it } from 'vitest';
import { isResearchAvailable } from '../../src/content/research';
import { MACHINE_EFFICIENCY_FAMILIES, HISTORICAL_RESEARCH as RESEARCH_PROJECTS } from './model';
import { buildResearchTree, researchAncestors } from '../../src/ui/researchTree';
import { isOptionalProject, pricePerLine, proposedResearchCatalog } from './model';

describe('research proposal', () => {
  it('keeps every required route acyclic and places every optional paid project after Automata Core', () => {
    const proposed = proposedResearchCatalog(RESEARCH_PROJECTS);
    const tree = buildResearchTree(proposed);
    for (const project of proposed.filter(isOptionalProject)) {
      expect(researchAncestors(tree, project.id).has('automataCore'), project.id).toBe(true);
      expect(isResearchAvailable(project, proposed.filter(candidate => candidate.id !== 'automataCore')
        .map(candidate => candidate.id)), project.id).toBe(false);
    }
    expect(researchAncestors(tree, 'automataCore').has('extractor3')).toBe(false);
    expect(researchAncestors(tree, 'exploration').has('automataCore')).toBe(false);
    for (const id of ['exploration', 'road']) {
      expect(proposed.find(project => project.id === id)?.costs).toEqual({ 'simple-core': 5 });
      const ancestors = researchAncestors(tree, id);
      expect(ancestors.has('refiner')).toBe(true);
      expect(ancestors.has('basicCore')).toBe(false);
      expect(ancestors.has('assembler')).toBe(false);
    }
  });

  it('retains machine access and the full researched effect with four more affordable ranks', () => {
    const proposed = proposedResearchCatalog(RESEARCH_PROJECTS);
    for (const [family] of MACHINE_EFFICIENCY_FAMILIES) {
      const ranks = proposed.filter(project => new RegExp(`^${family}[1-6]$`).test(project.id));
      expect(ranks).toHaveLength(4);
      expect(ranks.map(project => project.id)).toEqual([3, 4, 5, 6].map(rank => `${family}${rank}`));
      expect(pricePerLine(proposed, family)).toBe(340);
      expect(pricePerLine(RESEARCH_PROJECTS, family)).toBe(560);
      expect(ranks.at(-1)?.description).toBe(RESEARCH_PROJECTS.find(project => project.id === `${family}6`)?.description);
    }
    expect(proposed.find(project => project.id === 'botPlant3')?.prerequisite).toBe('suppressionBot');
    expect(proposed.find(project => project.id === 'advancedAssembler3')?.prerequisite).toBe('fabricatorTools');
  });

  it('builds a detached proposal without changing the game catalog', () => {
    const before = structuredClone(RESEARCH_PROJECTS);
    const proposed = proposedResearchCatalog(RESEARCH_PROJECTS);
    proposed[0].name = 'Prototype edit';
    expect(RESEARCH_PROJECTS).toEqual(before);
  });

  it('unlocks Splitter and Merger from the first Refiner production before Assembler or Automata access', () => {
    const proposed = proposedResearchCatalog(RESEARCH_PROJECTS);
    const tree = buildResearchTree(proposed);
    for (const id of ['splitter', 'merger']) {
      const project = proposed.find(project => project.id === id)!;
      expect(project.trigger?.id).toBe('refiner-produced');
      expect(project.trigger?.pending).toBe('Produce any item in a Refiner');
      expect(researchAncestors(tree, id).has('refiner')).toBe(true);
      expect(researchAncestors(tree, id).has('assembler')).toBe(false);
      expect(researchAncestors(tree, id).has('automataCore')).toBe(false);
    }
  });
});
