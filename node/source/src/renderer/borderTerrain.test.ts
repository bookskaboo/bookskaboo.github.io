import { expect, it } from 'vitest';
import { borderTerrainTransform } from './borderTerrain';

it('aligns canonical halves at all four boundaries, without mirroring or changing width on expansion', () => {
  for (const field of [{ width: 3600, height: 2400 }, { width: 5400, height: 3600 }]) {
    const east = borderTerrainTransform('east', field), west = borderTerrainTransform('west', field), north = borderTerrainTransform('north', field), south = borderTerrainTransform('south', field);
    for (const source of [{ x: 350, y: 0 }, { x: 320, y: 133 }, { x: 390, y: 500 }]) {
      const a = east.apply(source), b = west.apply(source), c = north.apply(source), d = south.apply(source);
      expect(a.x - b.x).toBeCloseTo(field.width); expect(a.y).toBeCloseTo(b.y);
      expect(d.y - c.y).toBeCloseTo(field.height); expect(c.x).toBeCloseTo(d.x);
    }
    expect(east.apply({ x: 351, y: 0 }).x - east.apply({ x: 350, y: 0 }).x).toBe(3);
    expect(north.apply({ x: 351, y: 0 }).y - north.apply({ x: 350, y: 0 }).y).toBe(3);
  }
});
