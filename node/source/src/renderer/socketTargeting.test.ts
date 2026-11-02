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
