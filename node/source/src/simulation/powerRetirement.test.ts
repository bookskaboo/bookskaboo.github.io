import { describe, expect, it } from 'vitest';
import { BUILDABLE_NODES, isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { getResearchProject, isResearchAvailable, RESEARCH_PROJECTS } from '../content/research';
import { normalizeLegacy } from '../persistence/legacyMigration';
import type { Connection, MachineNode } from '../domain/types';
import { productionVisual } from '../renderer/productionVisuals';
import { inputBufferRows } from '../renderer/inputBufferRows';
import { productionPortRow } from '../renderer/productionPortRows';
import { createInitialState, GameEngine } from './engine';

const machine = (id: string, kind: MachineNode['kind'], input: MachineNode['input'] = {}, output: MachineNode['output'] = {}): MachineNode => ({
  id, kind, name: NODE_DEFINITIONS[kind].name, x: 500, y: 500, rotation: 0, input, output,
  progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
});
const cable = (id: string, from: string, to: string): Connection => ({ id, from, to, fromPort: 0, toPort: 0, createdAt: 0 });

describe('Power retirement', () => {
  it('removes Power access while preserving Hydro and Tree Planter progression', () => {
    const engine = new GameEngine(createInitialState(200));
    for (const kind of ['charcoalGenerator', 'generator', 'powerSplitter', 'powerConduit'] as const) {
      expect(BUILDABLE_NODES.some(node => node.kind === kind)).toBe(false);
      expect(isNodeUnlocked(kind, ['basicElectricity', 'powerDistribution'])).toBe(false);
      expect(engine.placeNode(kind, 1000, 1000)).toBeUndefined();
    }
    expect(getResearchProject('basicElectricity')).toBeUndefined();
    expect(getResearchProject('powerDistribution')).toBeUndefined();
    expect(isResearchAvailable(getResearchProject('hydrochemistry')!, ['automataCore'])).toBe(true);
    expect(isResearchAvailable(getResearchProject('treePlanter1')!, ['treePlanter'])).toBe(true);
    for (const project of RESEARCH_PROJECTS) {
      expect([project.prerequisite, ...(project.prerequisites ?? [])]).not.toEqual(expect.arrayContaining(['basicElectricity']));
      expect([project.prerequisite, ...(project.prerequisites ?? [])]).not.toEqual(expect.arrayContaining(['powerDistribution']));
    }
    engine.getState().produced = { motor: 1 };
    engine.tick(100);
    expect(engine.getState().research.completed).not.toContain('basicElectricity');
  });

  it('archives old equipment and wiring once, retaining unaffected factories and research payments', () => {
    const state = createInitialState(201);
    const generator = machine('generator', 'generator', { charcoal: 4 }, { power: 50 });
    const joint = machine('joint', 'joint', { power: 1 }, { power: 2 });
    const planter = machine('planter', 'treePlanter', { power: 5 }, { 'forest-growth': 2 });
    const forest = machine('forest', 'forest');
    const kiln = machine('kiln', 'kiln', { wood: 3 }, { charcoal: 2 });
    const edges = [cable('fuel', 'kiln', 'generator'), cable('power', 'generator', 'joint'), cable('relay', 'joint', 'planter'), cable('growth', 'planter', 'forest')];
    state.sectors['5,5'].nodes = [generator, joint, planter, forest, kiln];
    state.sectors['5,5'].connections = edges;
    state.factoryTemplates = [{ name: 'Old layout', nodes: structuredClone([generator, joint, planter]), connections: structuredClone(edges.slice(1, 3)) }];
    state.research.selected = 'powerDistribution';
    state.research.contributed = { 'simple-core': 1 };
    const loaded = normalizeLegacy(state)!;
    const sector = loaded.sectors['5,5'];
    expect(sector.nodes.map(node => node.id)).toEqual(['joint', 'planter', 'forest', 'kiln']);
    expect(sector.connections).toEqual([edges[3]]);
    expect(sector.deferredPower).toEqual({ nodes: [generator], connections: edges.slice(0, 3), buffers: { joint: { input: 1, output: 2 }, planter: { input: 5, output: 0 } } });
    expect(sector.nodes.find(node => node.id === 'planter')).toMatchObject({ input: {}, output: { 'forest-growth': 2 } });
    expect(sector.nodes.find(node => node.id === 'kiln')).toEqual(kiln);
    expect(loaded.factoryTemplates![0].nodes.map(node => node.id)).toEqual(['joint', 'planter']);
    expect(loaded.factoryTemplates![0].connections).toEqual([]);
    expect(loaded.research.selected).toBeUndefined();
    expect(loaded.research.projectContributions?.powerDistribution).toEqual({ 'simple-core': 1 });
    expect(normalizeLegacy(loaded)).toEqual(loaded);
    expect(new GameEngine(state).getSector().deferredPower).toEqual(sector.deferredPower);
    expect(state.sectors['5,5'].nodes).toContain(generator);
    const engine = new GameEngine();
    engine.replaceState(state);
    expect(engine.getSector().nodes.some(node => node.kind === 'generator')).toBe(false);
  });

  it('runs both Tree Planter identifiers without Power and stops when output is full', () => {
    for (const kind of ['treePlanter', 'tree-planter'] as const) {
      const state = createInitialState(202);
      state.sectors['5,5'].nodes = [machine('planter', kind, { wood:10, 'iron-plate':1, stone:1 })];
      state.sectors['5,5'].connections = [];
      const engine = new GameEngine(state, { autosave: false });
      const planter = engine.getSector().nodes[0];
      expect(NODE_DEFINITIONS[kind].input).toEqual(['wood','iron-plate','stone']);
      expect(NODE_DEFINITIONS[kind].category).toBe('Production');
      expect(inputBufferRows(planter)).toHaveLength(3);
      expect(productionPortRow(planter, 'output', 0)).toMatchObject({ name: 'Forest Growth', amount: 0 });
      expect(productionVisual(planter, engine.getState(), engine.getSector()).missingInputs).toEqual([]);
      for (let i = 0; i < 10; i++) engine.tick(100);
      expect(planter.output['forest-growth']).toBe(1);
      for (let i = 0; i < 70; i++) engine.tick(100);
      expect(planter.output['forest-growth']).toBe(5);
      expect(planter.input.power).toBeUndefined();
    }
  });

  it('archives original-format Power equipment during import', () => {
    const loaded = normalizeLegacy({ version: 1, nodes: [{ id: 'old', kind: 'charcoalGenerator', title: 'Generator' }], positions: { old: { x: 500, y: 500 } }, connections: [], runtime: { charcoalGenerators: { old: { charcoal: 2, power: 30 } }, research: { basicElectricityUnlocked: true, activeProject: 'powerDistribution', progress: { powerDistribution: 1 } } } })!;
    expect(loaded.sectors[loaded.activeSectorId].nodes).toEqual([]);
    expect(loaded.sectors[loaded.activeSectorId].deferredPower?.nodes[0]).toMatchObject({ kind: 'charcoalGenerator', input: { charcoal: 2 }, output: { power: 30 } });
    expect(loaded.research.completed).toContain('basicElectricity');
    expect(loaded.research.selected).toBeUndefined();
    expect(loaded.research.projectContributions?.powerDistribution).toEqual({ 'simple-core': 1, 'basic-core': 0, 'automata-core': 0, 'hydro-core': 0 });
  });

  it('archives fuel and energy already traveling along retired cables', () => {
    const state = createInitialState(203);
    state.sectors['5,5'].nodes = [machine('generator', 'charcoalGenerator'), machine('planter', 'treePlanter')];
    const fuel = { id: 'fuel', sectorId: '5,5', connectionId: 'old-fuel', from: 'kiln', to: 'generator', item: 'charcoal' as const, launchedAtMs: 0, arrivesAtMs: 500 };
    const power = { ...fuel, id: 'energy', from: 'generator', to: 'planter', item: 'power' as const };
    state.inFlightTransfers = [fuel, power];
    const loaded = normalizeLegacy(state)!;
    expect(loaded.inFlightTransfers).toEqual([]);
    expect(loaded.sectors['5,5'].deferredPower?.transfers).toEqual([fuel, power]);
    expect(normalizeLegacy(loaded)).toEqual(loaded);
  });
});
