import { describe, expect, it } from 'vitest';
import { JOINT_CONTROL_GRACE_MS, NodeControlHover } from './nodeControlHover';

describe('node control hover', () => {
  it('keeps Joint controls available across the gap to its buttons and grip', () => {
    const hover = new NodeControlHover();
    hover.enter('joint'); hover.leave('joint', 100, JOINT_CONTROL_GRACE_MS);
    expect(hover.visible('joint', 450)).toBe(true);
    hover.enter('joint');
    expect(hover.visible('joint', 900)).toBe(true);
    hover.leave('joint', 1000, JOINT_CONTROL_GRACE_MS);
    expect(hover.visible('joint', 1401)).toBe(false);
  });
  it('pins pressed controls through a long drag and clears on cancellation', () => {
    const hover = new NodeControlHover();
    hover.press('joint'); hover.leave('joint', 10, JOINT_CONTROL_GRACE_MS);
    expect(hover.visible('joint', 10000)).toBe(true);
    hover.release();
    expect(hover.visible('joint', 10000)).toBe(false);
    hover.press('joint'); hover.clear();
    expect(hover.visible('joint', 10000)).toBe(false);
  });
  it('ignores a stale child leave after entering another node', () => {
    const hover = new NodeControlHover();
    hover.enter('joint'); hover.enter('extractor'); hover.leave('joint', 100, JOINT_CONTROL_GRACE_MS);
    expect(hover.visible('extractor', 100)).toBe(true);
    expect(hover.visible('joint', 100)).toBe(false);
    hover.leave('extractor', 101);
    expect(hover.visible('extractor', 102)).toBe(false);
  });
});
