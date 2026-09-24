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
import { ptBR } from "date-fns/locale";

import { cn } from "@/shared/lib/utils";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/**
 * Month view that will aggregate date-relevant items from every module.
 * It only reads module data; for now it renders the empty month grid.
 */
export default function CalendarView() {
  const today = new Date();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(today), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(today), { weekStartsOn: 1 }),
  });

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold capitalize">
        {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
      </h1>
      <p className="text-sm text-muted-foreground">
        Os itens de cada módulo aparecerão aqui conforme forem implementados.
      </p>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-muted p-2 text-center text-xs font-medium">
            {label}
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
