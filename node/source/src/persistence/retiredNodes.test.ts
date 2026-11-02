import { describe, expect, it } from 'vitest';
import { NODE_DEFINITIONS } from '../content/nodes';
import { RECIPE_GROUPS, RECIPES } from '../content/recipes';
import { createInitialState, GameEngine } from '../simulation/engine';
import { normalizeLegacy } from './saves';

describe('retired Automata Core Assembler migration', () => {
  it('removes the machine catalog entry while retaining the regular Assembler recipe', () => {
    expect(Object.keys(NODE_DEFINITIONS)).not.toContain('automataCoreAssembler');
    expect(Object.keys(RECIPE_GROUPS)).not.toContain('automataCoreAssembler');
    expect(RECIPE_GROUPS.assembler).toContain('automata-core');
  });

  it('converts saved nodes and templates without losing buffers, progress or connections', () => {
    const state = createInitialState(301);
    const retired = {
      id: 'old', kind: 'automataCoreAssembler', name: 'Automata Core Assembler', x: 1000, y: 1000,
      rotation: 90, input: { 'circuit-a': 2, brick: 2 }, output: { 'automata-core': 1 },
      progressMs: 500, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
    };
    const payload = JSON.parse(JSON.stringify(state));
    payload.sectors['5,5'].nodes = [retired];
    payload.sectors['5,5'].connections = [{ id: 'edge', from: 'old', to: 'chest', fromPort: 0, toPort: 0, createdAt: 0 }];
    payload.factoryTemplates = [{ name: 'Old factory', nodes: [retired], connections: [] }];
    const loaded = normalizeLegacy(payload)!;
    const converted = loaded.sectors['5,5'].nodes[0];
    expect(converted).toEqual({ ...retired, kind: 'assembler', name: 'Assembler', recipeId: 'automata-core', cycleMs: RECIPES['automata-core'].cycleMs });
    expect(loaded.sectors['5,5'].connections).toEqual(payload.sectors['5,5'].connections);
    expect(loaded.factoryTemplates![0].nodes[0]).toEqual(converted);
    expect(new GameEngine(payload).getSector().nodes[0]).toMatchObject({ kind: 'assembler', recipeId: 'automata-core' });
    const engine = new GameEngine(state);
    engine.replaceState(payload);
    expect(engine.getSector().nodes[0].kind).toBe('assembler');
    expect(payload.sectors['5,5'].nodes[0].kind).toBe('automataCoreAssembler');
  });

  it('imports original-format dedicated machines as ordinary Assemblers', () => {
    const loaded = normalizeLegacy({
      version: 1, nodes: [{ id: 'old', kind: 'automataCoreAssembler', title: 'Automata Core Assembler' }],
      positions: { old: { x: 1000, y: 1000 } }, connections: [],
      runtime: { processors: { old: { inputs: { CIRCUIT_A: 1, BRICK: 1 }, progress: 100 } }, research: {} },
    })!;
    expect(loaded.sectors['5,5'].nodes[0]).toMatchObject({ kind: 'assembler', recipeId: 'automata-core', input: { 'circuit-a': 1, brick: 1 }, progressMs: 100 });
  });
});
