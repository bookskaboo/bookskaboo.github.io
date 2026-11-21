export interface ResearchHintCopy { title: string; detail: string }
export interface ResearchHintHistory {
  assignmentAcknowledged: boolean;
  unlocked: ResearchHintCopy[];
}

/** Hint metadata is optional; malformed entries must not prevent a factory load. */
export function normalizeResearchHintHistory(value: unknown): ResearchHintHistory | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Partial<ResearchHintHistory>;
  const entries = new Map<string, ResearchHintCopy>();
  for (const hint of Array.isArray(record.unlocked) ? record.unlocked : []) {
    if (!hint || typeof hint.title !== 'string' || !hint.title.trim() || typeof hint.detail !== 'string') continue;
    if (entries.size < 256 || entries.has(hint.title)) entries.set(hint.title, { title: hint.title, detail: hint.detail });
  }
  return { assignmentAcknowledged: record.assignmentAcknowledged === true, unlocked: [...entries.values()] };
}

/** Undo rewinds factory commands, while knowledge already earned stays available. */
export function mergeResearchHintHistory(previous: unknown, learned: unknown) {
  const before = normalizeResearchHintHistory(previous), after = normalizeResearchHintHistory(learned);
  if (!before && !after) return undefined;
  return normalizeResearchHintHistory({ assignmentAcknowledged: before?.assignmentAcknowledged || after?.assignmentAcknowledged,
    unlocked: [...(before?.unlocked ?? []), ...(after?.unlocked ?? [])] });
}
