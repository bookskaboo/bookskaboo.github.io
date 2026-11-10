import { MACHINE_EFFICIENCY_FAMILIES, RESEARCH_PROJECTS } from '../content/research';
import { FINAL_CORE_PRODUCTION } from '../content/endgame';
import type { GameState, ResearchProject } from '../domain/types';
import { researchDependencies, researchSection, visibleResearchRequirements } from './researchPresentation';

export interface ResearchTreeNode { project: ResearchProject; dependencies: string[]; depth: number }
export interface ResearchTree { nodes: ResearchTreeNode[]; edges: Array<{ from: string; to: string }> }
export interface ResearchTreePosition { x: number; y: number; width: number; height: number }
export interface ResearchTreeGroup { anchorId: string; name: string; ranks: ResearchTreeNode[] }

/** Remove redundant direct lines while retaining every prerequisite through a path. */
export function buildResearchTree(projects = RESEARCH_PROJECTS): ResearchTree {
  const ids = new Set(projects.map(project => project.id));
  const dependencies = new Map(projects.map(project => {
    const parents = researchDependencies(project).map(id => id === FINAL_CORE_PRODUCTION ? 'cornerComponents' : id);
    return [project.id, [...new Set(parents.filter(id => ids.has(id)))]];
  }));
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

export function researchTreeGroups(tree: ResearchTree): ResearchTreeGroup[] {
  return MACHINE_EFFICIENCY_FAMILIES.flatMap(([family, name]) => {
    const ranks = tree.nodes.filter(node => node.project.id.replace(/\d+$/, '') === family && node.project.id !== family)
      .sort((a, b) => a.depth - b.depth);
    if (ranks.length < 2) return [];
    const ids = new Set(ranks.map(node => node.project.id));
    // A project outside the group must keep its exact rank prerequisite visible.
    if (tree.edges.some(edge => ids.has(edge.from) && !ids.has(edge.to))) return [];
    return [{ anchorId: ranks[0].project.id, name: `${name} upgrades`, ranks }];
  });
}

export function visibleResearchTreeNodes(tree: ResearchTree, groups: ResearchTreeGroup[], expanded: ReadonlySet<string>, query: string, pinnedPath: ReadonlySet<string>) {
  const value = query.trim().toLowerCase();
  if (value) {
    const visible = new Set(pinnedPath);
    for (const { project } of tree.nodes) {
      if (project.name.toLowerCase().includes(value)) {
        for (const id of researchAncestors(tree, project.id)) visible.add(id);
      }
    }
    return tree.nodes.filter(node => visible.has(node.project.id));
  }
  const hidden = new Set(groups.filter(group => !expanded.has(group.anchorId))
    .flatMap(group => group.ranks.slice(1).map(node => node.project.id)));
  return tree.nodes.filter(node => !hidden.has(node.project.id) || pinnedPath.has(node.project.id));
}

export function researchMainPath(tree: ResearchTree) {
  const nodes = new Map(tree.nodes.map(node => [node.project.id, node]));
  const path = new Set<string>();
  for (let node = nodes.get('victory'); node;) {
    path.add(node.project.id);
    node = node.dependencies.map(id => nodes.get(id)!).sort((a, b) => b.depth - a.depth)[0];
  }
  return path;
}

export function researchPathSteps(tree: ResearchTree, lineage: ReadonlySet<string>, game: GameState) {
  const ids = new Set<string>();
  let needsFinalCore = false;
  for (const { project } of tree.nodes) {
    if (!lineage.has(project.id)) continue;
    const section = researchSection(project, game);
    if (section === 'completed') continue;
    if (section !== 'future') ids.add(project.id);
    else if (game.research.completed.includes('cornerComponents')) {
      const missing = visibleResearchRequirements(project, game);
      if (missing.length === 1 && missing[0] === FINAL_CORE_PRODUCTION) needsFinalCore = true;
    }
  }
  return { ids, needsFinalCore };
}

/** Wrap each dependency layer to fit the screen; every parent remains above its children. */
export function researchTreeLayout(nodes: ResearchTreeNode[], availableWidth: number, mainPath: ReadonlySet<string> = new Set()) {
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
    const primary = columns >= 2 ? layer.find(node => mainPath.has(node.project.id)) : undefined;
    const center = (width - cardWidth) / 2;
    if (primary) positions.set(primary.project.id, { x: center, y: top, width: cardWidth, height: cardHeight });
    const remaining = layer.filter(node => node !== primary);
    const placeBeside = Boolean(primary && columns >= 3);
    const rowsBeforeSides = primary && !placeBeside ? 1 : 0;
    const perRow = placeBeside ? Math.floor((columns - 1) / 2) * 2 : columns;
    const rows = Math.max(1, Math.ceil(remaining.length / perRow) + rowsBeforeSides);
    remaining.forEach((node, index) => {
      const row = Math.floor(index / perRow), count = Math.min(perRow, remaining.length - row * perRow);
      const column = index % perRow;
      const leftCount = Math.ceil(count / 2);
      const offset = placeBeside ? column - leftCount + (column >= leftCount ? 1 : 0) : column - ((rowsBeforeSides ? perRow : count) - 1) / 2;
      positions.set(node.project.id, { x: center + offset * (cardWidth + columnGap), y: top + (row + rowsBeforeSides) * (cardHeight + rowGap), width: cardWidth, height: cardHeight });
    });
    top += rows * cardHeight + (rows - 1) * rowGap + 82;
  }
  return { positions, width, height: Math.max(160, top - 58) };
}

/** Longer links use clear side channels so intervening cards cannot look connected. */
export function researchTreeEdgePath(from: ResearchTreePosition, to: ResearchTreePosition, positions: Iterable<ResearchTreePosition>, width: number) {
  const sx = from.x + from.width / 2, sy = from.y + from.height + 1, tx = to.x + to.width / 2, ty = to.y - 3;
  const obstacles = [...positions].filter(position => position !== from && position !== to && position.y < ty && position.y + position.height > sy);
  if (sx === tx && obstacles.every(position => sx < position.x || sx > position.x + position.width)) {
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }
  if (!obstacles.length) {
    const bend = Math.max(24, (ty - sy) / 2);
    return `M ${sx} ${sy} C ${sx} ${sy + bend}, ${tx} ${ty - bend}, ${tx} ${ty}`;
  }
  const lanes = [4, width - 4, ...obstacles.flatMap(position => [position.x - 12, position.x + position.width + 12])]
    .filter(x => x >= 4 && x <= width - 4 && obstacles.every(position => x <= position.x - 8 || x >= position.x + position.width + 8));
  const lane = lanes.sort((a, b) => Math.abs(a - sx) + Math.abs(a - tx) - Math.abs(b - sx) - Math.abs(b - tx))[0];
  return `M ${sx} ${sy} L ${sx} ${sy + 14} L ${lane} ${sy + 14} L ${lane} ${ty - 14} L ${tx} ${ty - 14} L ${tx} ${ty}`;
}
