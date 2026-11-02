import { describe, expect, it } from 'vitest';
import { CONNECTOR_MIRRORING_RESEARCH } from '../content/productionNodes';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { RECIPE_GROUPS } from '../content/recipes';
import { isResearchAvailable, RESEARCH_PROJECTS } from '../content/research';
import type { ItemId, MachineNode, NodeKind } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { getPortAnchor } from '../renderer/nodeLayout';
import { getPortSide } from './connectionRules';
import { createInitialState, GameEngine } from './engine';

const cores: ItemId[] = ['simple-core', 'basic-core', 'automata-core', 'hydro-core'];
const machine = (kind: NodeKind, id = kind): MachineNode => ({
  id, kind, name: kind, x: 1000, y: 1000, rotation: 0,
  input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
  recipeId: RECIPE_GROUPS[kind]?.[0],
});

function setup(nodes: MachineNode[], researched = false) {
  const state = createInitialState(700);
  state.sectors['5,5'].nodes = nodes;
  state.research.completed = ['hydraulicAssembly', ...(researched ? [CONNECTOR_MIRRORING_RESEARCH] : [])];
  return new GameEngine(state, { autosave: false });
}

describe('Connector Mirroring', () => {
  it('requires Hydraulic Assembly and 100 of every core through tier 4', () => {
    const project = RESEARCH_PROJECTS.find(project => project.id === CONNECTOR_MIRRORING_RESEARCH)!;
    expect(project.costs).toEqual(Object.fromEntries(cores.map(core => [core, 100])));
    expect(isResearchAvailable(project, ['automataCore'])).toBe(false);
    expect(isResearchAvailable(project, ['hydraulicAssembly'])).toBe(true);
  });

  it('stays locked until all 100 four-core sets are paid together', () => {
    const engine = setup([machine('researchCenter'), machine('extractor')]);
    const state = engine.getState();
    const lab = engine.getSector().nodes.find(node => node.kind === 'researchCenter')!;
    engine.selectResearch(CONNECTOR_MIRRORING_RESEARCH);
    for (let i = 0; i < 99; i++) {
      lab.input = Object.fromEntries(cores.map(core => [core, 1]));
      engine.tick(1000);
    }
    expect(state.research.contributed).toEqual(Object.fromEntries(cores.map(core => [core, 99])));
    expect(engine.mirrorProductionConnectors('extractor')).toBe(false);
    lab.input = { 'simple-core': 1, 'basic-core': 1, 'automata-core': 1 };
    engine.tick(1000);
    expect(lab.input['simple-core']).toBe(1);
    expect(engine.mirrorProductionConnectors('extractor')).toBe(false);
    lab.input['hydro-core'] = 1;
    engine.tick(1000);
    expect(cores.every(core => lab.input[core] === 0)).toBe(true);
    expect(state.research.completed).toContain(CONNECTOR_MIRRORING_RESEARCH);
    expect(engine.mirrorProductionConnectors('extractor')).toBe(true);
  });

  it.each<NodeKind>(['extractor', 'kiln', 'smelter', 'refiner', 'assembler', 'hydroProcessor', 'advancedAssembler', 'separationFurnace'])('mirrors every connector on %s without changing its row or identity', kind => {
    const engine = setup([machine(kind)], true);
    const node = engine.getSector().nodes.find(node => node.kind === kind)!;
    const ports = [
      ...getEffectiveNodeInputFamilies(node, []).map((_, index) => ({ direction: 'input' as const, index })),
      ...getEffectiveNodeOutputFamilies(node).map((_, index) => ({ direction: 'output' as const, index })),
    ].map(port => ({ ...port, before: getPortAnchor(node, port.direction, port.index) }));
    expect(engine.mirrorProductionConnectors(node.id)).toBe(true);
    for (const { direction, index, before } of ports) {
      expect(getPortAnchor(node, direction, index)).toEqual({ x: -before.x, y: before.y });
      expect(getPortSide(node, direction, index)).toBe(direction === 'input' ? 'east' : 'west');
    }
    expect(engine.mirrorProductionConnectors(node.id)).toBe(true);
    for (const { direction, index, before } of ports) expect(getPortAnchor(node, direction, index)).toEqual(before);
  });

  it('keeps cable identities, buffers and in-flight deliveries intact', () => {
    const extractor = machine('extractor'); extractor.output.wood = 2;
    const chest = machine('woodenChest'); chest.x = 1700;
    const engine = setup([extractor, chest], true);
    expect(engine.connectPorts('extractor', 0, 'woodenChest', 0)).toBe(true);
    engine.tick(1000);
    const state = engine.getState();
    const node = engine.getSector().nodes.find(node => node.id === 'extractor')!;
    expect(state.inFlightTransfers?.length).toBeGreaterThan(0);
    const before = structuredClone({ cables: engine.getSector().connections, transfers: state.inFlightTransfers, input: node.input, output: node.output, progress: node.progressMs, recipe: node.recipeId });
    expect(engine.mirrorProductionConnectors(node.id)).toBe(true);
    expect({ cables: engine.getSector().connections, transfers: state.inFlightTransfers, input: node.input, output: node.output, progress: node.progressMs, recipe: node.recipeId }).toEqual(before);
    engine.tick(1000);
    expect(engine.getSector().nodes.find(node => node.id === 'woodenChest')!.output.wood).toBeGreaterThan(0);
  });

  it('preserves the separate input-order and output-position controls before and after research', () => {
    const engine = setup([machine('smelter')]);
    const node = engine.getSector().nodes.find(node => node.id === 'smelter')!;
    engine.cycleNodeInputOrder(node.id);
    engine.cycleNodeOutputPosition(node.id);
    expect(node.inputPortOrder).toEqual([1, 0]);
    expect(node.outputRowOffset).toBe(1);
    expect(engine.mirrorProductionConnectors(node.id)).toBe(false);
    engine.getState().research.completed.push(CONNECTOR_MIRRORING_RESEARCH);
    expect(engine.mirrorProductionConnectors(node.id)).toBe(true);
    expect(node.inputPortOrder).toEqual([1, 0]);
    expect(node.outputRowOffset).toBe(1);
    engine.cycleNodeInputOrder(node.id);
    engine.cycleNodeOutputPosition(node.id);
    expect(node.inputPortOrder).toEqual([0, 1]);
    expect(node.outputRowOffset).toBe(0);
    expect(getPortSide(node, 'output', 0)).toBe('west');
  });

  it('persists through saves and can be undone without losing the research', () => {
    const engine = setup([machine('extractor')], true);
    engine.mirrorProductionConnectors('extractor');
    const saved = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    const loaded = new GameEngine(saved, { autosave: false });
    expect(loaded.getSector().nodes.find(node => node.id === 'extractor')!.connectorsMirrored).toBe(true);
    expect(loaded.mirrorProductionConnectors('extractor')).toBe(true);
    loaded.undo();
    expect(loaded.getSector().nodes.find(node => node.id === 'extractor')!.connectorsMirrored).toBe(true);
    engine.undo();
    expect(engine.getSector().nodes.find(node => node.id === 'extractor')!.connectorsMirrored).toBeUndefined();
    expect(engine.getState().research.completed).toContain(CONNECTOR_MIRRORING_RESEARCH);
  });

  it.each<NodeKind>(['splitter', 'woodenChest', 'forest', 'researchCenter', 'miningDrill'])('leaves %s outside the production mirroring action', kind => {
    const engine = setup([machine(kind)], true);
    expect(engine.mirrorProductionConnectors(kind)).toBe(false);
    expect(engine.getSector().nodes.find(node => node.kind === kind)!.connectorsMirrored).toBeUndefined();
  });
});
