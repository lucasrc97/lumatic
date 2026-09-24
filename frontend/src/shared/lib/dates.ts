import { addDays, format, startOfWeek } from "date-fns";

/** Local calendar date as `yyyy-MM-dd`, the format the API uses for dates. */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** The seven days (Monday first) of the week containing `date`. */
export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
