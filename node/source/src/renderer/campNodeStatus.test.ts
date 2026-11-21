import { describe, expect, it } from 'vitest';
import { Text } from 'pixi.js';
import { createCampNodeStatus, updateCampNodeStatus } from './campNodeStatus';
import { tutorialNode } from '../tutorials/tutorialRuntime';

describe('always-visible camp feedback', () => {
  it('keeps the AP card below an interior guarded reserve', () => {
    const node=tutorialNode('monster-camp','guarding-camp',0,0,{guardedDepositId:'reserve'}),view=createCampNodeStatus();
    updateCampNodeStatus(view,node,0,1);
    expect(view.root.y+view.ap.y).toBeGreaterThan(128);
    view.root.destroy({children:true});view.halo.destroy();
  });
  it('updates live AP and result color without changing socket input', () => {
    const node = tutorialNode('monster-camp', 'camp', 0, 0, { attackRequirement: 6, progressMs: 30000, input: { 'medium-suppression-bot': 2 } });
    const view = createCampNodeStatus();
    updateCampNodeStatus(view, node, 0, 1);
    expect(view.ap.text).toBe('AP 8 / 6');
    expect(view.root.children.filter(child=>child instanceof Text)).toEqual([view.ap]);
    node.campLastCheck = { passed: false, atMs: 0, suppliedAp: 0, requiredAp: 6 };
    updateCampNodeStatus(view, node, 1000, 1.5);
    expect(view.ap.style.fill).toBe(0xff6878);
    node.campLastCheck.passed = true;
    updateCampNodeStatus(view, node, 0, 1);
    expect(view.ap.style.fill).toBe(0x65e69b);
    expect(node.input['medium-suppression-bot']).toBe(2);
    view.root.destroy({ children: true }); view.halo.destroy();
  });
});
