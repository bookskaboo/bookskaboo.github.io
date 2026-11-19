import { describe, expect, it } from 'vitest';
import { allowsContact, edgeTarget, fixture, gapBetween, snap, specimen, valid, type Layout, type Mode } from './model';

describe('isolated grid contact proposal', () => {
  for (const layout of ['horizontal', 'vertical', 'mixed'] as Layout[]) {
    for (const mode of ['current', 'contact', 'half', 'fine'] as Mode[]) {
      it(`${mode}: ${layout} starts at the closest permitted snapped gap`, () => {
        const nodes = fixture(mode, layout);
        expect(valid(nodes[1], nodes, mode)).toBe(true);
        expect(gapBetween(nodes, layout)).toBe(mode === 'current' ? 64 : mode === 'fine' ? 16 : 0);
        const touching = edgeTarget(nodes, layout);
        expect(valid(touching, nodes, mode)).toBe(allowsContact(mode));
        const overlapping = { ...touching, [layout === 'vertical' ? 'y' : 'x']: touching[layout === 'vertical' ? 'y' : 'x'] - 1 };
        expect(valid(overlapping, nodes, mode)).toBe(false);
      });
    }
  }
  it('retains obstacle and field clearance in the contact proposal', () => {
    const resource = specimen('iron', 'resource', 256, 128);
    const cart = specimen('woodenChest', 'cart', 576, 128);
    for (const mode of ['contact', 'half'] as const) {
      expect(valid(cart, [resource], mode)).toBe(false);
      expect(valid({ ...cart, x: cart.x + 12 }, [resource], mode)).toBe(true);
      expect(valid(specimen('woodenChest', 'edge', 0, 128), [], mode)).toBe(false);
    }
  });
  it('uses 16-unit top-left snapping only in the fine proposal', () => {
    const node = specimen('woodenChest', 'cart', 256, 128);
    expect(snap(node, { x: 337, y: 192 }, 'fine').x).toBe(336);
    expect(snap(node, { x: 337, y: 192 }, 'contact').x).toBe(320);
  });
  it('aligns to 32-unit corners, including positions halfway between the old grid lines', () => {
    for (const kind of ['woodenChest', 'smelter', 'assembler'] as const) {
      const node = specimen(kind, kind, 256, 128);
      expect(snap(node, { x: node.x + 31, y: node.y + 31 }, 'half')).toMatchObject({ x: node.x + 32, y: node.y + 32 });
      expect(snap(node, { x: node.x + 31, y: node.y + 31 }, 'contact')).toMatchObject({ x: node.x, y: node.y });
    }
  });
});
