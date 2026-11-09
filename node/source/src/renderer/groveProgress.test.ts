import { describe, expect, it } from 'vitest';
import { GROVE_GROWTH } from '../content/endgame';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { groveProgress } from './groveProgress';

describe('Grove cumulative progress', () => {
  it('shows exact sub-percent growth and uses saved cumulative work rather than cycle time', () => {
    const node = tutorialNode('cornerChallenge', 'grove', 500, 500, { cornerType: 'grove', cornerProgress: 1, progressMs: 0 });
    expect(groveProgress(node)).toEqual({ fraction: 1 / GROVE_GROWTH, label: '1 / 1,000' });
    node.cornerProgress = GROVE_GROWTH / 2;
    expect(groveProgress(node)).toEqual({ fraction: .5, label: '500 / 1,000' });
  });

  it('shows Tribute inventory independently of the next component progress', () => {
    const node = tutorialNode('cornerTribute', 'tribute', 500, 500, { cornerType: 'grove', capacity: 10, output: { 'grove-component': 3 } });
    expect(groveProgress(node)).toEqual({ fraction: .3, label: '3 / 10' });
    node.output['grove-component'] = 10;
    expect(groveProgress(node)?.fraction).toBe(1);
    expect(groveProgress(tutorialNode('kiln', 'kiln', 0, 0))).toBeUndefined();
  });
});
