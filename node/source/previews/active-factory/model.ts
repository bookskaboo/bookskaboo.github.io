import { NODE_DEFINITIONS } from '../../src/content/nodes';
import { RECIPES } from '../../src/content/recipes';
import type { GameState, MachineNode, NodeKind } from '../../src/domain/types';
import { createInitialState } from '../../src/simulation/engine';

export const LOADS = [150, 300, 600] as const;
export const DENSE_LOADS = [600, 1200, 2400] as const;
export type FactoryLoad = typeof LOADS[number] | typeof DENSE_LOADS[number];
export type FactoryLayout = 'lines' | 'dense' | 'standard';
export const DENSE_CELL_NODES = 20;
export const factoryLoads = (layout: FactoryLayout): readonly FactoryLoad[] => layout === 'standard' ? [600] : layout === 'dense' ? DENSE_LOADS : LOADS;
export const SINK_CAPACITY = 1_000_000;

// All recipes and cycles come from the current game. Only supply and final
// storage are synthetic, so branches keep running during a long inspection.
const CHAINS: Array<{ first: NodeKind; firstRecipe: string; second: NodeKind; secondRecipe: string; secondPort: number }> = [
  { first: 'smelter', firstRecipe: 'smelt-iron', second: 'refiner', secondRecipe: 'iron-gear', secondPort: 0 },
  { first: 'smelter', firstRecipe: 'smelt-copper', second: 'refiner', secondRecipe: 'copper-wire', secondPort: 0 },
  { first: 'refiner', firstRecipe: 'brick', second: 'assembler', secondRecipe: 'automata-core', secondPort: 1 },
  { first: 'assembler', firstRecipe: 'motor', second: 'assembler', secondRecipe: 'robot-frame', secondPort: 1 },
];

export function createActiveFactory(load: typeof LOADS[number] = 300): GameState {
  const state = createInitialState(20261118);
  const sector = state.sectors[state.activeSectorId];
  state.progressionVersion = 1;
  state.isTraining = true; // No resource-recovery assistance in this synthetic world.
  state.fieldSizeScale = 2;
  state.research.completed = ['kiln', 'smelter', 'refiner', 'assembler', 'simpleCore', 'basicCore', 'automataCore', 'suppressionBot', 'areaExpansion1', 'areaExpansion2'];
  state.research.unlocked = [...state.research.completed];
  state.research.selected = undefined;
  sector.nodes = [];
  sector.connections = [];
  sector.visited = true;
  sector.name = 'Active factory test';
  state.preferences.particles = true;
  state.preferences.showGrid = false;
  const branches = load / 5;
  const columns = load === 600 ? 8 : 6;
  const add = (branch: number, role: string, kind: NodeKind, x: number, y: number, recipeId?: string) => {
    const node: MachineNode = {
      id: `load-${branch}-${role}`, kind, name: NODE_DEFINITIONS[kind].name,
      x, y, rotation: 0, input: {}, output: {}, progressMs: recipeId ? (branch % 10) / 10 * RECIPES[recipeId].cycleMs : 0,
      cycleMs: recipeId ? RECIPES[recipeId].cycleMs : 1000,
      constructedAt: 0, constructionMs: 0, recipeId,
      ...(kind === 'warehouse' ? { capacity: SINK_CAPACITY } : {}),
    };
    sector.nodes.push(node);
    return node;
  };
  const connect = (from: MachineNode, to: MachineNode, toPort = 0) => {
    sector.connections.push({ id: `${from.id}>${to.id}:${toPort}`, from: from.id, to: to.id, fromPort: 0, toPort, createdAt: 0 });
  };
  for (let branch = 0; branch < branches; branch++) {
    const chain = CHAINS[branch % CHAINS.length];
    const x = 32 + branch % columns * 1312;
    const y = 224 + Math.floor(branch / columns) * 448;
    const source = add(branch, 'source', 'devSource', x + 128, y);
    const first = add(branch, 'first', chain.first, x + 416, y, chain.firstRecipe);
    const second = add(branch, 'second', chain.second, x + 704, y, chain.secondRecipe);
    const cart = add(branch, 'cart', 'woodenChest', x + 944, y);
    const sink = add(branch, 'sink', 'warehouse', x + 1152, y);
    Object.keys(RECIPES[chain.firstRecipe].inputs).forEach((_, port) => connect(source, first, port));
    connect(first, second, chain.secondPort);
    Object.keys(RECIPES[chain.secondRecipe].inputs).forEach((_, port) => {
      if (port !== chain.secondPort) connect(source, second, port);
    });
    connect(second, cart);
    connect(cart, sink);
  }
  return state;
}

/** Compact, valid fan-out/fan-in cells, with ordinary recipe and routing timing. */
export function createDenseFactory(load: typeof DENSE_LOADS[number] = 1200): GameState {
  const state = createActiveFactory(300);
  const sector = state.sectors[state.activeSectorId];
  sector.nodes = []; sector.connections = [];
  state.research.completed.push('splitter', 'merger', 'joint');
  state.research.unlocked = [...state.research.completed];
  const cells = load / DENSE_CELL_NODES;
  const columns = Math.min(10, Math.ceil(Math.sqrt(cells * .5)) + 2);
  const add = (cell: number, role: string, kind: NodeKind, x: number, y: number, recipeId?: string): MachineNode => {
    const node: MachineNode = {
      id: `dense-${cell}-${role}`, kind, name: NODE_DEFINITIONS[kind].name,
      x, y, rotation: 0, input: {}, output: {},
      recipeId, cycleMs: recipeId ? RECIPES[recipeId].cycleMs : 1000,
      progressMs: recipeId ? ((cell * 3 + role.length) % 17) / 17 * RECIPES[recipeId].cycleMs : 0,
      constructedAt: 0, constructionMs: 0,
      ...(kind === 'warehouse' ? { capacity: SINK_CAPACITY } : {}),
    };
    sector.nodes.push(node); return node;
  };
  const connect = (from: MachineNode, to: MachineNode, fromPort = 0, toPort = 0) => {
    sector.connections.push({ id: `${from.id}:${fromPort}>${to.id}:${toPort}`, from: from.id, to: to.id, fromPort, toPort, createdAt: 0 });
  };
  for (let cell = 0; cell < cells; cell++) {
    const chain = CHAINS[cell % CHAINS.length];
    const x = 256 + cell % columns * 1024, y = 256 + Math.floor(cell / columns) * 512;
    const source = add(cell, 'source', 'devSource', x + 128, y + 128);
    const first = add(cell, 'first', chain.first, x + 128, y + 384, chain.firstRecipe);
    const secondA = add(cell, 'second-a', chain.second, x + 416, y + 128, chain.secondRecipe);
    const secondB = add(cell, 'second-b', chain.second, x + 416, y + 384, chain.secondRecipe);
    const sink = add(cell, 'sink', 'warehouse', x + 832, y + 128);
    const cart = add(cell, 'cart', 'woodenChest', x + 832, y + 384);
    const splitterPositions = [[608, 64], [608, 320], [672, 64], [672, 320], [736, 288], [864, 288], [736, 480]];
    const mergerPositions = [[608, 192], [608, 448], [672, 192], [672, 448], [800, 288], [928, 288], [928, 480]];
    const splitters = splitterPositions.map(([dx, dy], i) => add(cell, `split-${i}`, 'splitter', x + dx, y + dy));
    const mergers = mergerPositions.map(([dx, dy], i) => add(cell, `merge-${i}`, 'merger', x + dx, y + dy));
    Object.keys(RECIPES[chain.firstRecipe].inputs).forEach((_, port) => connect(source, first, 0, port));
    connect(first, splitters[0]);
    for (const [branch, second] of [secondA, secondB].entries()) {
      connect(splitters[0], second, branch, chain.secondPort);
      Object.keys(RECIPES[chain.secondRecipe].inputs).forEach((_, port) => {
        if (port !== chain.secondPort) connect(source, second, 0, port);
      });
      connect(second, mergers[0], 0, branch);
    }
    // Two four-route blocks exercise both outlets of every Splitter and both
    // inlets of every Merger without changing materials or creating cycles.
    const block = (input: MachineNode, split: number, left: number, right: number, merge: number) => {
      connect(input, splitters[split]);
      for (const [port, branch] of [left, right].entries()) {
        connect(splitters[split], splitters[branch], port);
        connect(splitters[branch], mergers[branch], 0, 0);
        connect(splitters[branch], mergers[branch], 1, 1);
        connect(mergers[branch], mergers[merge], 0, port);
      }
    };
    block(mergers[0], 1, 2, 3, 1);
    block(mergers[1], 4, 5, 6, 4);
    connect(mergers[4], cart); connect(cart, sink);
  }
  return state;
}

/** Thirty routed cells on the ordinary field with both Area Expansion upgrades. */
export function createStandardFactory(): GameState {
  const state = createDenseFactory(600);
  state.fieldSizeScale = 1;
  for (const node of state.sectors[state.activeSectorId].nodes) {
    const cell = Number(node.id.split('-')[1]);
    node.x += (cell % 5 - cell % 6) * 1024;
    node.y += (Math.floor(cell / 5) - Math.floor(cell / 6)) * 512;
  }
  return state;
}

export function createFactoryFixture(layout: FactoryLayout, load: FactoryLoad) {
  if (layout === 'standard') return createStandardFactory();
  if (layout === 'dense') return createDenseFactory(DENSE_LOADS.find(value => value === load) ?? 1200);
  return createActiveFactory(LOADS.find(value => value === load) ?? 300);
}

export function factoryActivity(state: GameState) {
  const sector = state.sectors[state.activeSectorId];
  const total = (bag: MachineNode['input']) => Object.values(bag).reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  return {
    nodes: sector.nodes.length,
    producers: sector.nodes.filter(node => node.recipeId).length,
    cycling: sector.nodes.filter(node => node.recipeId && !node.processingPaused && node.progressMs > 0).length,
    splitters: sector.nodes.filter(node => node.kind === 'splitter').length,
    mergers: sector.nodes.filter(node => node.kind === 'merger').length,
    connections: sector.connections.length,
    transfers: state.inFlightTransfers?.filter(transfer => !transfer.cosmeticOnly).length ?? 0,
    produced: total(state.produced ?? {}),
    delivered: sector.nodes.filter(node => node.id.endsWith('-sink')).reduce((sum, node) => sum + total(node.input) + total(node.output), 0),
  };
}
