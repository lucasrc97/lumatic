import { format, parseISO } from "date-fns";
import { CalendarPlus, ListPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import EventForm from "@/modules/events/components/EventForm";
import { formatTimeRange } from "@/modules/events/lib/times";
import type { EventInput } from "@/modules/events/types/event";
import TaskForm from "@/modules/tasks/components/TaskForm";
import type { TaskCreateInput } from "@/modules/tasks/types/task";
import { Button } from "@/shared/components/ui/button";
import { useDateLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { CalendarItem } from "../types/calendar";

type Creating = null | "event" | "task";

interface DayPanelProps {
  /** `yyyy-MM-dd`. */
  date: string;
  /** Items already on this day, shown before adding anything. */
  items: CalendarItem[];
  /** Should reject on failure; the form keeps its input and shows the error. */
  onCreateEvent: (input: EventInput) => Promise<void>;
  onCreateTask: (input: TaskCreateInput) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

/** What is scheduled on a day, plus quick creation of an event or task on that day. */
export default function DayPanel({
  date,
  items,
  onCreateEvent,
  onCreateTask,
  isSubmitting,
  error,
}: DayPanelProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [creating, setCreating] = useState<Creating>(null);

  return (
    <section aria-labelledby="day-panel-title" className="space-y-3 rounded-lg border p-3 sm:p-4">
      <h2 id="day-panel-title" className="font-semibold capitalize">
        {format(parseISO(date), t("dates.dayLong"), { locale })}
      </h2>

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
                {item.module === "events" ? t("trash.modules.events") : t("trash.modules.tasks")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={creating === "event" ? "secondary" : "outline"}
          aria-pressed={creating === "event"}
          onClick={() => setCreating(creating === "event" ? null : "event")}
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t("calendar.newEvent")}
        </Button>
        <Button
          size="sm"
          variant={creating === "task" ? "secondary" : "outline"}
          aria-pressed={creating === "task"}
          onClick={() => setCreating(creating === "task" ? null : "task")}
        >
          <ListPlus className="h-4 w-4" aria-hidden />
          {t("calendar.newTask")}
        </Button>
      </div>

      {creating === "event" && (
        <EventForm
          defaultDate={date}
          hideDate
          onSubmit={onCreateEvent}
          onCancel={() => setCreating(null)}
          isSubmitting={isSubmitting}
          error={error}
          idPrefix="day-event"
        />
      )}
      {creating === "task" && (
        <TaskForm
          initialDueDate={date}
          onSubmit={onCreateTask}
          isSubmitting={isSubmitting}
          error={error}
          idPrefix="day-task"
        />
      )}
    </section>
  );
}
