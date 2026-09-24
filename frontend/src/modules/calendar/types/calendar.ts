// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

/** A dated item from some module (events, task due dates), read-only here. */
export interface CalendarItem {
  /** Owning module, e.g. `events` or `tasks`. */
  module: string;
  id: number;
  title: string;
  /** `yyyy-MM-dd`. */
  date: string;
  /** `HH:mm:ss`; null when the item takes the whole day. */
  start_time: string | null;
  end_time: string | null;
  /** For tasks: whether the task is done. */
  completed: boolean;
}
