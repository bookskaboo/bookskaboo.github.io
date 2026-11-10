import { describe, expect, it } from 'vitest';
import { ALPHA_AP, CORNER_ITEMS, RECLAMATION_PRODUCTION_TARGET_MS, FOUNDRY_INPUTS, GROVE_GROWTH, RECLAMATION_QUOTAS, type CornerType } from '../content/endgame';
import { RECIPES, isRecipeUnlocked } from '../content/recipes';
import { getResearchProject, isResearchAvailable } from '../content/research';
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
  sector.nodes = createCornerNodes(10, 0, state.seed, { width: 4800, height: 1800 }, ['alpha', type, 'reclamation', 'grove']);
  sector.connections = [];
  state.research.completed = ['assembler', 'treePlanter', 'hydraulicAssembly', 'sealedRobotics', 'precisionControl'];
  if (type === 'alpha') state.research.completed.push('finalRobotics');
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
      : supplier.kind === 'botPlant' ? { 'final-frame': 5, 'final-cannon': 5 }
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
  it('awards a piece at 200 AP using 72 AP Suppression Bots from a real supply cable and carries the surplus', () => {
    expect(ALPHA_AP).toBe(200);
    const f = twoComponents('alpha', [producer('botPlant')], 630000);
    expect(f.node.cornerProgress).toBe(32);
  });
  it('makes Final Robotics payable only after the first Final Core and charges one Final Core', () => {
    const f = fixture('reclamation');
    f.state.research.completed.push('commandRobotics', 'cornerComponents');
    const project = getResearchProject('finalRobotics')!;
    expect(project.costs['final-core']).toBe(1);
    expect(isResearchAvailable(project, f.state.research.completed)).toBe(false);
    expect(isRecipeUnlocked('assemble-bot-f5-g5', f.state.research.completed)).toBe(false);
    const lab = producer('researchCenter');
    lab.input = { ...project.costs };
    f.sector.nodes.push(lab);
    f.state.produced!['final-core'] = 1;
    f.engine.tick(100);
    expect(f.state.research.completed).toContain('finalCoreProduction');
    f.engine.selectResearch(project.id);
    for (let i = 0; i < 5; i++) f.engine.tick(1000);
    expect(f.state.research.completed).toContain(project.id);
    expect(lab.input['final-core']).toBe(0);
    expect(isRecipeUnlocked('assemble-bot-f5-g5', f.state.research.completed)).toBe(true);
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
  it('funds and delivers 1,000 Grove growth from two parallel base planters', () => {
    expect(GROVE_GROWTH).toBe(1000);
    const first = { ...producer('treePlanter', undefined, 400), id: 'planter-a' };
    const second = { ...producer('treePlanter', undefined, 1400), id: 'planter-b' };
    twoComponents('grove', [first, second], 500000);
  });
  it('delivers standard Controller waste through a Filter while draining its useful output', () => {
    expect(RECLAMATION_QUOTAS['metallic-fines']! * RECIPES['precision-controller'].cycleMs).toBe(RECLAMATION_PRODUCTION_TARGET_MS);
    twoComponents('reclamation', [producer('advancedAssembler', 'precision-controller')], RECLAMATION_PRODUCTION_TARGET_MS, true);
  });
  it.each([
    ['spent-flux', 'efficient-hydro-piston', 132], ['glassy-crust', 'efficient-mythril-mesh', 72], ['slag', 'efficient-circuit-c', 44],
  ] as const)('accepts %s from %s and awards one piece at %i units', (waste, recipeId, quota) => {
    const recipe = RECIPES[recipeId];
    const f = fixture('reclamation'), batchWaste = recipe.outputs[waste]!;
    expect(RECLAMATION_QUOTAS[waste]).toBe(quota);
    for (let remaining = quota - batchWaste; remaining > 0;) {
      const delivery = Math.min(100, remaining);
      f.node.input[waste] = delivery;
      simulateCorner(f.state, f.sector, f.node);
      remaining -= delivery;
    }
    expect(f.box.output['reclamation-component'] ?? 0).toBe(0);
    f.node.input[waste] = batchWaste;
    simulateCorner(f.state, f.sector, f.node);
    expect(f.box.output['reclamation-component']).toBe(1);
  });
  it('preserves accumulated Grove credit across full output and reload', () => {
    const f = fixture('grove'); f.node.cornerProgress = 11837;
    f.engine.tick(100);
    expect(f.box.output['grove-component']).toBe(10);
    expect(f.node.cornerProgress).toBe(1837);
    const loaded = new GameEngine(structuredClone(f.state), { autosave: false });
    loaded.tick(100);
    const [node, box] = loaded.getSector().nodes;
    expect(node.cornerProgress).toBe(1837);
    box.output['grove-component'] = 9; loaded.tick(100);
    expect(node.cornerProgress).toBe(837);
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
    node.input['metallic-fines'] = 2; loaded.tick(100);
    expect(box.output['reclamation-component'] ?? 0).toBe(0);
    expect(node.cornerProgress).toBeCloseTo(.85);
    node.input.slag = 11; loaded.tick(100);
    expect(box.output['reclamation-component']).toBe(1);
    expect(node.cornerProgress).toBeCloseTo(.10);
  });
  it('shows the current quotas in corner explanations', () => {
    for (const [type, wording] of [['alpha', '/ 200'], ['foundry', '25 Sealed Frame'], ['grove', 'Every 1,000 growth'], ['reclamation', '20 Metallic Fines']] as const) {
      const f = fixture(type);
      expect(productionExplanation(f.node, f.state, f.sector).summary).toContain(wording);
    }
  });
});
