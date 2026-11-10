import type { GameState } from '../domain/types';
import { GOLEM_PLACEMENT_TIER } from '../content/resourceGolems';
import { createHomeSector } from './worldGeneration';
import { activateMod } from '../mods/modContent';

export function createInitialState(seed = Math.floor(Math.random() * 2 ** 31)): GameState {
  activateMod();
  const now = Date.now();
  return {
    version: 1, seed, activeSectorId: '5,5', sectors: { '5,5': createHomeSector(now) },
    fieldSizeScale: 1,
    golemPlacementTier: GOLEM_PLACEMENT_TIER,
    encounterLayoutVersion: 2,
    research: { unlocked: ['extractor'], contributed: {}, completed: [], mapPoints: 0, repeatableCompletions: {} },
    paused: false, playTimeMs: 0, achievements: [],
    preferences: { autosaveMinutes: 5, confirmDelete: true, particles: true, showGrid: true, snapToGrid: false, sound: false },
    tutorialStep: 0, events: [], revision: 1, produced: {}, extracted: {}, hasCreatedConnection: false, inFlightTransfers: [],
  };
}

