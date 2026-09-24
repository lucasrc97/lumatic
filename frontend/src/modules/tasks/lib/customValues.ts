import { format, parseISO, type Locale } from "date-fns";

import type { CustomValue, TaskField } from "../types/task";

/** The value as an `<input>`/`<select>` value; empty when unset. */
export function toInputValue(value: CustomValue | undefined): string {
  return value === undefined ? "" : String(value);
}

/** Parse an input value for `field`; `null` clears the value. */
export function fromInputValue(field: TaskField, raw: string): CustomValue | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  return field.type === "number" ? Number(trimmed) : trimmed;
}

/** Human-readable value; dates use `dateFormat` in the active locale. */
export function formatCustomValue(
  field: TaskField,
  value: CustomValue,
  dateFormat: string,
  locale: Locale,
): string {
  if (field.type === "date" && typeof value === "string") {
    return format(parseISO(value), dateFormat, { locale });
  }
  return String(value);
}
