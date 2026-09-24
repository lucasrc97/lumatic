const STORAGE_KEY = "lumatic.calendarOpen";

/** DOM id of the panel, so the top-bar toggle can point at it (`aria-controls`). */
export const CALENDAR_PANEL_ID = "calendar-panel";

/** Whether the calendar panel was left open; closed by default. */
export function readPanelOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Storage can be unavailable (private mode, blocked site data): start closed.
    return false;
  }
}

export function savePanelOpen(open: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    // Not persisting the choice is acceptable; it still applies to this session.
  }
}
