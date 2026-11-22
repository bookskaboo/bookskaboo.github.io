import { describe, expect, it, vi } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { tutorialNode } from '../tutorials/tutorialRuntime';

function state() {
  const game = createInitialState(301);
  game.isTraining = true;
  game.borderObstructionVersion = 0; game.borderObstructions = [];
  game.research.unlocked.push('joint', 'road'); game.research.completed.push('road');
  const home = game.sectors[game.activeSectorId];
  home.nodes = [tutorialNode('joint', 'a', 600, 600), tutorialNode('joint', 'b', 1200, 600)];
  home.connections = [];
  return game;
}

describe('factory command planning through the public facade', () => {
  it.each(['placement', 'movement', 'connection', 'deletion', 'control-group'] as const)(
    'uses the replacement active sector for %s without retaining the original factory', family => {
      const engine = new GameEngine(state(), { autosave: false });
      const old = engine.getState();
      const oldSnapshot = structuredClone(old);
      const replacement = state();
      const remote = structuredClone(replacement.sectors[replacement.activeSectorId]);
      remote.id = '6,5'; remote.x = 6; remote.unlocked = true;
      replacement.sectors[remote.id] = remote; replacement.activeSectorId = remote.id;
      engine.replaceState(replacement);
      const current = engine.getSector();
      if (family === 'placement') {
        expect(engine.getNodePlacementPreview('joint', 1800, 600)?.valid).toBe(true);
        expect(engine.placeNode('joint', 1800, 600)).toBeTruthy();
        expect(current.nodes).toHaveLength(3);
      } else if (family === 'movement') {
        const positions = { a: { x: 800, y: 1000 } };
        expect(engine.canMoveNodesTo(positions)).toBe(true);
        expect(current.nodes[0].x).toBe(600);
        expect(engine.tryMoveNodesTo(positions)).toBe(true);
        expect(current.nodes[0]).toMatchObject(positions.a);
      } else if (family === 'connection') {
        expect(engine.getConnectionFailure('a', 0, 'b', 0)).toBeUndefined();
        expect(engine.connectPorts('a', 0, 'b', 0)).toBe(true);
        expect(current.connections).toHaveLength(1);
      } else if (family === 'deletion') {
        engine.deleteNodes(['a']);
        expect(current.nodes.map(n => n.id)).toEqual(['b']);
      } else {
        const group = engine.createControlGroup(['a', 'b'], '#4E79A7');
        expect(group?.nodeIds).toEqual(['a', 'b']);
        expect(current.controlGroups).toEqual([group]);
      }
      expect(old).toEqual(oldSnapshot);
      expect(engine.getState().sectors['5,5'].nodes).toHaveLength(2);
      engine.undo();
      expect(engine.getSector().nodes).toHaveLength(2);
      expect(engine.getSector().connections).toEqual([]);
      expect(engine.getSector().controlGroups ?? []).toEqual([]);
    },
  );

  it('rechecks placement after a preview and leaves rejected commands out of history', () => {
    const engine = new GameEngine(state(), { autosave: false });
    const original = structuredClone(engine.getSector().nodes), published = vi.fn();
    engine.subscribe(published);
    expect(engine.getNodePlacementPreview('joint', 1800, 600)?.valid).toBe(true);
    expect(engine.placeNode('joint', 1800, 600)).toBeTruthy();
    expect(engine.placeNode('joint', 1800, 600)).toBeUndefined();
    expect(engine.connectPorts('a', 0, 'a', 0)).toBe(false);
    expect(engine.createControlGroup(['a', 'a'], '#4E79A7')).toBeUndefined();
    expect(engine.disbandControlGroup('absent')).toBe(false);
    engine.deleteNodes(['absent']);
    expect(published).toHaveBeenCalledTimes(1);
    engine.undo();
    expect(engine.getSector().nodes).toEqual(original);
    expect(published).toHaveBeenCalledTimes(2);
    engine.undo();
    expect(published).toHaveBeenCalledTimes(2);
  });

  it('keeps previews read-only and retains successful no-op movement checkpoints', () => {
    const engine = new GameEngine(state(), { autosave: false });
    const positions = { a: { x: 600, y: 600 } }, requested = structuredClone(positions);
    const before = structuredClone(engine.getState()), published = vi.fn();
    engine.subscribe(published);
    expect(engine.canMoveNodesTo(positions)).toBe(true);
    expect(engine.getState()).toEqual(before);
    expect(positions).toEqual(requested);
    engine.undo();
    expect(published).not.toHaveBeenCalled();
    expect(engine.tryMoveNodesTo(positions)).toBe(true);
    expect(published).not.toHaveBeenCalled();
    engine.undo();
    expect(published).toHaveBeenCalledTimes(1);
    engine.undo();
    expect(published).toHaveBeenCalledTimes(1);
  });
});
