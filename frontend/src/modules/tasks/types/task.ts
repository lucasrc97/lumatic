// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

export const PRIORITIES = ["none", "low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  /** `yyyy-MM-dd`. */
  due_date: string | null;
  column_id: number;
  priority: Priority;
  /** Set while the task is in the done column. */
  completed_at: string | null;
  created_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  due_date?: string | null;
  /** Defaults to the first column. */
  column_id?: number;
  priority?: Priority;
}

/** Partial update: null clears `description`/`due_date`. */
export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  column_id?: number;
  priority?: Priority;
}

export interface TaskColumn {
  id: number;
  name: string;
  color: string;
  position: number;
  /** Exactly one column is the done column. */
  is_done: boolean;
}

export interface ColumnCreateInput {
  name: string;
  color?: string;
}

export interface ColumnUpdateInput {
  name?: string;
  color?: string;
  /** `true` makes this the done column. */
  is_done?: boolean;
}
