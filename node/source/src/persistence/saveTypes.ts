import type { GameState } from '../domain/types';

export interface SaveSlot {
  savedAt: number;
  playTimeMs: number;
  sectorName: string;
  state: GameState;
  name?: string;
}

export interface SaveSlotsSnapshot {
  slots: Array<SaveSlot | null>;
  unreadableSlots: number[];
  error?: string;
}
