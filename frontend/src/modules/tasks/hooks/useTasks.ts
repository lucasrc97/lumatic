import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { columnsApi, fieldsApi, tasksApi } from "../services/tasksApi";
import type {
  ColumnCreateInput,
  ColumnUpdateInput,
  FieldCreateInput,
  FieldUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "../types/task";

export const taskKeys = {
  all: ["tasks"] as const,
  tasks: () => [...taskKeys.all, "tasks"] as const,
  columns: () => [...taskKeys.all, "columns"] as const,
  fields: () => [...taskKeys.all, "fields"] as const,
};

export function useTasks() {
  return useQuery({ queryKey: taskKeys.tasks(), queryFn: tasksApi.list });
}

export function useTaskColumns() {
  return useQuery({ queryKey: taskKeys.columns(), queryFn: columnsApi.list });
}

export function useTaskFields() {
  return useQuery({ queryKey: taskKeys.fields(), queryFn: fieldsApi.list });
}

/** Columns and fields change tasks too (completion, removed values), so refresh the module. */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskKeys.all });
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

export function useCreateField() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: FieldCreateInput) => fieldsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateField() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: FieldUpdateInput }) =>
      fieldsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useReorderFields() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (ids: number[]) => fieldsApi.reorder(ids),
    onSuccess: invalidate,
  });
}

export function useDeleteField() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: number) => fieldsApi.remove(id),
    onSuccess: invalidate,
  });
}
