import type { InFlightTransfer } from '../domain/types';

/** Matches the source game's cable travel time. */
export const CABLE_TRANSFER_DURATION_MS = 1000;
export const MAX_VISIBLE_TRANSFERS = 64;

export function transferProgress(transfer: InFlightTransfer, playTimeMs: number) {
  const duration = Math.max(1, transfer.arrivesAtMs - transfer.launchedAtMs);
  return Math.max(0, Math.min(1, (playTimeMs - transfer.launchedAtMs) / duration));
}
