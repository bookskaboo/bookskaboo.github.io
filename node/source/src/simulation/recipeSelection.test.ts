import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { getNodeModule } from '../content/nodeModules';
import { getEffectiveNodeInputFamilies } from '../content/nodes';
import { RECIPES, RETIRED_RECIPES } from '../content/recipes';
import { BOT_BUILDS, BOT_STRENGTH, MATCHED_BOTS } from '../content/botAssembly';
import { RESEARCH_PROJECTS } from '../content/research';
import { tutorialRecipeChoice } from '../tutorials/tutorialChoices';
import type { MachineNode, NodeKind } from '../domain/types';

function setup(kind: NodeKind) {
  const state = createInitialState(82);
  state.research.unlocked.push('road', 'fluidRouting', 'suppressionBot');
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
    ['hydroProcessor', 'coolant'], ['advancedAssembler', 'efficient-motor'], ['separationFurnace', 'refined-mithril'],
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

  it('assembles bots automatically and delivers different AP values together from a Cart', () => {
    expect(BOT_BUILDS).toHaveLength(25);
    expect(MATCHED_BOTS.map(item => BOT_STRENGTH[item])).toEqual([1, 3, 8, 24, 72]);
    const { engine, machine, node, source, target } = setup('botPlant');
    for (const { frame, gun, legacyId, recipe } of BOT_BUILDS) {
      expect(RECIPES[recipe.id].inputs).toEqual({ [frame]: 1, [gun]: 1 });
      expect(RETIRED_RECIPES.has(legacyId)).toBe(true);
    }
    const guns = engine.placeNode('woodenChest', 400, 950)!;
    const stock = (id: string) => engine.getSector().nodes.find(candidate => candidate.id === id)!;
    [source, guns, target].forEach(id => { stock(id).constructionMs = 0; });
    stock(source).output = { 'simple-robot-frame': 1 };
    stock(guns).output = { 'simple-robot-gun': 1 };
    expect(engine.connectPorts(source, 0, machine, 1)).toBe(false);
    expect(engine.connectPorts(guns, 0, machine, 0)).toBe(false);
    expect(engine.connectPorts(source, 0, machine, 0)).toBe(true);
    expect(engine.connectPorts(guns, 0, machine, 1)).toBe(true);
    expect(engine.connect(machine, target)).toBe(true);
    for (let i = 0; i < 15; i++) engine.tick(1000);
    expect(stock(target).output['suppression-bot']).toBe(1);
    stock(source).output = { 'mithril-frame': 1 };
    stock(guns).output = { 'pulse-cannon': 1 };
    for (let i = 0; i < 95; i++) engine.tick(1000);
    const strong = BOT_BUILDS.find(build => build.frame === 'mithril-frame' && build.gun === 'pulse-cannon')!.item;
    expect(stock(target).output).toMatchObject({ 'suppression-bot': 1, [strong]: 1 });
    expect(node.recipeId).toBeUndefined();
    const camp: MachineNode = { ...node, id: 'camp', kind: 'monster-camp', x: 2100, input: {}, output: {}, outputQueue: [], attackRequirement: 17 };
    engine.getSector().nodes.push(camp);
    expect(engine.connect(target, camp.id)).toBe(true);
    for (let i = 0; i < 61; i++) engine.tick(1000);
    expect(camp.campLastCheck).toMatchObject({ passed: true, suppliedAp: 17, requiredAp: 17 });
  });

  it('preserves paid bot and Gun batches and returns obsolete ingredients on load once', () => {
    const { engine, machine, node, source } = setup('advancedAssembler');
    const state = structuredClone(engine.getState());
    delete state.botAssemblyVersion;
    const sector = state.sectors[state.activeSectorId];
    const saved = sector.nodes.find(candidate => candidate.id === node.id)!;
    saved.recipeId = 'medium-suppression-bot';
    saved.input = { 'basic-core': 2, 'sealed-frame': 1 };
    saved.output = { 'medium-suppression-bot': 1 };
    saved.batch = { recipeId: saved.recipeId!, outputs: { 'medium-suppression-bot': 1 } };
    saved.progressMs = 19500;
    sector.connections.push({ id: 'old-cores', from: source, to: machine, toPort: 2, item: 'basic-core', createdAt: 0 });
    state.inFlightTransfers = [{ id: 'core', sectorId: sector.id, connectionId: 'old-cores', from: source, to: machine, item: 'basic-core', launchedAtMs: 0, arrivesAtMs: 1000 }];
    sector.nodes.push({ ...saved, id: 'gun', kind: 'assembler', x: 1000, y: 900, recipeId: 'robot-gun',
      input: { 'copper-wire': 1, 'iron-plate': 2 }, output: {}, batch: undefined, progressMs: 6000 });
    const loaded = new GameEngine(state, { autosave: false });
    loaded.tick(500);
    const reloaded = new GameEngine(loaded.getState(), { autosave: false });
    const nodes = reloaded.getSector().nodes;
    expect(nodes.find(candidate => candidate.id === machine)).toMatchObject({ input: { 'sealed-frame': 1 }, output: { 'medium-suppression-bot': 2 } });
    expect(nodes.find(candidate => candidate.id === machine)?.input['basic-core']).toBeUndefined();
    expect(nodes.find(candidate => candidate.id === source)?.output['basic-core']).toBe(3);
    expect(nodes.find(candidate => candidate.id === 'gun')?.output['simple-robot-gun']).toBe(1);
    expect(reloaded.getSector().connections).toEqual([]);
    expect(reloaded.getState().inFlightTransfers).toEqual([]);
  });

  it.each(['motor', 'iron-gear'])('keeps legacy Fabricator %s production working without allowing new copies', (recipeId) => {
    const { engine, machine, node } = setup('advancedAssembler');
    const recipe = RECIPES[recipeId];
    engine.developerUnlockAllResearch();
    expect(engine.setRecipe(machine, recipeId)).toBe(false);
    expect(engine.setRecipe(machine, 'efficient-motor')).toBe(true);
    node.recipeId = recipeId;
    node.cycleMs = recipe.cycleMs;
    node.input = { ...recipe.inputs };
    const loaded = new GameEngine(engine.getState(), { autosave: false });
    for (let i = 0; i < 7; i++) loaded.tick(1000);
    expect(loaded.getSector().nodes.find(node => node.id === machine)?.output).toEqual(recipe.outputs);
    expect(loaded.duplicateNodes([machine])).toEqual([]);
    expect(loaded.saveFactoryTemplate('Legacy production line', [machine])).toBe(true);
    expect(loaded.placeFactoryTemplate(0, 1000, 1100)).toBe(false);
  });
});
