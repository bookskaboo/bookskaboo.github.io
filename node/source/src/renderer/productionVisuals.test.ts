import { describe, expect, it } from 'vitest';
import { createInitialState } from '../simulation/engine';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { productionExplanation, productionVisual } from './productionVisuals';

describe('production animation and bottleneck cues', () => {
  it('shows Cart contents and exact counts while ignoring an obsolete processing-pause flag', () => {
    const game = createInitialState(1), sector = game.sectors[game.activeSectorId];
    const node = tutorialNode('woodenChest', 'chest', 500, 500, { capacity: 20 });
    expect(productionExplanation(node, game, sector).summary).toBe('Empty · 0/20 stored.');
    node.output.wood = 12;
    node.input.wood = 2;
    expect(productionExplanation(node, game, sector).summary).toBe('Wood: 14 · 14/20 stored.');
    node.processingPaused = true;
    expect(productionExplanation(node, game, sector).summary).toBe('Wood: 14 · 14/20 stored.');
  });
  it('explains zero-count ingredients and committed batches without reporting consumed inputs as missing', () => {
    const game = createInitialState(1), sector = game.sectors[game.activeSectorId];
    game.research.completed.push('precisionControl');
    const node = tutorialNode('advancedAssembler', 'logic', 500, 500, { recipeId: 'logic-substrate', input: { 'circuit-a': 1 }, capacity: 5 });
    expect(productionExplanation(node, game, sector).ingredients).toContainEqual({ item: 'circuit-a', available: 1, required: 2, capacity: 5 });
    expect(productionExplanation(node, game, sector).summary).toContain('Waiting for');
    node.batch = { recipeId: 'logic-substrate', outputs: { 'logic-substrate': 1 } };
    expect(productionExplanation(node, game, sector).summary).toContain('ingredients already consumed');
    expect(productionExplanation(node, game, sector).summary).not.toContain('Waiting');
    delete node.batch;
    node.output = { 'glassy-crust': 5 };
    expect(productionExplanation(node, game, sector).summary).toContain('Output/waste buffer full: 5/5');
  });
  it('identifies the short smelter input and stops motion until both feeds arrive', () => {
    const game = createInitialState(1), sector = game.sectors[game.activeSectorId];
    const node = tutorialNode('smelter', 'smelt', 500, 500, { recipeId: 'smelt-copper', input: { copper: 2 }, progressMs: 200 });
    expect(productionVisual(node, game, sector)).toMatchObject({ working: false, missingInputs: [1], blockedOutputs: [] });
    node.input.charcoal = 1;
    expect(productionVisual(node, game, sector).working).toBe(true);
    node.processingPaused = true;
    expect(productionVisual(node, game, sector).working).toBe(false);
  });
  it('marks a backed-up output without portraying it as completed production', () => {
    const game = createInitialState(1), sector = game.sectors[game.activeSectorId];
    const node = tutorialNode('kiln', 'kiln', 500, 500, { recipeId: 'charcoal', input: { wood: 5 }, output: { charcoal: 5 }, progressMs: 200 });
    expect(productionVisual(node, game, sector)).toMatchObject({ working: false, blockedOutputs: [0], fill: 1 });
    node.output.charcoal = 4;
    expect(productionVisual(node, game, sector)).toMatchObject({ working: true, blockedOutputs: [] });
  });
  it('keeps committed batches moving after ingredients were consumed and identifies a waste backup', () => {
    const game = createInitialState(1), sector = game.sectors[game.activeSectorId];
    const node = tutorialNode('separationFurnace', 'furnace', 500, 500, { recipeId: 'refined-mithril', output: { slag: 5 }, progressMs: 1000 });
    // Use the live recipe attached to the furnace catalog.
    node.recipeId = 'refined-mithril';
    const idle = productionVisual(node, game, sector);
    expect(idle).toMatchObject({ working: false, blockedOutputs: [0] });
    node.batch = { recipeId: node.recipeId, outputs: { 'refined-mithril': 1 } };
    expect(productionVisual(node, game, sector)).toMatchObject({ working: true, missingInputs: [], blockedOutputs: [] });
  });
  it('traces missing extraction through a Joint and checks synchronized research inputs', () => {
    const game = createInitialState(1), sector = game.sectors[game.activeSectorId];
    const forest = tutorialNode('forest', 'forest', 200, 400, { resourceItem: 'wood', resourceRemaining: 0 });
    const joint = tutorialNode('joint', 'joint', 400, 400);
    const extractor = tutorialNode('extractor', 'extractor', 600, 400, { progressMs: 100 });
    sector.nodes = [forest, joint, extractor];
    sector.connections = [{ id: 'a', from: forest.id, to: joint.id, createdAt: 0 }, { id: 'b', from: joint.id, to: extractor.id, createdAt: 0 }];
    expect(productionVisual(extractor, game, sector)).toMatchObject({ working: false, missingInputs: [0] });
    forest.resourceRemaining = 10;
    expect(productionVisual(extractor, game, sector).working).toBe(true);
    game.research.selected = 'exploration';
    const lab = tutorialNode('researchCenter', 'lab', 800, 400, { progressMs: 100, input: { 'simple-core': 1 } });
    expect(productionVisual(lab, game, sector).missingInputs).toEqual([0]);
    lab.input['basic-core'] = 1;
    expect(productionVisual(lab, game, sector).working).toBe(true);
  });
});
