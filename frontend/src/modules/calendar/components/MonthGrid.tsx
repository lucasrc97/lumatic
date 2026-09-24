import { format, isSameMonth } from "date-fns";
import { useTranslation } from "react-i18next";

import { useDateLocale } from "@/shared/i18n";
import { monthGridDays, toISODate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";

import type { CalendarItem } from "../types/calendar";

const MAX_DOTS = 4;

interface MonthGridProps {
  /** Any day in the shown month. */
  month: Date;
  items: CalendarItem[];
  /** `yyyy-MM-dd`. */
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
}

/**
 * Compact month grid: one dot per item (events and tasks in different colors);
 * selecting a day lists its items in the day panel.
 */
export default function MonthGrid({ month, items, today, selected, onSelect }: MonthGridProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const days = monthGridDays(month);
  const byDate = new Map<string, CalendarItem[]>();
  for (const item of items) byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
      {days.slice(0, 7).map((day) => (
        <div
          key={day.getDay()}
          className="bg-muted p-1 text-center text-xs font-medium capitalize"
        >
          {format(day, "EEEEEE", { locale })}
        </div>
      ))}
      {days.map((day) => {
        const date = toISODate(day);
        const dayItems = byDate.get(date) ?? [];
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            aria-pressed={selected === date}
            aria-label={t("calendar.dayLabel", {
              date: format(day, t("dates.dayLong"), { locale }),
              count: dayItems.length,
            })}
            className={cn(
              "flex min-h-11 flex-col items-center gap-0.5 bg-background p-1 transition-colors hover:bg-accent sm:min-h-12",
              !isSameMonth(day, month) && "bg-muted/40 text-muted-foreground",
              selected === date && "ring-2 ring-inset ring-primary",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                date === today && "bg-primary font-bold text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </span>
            <span className="flex flex-wrap justify-center gap-0.5" aria-hidden>
              {dayItems.slice(0, MAX_DOTS).map((item) => (
                <span
                  key={`${item.module}-${item.id}`}
                  data-module={item.module}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    item.module === "events" ? "bg-primary" : "bg-amber-500",
                    item.completed && "opacity-40",
                  )}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
