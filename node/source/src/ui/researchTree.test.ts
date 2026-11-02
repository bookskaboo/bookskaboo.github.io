import { describe, expect, it } from 'vitest';
import { RESEARCH_PROJECTS } from '../content/research';
import { buildResearchTree, researchAncestors, researchTreeEdgePath, researchTreeLayout } from './researchTree';

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

  it('routes past intervening projects instead of drawing through their cards', () => {
    const source = { x: 60, y: 0, width: 180, height: 88 };
    const obstacle = { ...source, y: 140 }, target = { ...source, y: 280 };
    const path = researchTreeEdgePath(source, target, [source, obstacle, target], 300);
    expect(path).toContain('L 48 103');
    expect(path).toContain('L 48 263');
    expect(path).not.toContain('undefined');
  });

  it.each([260, 720, 1180])('fits a %s-pixel view without overlapping projects or placing children above parents', width => {
    const layout = researchTreeLayout(tree.nodes, width);
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
