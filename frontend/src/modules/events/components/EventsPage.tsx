import { format, parseISO, startOfMonth } from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import MonthNavigator from "@/shared/components/MonthNavigator";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useDateLocale } from "@/shared/i18n";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { monthRange, toISODate } from "@/shared/lib/dates";

import { useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from "../hooks/useEvents";
import type { CalendarEvent } from "../types/event";
import EventForm from "./EventForm";
import EventRow from "./EventRow";

/** Dialog state: closed, creating a new event, or editing one. */
type Editing = null | "new" | CalendarEvent;

function groupByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    groups.set(event.event_date, [...(groups.get(event.event_date) ?? []), event]);
  }
  return [...groups.entries()];
}

export default function EventsPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [editing, setEditing] = useState<Editing>(null);
  const range = monthRange(month);
  const today = toISODate(new Date());

  const eventsQuery = useEvents(range.from, range.to);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const saveError = editing === "new" ? createEvent.error : updateEvent.error;

  function openDialog(target: Editing) {
    createEvent.reset();
    updateEvent.reset();
    setEditing(target);
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("events.title")}</h1>
        <Button size="sm" onClick={() => openDialog("new")}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("events.new")}
        </Button>
      </div>

      <MonthNavigator month={month} onChange={setMonth} />

      {deleteEvent.error && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(deleteEvent.error)}
        </p>
      )}
      {eventsQuery.isPending && (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      )}
      {eventsQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(eventsQuery.error)}
        </p>
      )}
      {eventsQuery.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("events.empty")}</p>
      )}

      {groupByDate(eventsQuery.data ?? []).map(([date, events]) => (
        <section key={date} aria-labelledby={`events-${date}`} className="space-y-2">
          <h2
            id={`events-${date}`}
            className="text-sm font-semibold capitalize text-muted-foreground"
          >
            {format(parseISO(date), t("dates.dayLong"), { locale })}
          </h2>
          <ul className="space-y-2">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                disabled={deleteEvent.isPending}
                onEdit={() => openDialog(event)}
                onDelete={() => deleteEvent.mutate(event.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? t("events.new") : t("events.edit")}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <EventForm
              key={editing === "new" ? "new" : editing.id}
              event={editing === "new" ? undefined : editing}
              // New events start in the shown month: today if it is this month, else its first day.
              defaultDate={today.startsWith(range.from.slice(0, 7)) ? today : range.from}
              onSubmit={async (input) => {
                if (editing === "new") await createEvent.mutateAsync(input);
                else await updateEvent.mutateAsync({ id: editing.id, input });
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
              isSubmitting={createEvent.isPending || updateEvent.isPending}
              error={saveError ? getErrorMessage(saveError) : null}
              idPrefix="event-dialog"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
