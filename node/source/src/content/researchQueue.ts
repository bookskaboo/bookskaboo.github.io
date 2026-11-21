export const RESEARCH_QUEUE_LIMIT = 4;
export type QueueResearchResult = 'added' | 'full' | 'duplicate' | 'unavailable' | 'map-destination';
export interface QueueResearchOptions {
  /** Priority work stays selected without occupying a queue slot. */
  adoptSelected?: boolean;
}
