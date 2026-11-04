import { describe, expect, it } from 'vitest';
import type { MachineNode } from '../domain/types';
import { resourceReserveFraction } from './playfieldNodeState';

describe('resource reserve bars', () => {
  it.each([1000, 750, 500, 250, 0])('shows the remaining fraction for %s of 1000 resources', remaining => {
    const node = { resourceRemaining: remaining, resourceCapacity: 1000 } as MachineNode;
    expect(resourceReserveFraction(node)).toBe(remaining / 1000);
  });

  it('increases again when a Forest regrows and remains accurate while paused', () => {
    const node = { kind: 'forest', resourceRemaining: 700, resourceCapacity: 1000, processingPaused: true } as MachineNode;
    expect(resourceReserveFraction(node)).toBe(.7);
    node.resourceRemaining = 800;
    expect(resourceReserveFraction(node)).toBe(.8);
  });

  it('keeps infinite reserves full and bounds empty or legacy reserves', () => {
    expect(resourceReserveFraction({ infiniteResource: true } as MachineNode)).toBe(1);
    expect(resourceReserveFraction({ resourceRemaining: 0, resourceCapacity: 0 } as MachineNode)).toBe(0);
    expect(resourceReserveFraction({ resourceRemaining: -1, resourceCapacity: 100 } as MachineNode)).toBe(0);
    expect(resourceReserveFraction({ resourceRemaining: 120, resourceCapacity: 100 } as MachineNode)).toBe(1);
    expect(resourceReserveFraction({ resourceRemaining: 50 } as MachineNode)).toBe(1);
  });
});
