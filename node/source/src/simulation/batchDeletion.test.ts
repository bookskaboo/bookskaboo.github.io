import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';

describe('batch node deletion', () => {
  it('removes the selected group and its cables as one undoable operation', () => {
    const engine = new GameEngine(createInitialState(1), { autosave: false });
    engine.getState().research.unlocked.push('road');
    const first = engine.placeNode('woodenChest', 1100, 650)!;
    engine.getState().research.unlocked.push('road');
    const second = engine.placeNode('woodenChest', 1500, 650)!;
    expect(first).toBeTruthy(); expect(second).toBeTruthy();
    expect(engine.connect('ironExtractor', first)).toBe(true);
    expect(engine.connect(first, second)).toBe(true);
    const group = engine.createControlGroup([first, second], '#4E79A7');
    expect(group).toBeTruthy();
    const before = structuredClone(engine.getSector());
    engine.deleteNodes([first, second]);
    expect(engine.getSector().nodes).toEqual(before.nodes.filter(node => ![first, second].includes(node.id)));
    expect(engine.getSector().connections).toHaveLength(0);
    expect(engine.getSector().controlGroups).toEqual([]);
    engine.undo();
    expect(engine.getSector().nodes).toEqual(before.nodes);
    expect(engine.getSector().connections).toEqual(before.connections);
    expect(engine.getSector().controlGroups).toEqual(before.controlGroups);
  });
  it('keeps protected and non-deletable nodes when they appear in the selection', () => {
    const engine = new GameEngine(createInitialState(1), { autosave: false });
    engine.getState().research.unlocked.push('road');
    const first = engine.placeNode('woodenChest', 1100, 650)!;
    engine.getState().research.unlocked.push('road');
    const protectedId = engine.placeNode('woodenChest', 1500, 650)!;
    const protectedNode = engine.getSector().nodes.find(node => node.id === protectedId)!;
    protectedNode.protected = true;
    engine.deleteNodes([first, protectedId, 'forest', 'missing']);
    expect(engine.getSector().nodes.find(node => node.id === first)).toBeUndefined();
    expect(engine.getSector().nodes).toContainEqual(protectedNode);
    expect(engine.getSector().nodes.some(node => node.id === 'forest')).toBe(true);
  });
});
