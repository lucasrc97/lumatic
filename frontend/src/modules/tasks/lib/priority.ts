import { PRIORITIES, type Priority } from "../types/task";

/** Accent color per priority: card border and tag. `none` has no accent. */
export const PRIORITY_COLORS: Record<Priority, string | null> = {
  none: null,
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#ef4444",
};

/** Narrow a `<select>` value to a priority; unknown values mean "none". */
export function toPriority(value: string): Priority {
  return PRIORITIES.find((priority) => priority === value) ?? "none";
}
