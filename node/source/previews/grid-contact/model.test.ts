import { describe, expect, it } from 'vitest';
import { edgeTarget, fixture, gapBetween, snap, specimen, valid, type Layout, type Mode } from './model';

describe('isolated grid contact proposal', () => {
  for (const layout of ['horizontal', 'vertical', 'mixed'] as Layout[]) {
    for (const mode of ['current', 'contact', 'fine'] as Mode[]) {
      it(`${mode}: ${layout} starts at the closest permitted snapped gap`, () => {
        const nodes = fixture(mode, layout);
        expect(valid(nodes[1], nodes, mode)).toBe(true);
        expect(gapBetween(nodes, layout)).toBe(mode === 'current' ? 64 : mode === 'fine' ? 16 : 0);
        const touching = edgeTarget(nodes, layout);
        expect(valid(touching, nodes, mode)).toBe(mode === 'contact');
        const overlapping = { ...touching, [layout === 'vertical' ? 'y' : 'x']: touching[layout === 'vertical' ? 'y' : 'x'] - 1 };
        expect(valid(overlapping, nodes, mode)).toBe(false);
      });
    }
  }
  it('retains obstacle and field clearance in the contact proposal', () => {
    const resource = specimen('iron', 'resource', 256, 128);
    const cart = specimen('woodenChest', 'cart', 576, 128);
    expect(valid(cart, [resource], 'contact')).toBe(false);
    expect(valid({ ...cart, x: cart.x + 12 }, [resource], 'contact')).toBe(true);
    expect(valid(specimen('woodenChest', 'edge', 0, 128), [], 'contact')).toBe(false);
  });
  it('uses 16-unit top-left snapping only in the fine proposal', () => {
    const node = specimen('woodenChest', 'cart', 256, 128);
    expect(snap(node, { x: 337, y: 192 }, 'fine').x).toBe(336);
    expect(snap(node, { x: 337, y: 192 }, 'contact').x).toBe(320);
  });
});
