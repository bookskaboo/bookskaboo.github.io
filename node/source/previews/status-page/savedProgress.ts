import { migrateUpgrades } from '../../src/simulation/upgradesMigration';
import type { GameState, MachineNode } from '../../src/domain/types';
import { normalizeLegacy } from '../../src/persistence/saves';
import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { installBotUpgradeProposal } from './model';

/** Explicit prototype transition only; ordinary campaign loading does not call this. */
export function restoreStatusFactory(payload: unknown): GameState | null {
  const state = normalizeLegacy(payload);
  if (!state) return null;
  migrateUpgrades(state);
  return state;
}

/** A file-shaped stock-catalog example, not an import from campaign slots. */
export function savedProgressExample(): GameEngine {
  installBotUpgradeProposal();
  const saved = createInitialState(204);
  saved.paused = true;
  saved.research = {
    completed: ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'basicCore', 'exploration', 'automataCore'],
    unlocked: ['extractor', 'joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'basicCore', 'exploration', 'automataCore'],
    selected: 'hydroCore', contributed: { 'simple-core': 2, 'basic-core': 2, 'automata-core': 2 },
    projectContributions: { extractor2: { 'simple-core': 3 } },
    repeatableCompletions: {}, mapPoints: 0, queue: ['extractor2', 'kiln2'], paused: true,
  };
  saved.produced = { 'simple-core': 10, 'basic-core': 5, 'automata-core': 3 };
  const lab: MachineNode = { id: 'queue-test-lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000,
    rotation: 0, input: { 'simple-core': 3, 'basic-core': 3, 'automata-core': 3 }, output: {},
    progressMs: 1200, cycleMs: 5000, constructedAt: 0, constructionMs: 0 };
  saved.sectors['5,5'].nodes = [lab];
  saved.sectors['5,5'].connections = [];
  return new GameEngine(restoreStatusFactory(JSON.parse(JSON.stringify(saved)))!, { autosave: false });
}

/** A legacy destination quote with two Simple payments left and Basic already paid. */
export function savedMapPurchaseExample(): GameEngine {
  const saved = savedProgressExample().getState();
  delete saved.mapResearchMode;
  saved.paused = false;
  saved.research.paused = true;
  saved.research.projectContributions!.hydroCore = { ...saved.research.contributed };
  saved.research.selected = 'mapNode';
  saved.research.contributed = { 'simple-core': 7, 'basic-core': 4 };
  saved.research.repeatableCompletions = { mapNode: 2 };
  saved.research.mapNodeQuote = { completion: 2, costs: { 'simple-core': 9, 'basic-core': 4 }, destination: '6,5' };
  saved.research.queue = ['mapNode', 'extractor2', 'kiln2'];
  return new GameEngine(restoreStatusFactory(JSON.parse(JSON.stringify(saved)))!, { autosave: false });
}
