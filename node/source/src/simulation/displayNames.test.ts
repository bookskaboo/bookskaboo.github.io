import { describe, expect, it } from 'vitest';
import { GameEngine, createInitialState } from './engine';
import { tutorialNode } from '../tutorials/tutorialState';
import { ITEM_NAMES } from '../content/items';
import { RECIPES } from '../content/recipes';
import { RESEARCH_FILTER_OPTIONS } from '../ui/researchUiConfig';

describe('shorter node names in existing factories', () => {
  it('updates old Core text on load while preserving inventory, recipes and research contributions', () => {
    const state = createInitialState(86);
    state.sectors['5,5'].name = 'Command Core outpost';
    state.sectors['5,5'].nodes = [tutorialNode('advancedAssembler', 'saved', 1000, 1000, { name: 'Command Core line', recipeId: 'command-core', output: { 'command-core': 3 } })];
    state.research.projectContributions = { efficientIntermediates: { 'command-core': 12 } };
    state.factoryTemplates = [{ name: 'Command Cores', nodes: [structuredClone(state.sectors['5,5'].nodes[0])], connections: [] }];
    state.events.push({ id: 'old-message', type: 'ItemProduced', message: 'Command Core produced; Command Bot ready.', at: 0 });
    const engine = new GameEngine(state, { autosave: false });
    const saved = engine.getSector().nodes[0];
    expect(saved).toMatchObject({ id: 'saved', name: 'Complex Core line', recipeId: 'command-core', output: { 'command-core': 3 } });
    expect(engine.getSector().name).toBe('Complex Core outpost');
    expect(engine.getState().factoryTemplates![0].name).toBe('Complex Cores');
    expect(engine.getState().factoryTemplates![0].nodes[0].name).toBe('Complex Core line');
    expect(engine.getState().research.projectContributions?.efficientIntermediates).toEqual({ 'command-core': 12 });
    expect(engine.getState().events.find(event => event.id === 'old-message')?.message).toBe('Complex Core produced; Command Bot ready.');
    expect(ITEM_NAMES['command-core']).toBe('Complex Core');
    expect(RECIPES['command-core'].name).toBe('Complex Core');
    expect(RESEARCH_FILTER_OPTIONS.find(option => option.id === 'command-core')?.label).toBe('Complex');
    expect(new GameEngine(engine.getState(), { autosave: false }).getSector().nodes[0]).toEqual(saved);
  });
  it('updates former generated titles in factories and templates without changing IDs or recipes', () => {
    const state = createInitialState(84);
    const node = tutorialNode('hydroProcessor', 'old-machine', 1000, 1000, { name: 'Hydro Processor', recipeId: 'conductive-slurry' });
    state.sectors[state.activeSectorId].nodes = [node];
    state.factoryTemplates = [{ name: 'Saved factory', nodes: [structuredClone(node)], connections: [] }];
    const engine = new GameEngine(state, { autosave: false });
    const expected = { id: 'old-machine', kind: 'hydroProcessor', recipeId: 'conductive-slurry', name: 'Hydro Plant' };
    expect(engine.getSector().nodes[0]).toMatchObject(expected);
    expect(engine.getState().factoryTemplates![0].nodes[0]).toMatchObject(expected);
  });

  it('keeps custom node titles', () => {
    const state = createInitialState(85);
    state.sectors[state.activeSectorId].nodes = [tutorialNode('advancedAssembler', 'custom-machine', 1000, 1000, { name: 'My machine' })];
    expect(new GameEngine(state, { autosave: false }).getSector().nodes[0].name).toBe('My machine');
  });
});
