import { RESEARCH_PROJECTS } from '../content/research';
import type { ResearchProject } from '../domain/types';
import { researchDependencies } from './researchPresentation';

export interface ResearchTreeNode { project: ResearchProject; dependencies: string[]; depth: number }
export interface ResearchTree { nodes: ResearchTreeNode[]; edges: Array<{ from: string; to: string }> }
export interface ResearchTreePosition { x: number; y: number; width: number; height: number }

/** Remove redundant direct lines while retaining every prerequisite through a path. */
export function buildResearchTree(projects = RESEARCH_PROJECTS): ResearchTree {
  const ids = new Set(projects.map(project => project.id));
  const dependencies = new Map(projects.map(project => [project.id, researchDependencies(project).filter(id => ids.has(id))]));
  const depths = new Map<string, number>(), ancestors = new Map<string, Set<string>>();
  const visit = (id: string, visiting = new Set<string>()): Set<string> => {
    if (visiting.has(id)) throw new Error(`Circular research dependency: ${id}`);
    const cached = ancestors.get(id); if (cached) return cached;
    visiting.add(id);
    const parents = dependencies.get(id) ?? [], all = new Set<string>();
    for (const parent of parents) { all.add(parent); for (const ancestor of visit(parent, visiting)) all.add(ancestor); }
    visiting.delete(id);
    depths.set(id, parents.length ? 1 + Math.max(...parents.map(parent => depths.get(parent)!)) : 0);
    ancestors.set(id, all);
    return all;
  };
  projects.forEach(project => visit(project.id));
  const nodes = projects.map(project => {
    const parents = dependencies.get(project.id)!;
    return { project, depth: depths.get(project.id)!, dependencies: parents.filter(parent => !parents.some(other => other !== parent && ancestors.get(other)!.has(parent))) };
  });
  return { nodes, edges: nodes.flatMap(node => node.dependencies.map(from => ({ from, to: node.project.id }))) };
}

export function researchAncestors(tree: ResearchTree, id: string) {
  const byId = new Map(tree.nodes.map(node => [node.project.id, node]));
  const ancestors = new Set<string>();
  const visit = (current: string) => {
    if (ancestors.has(current)) return;
    ancestors.add(current);
    byId.get(current)?.dependencies.forEach(visit);
  };
  visit(id);
  return ancestors;
}

/** Wrap each dependency layer to fit the screen; every parent remains above its children. */
export function researchTreeLayout(nodes: ResearchTreeNode[], availableWidth: number) {
  const width = Math.max(200, availableWidth), cardWidth = Math.min(136, width - 24), cardHeight = 52, columnGap = 28, rowGap = 44;
  const columns = Math.max(1, Math.floor((width - 24 + columnGap) / (cardWidth + columnGap)));
  const positions = new Map<string, ResearchTreePosition>();
  let top = 24;
  for (const depth of [...new Set(nodes.map(node => node.depth))].sort((a, b) => a - b)) {
    const parentCenter = (node: ResearchTreeNode) => {
      const parents = node.dependencies.map(id => positions.get(id)).filter((position): position is ResearchTreePosition => Boolean(position));
      return parents.length ? parents.reduce((sum, position) => sum + position.x + position.width / 2, 0) / parents.length : width / 2;
    };
    const layer = nodes.filter(node => node.depth === depth).sort((a, b) => parentCenter(a) - parentCenter(b));
    const rows = Math.ceil(layer.length / columns);
    layer.forEach((node, index) => {
      const row = Math.floor(index / columns), count = Math.min(columns, layer.length - row * columns);
      const left = (width - count * cardWidth - (count - 1) * columnGap) / 2;
      positions.set(node.project.id, { x: left + (index % columns) * (cardWidth + columnGap), y: top + row * (cardHeight + rowGap), width: cardWidth, height: cardHeight });
    });
    top += rows * cardHeight + (rows - 1) * rowGap + 82;
  }
  return { positions, width, height: Math.max(160, top - 58) };
}

/** Longer links use clear side channels so intervening cards cannot look connected. */
export function researchTreeEdgePath(from: ResearchTreePosition, to: ResearchTreePosition, positions: Iterable<ResearchTreePosition>, width: number) {
  const sx = from.x + from.width / 2, sy = from.y + from.height + 1, tx = to.x + to.width / 2, ty = to.y - 3;
  const obstacles = [...positions].filter(position => position !== from && position !== to && position.y < ty && position.y + position.height > sy);
  if (!obstacles.length) {
    const bend = Math.max(24, (ty - sy) / 2);
    return `M ${sx} ${sy} C ${sx} ${sy + bend}, ${tx} ${ty - bend}, ${tx} ${ty}`;
  }
  const lanes = [4, width - 4, ...obstacles.flatMap(position => [position.x - 12, position.x + position.width + 12])]
    .filter(x => x >= 4 && x <= width - 4 && obstacles.every(position => x <= position.x - 8 || x >= position.x + position.width + 8));
  const lane = lanes.sort((a, b) => Math.abs(a - sx) + Math.abs(a - tx) - Math.abs(b - sx) - Math.abs(b - tx))[0];
  return `M ${sx} ${sy} L ${sx} ${sy + 14} L ${lane} ${sy + 14} L ${lane} ${ty - 14} L ${tx} ${ty - 14} L ${tx} ${ty}`;
}
