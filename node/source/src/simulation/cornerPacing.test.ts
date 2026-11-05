import { describe, expect, it } from 'vitest';
import { ALPHA_AP, CORNER_ITEMS, RECLAMATION_PRODUCTION_TARGET_MS, FOUNDRY_INPUTS, GROVE_GROWTH, RECLAMATION_QUOTAS, type CornerType } from '../content/endgame';
import { BOT_STRENGTH } from '../content/progression';
import { RECIPES } from '../content/recipes';
import type { ItemId, MachineNode } from '../domain/types';
import { productionPortRow } from '../renderer/productionPortRows';
import { productionExplanation } from '../renderer/productionVisuals';
import { createInitialState, GameEngine } from './engine';
import { createCornerNodes, simulateCorner } from './endgameRuntime';

const producer = (kind: MachineNode['kind'], recipeId?: string, y = 900): MachineNode => ({
  kind, id: recipeId ?? kind, recipeId, name: recipeId ?? kind, x: 400, y, rotation: 0,
  input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
});
function fixture(type: CornerType) {
  const state = createInitialState(204), sector = state.sectors['5,5'];
  sector.nodes = createCornerNodes(0, 0, state.seed, { width: 4800, height: 1800 }, [type, 'foundry', 'reclamation', 'grove']);
  sector.connections = [];
  state.research.completed = ['assembler', 'treePlanter', 'hydraulicAssembly', 'sealedRobotics', 'precisionControl'];
  state.research.unlocked = [...state.research.completed];
  const engine = new GameEngine(state, { autosave: false });
  return { engine, state: engine.getState(), sector: engine.getSector(), node: engine.getSector().nodes[0], box: engine.getSector().nodes[1] };
}
/** Synthetic supplied-machine QA: refill only producer inputs, then use real production,
 * buffers and cables. No save, browser or normal-play balance run is involved. */
function twoComponents(type: CornerType, suppliers: MachineNode[], productionMs: number, filtered = false) {
  const f = fixture(type);
  f.sector.nodes.push(...suppliers);
  if (filtered) {
    const filter = producer('filter'); filter.x = 1100; filter.filterItem = 'precision-controller';
    const sink = producer('warehouse'); sink.x = 1800; sink.y = 400; sink.capacity = 250;
    f.sector.nodes.push(filter, sink);
    expect(f.engine.connect(suppliers[0].id, filter.id)).toBe(true);
    expect(f.engine.connectPorts(filter.id, 0, sink.id, 0)).toBe(true);
    expect(f.engine.connectPorts(filter.id, 1, f.node.id, 0)).toBe(true);
  } else for (const supplier of suppliers) expect(f.engine.connect(supplier.id, f.node.id)).toBe(true);
  const times: number[] = [];
  for (let ms = 0; ms < productionMs * 2 + 5000 && times.length < 2; ms += 100) {
    for (const supplier of suppliers) supplier.input = supplier.kind === 'treePlanter'
      ? { wood: 10, 'iron-plate': 1, stone: 1 }
      : Object.fromEntries(Object.entries(RECIPES[supplier.recipeId!].inputs).map(([item, count]) => [item, Math.max(5, count!)]));
    f.engine.tick(100);
    if ((f.box.output[CORNER_ITEMS[type]] ?? 0) > times.length) times.push(ms + 100);
  }
  expect(times).toHaveLength(2);
  // Cold cables add launch/travel latency. Steady production must meet its quota-derived interval.
  expect(times[0]).toBeLessThanOrEqual(productionMs + 5000);
  expect(times[1] - times[0]).toBeLessThanOrEqual(productionMs);
  return f;
}

describe('explicit corner quotas and production cadence', () => {
  it('sizes Alpha to fifty AP with whole-bot surplus and completes through a real supply cable', () => {
    expect(ALPHA_AP).toBe(50);
    expect(Math.ceil(ALPHA_AP / BOT_STRENGTH['medium-suppression-bot']!) * RECIPES['medium-suppression-bot'].cycleMs).toBe(425000);
    const f = twoComponents('alpha', [producer('advancedAssembler', 'medium-suppression-bot')], 425000);
    expect(f.node.cornerProgress).toBe(2);
  });
  it('delivers each Foundry ingredient from one base producer without overfilling its distinct buffer', () => {
    const ids = ['ceramic-electrode', 'sealed-frame', 'mythril-gear'];
    expect(FOUNDRY_INPUTS).toEqual({ 'ceramic-electrode': 50, 'sealed-frame': 25, 'mythril-gear': 100 });
    for (const [index, id] of ids.entries()) {
      const recipe = RECIPES[id];
      const batches = FOUNDRY_INPUTS[id as ItemId]! / recipe.outputs[id as ItemId]!;
      expect(batches * recipe.cycleMs).toBe([500000, 450000, 300000][index]);
    }
    const suppliers = [producer('advancedAssembler', ids[0], 200), producer('advancedAssembler', ids[1], 900), producer('refiner', ids[2], 1600)];
    const f = twoComponents('foundry', suppliers, 500000);
    for (const [index, id] of ids.entries()) {
      expect(productionPortRow(f.node, 'input', index).capacity).toBe(FOUNDRY_INPUTS[id as ItemId]);
      expect(f.node.input[id as ItemId] ?? 0).toBeLessThanOrEqual(FOUNDRY_INPUTS[id as ItemId]!);
    }
  });
  it('funds and delivers Grove growth from one base Planter without Industrial Forestry', () => {
    expect(GROVE_GROWTH).toBe(500);
    twoComponents('grove', [producer('treePlanter')], 500000);
  });
  it('delivers standard Controller waste through a Filter while draining its useful output', () => {
    expect(RECLAMATION_QUOTAS['metallic-fines']! * RECIPES['precision-controller'].cycleMs).toBe(RECLAMATION_PRODUCTION_TARGET_MS);
    twoComponents('reclamation', [producer('advancedAssembler', 'precision-controller')], RECLAMATION_PRODUCTION_TARGET_MS, true);
  });
  it.each([
    ['spent-flux', 'efficient-hydro-piston'], ['glassy-crust', 'efficient-mythril-mesh'], ['slag', 'efficient-circuit-c'],
  ] as const)('accepts five minutes of %s from one base %s producer as a complete component', (waste, recipeId) => {
    const recipe = RECIPES[recipeId], batches = Math.floor(RECLAMATION_PRODUCTION_TARGET_MS / recipe.cycleMs);
    const f = fixture('reclamation'), batchWaste = recipe.outputs[waste]!;
    expect(RECLAMATION_QUOTAS[waste]).toBe(batches * batchWaste);
    f.node.input[waste] = (batches - 1) * batchWaste;
    simulateCorner(f.state, f.sector, f.node);
    expect(f.box.output['reclamation-component'] ?? 0).toBe(0);
    f.node.input[waste] = batchWaste;
    simulateCorner(f.state, f.sector, f.node);
    expect(f.box.output['reclamation-component']).toBe(1);
  });
  it('preserves legacy Grove credit across the smaller quota, full output and reload', () => {
    const f = fixture('grove'); f.node.cornerProgress = 5837;
    f.engine.tick(100);
    expect(f.box.output['grove-component']).toBe(10);
    expect(f.node.cornerProgress).toBe(837);
    const loaded = new GameEngine(structuredClone(f.state), { autosave: false });
    loaded.tick(100);
    const [node, box] = loaded.getSector().nodes;
    expect(node.cornerProgress).toBe(837);
    box.output['grove-component'] = 9; loaded.tick(100);
    expect(node.cornerProgress).toBe(337);
    expect(box.output['grove-component']).toBe(10);
  });
  it('preserves legacy Foundry overstock and consumes only the new bill', () => {
    const f = fixture('foundry'); f.node.input = { 'ceramic-electrode': 3000, 'sealed-frame': 3000, 'mythril-gear': 3000 };
    const loaded = new GameEngine(structuredClone(f.state), { autosave: false });
    for (let i = 0; i < 20; i++) loaded.tick(100);
    const [node, box] = loaded.getSector().nodes;
    expect(box.output['foundry-component']).toBe(10);
    expect(node.input).toEqual({ 'ceramic-electrode': 2500, 'sealed-frame': 2750, 'mythril-gear': 2000 });
  });
  it('retains saved normalized Reclamation progress and applies new credits only to new waste', () => {
    const f = fixture('reclamation'); f.node.cornerProgress = .75;
    const loaded = new GameEngine(structuredClone(f.state), { autosave: false });
    const [node, box] = loaded.getSector().nodes;
    expect(node.cornerProgress).toBe(.75);
    node.input['metallic-fines'] = 3; loaded.tick(100);
    expect(box.output['reclamation-component']).toBe(1);
    expect(node.cornerProgress).toBeCloseTo(.05);
  });
  it('shows the current quotas in corner explanations', () => {
    for (const [type, wording] of [['alpha', '/ 50'], ['foundry', '25 Sealed Frame'], ['grove', 'Every 500 growth'], ['reclamation', '10 Metallic Fines']] as const) {
      const f = fixture(type);
      expect(productionExplanation(f.node, f.state, f.sector).summary).toContain(wording);
    }
  });
});
