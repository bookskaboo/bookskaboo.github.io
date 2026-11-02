import { describe, expect, it } from 'vitest';
import { RESEARCH_PROJECTS } from '../content/research';
import { createInitialState } from '../simulation/engine';
import { groupResearch, researchSection, searchResearch } from './researchPresentation';

const project = (id: string) => RESEARCH_PROJECTS.find(p => p.id === id)!;
describe('research browsing', () => {
  it('starts with achievable milestones while preserving every long-term project', () => {
    const state = createInitialState(1);
    const sections = groupResearch(state);
    expect(sections.milestones.map(p => p.id)).toEqual(expect.arrayContaining(['joint', 'kiln', 'smelter']));
    expect(researchSection(project('lakeTools'), state)).toBe('future');
    expect(researchSection(project('assembler'), state)).toBe('future');
    expect(sections.future.map(p => p.id)).toContain('endgameTheory');
    const ids = Object.values(sections).flat().map(p => p.id);
    expect(ids.length).toBe(RESEARCH_PROJECTS.length);
    expect(new Set(ids).size).toBe(RESEARCH_PROJECTS.length);
  });
  it('puts capabilities before efficiency upgrades when Core production is unlocked', () => {
    const state = createInitialState(1);
    state.research.completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter'];
    const sections = groupResearch(state);
    expect(sections.available[0].id).toBe('assembler');
    expect(sections.completed.map(p => p.id)).toContain('joint');
    expect(researchSection(project('exploration'), state)).toBe('future');
    state.research.completed.push('assembler');
    expect(researchSection(project('exploration'), state)).toBe('available');
  });
  it('keeps active and repeatable projects out of the completed archive', () => {
    const state = createInitialState(1);
    state.research.selected = 'assembler';
    expect(researchSection(project('assembler'), state)).toBe('active');
    state.research.completed.push('exploration', 'mapNode');
    expect(researchSection(project('mapNode'), state)).not.toBe('completed');
  });

  it('puts the exact Assembler project before upgrades and related prerequisite matches', () => {
    const state = createInitialState(1);
    const results = searchResearch(state, '  ASSEMBLER  ');
    expect(results[0].id).toBe('assembler');
    expect(results.map(p => p.id)).toContain('fabricatorTools');
    const firstRelated = results.findIndex(p => !p.name.toLowerCase().includes('assembler'));
    expect(firstRelated).toBeGreaterThan(0);
    expect(results.slice(firstRelated).every(p => !p.name.toLowerCase().includes('assembler'))).toBe(true);
    expect(results.some(p => p.id === 'kiln')).toBe(false);
  });

  it('finds completed and distant future projects without selecting research or changing progression', () => {
    const state = createInitialState(1);
    state.research.completed = ['assembler'];
    state.research.selected = 'extractor1';
    const before = structuredClone(state);
    expect(searchResearch(state, 'Assembler')[0].id).toBe('assembler');
    expect(searchResearch(state, project('endgameTheory').name)[0].id).toBe('endgameTheory');
    expect(state).toEqual(before);
  });

  it('searches prerequisite display names and Core costs as related matches', () => {
    const state = createInitialState(1);
    expect(searchResearch(state, 'Exploration').map(p => p.id)).toContain('automataCore');
    expect(searchResearch(state, 'Simple Core').map(p => p.id)).toContain('assembler');
  });

  it('returns no matches for unknown text and restores all projects for a cleared query', () => {
    const state = createInitialState(1);
    expect(searchResearch(state, 'zzzz no such project')).toEqual([]);
    expect(searchResearch(state, '[')).toEqual([]);
    expect(searchResearch(state, '   ').map(p => p.id)).toEqual(RESEARCH_PROJECTS.map(p => p.id));
    expect(searchResearch(state, 'advanced   fabrication')[0].id).toBe('fabricatorTools');
  });
});
