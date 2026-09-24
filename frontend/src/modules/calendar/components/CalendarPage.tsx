import { startOfMonth } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCreateEvent } from "@/modules/events/hooks/useEvents";
import { useCreateTask } from "@/modules/tasks/hooks/useTasks";
import MonthNavigator from "@/shared/components/MonthNavigator";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { monthGridDays, toISODate } from "@/shared/lib/dates";

import { useCalendarItems, useInvalidateCalendar } from "../hooks/useCalendar";
import DayPanel from "./DayPanel";
import MonthGrid from "./MonthGrid";

/**
 * Month view of dated items from every module (events, task due dates).
 * It only reads module data; creating goes through each module's own API.
 */
export default function CalendarPage() {
  const { t } = useTranslation();
  const today = toISODate(new Date());
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(today);
  const days = monthGridDays(month);
  const from = toISODate(days[0]);
  const to = toISODate(days[days.length - 1]);

  const itemsQuery = useCalendarItems(from, to);
  const createEvent = useCreateEvent();
  const createTask = useCreateTask();
  const invalidateCalendar = useInvalidateCalendar();
  const createError = createEvent.error ?? createTask.error;
  const items = itemsQuery.data ?? [];

  function changeMonth(next: Date) {
    setMonth(next);
    setSelected(null);
    createEvent.reset();
    createTask.reset();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("calendar.title")}</h1>
        <MonthNavigator month={month} onChange={changeMonth} />
      </div>

      {itemsQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(itemsQuery.error)}
        </p>
      )}

      <MonthGrid
        month={month}
        items={items}
        today={today}
        selected={selected}
        onSelect={(date) => {
          setSelected(date);
          createEvent.reset();
          createTask.reset();
        }}
      />

      {selected && (
        <DayPanel
          // Keyed so the forms restart for each picked day.
          key={selected}
          date={selected}
          items={items.filter((item) => item.date === selected)}
          onCreateEvent={async (input) => {
            await createEvent.mutateAsync(input);
            await invalidateCalendar();
          }}
          onCreateTask={async (input) => {
            await createTask.mutateAsync(input);
            await invalidateCalendar();
          }}
          isSubmitting={createEvent.isPending || createTask.isPending}
          error={createError ? getErrorMessage(createError) : null}
        />
      )}
    </section>
  );
}
