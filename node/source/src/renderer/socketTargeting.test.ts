import { expect, it } from 'vitest';
import { nearestSocket, socketHitContains } from './socketTargeting';

it('chooses the nearest crowded socket even when it is incompatible, without falling through to another', () => {
  const ports = [{ key: 'water', x: 100, y: 100 }, { key: 'iron', x: 100, y: 108 }];
  expect(nearestSocket(ports, 103, 107, 44)?.key).toBe('iron');
  expect(nearestSocket(ports, 103, 101, 44)?.key).toBe('water');
  expect(nearestSocket(ports, 200, 200, 44)).toBeUndefined();
});
it('keeps compact bodies selectable while extending the outside socket target', () => {
  expect(socketHitContains(-8, 0, 'west', true)).toBe(true);
  expect(socketHitContains(8, 0, 'west', true)).toBe(false);
  expect(socketHitContains(-8, 0, 'east', true)).toBe(false);
  expect(socketHitContains(8, 0, 'east', true)).toBe(true);
  expect(socketHitContains(0, 12, 'west', true)).toBe(false);
});
it('selects either touching socket from its own body side, independent of drawing order', () => {
  const ports = [{ key: 'a-output', x: 100, y: 100, side: 'east' }, { key: 'b-input', x: 100, y: 100, side: 'west' }];
  for (const candidates of [ports, [...ports].reverse()]) {
    expect(nearestSocket(candidates, 97, 100, 10)?.key).toBe('a-output');
    expect(nearestSocket(candidates, 103, 100, 10)?.key).toBe('b-input');
    expect(nearestSocket(candidates, 100, 100, 10)?.key).toBe('a-output');
  }
  const vertical = [{ key: 'upper', x: 100, y: 100, side: 'south' }, { key: 'lower', x: 100, y: 100, side: 'north' }];
  expect(nearestSocket(vertical, 100, 97, 10)?.key).toBe('upper');
  expect(nearestSocket(vertical, 100, 103, 10)?.key).toBe('lower');
});
