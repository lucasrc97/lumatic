// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

/** Text, number, `yyyy-MM-dd` date or select option, depending on the field type. */
export type CustomValue = string | number;

/** Values keyed by field id (JSON object keys are strings). */
export type CustomValues = Record<string, CustomValue>;

export interface Task {
  id: number;
  title: string;
  description: string | null;
  /** `yyyy-MM-dd`. */
  due_date: string | null;
  column_id: number;
  custom_values: CustomValues;
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
  custom_values?: Record<string, CustomValue | null>;
}

/** Partial update: null clears `description`/`due_date`; a null custom value removes it. */
export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  column_id?: number;
  custom_values?: Record<string, CustomValue | null>;
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

export const FIELD_TYPES = ["text", "number", "date", "select"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface TaskField {
  id: number;
  name: string;
  type: FieldType;
  /** Only select fields have options. */
  options: string[];
  position: number;
}

export interface FieldCreateInput {
  name: string;
  type: FieldType;
  options?: string[];
}

export interface FieldUpdateInput {
  name?: string;
  options?: string[];
}
