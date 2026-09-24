import { format, parseISO } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatTimeRange } from "@/modules/events/lib/times";
import { useDateLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { CalendarItem } from "../types/calendar";

const LIST_ID = "day-panel-list";

interface DayPanelProps {
  /** `yyyy-MM-dd`. */
  date: string;
  /** Items already on this day. */
  items: CalendarItem[];
}

/** What is scheduled on a day; the list starts hidden and opens with the arrow by the date. */
export default function DayPanel({ date, items }: DayPanelProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  // Collapsed by default: the grid dots already show which days have items.
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="day-panel-title" className="space-y-2 rounded-lg border p-3 sm:p-4">
      <h2 id="day-panel-title" className="font-semibold">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={LIST_ID}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 rounded-md capitalize hover:text-primary"
        >
          {format(parseISO(date), t("dates.dayLong"), { locale })}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", !expanded && "-rotate-90")}
            aria-hidden
          />
        </button>
      </h2>

      {expanded && (
        <div id={LIST_ID}>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("calendar.dayEmpty")}</p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li
                  key={`${item.module}-${item.id}`}
                  className="flex items-baseline gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm"
                >
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {item.module === "tasks"
                      ? t("calendar.due")
                      : (formatTimeRange(item.start_time, item.end_time) ?? t("events.allDay"))}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words",
                      item.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.module === "events"
                      ? t("trash.modules.events")
                      : t("trash.modules.tasks")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
