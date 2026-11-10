import { describe, expect, it } from 'vitest';
import { BUILDABLE_NODES, NODE_DEFINITIONS } from '../content/nodes';
import { RECIPE_GROUPS, RECIPES } from '../content/recipes';
import { emptyMod } from '../mods/modTypes';
import { createInitialState, GameEngine } from '../simulation/engine';
import { normalizeLegacy } from './saves';

describe('retired Automata Core Assembler migration', () => {
  it('removes the machine catalog entry while retaining the regular Assembler recipe', () => {
    expect(Object.keys(NODE_DEFINITIONS)).not.toContain('automataCoreAssembler');
    expect(Object.keys(RECIPE_GROUPS)).not.toContain('automataCoreAssembler');
    expect(RECIPE_GROUPS.assembler).toContain('automata-core');
  });

  it('converts saved nodes and templates without losing buffers, progress or connections', () => {
    const state = createInitialState(301);
    const retired = {
      id: 'old', kind: 'automataCoreAssembler', name: 'Automata Core Assembler', x: 1000, y: 1000,
      rotation: 90, input: { 'circuit-a': 2, brick: 2 }, output: { 'automata-core': 1 },
      progressMs: 500, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
    };
    const payload = JSON.parse(JSON.stringify(state));
    payload.sectors['5,5'].nodes = [retired];
    payload.sectors['5,5'].connections = [{ id: 'edge', from: 'old', to: 'chest', fromPort: 0, toPort: 0, createdAt: 0 }];
    payload.factoryTemplates = [{ name: 'Old factory', nodes: [retired], connections: [] }];
    const loaded = normalizeLegacy(payload)!;
    const converted = loaded.sectors['5,5'].nodes[0];
    expect(converted).toEqual({ ...retired, kind: 'assembler', name: 'Assembler', recipeId: 'automata-core', cycleMs: RECIPES['automata-core'].cycleMs });
    expect(loaded.sectors['5,5'].connections).toEqual(payload.sectors['5,5'].connections);
    expect(loaded.factoryTemplates![0].nodes[0]).toEqual(converted);
    expect(new GameEngine(payload).getSector().nodes[0]).toMatchObject({ kind: 'assembler', recipeId: 'automata-core' });
    const engine = new GameEngine(state);
    engine.replaceState(payload);
    expect(engine.getSector().nodes[0].kind).toBe('assembler');
    expect(payload.sectors['5,5'].nodes[0].kind).toBe('automataCoreAssembler');
  });

  it('imports original-format dedicated machines as ordinary Assemblers', () => {
    const loaded = normalizeLegacy({
      version: 1, nodes: [{ id: 'old', kind: 'automataCoreAssembler', title: 'Automata Core Assembler' }],
      positions: { old: { x: 1000, y: 1000 } }, connections: [],
      runtime: { processors: { old: { inputs: { CIRCUIT_A: 1, BRICK: 1 }, progress: 100 } }, research: {} },
    })!;
    expect(loaded.sectors['5,5'].nodes[0]).toMatchObject({ kind: 'assembler', recipeId: 'automata-core', input: { 'circuit-a': 1, brick: 1 }, progressMs: 100 });
  });
});

const retiredWasteNodes = [
  { kind: 'slagHopper', name: 'Slag Hopper', capacity: 200 },
  { kind: 'wasteLink', name: 'Waste Link', capacity: 160 },
];

describe('retired waste node migration', () => {
  it.each(retiredWasteNodes)('replaces $name nodes and templates while retaining stock and wiring', (retired) => {
    const state = createInitialState(301);
    const payload = JSON.parse(JSON.stringify(state));
    const hopper = {
      ...retired, id: 'old-waste-node', x: 1000, y: 1000,
      rotation: 0, input: { slag: 4 }, output: { 'metallic-fines': 6 },
      inputQueue: ['slag', 'slag', 'slag', 'slag'], progressMs: 0, cycleMs: 1000,
      constructedAt: 0, constructionMs: 0,
    };
    const sector = payload.sectors['5,5'];
    const bin = { ...hopper, id: 'bin', kind: 'wasteHopper', name: 'Waste Bin', x: 1300, capacity: 200 };
    const cable = { id: 'edge', from: hopper.id, to: bin.id, fromPort: 0, toPort: 0, createdAt: 0 };
    const transfer = { id: 'in-transit', sectorId: sector.id, connectionId: cable.id, from: hopper.id, to: bin.id, item: 'slag', launchedAtMs: 0, arrivesAtMs: 1000 };
    sector.nodes = [hopper, bin];
    sector.connections = [cable];
    payload.factoryTemplates = [{ name: 'Waste loop', nodes: [hopper, bin], connections: [cable] }];
    payload.inFlightTransfers = [transfer];

    expect(Object.keys(NODE_DEFINITIONS)).not.toContain(retired.kind);
    expect(BUILDABLE_NODES.filter(node => [retired.name, 'Waste Bin'].includes(node.name)).map(node => node.name)).toEqual(['Waste Bin']);
    const loaded = normalizeLegacy(payload)!;
    const converted = { ...hopper, kind: 'wasteHopper', name: 'Waste Bin', capacity: 200 };
    expect(loaded.sectors[sector.id].nodes).toEqual([converted, bin]);
    expect(loaded.sectors[sector.id].connections).toEqual([cable]);
    expect(loaded.factoryTemplates![0]).toEqual({ ...payload.factoryTemplates[0], nodes: [converted, bin] });
    expect(loaded.inFlightTransfers).toEqual([transfer]);
    expect(new GameEngine(payload, { autosave: false }).getSector().nodes[0]).toMatchObject(converted);
    const engine = new GameEngine(state, { autosave: false });
    engine.replaceState(payload);
    expect(engine.getSector().nodes[0]).toMatchObject(converted);
    expect(payload.sectors[sector.id].nodes[0]).toEqual(hopper);
  });

  it.each(retiredWasteNodes)('imports original-format $name nodes with their stored waste', ({ kind, name }) => {
    const loaded = normalizeLegacy({
      version: 1, nodes: [{ id: 'old', kind, title: kind === 'wasteLink' ? 'Waste Batch Link' : name }],
      positions: { old: { x: 1000, y: 1000 } }, connections: [],
      runtime: { processors: { old: { inputs: { SLAG: 4 }, materialType: 'METALLIC_FINES', stored: 6 } }, research: {} },
    })!;
    expect(loaded.sectors['5,5'].nodes[0]).toMatchObject({
      kind: 'wasteHopper', name: 'Waste Bin', input: { slag: 4 }, output: { 'metallic-fines': 6 },
    });
  });

  it.each(retiredWasteNodes)('imports $name mod settings with Waste Bin settings taking precedence', ({ kind }) => {
    const state = createInitialState(301);
    const retired = { capacity: 280 };
    const mod = { ...emptyMod(), nodes: { [kind]: retired } };
    expect(normalizeLegacy({ ...state, mod })?.mod?.nodes).toEqual({ wasteHopper: retired });

    const wasteHopper = { capacity: 250 };
    const both = { ...mod, nodes: { ...mod.nodes, wasteHopper } };
    expect(normalizeLegacy({ ...state, mod: both })?.mod?.nodes).toEqual({ wasteHopper });
    expect(mod.nodes[kind]).toEqual(retired);
  });

  it('delivers saved waste in transit through a retired link and forwards its buffered stock', () => {
    const payload = JSON.parse(JSON.stringify(createInitialState(301)));
    const sector = payload.sectors['5,5'];
    const bin = (id: string, x: number) => ({
      id, x, kind: 'wasteHopper', name: 'Waste Bin', y: 1000, rotation: 0, input: {}, output: {},
      progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0, capacity: 200,
    });
    sector.nodes = [
      bin('source', 600),
      { ...bin('link', 950), kind: 'wasteLink', name: 'Waste Link', input: { slag: 4 }, capacity: 160 },
      bin('target', 1300),
    ];
    sector.connections = [
      { id: 'in', from: 'source', to: 'link', fromPort: 0, toPort: 0, createdAt: 0 },
      { id: 'out', from: 'link', to: 'target', fromPort: 0, toPort: 0, createdAt: 0 },
    ];
    payload.inFlightTransfers = [{
      id: 'shipment', sectorId: sector.id, connectionId: 'in', routeConnectionIds: ['in', 'out'],
      from: 'source', to: 'target', item: 'spent-flux', amount: 3, launchedAtMs: 0, arrivesAtMs: 500,
    }];
    const engine = new GameEngine(payload, { autosave: false });
    engine.tick(1000);
    engine.tick(1000);
    expect(engine.getSector().nodes.find(node => node.id === 'target')?.output).toEqual({ 'spent-flux': 3, slag: 4 });
    expect(engine.getState().inFlightTransfers).toEqual([]);
  });
});
