import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useDateLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

interface TaskDueDateProps {
  /** `yyyy-MM-dd`. */
  dueDate: string;
  overdue: boolean;
}

/** Due date chip; red when the task is overdue. */
export default function TaskDueDate({ dueDate, overdue }: TaskDueDateProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
        overdue && "border-destructive text-destructive",
      )}
    >
      <CalendarDays className="h-3 w-3" aria-hidden />
      {format(parseISO(dueDate), t("dates.dayShort"), { locale })}
      {overdue && <span className="sr-only">({t("tasks.card.overdue")})</span>}
    </span>
  );
}
