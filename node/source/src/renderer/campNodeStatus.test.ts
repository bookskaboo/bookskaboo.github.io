import { describe, expect, it } from 'vitest';
import { createCampNodeStatus, updateCampNodeStatus } from './campNodeStatus';
import { tutorialNode } from '../tutorials/tutorialRuntime';

describe('always-visible camp feedback', () => {
  it('updates live AP, countdown, and last-result color without changing socket input', () => {
    const node = tutorialNode('monster-camp', 'camp', 0, 0, { attackRequirement: 6, progressMs: 30000, input: { 'medium-suppression-bot': 2 } });
    const view = createCampNodeStatus();
    updateCampNodeStatus(view, node, 0, 1);
    expect(view.ap.text).toBe('AP 6 / 6'); expect(view.check.text).toBe('FIRST CHECK · 30s');
    node.campLastCheck = { passed: false, atMs: 0, suppliedAp: 0, requiredAp: 6 };
    updateCampNodeStatus(view, node, 1000, 1.5);
    expect(view.ap.style.fill).toBe(0xff6878); expect(view.check.text).toBe('FAILED · 29s');
    node.campLastCheck.passed = true;
    updateCampNodeStatus(view, node, 0, 1);
    expect(view.ap.style.fill).toBe(0x65e69b); expect(view.check.text).toBe('PASSED · 30s');
    expect(node.input['medium-suppression-bot']).toBe(2);
    view.root.destroy({ children: true }); view.halo.destroy();
  });
});
