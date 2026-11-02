import type { GameState } from '../domain/types';

export interface SaveSlot {
  savedAt: number;
  playTimeMs: number;
  sectorName: string;
  state: GameState;
  name?: string;
}
