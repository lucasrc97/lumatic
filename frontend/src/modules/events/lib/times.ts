/** API time (`HH:mm:ss`) as an `<input type="time">` value (`HH:mm`); empty when unset. */
export function toTimeInput(time: string | null): string {
  return time ? time.slice(0, 5) : "";
}

/** "09:00", "09:00–10:30", or null for an all-day item. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${toTimeInput(start)}–${toTimeInput(end)}` : toTimeInput(start);
}

/** Why a start/end pair (`HH:mm`, empty when unset) is invalid, as an `events.form.*` key. */
export function timeProblem(start: string, end: string): "endNeedsStart" | "endBeforeStart" | null {
  if (end && !start) return "endNeedsStart";
  // `HH:mm` strings compare like the times they represent.
  if (end && end < start) return "endBeforeStart";
  return null;
}
