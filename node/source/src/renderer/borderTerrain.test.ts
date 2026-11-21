import { expect, it } from 'vitest';
import { borderTerrainTransform } from './borderTerrain';
import { mountainFaces, mountainPoint } from '../domain/borderTerrainGeometry';

it('aligns canonical halves at all four boundaries, without mirroring or changing width on expansion', () => {
  for (const field of [{ width: 3600, height: 2400 }, { width: 5400, height: 3600 }]) {
    const east = borderTerrainTransform('east', field), west = borderTerrainTransform('west', field), north = borderTerrainTransform('north', field), south = borderTerrainTransform('south', field);
    for (const source of [{ x: 350, y: 0 }, { x: 320, y: 133 }, { x: 390, y: 500 }]) {
      const a = east.apply(source), b = west.apply(source), c = north.apply(source), d = south.apply(source);
      expect(a.x - b.x).toBeCloseTo(field.width); expect(a.y).toBeCloseTo(b.y);
      expect(d.y - c.y).toBeCloseTo(field.height); expect(c.x).toBeCloseTo(d.x);
    }
    expect(east.apply({ x: 351, y: 0 }).x - east.apply({ x: 350, y: 0 }).x).toBe(3.75);
    expect(north.apply({ x: 351, y: 0 }).y - north.apply({ x: 350, y: 0 }).y).toBe(3.75);
  }
});

it('keeps dense mountain clusters upright on every side through expansion', () => {
  const faces = mountainFaces(37);
  expect(faces.length).toBeGreaterThan(25);
  expect(new Set(faces.map(face => Math.floor(face.x / 20))).size).toBeGreaterThan(3);
  for (const field of [{width:3600,height:2400},{width:5400,height:3600},{width:7200,height:2400}]) {
    for (const side of ['north','east','south','west'] as const) for (const face of faces) {
      const projection = { horizontal: side === 'north' || side === 'south', field };
      const point = (dx: number, dy: number) => { const [x,y] = mountainPoint(face,dx,dy,projection); return borderTerrainTransform(side,field).apply({x,y}); };
      expect(point(4,-49).y).toBeLessThan(point(-72,65).y);
      expect(point(4,-49).y).toBeLessThan(point(80,68).y);
    }
  }
});
