import { describe, expect, it } from 'vitest';
import { RESEARCH_PROJECTS } from '../content/research';
import { createInitialState } from '../simulation/engine';
import { researchSection, searchResearch } from './researchPresentation';
import { researchCatalog } from './researchCatalog';

const project = (id: string) => RESEARCH_PROJECTS.find(p => p.id === id)!;
describe('research browsing', () => {
  it('starts with achievable milestones while preserving every long-term project', () => {
    const state = createInitialState(1);
    const { projects } = researchCatalog(state);
    expect(projects.slice(0, 3).map(p => p.id)).toEqual(['joint', 'kiln', 'smelter']);
    expect(researchSection(project('lakeTools'), state)).toBe('future');
    expect(researchSection(project('assembler'), state)).toBe('future');
    expect(researchSection(project('mapNode'), state)).toBe('future');
    const ids = projects.map(p => p.id);
    expect(ids).toContain('victory');
    expect(ids).not.toContain('endgameTheory');
    expect(ids.length).toBe(RESEARCH_PROJECTS.length);
    expect(new Set(ids).size).toBe(RESEARCH_PROJECTS.length);
  });
  it('puts capabilities before efficiency upgrades when Core production is unlocked', () => {
    const state = createInitialState(1);
    state.research.completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter'];
    const catalog = researchCatalog(state);
    expect(catalog.projects[0].id).toBe('assembler');
    expect(catalog.completed.map(p => p.id)).toContain('joint');
    expect(researchSection(project('exploration'), state)).toBe('future');
    state.research.completed.push('assembler');
    expect(researchSection(project('exploration'), state)).toBe('available');
  });

  it('puts Extra Map Point first when available and keeps other cards ordered by access and complexity', () => {
    const state = createInitialState(1);
    state.research.completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'assembler'];
    expect(researchCatalog(state).projects[0].id).not.toBe('mapNode');
    state.research.completed.push('exploration');
    state.research.selected = 'road';
    const { active, projects } = researchCatalog(state);
    expect(active?.id).toBe('road');
    const firstLocked = projects.findIndex(p => researchSection(p, state) === 'future');
    const reachable = projects.slice(0, firstLocked).map(p => p.id);
    const locked = projects.slice(firstLocked).map(p => p.id);
    expect(reachable).toContain('lakeTools');
    expect(reachable.indexOf('automataCore')).toBeLessThan(reachable.indexOf('extractor1'));
    expect(reachable[0]).toBe('mapNode');
    expect(projects[0].name).toBe('Extra Map Point');
    expect(projects.slice(firstLocked).every(p => researchSection(p, state) === 'future')).toBe(true);
    expect(locked.indexOf('hydraulicAssembly')).toBeLessThan(locked.indexOf('precisionControl'));
    expect(locked.indexOf('finalCoreProduction')).toBeLessThan(locked.indexOf('victory'));
    expect(projects.some(p => p.id === active?.id)).toBe(false);
    state.research.selected = 'mapNode';
    expect(researchCatalog(state).active?.id).toBe('mapNode');
    state.research.mapPoints = 120;
    expect(researchCatalog(state).completed.map(p => p.id)).toContain('mapNode');
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
    expect(searchResearch(state, project('victory').name)[0].id).toBe('victory');
    expect(searchResearch(state, 'Endgame Theory')).toEqual([]);
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
