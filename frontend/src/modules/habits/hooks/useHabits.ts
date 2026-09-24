import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { habitsApi } from "../services/habitsApi";
import type { DateRange, HabitCreateInput, HabitUpdateInput } from "../types/habit";

export const habitKeys = {
  all: ["habits"] as const,
  list: (range: DateRange, today: string) =>
    [...habitKeys.all, "list", range.from, range.to, today] as const,
};

export function useHabits(range: DateRange, today: string) {
  return useQuery({
    queryKey: habitKeys.list(range, today),
    queryFn: () => habitsApi.list(range, today),
  });
}

function useInvalidateHabits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: habitKeys.all });
}

export function useCreateHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: (input: HabitCreateInput) => habitsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: HabitUpdateInput }) =>
      habitsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => habitsApi.remove(id),
    // The habit leaves this module's lists and shows up in the trash, which lives elsewhere.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useToggleHabitDay() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ habitId, day, completed }: { habitId: number; day: string; completed: boolean }) =>
      completed ? habitsApi.completeDay(habitId, day) : habitsApi.uncompleteDay(habitId, day),
    onSuccess: invalidate,
  });
}
