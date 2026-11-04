import { describe, expect, it } from 'vitest';
import { tutorialNode } from '../tutorials/tutorialState';
import { selectionScreenBounds } from './SelectionActions';

describe('multi-node selection control geometry', () => {
  const nodes = [tutorialNode('woodenChest', 'a', 400, 600), tutorialNode('woodenChest', 'b', 800, 900)];
  it('encloses both node bodies in screen coordinates with the current pan and zoom', () => {
    expect(selectionScreenBounds(nodes, { x: 100, y: -20, zoom: .5 })).toEqual({ left: 260, right: 540, top: 240, bottom: 470 });
    const original = selectionScreenBounds(nodes, { x: 0, y: 0, zoom: 1 })!;
    const panned = selectionScreenBounds(nodes, { x: -70, y: 130, zoom: 1 })!;
    expect(panned).toEqual({ left: original.left - 70, right: original.right - 70, top: original.top + 130, bottom: original.bottom + 130 });
  });
  it('removes the batch control when fewer than two nodes remain selected', () => {
    expect(selectionScreenBounds([], { x: 0, y: 0, zoom: 1 })).toBeUndefined();
    expect(selectionScreenBounds(nodes.slice(0, 1), { x: 0, y: 0, zoom: 1 })).toBeUndefined();
  });
});
