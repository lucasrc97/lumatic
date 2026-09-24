import { startOfMonth } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import MonthNavigator from "@/shared/components/MonthNavigator";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { monthGridDays, toISODate } from "@/shared/lib/dates";

import { useCalendarItems } from "../hooks/useCalendar";
import { CALENDAR_PANEL_ID } from "../lib/panelPreference";
import DayPanel from "./DayPanel";
import MonthGrid from "./MonthGrid";

/**
 * Collapsible month view shown above the current page, with dated items from every
 * module (events, task due dates). It only reads; adding happens in each module's page.
 */
export default function CalendarPanel() {
  const { t } = useTranslation();
  const today = toISODate(new Date());
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(today);
  const days = monthGridDays(month);
  const itemsQuery = useCalendarItems(toISODate(days[0]), toISODate(days[days.length - 1]));
  const items = itemsQuery.data ?? [];

  return (
    <section
      id={CALENDAR_PANEL_ID}
      aria-label={t("calendar.title")}
      className="mx-auto mb-6 max-w-5xl space-y-3 rounded-lg border bg-card p-3 sm:p-4"
    >
      <MonthNavigator
        month={month}
        onChange={(next) => {
          setMonth(next);
          setSelected(null);
        }}
      />
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
        onSelect={setSelected}
      />
      {selected && (
        <DayPanel date={selected} items={items.filter((item) => item.date === selected)} />
      )}
    </section>
  );
}
