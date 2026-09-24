import { addWeeks, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { toISODate, weekDays } from "@/shared/lib/dates";

import {
  useCreateHabit,
  useHabits,
  useToggleHabitDay,
  useUpdateHabit,
} from "../hooks/useHabits";
import HabitCard from "./HabitCard";
import HabitForm from "./HabitForm";

export default function HabitsPage() {
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const today = toISODate(new Date());
  const days = weekDays(referenceDate).map(toISODate);
  const range = { from: days[0], to: days[days.length - 1] };

  const habitsQuery = useHabits(range, today);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const toggleDay = useToggleHabitDay();
  const actionError = toggleDay.error ?? updateHabit.error;

  const weekLabel = `${format(parseISO(range.from), "d MMM", { locale: ptBR })} – ${format(
    parseISO(range.to),
    "d MMM",
    { locale: ptBR },
  )}`;

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Hábitos</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => setReferenceDate((date) => addWeeks(date, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Voltar para a semana atual"
            onClick={() => setReferenceDate(new Date())}
          >
            {weekLabel}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Próxima semana"
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

      {habitsQuery.isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {habitsQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(habitsQuery.error)}
        </p>
      )}
      {habitsQuery.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum hábito ainda. Adicione o primeiro acima.
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
          />
        ))}
      </div>
    </section>
  );
}
