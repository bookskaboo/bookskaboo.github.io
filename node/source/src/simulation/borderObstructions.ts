import { borderCrossingFailure, borderKey, borderSide, trySetBorder } from '../domain/borderObstructionLayout';
import type { BorderObstruction, MapBorderLayout, SharedBorderObstruction } from '../domain/borderObstructionLayout';
import type { GameState } from '../domain/types';
import { HOME_SECTOR_ID, worldGridBounds } from '../domain/worldGrid';

const empty = (): MapBorderLayout => ({ north: null, east: null, south: null, west: null });
function random(seed: number) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
const distance = (id: string) => id.split(',').map(Number).reduce((sum, n) => sum + Math.abs(n - 5), 0);
export function borderTargets(size: number) {
  const ratio = 2 * size * (size - 1) / 220;
  return { river: Math.round(16 * ratio), mountain: Math.round(12 * ratio), chasm: Math.round(8 * ratio) };
}
function gridGraph(size: number) {
  const { min, max } = worldGridBounds(size), graph = new Map<string, string[]>();
  for (let y = min; y <= max; y++) for (let x = min; x <= max; x++) {
    graph.set(`${x},${y}`, [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => a >= min && a <= max && b >= min && b <= max).map(p => p.join(',')));
  }
  return graph;
}
function pathLength(graph: Map<string, string[]>, blocked: Set<string>, from: string, to?: string, limit = Infinity) {
  const seen = new Map([[from, 0]]), queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i], d = seen.get(id)!;
    if (id === to) return d;
    if (d >= limit) continue;
    for (const next of graph.get(id) ?? []) if (!seen.has(next) && !blocked.has(borderKey(id, next))) { seen.set(next, d + 1); queue.push(next); }
  }
  return to ? Infinity : seen;
}
export function validateBorderWorld(edges: readonly SharedBorderObstruction[], size: number) {
  const graph = gridGraph(size), blocked = new Set<string>(), layouts = new Map<string, MapBorderLayout>();
  for (const edge of edges) {
    if (!['river', 'mountain', 'chasm'].includes(edge.kind) || !graph.get(edge.from)?.includes(edge.to) || blocked.has(borderKey(edge.from, edge.to))) return false;
    blocked.add(borderKey(edge.from, edge.to));
    for (const id of [edge.from, edge.to]) {
      const other = id === edge.from ? edge.to : edge.from;
      const result = trySetBorder(layouts.get(id) ?? empty(), borderSide(id, other), edge.kind);
      if (!result.accepted) return false;
      layouts.set(id, result.layout);
    }
  }
  if (blocked.has(borderKey('6,5', '7,5'))) return false;
  for (const [id, neighbors] of graph) if (neighbors.filter(n => !blocked.has(borderKey(id, n))).length < 2 || id === HOME_SECTOR_ID && neighbors.some(n => blocked.has(borderKey(id, n)))) return false;
  const lengths = pathLength(graph, blocked, HOME_SECTOR_ID) as Map<string, number>;
  // Every destination keeps a clear shortest route, including all progression sites.
  if ([...graph.keys()].some(id => lengths.get(id) !== distance(id))) return false;
  return edges.every(edge => (pathLength(graph, blocked, edge.from, edge.to, 3) as number) <= 3);
}
const cache = new Map<string, SharedBorderObstruction[]>();
export function borderQuadrantCount(edges: readonly SharedBorderObstruction[], kind: BorderObstruction) {
  return new Set(edges.filter(edge => edge.kind === kind).map(edge => {
    const [x, y] = edge.from.split(',').map(Number), [a, b] = edge.to.split(',').map(Number);
    return `${(x + a) / 2 >= 5 ? 'E' : 'W'}${(y + b) / 2 >= 5 ? 'S' : 'N'}`;
  })).size;
}
export function generateBorderObstructions(seed: number, size = 11): SharedBorderObstruction[] {
  const key = `${seed}:${size}`, saved = cache.get(key);
  if (saved) return saved.map(edge => ({ ...edge }));
  const graph = gridGraph(size), targets = borderTargets(size), total = Object.values(targets).reduce((a, b) => a + b, 0);
  const candidates = [...graph].flatMap(([from, neighbors]) => neighbors.filter(to => from < to).map(to => ({ from, to })));
  let best: SharedBorderObstruction[] = [];
  for (let attempt = 0; attempt < 48; attempt++) {
    const rng = random(seed ^ 0xb04de4 ^ Math.imul(attempt + 1, 0x9e3779b1)), edges: SharedBorderObstruction[] = [], layouts = new Map<string, MapBorderLayout>();
    for (const kind of ['chasm', 'mountain', 'river'] as BorderObstruction[]) {
      const range = kind === 'river' ? [1, 6] : kind === 'mountain' ? [3, 8] : [5, 9];
      const scale = (size - 1) / 10;
      const shuffled = candidates.filter(edge => { const tier = Math.min(distance(edge.from), distance(edge.to)); return tier >= Math.floor(range[0] * scale) && tier <= Math.ceil(range[1] * scale); }).map(edge => ({ ...edge, order: rng() })).sort((a, b) => a.order - b.order);
      let count = 0;
      for (const edge of shuffled) {
        if (count === targets[kind]) break;
        if (edges.some(e => borderKey(e.from, e.to) === borderKey(edge.from, edge.to))) continue;
        if ([edge.from, edge.to].some(id => { const layout = layouts.get(id) ?? empty(); return !trySetBorder(layout, borderSide(id, id === edge.from ? edge.to : edge.from), kind).accepted; })) continue;
        const next = [...edges, { from: edge.from, to: edge.to, kind }];
        if (!validateBorderWorld(next, size)) continue;
        edges.push(next[next.length - 1]); count++;
        for (const id of [edge.from, edge.to]) layouts.set(id, trySetBorder(layouts.get(id) ?? empty(), borderSide(id, id === edge.from ? edge.to : edge.from), kind).layout);
      }
    }
    if (edges.length > best.length) best = edges;
    if (edges.length === total && (['river', 'mountain', 'chasm'] as const).every(kind => borderQuadrantCount(edges, kind) >= 3)) { best = edges; break; }
  }
  // A bounded, deterministic valid subset is safer than an unbounded generator retry.
  if (cache.size >= 64) cache.delete(cache.keys().next().value!);
  cache.set(key, best);
  return best.map(edge => ({ ...edge }));
}
export function normalizeBorderLayout(version: unknown, value: unknown, size: number): { borderObstructionVersion: 0 | 1; borderObstructions: SharedBorderObstruction[] } {
  if (version === undefined || version === 0) return { borderObstructionVersion: 0, borderObstructions: [] };
  if (version !== 1 || !Array.isArray(value) || value.length > 2 * size * (size - 1)) throw Error('Unsupported or invalid border obstruction layout.');
  const edges = value.map(edge => ({ from: edge?.from, to: edge?.to, kind: edge?.kind })) as SharedBorderObstruction[];
  if (!validateBorderWorld(edges, size)) throw Error('Invalid border obstruction layout.');
  return { borderObstructionVersion: 1, borderObstructions: edges };
}
export function borderLayoutStatistics(edges: readonly SharedBorderObstruction[]) {
  return { ...Object.fromEntries(['river', 'mountain', 'chasm'].map(kind => [kind, edges.filter(edge => edge.kind === kind).length])), maps: new Set(edges.flatMap(edge => [edge.from, edge.to])).size };
}
export function borderRoadPermissionsValid(state: GameState) {
  return Object.values(state.sectors).every(sector => sector.nodes.every(node => !node.pairedSectorId || !borderCrossingFailure(state, sector.id, node.pairedSectorId)));
}
