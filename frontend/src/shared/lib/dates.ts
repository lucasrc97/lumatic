import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Local calendar date as `yyyy-MM-dd`, the format the API uses for dates. */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** The seven days (Monday first) of the week containing `date`. */
export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Full weeks (Monday first) covering the month of `date`, as shown in a month grid. */
export function monthGridDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  });
}

/** First and last day (`yyyy-MM-dd`) of the month of `date`. */
export function monthRange(date: Date): { from: string; to: string } {
  return { from: toISODate(startOfMonth(date)), to: toISODate(endOfMonth(date)) };
}
