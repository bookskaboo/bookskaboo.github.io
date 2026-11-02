import { describe, expect, it } from 'vitest';
import { ITEM_COLORS } from '../content/items';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { getNodeSize, getPortAnchor } from './nodeLayout';
import { isProductionMachine, productionBufferSummary, productionPortRow } from './productionPortRows';

describe('production material rows', () => {
  it('keeps each Smelter ingredient and output separate even when other materials are buffered', () => {
    const node = tutorialNode('smelter', 'smelter', 0, 0, { recipeId: 'smelt-copper', input: { charcoal: 5, copper: 2 }, output: { 'copper-plate': 2 } });
    expect(productionPortRow(node, 'input', 0)).toEqual({ name: 'Copper', amount: 2, capacity: 5, color: ITEM_COLORS.copper });
    expect(productionPortRow(node, 'input', 1)).toEqual({ name: 'Charcoal', amount: 5, capacity: 5, color: ITEM_COLORS.charcoal });
    expect(productionPortRow(node, 'output', 0)).toEqual({ name: 'Copper Plate', amount: 2, capacity: 5, color: ITEM_COLORS['copper-plate'] });
    expect(productionBufferSummary(node)).toContain('Outputs: Copper Plate 2/5');
  });
  it('moves material displays with swapped sockets while preserving their quantities', () => {
    const node = tutorialNode('smelter', 'smelter', 0, 0, { recipeId: 'smelt-copper', input: { charcoal: 5, copper: 2 } });
    const first = getPortAnchor(node, 'input', 0), second = getPortAnchor(node, 'input', 1);
    node.inputPortOrder = [1, 0];
    expect(getPortAnchor(node, 'input', 0)).toEqual(second);
    expect(getPortAnchor(node, 'input', 1)).toEqual(first);
    expect(productionPortRow(node, 'input', 0).amount).toBe(2);
    node.outputRowOffset = 1;
    expect(getPortAnchor(node, 'output', 0).y).toBe(second.y);
    expect(second.y + 15).toBeLessThan(getNodeSize(node).h / 2 - 22);
  });
  it('uses empty outlined buffers before production and changes materials with the recipe', () => {
    const node = tutorialNode('refiner', 'refiner', 0, 0);
    expect(productionPortRow(node, 'input', 0)).toMatchObject({ name: 'Choose recipe', amount: 0 });
    node.recipeId = 'simple-core';
    expect(productionPortRow(node, 'input', 0)).toMatchObject({ name: 'Copper Gear', amount: 0 });
    expect(productionPortRow(node, 'output', 0)).toMatchObject({ name: 'Simple Core', amount: 0 });
  });
  it('includes Extractors while keeping storage, logistics, research and resource nodes separate', () => {
    for (const kind of ['extractor', 'kiln', 'smelter', 'refiner', 'assembler', 'advancedAssembler', 'hydroProcessor', 'separationFurnace'] as const) expect(isProductionMachine(tutorialNode(kind, kind, 0, 0))).toBe(true);
    for (const kind of ['woodenChest', 'joint', 'researchCenter', 'forest'] as const) expect(isProductionMachine(tutorialNode(kind, kind, 0, 0))).toBe(false);
  });
  it('keeps waste stock separate from the product at its existing output socket', () => {
    const node = tutorialNode('advancedAssembler', 'advanced', 0, 0, { recipeId: 'precision-controller', output: { 'precision-controller': 1, 'metallic-fines': 2, 'glassy-crust': 1 } });
    expect(productionPortRow(node, 'output', 0)).toMatchObject({ name: 'Precision Controller', amount: 1 });
    expect(productionPortRow(node, 'output', 1)).toMatchObject({ name: 'Waste', amount: 3 });
    expect(getPortAnchor(node, 'output', 0).y).not.toBe(getPortAnchor(node, 'output', 1).y);
  });
  it('shows an Extractor’s connected reserve through a Joint separately from its stored output', () => {
    const forest = tutorialNode('forest', 'forest', 0, 0, { resourceItem: 'wood', resourceRemaining: 700, resourceCapacity: 1000 });
    const joint = tutorialNode('joint', 'joint', 400, 0);
    const extractor = tutorialNode('extractor', 'extractor', 800, 0, { output: { wood: 3 } });
    const sector = { nodes: [forest, joint, extractor], connections: [
      { id: 'a', from: forest.id, to: joint.id, createdAt: 0 },
      { id: 'b', from: joint.id, to: extractor.id, createdAt: 0 },
    ] };
    expect(productionPortRow(extractor, 'input', 0, sector)).toMatchObject({ name: 'Wood', amount: 700, capacity: 1000, color: ITEM_COLORS.wood });
    expect(productionPortRow(extractor, 'output', 0, sector)).toMatchObject({ name: 'Wood', amount: 3, capacity: 5 });
    expect(productionBufferSummary(extractor, sector)).toContain('remaining at Forest');
    sector.connections = [];
    expect(productionPortRow(extractor, 'input', 0, sector)).toMatchObject({ name: 'Resource', amount: 0, capacity: 0 });
    expect(productionPortRow(extractor, 'output', 0, sector)).toMatchObject({ name: 'Wood', amount: 3 });
  });
  it('handles infinite sources and disconnected Extractors without inventing an input buffer', () => {
    const source = tutorialNode('iron', 'golem-reserve', 0, 0, { resourceItem: 'iron', infiniteResource: true });
    const extractor = tutorialNode('extractor', 'extractor', 400, 0);
    const sector = { nodes: [source, extractor], connections: [{ id: 'a', from: source.id, to: extractor.id, createdAt: 0 }] };
    expect(productionPortRow(extractor, 'input', 0, sector).detail).toContain('Infinite Iron reserve');
    expect(productionPortRow(extractor, 'output', 0, sector)).toMatchObject({ name: 'Iron', amount: 0, capacity: 5 });
    expect(productionPortRow(extractor, 'input', 0).name).toBe('Resource');
    expect(productionPortRow(extractor, 'output', 0).name).toBe('Output');
  });
});
