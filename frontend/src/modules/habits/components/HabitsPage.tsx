import { addWeeks, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { useDateLocale } from "@/shared/i18n";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { toISODate, weekDays } from "@/shared/lib/dates";

import {
  useCreateHabit,
  useDeleteHabit,
  useHabits,
  useToggleHabitDay,
  useUpdateHabit,
} from "../hooks/useHabits";
import HabitCard from "./HabitCard";
import HabitForm from "./HabitForm";

export default function HabitsPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const today = toISODate(new Date());
  const days = weekDays(referenceDate).map(toISODate);
  const range = { from: days[0], to: days[days.length - 1] };

  const habitsQuery = useHabits(range, today);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const toggleDay = useToggleHabitDay();
  const deleteHabit = useDeleteHabit();
  const actionError = toggleDay.error ?? updateHabit.error ?? deleteHabit.error;

  const weekLabel = `${format(parseISO(range.from), t("dates.dayShort"), { locale })} – ${format(
    parseISO(range.to),
    t("dates.dayShort"),
    { locale },
  )}`;

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("habits.title")}</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("habits.previousWeek")}
            onClick={() => setReferenceDate((date) => addWeeks(date, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title={t("habits.currentWeek")}
            onClick={() => setReferenceDate(new Date())}
          >
            {weekLabel}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("habits.nextWeek")}
            onClick={() => setReferenceDate((date) => addWeeks(date, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <HabitForm
        onSubmit={async (input) => {
          await createHabit.mutateAsync(input);
        }}
        isSubmitting={createHabit.isPending}
        error={createHabit.error ? getErrorMessage(createHabit.error) : null}
      />

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(actionError)}
        </p>
      )}

      {habitsQuery.isPending && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {habitsQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(habitsQuery.error)}
        </p>
      )}
      {habitsQuery.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("habits.empty")}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {habitsQuery.data?.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            days={days}
            today={today}
            isUpdating={toggleDay.isPending && toggleDay.variables?.habitId === habit.id}
            onToggleDay={(day, completed) => toggleDay.mutate({ habitId: habit.id, day, completed })}
            onArchive={() => updateHabit.mutate({ id: habit.id, input: { archived: true } })}
            onDelete={() => deleteHabit.mutate(habit.id)}
          />
        ))}
      </div>
    </section>
  );
}
