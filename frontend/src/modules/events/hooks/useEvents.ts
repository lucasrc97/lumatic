import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { eventsApi } from "../services/eventsApi";
import type { EventInput, EventUpdateInput } from "../types/event";

export const eventKeys = {
  all: ["events"] as const,
  list: (from: string, to: string) => [...eventKeys.all, "list", from, to] as const,
};

export function useEvents(from: string, to: string) {
  return useQuery({ queryKey: eventKeys.list(from, to), queryFn: () => eventsApi.list(from, to) });
}

/**
 * Events also show up in the calendar view, which lives elsewhere,
 * so invalidate every query instead of coupling this module to its keys.
 */
function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useCreateEvent() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: EventInput) => eventsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EventUpdateInput }) =>
      eventsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: number) => eventsApi.remove(id),
    onSuccess: invalidate,
  });
}
