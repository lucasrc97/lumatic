import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { columnsApi, tasksApi } from "../services/tasksApi";
import type {
  ColumnCreateInput,
  ColumnUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "../types/task";

export const taskKeys = {
  all: ["tasks"] as const,
  tasks: () => [...taskKeys.all, "tasks"] as const,
  columns: () => [...taskKeys.all, "columns"] as const,
};

export function useTasks() {
  return useQuery({ queryKey: taskKeys.tasks(), queryFn: tasksApi.list });
}

export function useTaskColumns() {
  return useQuery({ queryKey: taskKeys.columns(), queryFn: columnsApi.list });
}

/**
 * Column changes affect tasks too (completion), and due dates show up in the calendar,
 * which lives elsewhere; invalidate every query instead of coupling to its keys.
 */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: TaskCreateInput) => tasksApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskUpdateInput }) =>
      tasksApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.remove(id),
    // The task leaves this module's lists and shows up in the trash, which lives elsewhere.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useCreateColumn() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: ColumnCreateInput) => columnsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateColumn() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ColumnUpdateInput }) =>
      columnsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useReorderColumns() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (ids: number[]) => columnsApi.reorder(ids),
    onSuccess: invalidate,
  });
}

export function useDeleteColumn() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: number) => columnsApi.remove(id),
    onSuccess: invalidate,
  });
}
