import { describe, expect, it } from 'vitest';
import { RESEARCH_PROJECTS } from '../content/research';
import { createInitialState } from '../simulation/engine';
import { buildResearchTree, researchAncestors, researchMainPath, researchPathSteps, researchTreeEdgePath, researchTreeGroups, researchTreeLayout, visibleResearchTreeNodes } from './researchTree';

describe('research dependency tree', () => {
  const tree = buildResearchTree();

  it('includes every project exactly once, with all prerequisite paths flowing downward', () => {
    expect(tree.nodes.map(node => node.project.id).sort()).toEqual(RESEARCH_PROJECTS.map(project => project.id).sort());
    expect(new Set(tree.nodes.map(node => node.project.id)).size).toBe(RESEARCH_PROJECTS.length);
    const depths = new Map(tree.nodes.map(node => [node.project.id, node.depth]));
    for (const edge of tree.edges) expect(depths.get(edge.from)).toBeLessThan(depths.get(edge.to)!);
    for (const id of ['joint', 'kiln', 'smelter']) expect(depths.get(id)).toBe(0);
  });

  it('includes required core access and milestone prerequisites', () => {
    expect([...researchAncestors(tree, 'extractor1')]).toEqual(expect.arrayContaining(['extractor1', 'refiner', 'smelter']));
    expect([...researchAncestors(tree, 'connectorMirroring')]).toEqual(expect.arrayContaining(['hydraulicAssembly', 'hydrochemistry', 'automataCore', 'assembler', 'refiner']));
  });

  it('removes redundant lines while preserving indirect dependencies', () => {
    const node = tree.nodes.find(node => node.project.id === 'connectorMirroring')!;
    expect(node.dependencies).toEqual(['hydraulicAssembly']);
    expect(researchAncestors(tree, node.project.id).has('automataCore')).toBe(true);
  });

  it('shows initial dependencies for repeatable research', () => {
    const parents = researchAncestors(tree, 'mapNode');
    expect(parents.has('exploration')).toBe(true);
    expect(parents.has('assembler')).toBe(true);
    expect(parents.has('hydraulicAssembly')).toBe(false);
  });

  it('folds six-rank machine families and keeps individual ranks available to expand or search', () => {
    const groups = researchTreeGroups(tree);
    expect(groups).toHaveLength(9);
    const collapsed = visibleResearchTreeNodes(tree, groups, new Set(), '', new Set());
    expect(collapsed).toHaveLength(tree.nodes.length - 45);
    expect(collapsed.map(node => node.project.id)).toContain('kiln1');
    expect(collapsed.map(node => node.project.id)).not.toContain('kiln6');

    const expanded = visibleResearchTreeNodes(tree, groups, new Set(['kiln1']), '', new Set());
    expect(expanded).toHaveLength(collapsed.length + 5);
    expect(expanded.map(node => node.project.id)).toContain('kiln6');

    const pinnedPath = researchAncestors(tree, 'road');
    const results = visibleResearchTreeNodes(tree, groups, new Set(), 'Kiln 6', pinnedPath);
    expect(new Set(results.map(node => node.project.id))).toEqual(new Set([...researchAncestors(tree, 'kiln6'), ...pinnedPath]));
  });

  it('marks the reachable prerequisite frontier and recognizes the first Final Core gate', () => {
    const game = createInitialState(1);
    const lineage = researchAncestors(tree, 'victory');
    expect(researchPathSteps(tree, lineage, game)).toEqual({ ids: new Set(['smelter']), needsFinalCore: false });

    game.research.completed = [...lineage].filter(id => id !== 'victory');
    expect(researchPathSteps(tree, lineage, game)).toEqual({ ids: new Set(), needsFinalCore: true });

    game.research.completed.push('finalCoreProduction');
    expect(researchPathSteps(tree, lineage, game)).toEqual({ ids: new Set(['victory']), needsFinalCore: false });
  });

  it('routes past intervening projects instead of drawing through their cards', () => {
    const source = { x: 60, y: 0, width: 180, height: 88 };
    const obstacle = { ...source, y: 140 }, target = { ...source, y: 280 };
    const path = researchTreeEdgePath(source, target, [source, obstacle, target], 300);
    expect(path).toContain('L 48 103');
    expect(path).toContain('L 48 263');
    expect(path).not.toContain('undefined');
    expect(researchTreeEdgePath(source, target, [source, { ...obstacle, x: 260 }, target], 500)).toBe('M 150 89 L 150 277');
  });

  it.each([260, 360, 720, 1180])('fits a %s-pixel view without overlapping projects or placing children above parents', width => {
    const mainPath = researchMainPath(tree);
    const layout = researchTreeLayout(tree.nodes, width, mainPath);
    expect(mainPath.has('victory')).toBe(true);
    expect(new Set([...mainPath].map(id => layout.positions.get(id)!.x)).size).toBe(1);
    const positions = [...layout.positions.values()];
    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x + position.width).toBeLessThanOrEqual(layout.width);
      expect(position.y + position.height).toBeLessThanOrEqual(layout.height);
    }
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i], b = positions[j];
      expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y).toBe(false);
    }
    for (const edge of tree.edges) {
      const parent = layout.positions.get(edge.from)!, child = layout.positions.get(edge.to)!;
      expect(parent.y + parent.height).toBeLessThan(child.y);
    }
  });
});
