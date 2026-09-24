/** API time (`HH:mm:ss`) as an `<input type="time">` value (`HH:mm`); empty when unset. */
export function toTimeInput(time: string | null): string {
  return time ? time.slice(0, 5) : "";
}

/** "09:00", "09:00–10:30", or null for an all-day item. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${toTimeInput(start)}–${toTimeInput(end)}` : toTimeInput(start);
}
