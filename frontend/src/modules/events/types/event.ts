// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  /** `yyyy-MM-dd`. */
  event_date: string;
  /** `HH:mm:ss`; null for an all-day event. */
  start_time: string | null;
  /** `HH:mm:ss`; only set together with `start_time`. */
  end_time: string | null;
  created_at: string;
}

export interface EventInput {
  title: string;
  description: string | null;
  event_date: string;
  /** `HH:mm`; null for an all-day event. */
  start_time: string | null;
  end_time: string | null;
}

/** Partial update: null clears `description`, `start_time` and `end_time`. */
export type EventUpdateInput = Partial<EventInput>;
