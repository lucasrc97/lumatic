import { format, parseISO, startOfMonth } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import MonthNavigator from "@/shared/components/MonthNavigator";
import { useDateLocale } from "@/shared/i18n";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { monthRange } from "@/shared/lib/dates";

import { useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from "../hooks/useEvents";
import type { CalendarEvent } from "../types/event";
import EventEditDialog from "./EventEditDialog";
import EventQuickForm from "./EventQuickForm";
import EventRow from "./EventRow";

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
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const range = monthRange(month);

  const eventsQuery = useEvents(range.from, range.to);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  // While the edit dialog is open it shows update errors itself.
  const actionError = deleteEvent.error;

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("events.title")}</h1>
        <MonthNavigator month={month} onChange={setMonth} />
      </div>

      <EventQuickForm
        onSubmit={async (input) => {
          await createEvent.mutateAsync(input);
          // Show the month the new event landed in.
          setMonth(startOfMonth(parseISO(input.event_date)));
        }}
        isSubmitting={createEvent.isPending}
        error={createEvent.error ? getErrorMessage(createEvent.error) : null}
      />

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(actionError)}
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
                onEdit={() => {
                  updateEvent.reset();
                  setEditing(event);
                }}
                onDelete={() => deleteEvent.mutate(event.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      <EventEditDialog
        event={editing}
        onSubmit={async (input) => {
          if (editing) await updateEvent.mutateAsync({ id: editing.id, input });
        }}
        onClose={() => setEditing(null)}
        isSubmitting={updateEvent.isPending}
        error={editing && updateEvent.error ? getErrorMessage(updateEvent.error) : null}
      />
    </section>
  );
}
