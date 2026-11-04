import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { getNodeModule } from '../content/nodeModules';
import { getEffectiveNodeInputFamilies } from '../content/nodes';
import { RESEARCH_PROJECTS } from '../content/research';
import { tutorialRecipeChoice } from '../tutorials/tutorialChoices';
import type { MachineNode, NodeKind } from '../domain/types';

function setup(kind: NodeKind) {
  const state = createInitialState(82);
  state.research.unlocked.push('road', 'fluidRouting');
  state.research.completed = RESEARCH_PROJECTS.map(project => project.id);
  state.sectors[state.activeSectorId].nodes = [];
  const engine = new GameEngine(state, { autosave: false });
  const source = engine.placeNode('woodenChest', 400, 500)!;
  const machine = engine.placeNode(kind, 1000, 500)!;
  const target = engine.placeNode(kind === 'hydroProcessor' ? 'fluidStorage' : 'woodenChest', 1600, 500)!;
  const node = engine.getSector().nodes.find(node => node.id === machine)!;
  node.constructionMs = 0;
  return { engine, source, machine, target, node };
}

describe('choosing a recipe before connecting production nodes', () => {
  it.each<[NodeKind, string]>([
    ['smelter', 'smelt-copper'], ['refiner', 'copper-gear'], ['assembler', 'motor'],
    ['hydroProcessor', 'coolant'], ['advancedAssembler', 'motor'], ['separationFurnace', 'refined-mithril'],
  ])('blocks both directions on an unconfigured %s and allows them once configured', (kind, recipe) => {
    const { engine, source, machine, target, node } = setup(kind);
    expect(node.recipeId).toBeUndefined();
    expect(engine.connect(source, machine)).toBe(false);
    expect(engine.connectPorts(source, 0, machine, 0)).toBe(false);
    expect(engine.connect(machine, target)).toBe(false);
    expect(engine.connectPorts(machine, 0, target, 0)).toBe(false);
    expect(engine.getConnectionFailure(source, 0, machine, 0)).toEqual({
      title: 'Choose a recipe first', detail: `${node.name} needs a recipe before it can be connected. Left-click it and choose a recipe.`,
    });
    expect(engine.getConnectionFailure(machine, 0, target, 0)?.title).toBe('Choose a recipe first');
    expect(engine.getSector().connections).toEqual([]);

    expect(engine.setRecipe(machine, recipe)).toBe(true);
    expect(engine.connect(source, machine)).toBe(true);
    expect(engine.connect(machine, target)).toBe(true);
  });

  it('opens Smelter recipes through the standard configuration control and highlights Copper in Basics', () => {
    expect(getNodeModule('smelter').controls.configuration).toBe('recipe');
    expect(tutorialRecipeChoice('basic', { kind: 'smelter' } as MachineNode, [])).toBe('smelt-copper');
  });

  it('preserves the selected recipe when an existing Smelter is loaded', () => {
    const { engine, machine } = setup('smelter');
    expect(engine.setRecipe(machine, 'smelt-copper')).toBe(true);
    const loaded = new GameEngine(engine.getState(), { autosave: false });
    const node = loaded.getSector().nodes.find(node => node.id === machine)!;
    expect(node.recipeId).toBe('smelt-copper');
    expect(getEffectiveNodeInputFamilies(node, [])).toEqual(['copper', 'charcoal']);
  });
});
