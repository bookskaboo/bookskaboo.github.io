import type { GameState } from '../domain/types';
import { createHomeSector } from './worldGeneration';

export function createInitialState(seed = Math.floor(Math.random() * 2 ** 31)): GameState {
  const now = Date.now();
  return {
    version: 1, seed, activeSectorId: '5,5', sectors: { '5,5': createHomeSector(now) },
    research: { unlocked: ['extractor', 'woodenChest'], contributed: {}, completed: [], mapPoints: 0, repeatableCompletions: {} },
    paused: false, playTimeMs: 0, achievements: [],
    preferences: { autosaveMinutes: 5, confirmDelete: true, particles: true, showGrid: true, sound: false },
    tutorialStep: 0, events: [], revision: 1, produced: {}, extracted: {}, hasCreatedConnection: false, inFlightTransfers: [],
  };
}

