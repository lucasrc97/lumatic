// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

export interface Preferences {
  trash_retention_days: number;
}

export type PreferencesUpdateInput = Partial<Preferences>;

/** Bounds enforced by the backend for `trash_retention_days`. */
export const TRASH_RETENTION_DAYS = { min: 1, max: 365 } as const;
