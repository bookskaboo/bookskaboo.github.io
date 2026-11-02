import { describe, expect, it } from 'vitest';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { inputBufferRows } from './inputBufferRows';
import { getPortAnchor, getNodeSize } from './nodeLayout';

describe('input buffer rows', () => {
  it('shows buffered quantities separately for each required ingredient, including empty inputs', () => {
    const node = tutorialNode('smelter', 'smelter', 0, 0, { recipeId: 'smelt-copper', input: { copper: 3 }, output: { 'copper-plate': 4 } });
    expect(inputBufferRows(node)).toEqual([
      { item: 'copper', amount: 3, capacity: 5, y: getPortAnchor(node, 'input', 0).y - 17 },
      { item: 'charcoal', amount: 0, capacity: 5, y: getPortAnchor(node, 'input', 1).y - 17 },
    ]);
    expect(inputBufferRows(node)[0].y).toBe(-getNodeSize(node).h / 2 + 69);
  });
  it('swaps ingredient rows with their input sockets without swapping their quantities', () => {
    const node = tutorialNode('assembler', 'assembler', 0, 0, { recipeId: 'motor', input: { 'iron-gear': 2, 'copper-wire': 4 } });
    const before = inputBufferRows(node);
    node.inputPortOrder = [1, 0];
    const after = inputBufferRows(node);
    expect(after.map(row => row.amount)).toEqual([2, 4]);
    expect(after[0].y).toBe(before[1].y);
    expect(after[1].y).toBe(before[0].y);
  });
  it('updates rows when a recipe changes and leaves unconfigured machines and Chests empty', () => {
    const node = tutorialNode('refiner', 'refiner', 0, 0);
    expect(inputBufferRows(node)).toEqual([]);
    node.recipeId = 'simple-core';
    expect(inputBufferRows(node)[0]).toMatchObject({ item: 'copper-gear', amount: 0, capacity: 5 });
    node.recipeId = 'copper-wire';
    expect(inputBufferRows(node)[0].item).toBe('copper-plate');
    expect(inputBufferRows(tutorialNode('woodenChest', 'chest', 0, 0))).toEqual([]);
  });
});
