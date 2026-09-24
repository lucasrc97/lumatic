import { format, isSameMonth } from "date-fns";
import { useTranslation } from "react-i18next";

import { useDateLocale } from "@/shared/i18n";
import { monthGridDays, toISODate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";

import type { CalendarItem } from "../types/calendar";

const MAX_TITLES = 3;

interface MonthGridProps {
  /** Any day in the shown month. */
  month: Date;
  items: CalendarItem[];
  /** `yyyy-MM-dd`. */
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
}

/** Month grid; each day shows item titles (dots on narrow screens) and can be selected. */
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
          className="bg-muted p-1 text-center text-xs font-medium capitalize sm:p-2"
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
              "flex min-h-14 flex-col items-stretch gap-0.5 bg-background p-1 text-left transition-colors hover:bg-accent sm:min-h-24 sm:p-1.5",
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
            {/* Narrow screens: one dot per item, up to a few. */}
            <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
              {dayItems.slice(0, 4).map((item) => (
                <span
                  key={`${item.module}-${item.id}`}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    item.module === "events" ? "bg-primary" : "bg-amber-500",
                  )}
                />
              ))}
            </span>
            {/* Wider screens: titles. */}
            <span className="hidden flex-col gap-0.5 sm:flex" aria-hidden>
              {dayItems.slice(0, MAX_TITLES).map((item) => (
                <span
                  key={`${item.module}-${item.id}`}
                  className={cn(
                    "truncate rounded px-1 text-xs",
                    item.module === "events"
                      ? "bg-primary/10 text-primary"
                      : "border border-amber-500/60 text-foreground",
                    item.completed && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </span>
              ))}
              {dayItems.length > MAX_TITLES && (
                <span className="px-1 text-xs text-muted-foreground">
                  {t("calendar.more", { count: dayItems.length - MAX_TITLES })}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
