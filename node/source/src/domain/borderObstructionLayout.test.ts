import { describe, expect, it } from 'vitest';
import { BORDER_SIDES, hasObstructedCorner, trySetBorder } from './borderObstructionLayout';
import type { MapBorderLayout } from './borderObstructionLayout';

const empty = (): MapBorderLayout => ({ north: null, east: null, south: null, west: null });
describe('planned map border corner rule', () => {
  it('allows exactly the empty layout, four single sides and two opposite pairs', () => {
    const valid: number[] = [];
    for (let mask = 0; mask < 16; mask++) {
      const layout = empty();
      BORDER_SIDES.forEach((side, bit) => { if (mask & (1 << bit)) layout[side] = 'river'; });
      if (!hasObstructedCorner(layout)) valid.push(mask);
    }
    expect(valid).toEqual([0, 1, 2, 4, 5, 8, 10]);
  });
  it('rejects the north addition with east and west occupied without changing either edge', () => {
    const layout: MapBorderLayout = { ...empty(), east: 'river', west: 'mountain' };
    const result = trySetBorder(layout, 'north', 'chasm');
    expect(result.accepted).toBe(false);
    expect(result.layout).toBe(layout);
    expect(result.layout).toEqual({ north: null, south: null, east: 'river', west: 'mountain' });
  });
  it('rejects every adjacent pair for every combination of terrain types', () => {
    for (const a of ['river', 'mountain', 'chasm'] as const) for (const b of ['river', 'mountain', 'chasm'] as const) {
      for (const [one, two] of [['north', 'east'], ['east', 'south'], ['south', 'west'], ['west', 'north']] as const) {
        const layout = { ...empty(), [one]: a };
        expect(trySetBorder(layout, two, b).accepted).toBe(false);
        expect(trySetBorder({ ...empty(), [two]: b }, one, a).accepted).toBe(false);
      }
    }
  });
  it('allows mixed opposite types, replacement on that side and clearing before a turn', () => {
    const pair = trySetBorder({ ...empty(), north: 'river' }, 'south', 'chasm');
    expect(pair.accepted).toBe(true);
    expect(trySetBorder(pair.layout, 'south', 'mountain').accepted).toBe(true);
    const cleared = trySetBorder(trySetBorder(pair.layout, 'north', null).layout, 'south', null);
    expect(trySetBorder(cleared.layout, 'east', 'mountain').accepted).toBe(true);
  });
});
