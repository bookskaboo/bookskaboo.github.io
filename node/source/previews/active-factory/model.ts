import { NODE_DEFINITIONS } from '../../src/content/nodes';
import { RECIPES } from '../../src/content/recipes';
import type { GameState, MachineNode, NodeKind } from '../../src/domain/types';
import { createInitialState } from '../../src/simulation/engine';

export const LOADS = [150, 300, 600] as const;
export type FactoryLoad = typeof LOADS[number];
export const SINK_CAPACITY = 1_000_000;

// All recipes and cycles come from the current game. Only supply and final
// storage are synthetic, so branches keep running during a long inspection.
const CHAINS: Array<{ first: NodeKind; firstRecipe: string; second: NodeKind; secondRecipe: string; secondPort: number }> = [
  { first: 'smelter', firstRecipe: 'smelt-iron', second: 'refiner', secondRecipe: 'iron-gear', secondPort: 0 },
  { first: 'smelter', firstRecipe: 'smelt-copper', second: 'refiner', secondRecipe: 'copper-wire', secondPort: 0 },
  { first: 'refiner', firstRecipe: 'brick', second: 'assembler', secondRecipe: 'automata-core', secondPort: 1 },
  { first: 'assembler', firstRecipe: 'motor', second: 'assembler', secondRecipe: 'robot-frame', secondPort: 1 },
];

export function createActiveFactory(load: FactoryLoad = 300): GameState {
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

export function factoryActivity(state: GameState) {
  const sector = state.sectors[state.activeSectorId];
  const total = (bag: MachineNode['input']) => Object.values(bag).reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  return {
    nodes: sector.nodes.length,
    producers: sector.nodes.filter(node => node.recipeId).length,
    connections: sector.connections.length,
    transfers: state.inFlightTransfers?.filter(transfer => !transfer.cosmeticOnly).length ?? 0,
    produced: total(state.produced ?? {}),
    delivered: sector.nodes.filter(node => node.id.endsWith('-sink')).reduce((sum, node) => sum + total(node.input) + total(node.output), 0),
  };
}
