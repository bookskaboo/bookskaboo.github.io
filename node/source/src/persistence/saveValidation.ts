export type UnknownRecord = Record<string, unknown>;
export const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {};
export const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const entries = (value: unknown) => Object.entries(record(value));

