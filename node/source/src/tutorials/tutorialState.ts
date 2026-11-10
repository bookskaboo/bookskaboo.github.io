import { NODE_DEFINITIONS } from '../content/nodes';
import type { GameState, MachineNode, NodeKind } from '../domain/types';
import { createInitialState } from '../simulation/engine';
import { generateSector, getWorldFieldSize } from '../simulation/worldGeneration';
import { type TutorialKind, EXPANSION_OUTPOST, CONTROL_GROUP_NODE_IDS, TUTORIAL_NAMES } from './tutorialDefinitions';

export function tutorialNode(kind: NodeKind, id: string, x: number, y: number, extra: Partial<MachineNode> = {}): MachineNode {
  return { id, kind, name: NODE_DEFINITIONS[kind].name, x, y, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: kind === 'extractor' ? 5000 : 1000, constructedAt: 0, constructionMs: 0, ...extra };
}
export function createTutorialState(kind: TutorialKind, board = ''): GameState {
  const state = createInitialState(1);
  state.isTraining=true;
  state.events = [];
  const sector = state.sectors[state.activeSectorId];
  sector.name = `${TUTORIAL_NAMES[kind]} practice`;
  sector.label = 'T';
  sector.camera = { x: 10, y: 10, zoom: .65 };
  const forest = tutorialNode('forest', 'tutorial-forest', 270, 340, { resourceItem: 'wood', resourceRemaining: 1000, resourceCapacity: 1000 });
  sector.nodes = [forest];
  sector.connections = [];
  const add = (kind: NodeKind, id: string, x: number, y: number, extra: Partial<MachineNode> = {}) => sector.nodes.push(tutorialNode(kind, id, x, y, extra));
  const link = (from: string, to: string, fromPort = 0, toPort = 0) => sector.connections.push({ id: `${from}-${to}`, from, to, fromPort, toPort, createdAt: 0 });
  if (kind === 'basic') {
    add('copper', 'tutorial-copper', 270, 740, { resourceItem: 'copper', resourceRemaining: 1000, resourceCapacity: 1000 });
  } else if (kind === 'logistics') {
    state.research.completed = ['joint', 'kiln', 'assembler', 'splitter', 'merger'];
    add('extractor', 'tutorial-extractor-a', 650, 340);
    if (board.startsWith('splitter')) {
      add('splitter', 'tutorial-splitter', 1010, 340);
      add('kiln', 'tutorial-kiln-a', 1330, 220, { recipeId: 'charcoal' });
      add('kiln', 'tutorial-kiln-b', 1330, 560, { recipeId: 'charcoal' });
      link(forest.id, 'tutorial-extractor-a');
    } else if (board.startsWith('merger')) {
      add('extractor', 'tutorial-extractor-b', 650, 680);
      add('merger', 'tutorial-merger', 1010, 440);
      add('kiln', 'tutorial-kiln-a', 1330, 440, { recipeId: 'charcoal' });
      link(forest.id, 'tutorial-extractor-a'); link(forest.id, 'tutorial-extractor-b');
    } else {
      sector.nodes.find(n => n.id === 'tutorial-extractor-a')!.x = 1100;
      add('joint', 'tutorial-joint', 680, 340);
    }
    if (board.endsWith('-insert')) {
      const kind = board.startsWith('splitter') ? 'splitter' : board.startsWith('merger') ? 'merger' : 'joint';
      const router = sector.nodes.find(node => node.kind === kind)!;
      router.x = kind === 'joint' ? 680 : 1010; router.y = 700;
      if (kind === 'joint') link(forest.id, 'tutorial-extractor-a');
      else {
        const kiln = sector.nodes.find(node => node.id === 'tutorial-kiln-a')!; kiln.y = 340;
        link('tutorial-extractor-a', kiln.id);
      }
    }
    sector.camera.zoom = .55;
  } else if (kind === 'expansion') {
    state.research.completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'exploration', 'road'];
    state.research.mapPoints = 1;
    sector.name = 'Home'; sector.label = 'H';
    sector.camera = { x: 40, y: 100, zoom: .5 };
    sector.nodes = [
      tutorialNode('woodenChest', 'expansion-home-chest', 450, 350, { capacity: 20 }),
      tutorialNode('researchCenter', 'expansion-home-lab', 850, 800),
    ];
    const outpost = generateSector(4, 5, state.seed, 0);
    const eastWall = getWorldFieldSize(state).width;
    outpost.name = 'Wood outpost'; outpost.label = 'W'; outpost.unlocked = false; outpost.visited = false;
    outpost.camera = { x: -1450, y: 100, zoom: .5 };
    outpost.nodes = [
      tutorialNode('forest', 'expansion-forest', eastWall - 1400, 350, { resourceItem: 'wood', resourceRemaining: 1000, resourceCapacity: 1000 }),
      tutorialNode('extractor', 'expansion-extractor', eastWall - 950, 350),
      tutorialNode('woodenChest', 'expansion-outpost-chest', eastWall - 500, 350, { capacity: 20 }),
    ];
    outpost.connections = [
      { id: 'expansion-extract', from: 'expansion-forest', to: 'expansion-extractor', fromPort: 0, toPort: 0, createdAt: 0 },
      { id: 'expansion-store', from: 'expansion-extractor', to: 'expansion-outpost-chest', fromPort: 0, toPort: 0, createdAt: 0 },
    ];
    state.sectors[EXPANSION_OUTPOST] = outpost;
  } else if (kind === 'control-groups') {
    sector.nodes = [];
    add('extractor', CONTROL_GROUP_NODE_IDS[0], 500, 340, { name: 'Extractor A' });
    add('extractor', CONTROL_GROUP_NODE_IDS[1], 900, 340, { name: 'Extractor B' });
    add('extractor', CONTROL_GROUP_NODE_IDS[2], 900, 740, { name: 'Extractor C' });
    sector.camera = { x: 30, y: 80, zoom: .65 };
  } else if (kind === 'monster-camps') {
    sector.nodes = [];
    add('monster-camp', 'tutorial-camp', 1000, 440, { campStrength: 25, attackRequirement: 3, progressMs: 54000 });
    add('woodenChest', 'tutorial-bots', 450, 440, { output: { 'suppression-bot': 20 }, capacity: 20 });
    state.research.completed = ['suppressionBot'];
  }
  // Basics lends the Cart schematic for its buffer lesson; normal games require Road research.
  state.research.unlocked = ['extractor', ...(kind === 'basic' ? ['road'] : []), ...state.research.completed];
  return state;
}

