import { describe, expect, it } from 'vitest';
import type { MachineNode, NodeKind } from '../domain/types';
import { tutorialNode } from '../tutorials/tutorialState';
import { createInitialState, GameEngine } from './engine';

function setup() {
  const state = createInitialState(1);
  state.sectors['5,5'].nodes = [];
  const engine = new GameEngine(state, { autosave: false });
  const add = (kind: NodeKind, id: string, patch: Partial<MachineNode> = {}) => {
    const node = tutorialNode(kind, id, 300 + engine.getSector().nodes.length * 450, 600, { constructionMs: 0, ...patch });
    engine.getSector().nodes.push(node);
    return node;
  };
  return { engine, add };
}

describe('material-aware logistics connections', () => {
  it.each(['splitter', 'merger', 'joint'] as const)('rejects Charcoal at a Copper socket through an empty %s', kind => {
    const { engine, add } = setup();
    const kiln = add('kiln', 'kiln', { recipeId: 'charcoal' });
    const router = add(kind, 'router');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-copper' });
    expect(engine.connect(kiln.id, router.id)).toBe(true);
    const before = structuredClone(engine.getSector().connections);
    expect(engine.connectPorts(router.id, 0, smelter.id, 0)).toBe(false);
    expect(engine.getConnectionFailure(router.id, 0, smelter.id, 0)).toMatchObject({ title: 'Incompatible socket', detail: expect.stringContaining('Charcoal') });
    expect(engine.getConnectionFailure(router.id, 0, smelter.id, 0)?.detail).toContain('Copper');
    expect(engine.getSector().connections).toEqual(before);
    expect(engine.connectPorts(router.id, 0, smelter.id, 1)).toBe(true);
  });

  it('finds the correct semantic input when automatically connecting a splitter', () => {
    const { engine, add } = setup();
    const kiln = add('kiln', 'kiln', { recipeId: 'charcoal' });
    const splitter = add('splitter', 'splitter');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-copper', connectorsMirrored: true, inputPortOrder: [1, 0] });
    expect(engine.connect(kiln.id, splitter.id)).toBe(true);
    expect(engine.connect(splitter.id, smelter.id)).toBe(true);
    expect(engine.getSector().connections.find(edge => edge.to === smelter.id)?.toPort).toBe(1);
  });

  it('checks downstream sockets when an input is attached after prewiring an empty chain', () => {
    const { engine, add } = setup();
    const kiln = add('kiln', 'kiln', { recipeId: 'charcoal' });
    const joint = add('joint', 'joint');
    const splitter = add('splitter', 'splitter');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-copper' });
    expect(engine.connectPorts(splitter.id, 0, smelter.id, 0)).toBe(true);
    expect(engine.connect(joint.id, splitter.id)).toBe(true);
    const before = structuredClone(engine.getSector().connections);
    expect(engine.connect(kiln.id, joint.id)).toBe(false);
    expect(engine.getSector().connections).toEqual(before);
    expect(engine.getConnectionFailure(kiln.id, 0, joint.id, 0)?.title).toBe('Incompatible socket');
  });

  it('keeps valid mixed-material smart branches and selected Filter output working', () => {
    const { engine, add } = setup();
    const chest = add('woodenChest', 'chest', { output: { charcoal: 1, copper: 1 } });
    const splitter = add('splitter', 'splitter');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-copper' });
    expect(engine.connectPorts(splitter.id, 0, smelter.id, 0)).toBe(true);
    expect(engine.connectPorts(splitter.id, 1, smelter.id, 1)).toBe(true);
    expect(engine.connect(chest.id, splitter.id)).toBe(true);
    const filter = add('filter', 'filter', { filterItem: 'copper' });
    const second = add('smelter', 'second', { recipeId: 'smelt-copper' });
    expect(engine.connectPorts(filter.id, 0, second.id, 0)).toBe(true);
    expect(engine.connectPorts(filter.id, 0, second.id, 1)).toBe(false);
  });

  it('does not transfer through an invalid socket left in an older save', () => {
    const { engine, add } = setup();
    const kiln = add('kiln', 'kiln', { recipeId: 'charcoal', output: { charcoal: 5 }, processingPaused: true });
    const splitter = add('splitter', 'splitter');
    const smelter = add('smelter', 'smelter', { recipeId: 'smelt-copper' });
    engine.getSector().connections = [
      { id: 'feed', from: kiln.id, to: splitter.id, fromPort: 0, toPort: 0, createdAt: 0 },
      { id: 'old-invalid', from: splitter.id, to: smelter.id, fromPort: 0, toPort: 0, createdAt: 0 },
    ];
    engine.tick(2000);
    expect(smelter.input).toEqual({});
    expect(kiln.output.charcoal).toBe(5);
  });
});
