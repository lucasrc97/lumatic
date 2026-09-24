import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useTranslation } from "react-i18next";

import { useDateLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

/**
 * Month view that will aggregate date-relevant items from every module.
 * It only reads module data; for now it renders the empty month grid.
 */
export default function CalendarView() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const today = new Date();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(today), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(today), { weekStartsOn: 1 }),
  });

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold capitalize">
        {format(today, t("dates.monthYear"), { locale })}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("calendar.placeholder")}
      </p>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {days.slice(0, 7).map((day) => (
          <div key={day.getDay()} className="bg-muted p-2 text-center text-xs font-medium capitalize">
            {format(day, "EEE", { locale })}
          </div>
        ))}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-12 bg-background p-1 sm:min-h-20 sm:p-2",
              !isSameMonth(day, today) && "text-muted-foreground",
              isToday(day) && "font-bold text-primary",
            )}
          >
            {format(day, "d")}
          </div>
        ))}
      </div>
    </section>
  );
}
