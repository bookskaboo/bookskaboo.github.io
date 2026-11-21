import type { GameState } from '../domain/types';
import { GOLEM_PLACEMENT_TIER } from '../content/resourceGolems';
import { createHomeSector } from './worldGeneration';
import { activateMod } from '../mods/modContent';
import { generateBorderObstructions } from './borderObstructions';
import { generateMapTerrains } from './mapTerrain';
import { initializeLandmarks } from './landmarkGeneration';

export function createInitialState(seed = Math.floor(Math.random() * 2 ** 31)): GameState {
  activateMod();
  const now = Date.now();
  const state: GameState = {
    version: 1, seed, activeSectorId: '5,5', sectors: { '5,5': createHomeSector(now) },
    fieldSizeScale: 1,
    landmarkEligible: true,
    coreResearchVersion: 1,
    mapResearchMode: 'points',
    basicGunRecipeVersion: 1,
    machineEfficiencyVersion: 1,
    golemPlacementTier: GOLEM_PLACEMENT_TIER,
    encounterLayoutVersion: 2,
    worldRulesVersion: 2,
    mapTerrainVersion: 1,
    mapTerrains: generateMapTerrains(seed),
    borderObstructionVersion: 1,
    borderObstructions: generateBorderObstructions(seed),
    research: { unlocked: ['extractor'], contributed: {}, completed: [], mapPoints: 0, repeatableCompletions: {}, queue: [], paused: false },
    paused: false, playTimeMs: 0, achievements: [],
    preferences: { autosaveMinutes: 5, confirmDelete: true, particles: true, showGrid: true, snapToGrid: false, sound: false },
    tutorialStep: 0, events: [], revision: 1, produced: {}, extracted: {}, hasCreatedConnection: false, inFlightTransfers: [],
  };
  initializeLandmarks(state);
  return state;
}

