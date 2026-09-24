import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { useDateLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

interface HabitWeekGridProps {
  /** `yyyy-MM-dd` dates to display, in order. */
  days: string[];
  completedDates: string[];
  today: string;
  color: string;
  disabled?: boolean;
  onToggle: (day: string, completed: boolean) => void;
}

export default function HabitWeekGrid({
  days,
  completedDates,
  today,
  color,
  disabled = false,
  onToggle,
}: HabitWeekGridProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const completed = new Set(completedDates);

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {days.map((day) => {
        const date = parseISO(day);
        const done = completed.has(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={done}
            aria-label={format(date, t("dates.dayLong"), { locale })}
            disabled={disabled || day > today}
            onClick={() => onToggle(day, !done)}
            className={cn(
              "flex flex-col items-center rounded-md border py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              day === today && "ring-2 ring-ring ring-offset-1 ring-offset-background",
              done ? "border-transparent text-white" : "hover:bg-accent",
            )}
            style={done ? { backgroundColor: color } : undefined}
          >
            <span className="uppercase">{format(date, "EEEEEE", { locale })}</span>
            <span className="text-sm font-semibold">{format(date, "d")}</span>
          </button>
        );
      })}
    </div>
  );
}
