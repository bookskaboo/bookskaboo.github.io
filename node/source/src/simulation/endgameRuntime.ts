import { ALPHA_AP, CORNER_ITEMS, CORNER_NAMES, FOUNDRY_INPUTS, GROVE_GROWTH, RECLAMATION_VALUE, reconcileHole, seededCornerOrder, seededPairIndex } from '../content/endgame';
import { BOT_STRENGTH } from '../content/progression';
import { RECYCLER_RETURNS } from '../content/recycling';
import type { GameState, ItemId, MachineNode, SectorState } from '../domain/types';
import { DEFAULT_WORLD_GRID_SIZE, HOME_COORDINATE, worldCornerIds, worldGridSize } from '../domain/worldGrid';
import { canPlaceNode } from './collisions';
import { queueOutputs, reconcileQueue } from './mixedOutput';
import { obstructedConnections } from './obstructedConnections';

const CORNER_QUADRANTS = ['northwest', 'northeast', 'southeast', 'southwest'] as const;
const CAMP_EDGE_MARGIN = 24;

export function createCornerNodes(x: number, y: number, seed: number, field: { width: number; height: number }, order = seededCornerOrder(seed), gridSize = DEFAULT_WORLD_GRID_SIZE): MachineNode[] {
  const index = worldCornerIds(gridSize).indexOf(`${x},${y}`); if (index < 0) return [];
  const type = order[index], cx = field.width / 2, cy = field.height / 2;
  const base = { rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 0, constructedAt: 0, constructionMs: 0, cornerType: type };
  const challenge: MachineNode = {
    ...base, id: `corner-${x}-${y}`, kind: 'cornerChallenge', name: CORNER_NAMES[type],
    x: cx * (x < HOME_COORDINATE ? .5 : 1.5), y: cy * (y < HOME_COORDINATE ? .5 : 1.5), cornerProgress: 0,
    cornerCampQuadrant: CORNER_QUADRANTS[index], obstructionWidth: cx - CAMP_EDGE_MARGIN * 2, obstructionHeight: cy - CAMP_EDGE_MARGIN * 2,
  };
  const tribute: MachineNode = { ...base, id: `corner-tribute-${x}-${y}`, kind: 'cornerTribute', name: `${CORNER_NAMES[type]} Tribute`, x: cx, y: cy, capacity: 10, tributeCampId: challenge.id, input: {}, output: {} };
  return [challenge, tribute];
}

/** Upgrade old layouts and follow field expansion only when the entire move fits. */
export function syncCornerLayout(sector: SectorState, field: { width: number; height: number }, state: GameState) {
  const [campLayout, tributeLayout] = createCornerNodes(sector.x, sector.y, state.seed, field, state.endgame?.cornerOrder, worldGridSize(state));
  if (!campLayout || !tributeLayout) return;
  const oldCamp = sector.nodes.find(node => node.kind === 'cornerChallenge');
  const oldTribute = sector.nodes.find(node => node.kind === 'cornerTribute');
  const { x, y, cornerCampQuadrant, obstructionWidth, obstructionHeight } = campLayout;
  if (oldCamp?.x === x && oldCamp.y === y && oldCamp.cornerCampQuadrant === cornerCampQuadrant
    && oldCamp.obstructionWidth === obstructionWidth && oldCamp.obstructionHeight === obstructionHeight
    && oldTribute?.x === tributeLayout.x && oldTribute.y === tributeLayout.y && oldTribute.tributeCampId === oldCamp.id) return;

  const type = oldCamp?.cornerType ?? campLayout.cornerType!;
  const camp = oldCamp ? { ...oldCamp, x, y, cornerType: type, cornerCampQuadrant, obstructionWidth, obstructionHeight } : campLayout;
  const tribute = {
    ...(oldTribute ?? { ...tributeLayout, name: `${CORNER_NAMES[type]} Tribute` }),
    x: tributeLayout.x, y: tributeLayout.y, cornerType: type, tributeCampId: camp.id,
  };
  const nodes = sector.nodes.filter(node => node !== oldCamp && node !== oldTribute);
  nodes.push(camp, tribute);
  if (!canPlaceNode(camp, nodes, field) || !canPlaceNode(tribute, nodes, field)) return;
  const blocked = obstructedConnections({ ...sector, nodes });
  if (blocked.size) {
    const alreadyBlocked = obstructedConnections(sector);
    if ([...blocked].some(id => !alreadyBlocked.has(id))) return;
  }
  if (oldCamp) Object.assign(oldCamp, camp); else sector.nodes.push(camp);
  if (oldTribute) Object.assign(oldTribute, tribute); else sector.nodes.push(tribute);
}

export function initializeEndgame(state: GameState) {
  state.endgame ??= { version: 1, cornerOrder: seededCornerOrder(state.seed), pairIndex: seededPairIndex(state.seed) };
  state.rescue ??= { resources: [] };
  for (const sector of Object.values(state.sectors)) for (const node of sector.nodes) if (node.kind === 'big-hole') reconcileHole(node, state);
  if ((state.produced?.['final-core'] ?? 0) > 0) state.finalCoreProduced = true;
}

const total = (bag: MachineNode['input']) => Object.values(bag).reduce<number>((n, q) => n + (q ?? 0), 0);
export function cornerOutput(sector: SectorState, node: MachineNode) { return sector.nodes.find(n => n.kind === 'cornerTribute' && n.tributeCampId === node.id); }
export function cornerInputAllowed(sector: SectorState, node: MachineNode) {
  const box = cornerOutput(sector, node);
  // Foundry may collect its next full recipe while its output waits for collection.
  return node.cornerType === 'foundry' || Boolean(box && total(box.output) < 10);
}
export function simulateCorner(state: GameState, sector: SectorState, node: MachineNode) {
  const type = node.cornerType; if (!type) return;
  const box = cornerOutput(sector, node); if (!box || total(box.output) >= 10) return;
  const item = CORNER_ITEMS[type];
  const award = () => { box.output[item] = (box.output[item] ?? 0) + 1; state.endgame!.componentObtained = true; (state.produced ??= {})[item] = (state.produced?.[item] ?? 0) + 1; };
  if (type === 'foundry') {
    if (!Object.entries(FOUNDRY_INPUTS).every(([i, q]) => (node.input[i as ItemId] ?? 0) >= q!)) return;
    for (const [i, q] of Object.entries(FOUNDRY_INPUTS)) node.input[i as ItemId] = (node.input[i as ItemId] ?? 0) - q!;
    award(); return;
  }
  const threshold = type === 'alpha' ? ALPHA_AP : type === 'grove' ? GROVE_GROWTH : 1;
  node.cornerProgress ??= 0;
  const payRewards = () => { while (node.cornerProgress! + 1e-12 >= threshold && total(box.output) < 10) { node.cornerProgress = Math.max(0, node.cornerProgress! - threshold); award(); } };
  payRewards();
  // Consume one supplied unit at a time. Once output fills, retain the rest and all surplus.
  for (const input of Object.keys(node.input) as ItemId[]) {
    const credit = type === 'alpha' ? BOT_STRENGTH[input] : type === 'grove' ? input === 'forest-growth' ? 1 : 0 : RECLAMATION_VALUE[input];
    if (!credit) continue;
    while ((node.input[input] ?? 0) > 0 && total(box.output) < 10) { node.input[input]!--; node.cornerProgress += credit; payRewards(); }
  }
}

export function simulateRecycler(node: MachineNode, dt: number) {
  node.inputQueue = reconcileQueue(node.inputQueue, node.input);
  const item = node.inputQueue[0]; if (!item) { node.progressMs = 0; return; }
  const returns = RECYCLER_RETURNS[item]; if (!returns) return;
  const count = total(returns);
  if (count && total(node.output) + count > 10) return;
  node.progressMs += dt; if (node.progressMs < 2000) return;
  node.progressMs %= 2000;
  node.input[item]!--; node.inputQueue.shift(); queueOutputs(node, returns);
}
