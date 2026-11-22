import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { NODE_DEFINITIONS } from '../../src/content/nodes';
import { RECIPES } from '../../src/content/recipes';
import type { MachineNode, NodeKind } from '../../src/domain/types';

/** Disposable supplied factory. Normal engine timing; never a campaign or balance fixture. */
export function createSoundFactory() {
  const state = createInitialState(20261121);
  state.isTraining = true;
  state.borderObstructions = [];
  state.research.completed = ['kiln', 'smelter', 'refiner', 'researchCenter', 'road', 'exploration', 'splitter', 'merger', 'joint'];
  state.research.unlocked = [...state.research.completed, 'extractor'];
  state.research.mapPoints = 4;
  state.hasCreatedConnection = true;
  state.hasProducedWithRefiner = true;
  state.produced = { 'copper-plate': 1 };
  state.extracted = { wood: 1, copper: 1 };
  state.preferences.autosaveMinutes = 0;
  state.preferences.showGrid = true;
  state.devTutorialPromptsSuppressed = true;
  const home = state.sectors[state.activeSectorId];
  home.nodes = []; home.connections = []; home.name = 'Sound test';
  const add = (id: string, kind: NodeKind, x: number, y: number, recipeId?: string) => {
    const node: MachineNode = { id, kind, name: NODE_DEFINITIONS[kind].name, x, y, rotation: 0,
      input: {}, output: {}, progressMs: 0, cycleMs: recipeId ? RECIPES[recipeId].cycleMs : 1000,
      recipeId, constructedAt: 0, constructionMs: 0 };
    home.nodes.push(node); return node;
  };
  const supply = add('wood-cart', 'woodenChest', 420, 460);
  supply.output.wood = 20;
  const kiln = add('test-kiln', 'kiln', 860, 460, 'charcoal');
  kiln.input.wood = 3;
  add('charcoal-cart', 'woodenChest', 1300, 460);
  const refiner = add('test-refiner', 'refiner', 420, 1000, 'copper-gear');
  refiner.input['copper-plate'] = 10;
  add('empty-refiner', 'refiner', 860, 1000);
  const lab = add('test-lab', 'researchCenter', 1370, 1000);
  lab.input['simple-core'] = 10; lab.input['basic-core'] = 10;
  home.connections = [
    { id: 'wood-route', from: supply.id, to: kiln.id, fromPort: 0, toPort: 0, createdAt: 0 },
    { id: 'charcoal-route', from: kiln.id, to: 'charcoal-cart', fromPort: 0, toPort: 0, createdAt: 0 },
  ];
  const engine = new GameEngine(state, { autosave: false });
  const east = engine.ensureSector(6, 5);
  east.nodes = []; east.connections = []; east.unlocked = false; east.visited = false;
  engine.getState().sectors[east.id] = east;
  return engine;
}
