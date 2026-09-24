// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

export interface TrashItem {
  /** Owning module, e.g. `habits`. */
  module: string;
  id: number;
  title: string;
  deleted_at: string;
  /** When the item will be permanently deleted automatically. */
  purge_at: string;
}

export interface TrashPurgeResult {
  purged: number;
}
