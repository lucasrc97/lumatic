import { useQuery, useQueryClient } from "@tanstack/react-query";

import { calendarApi } from "../services/calendarApi";

export const calendarKeys = {
  all: ["calendar"] as const,
  items: (from: string, to: string) => [...calendarKeys.all, "items", from, to] as const,
};

export function useCalendarItems(from: string, to: string) {
  return useQuery({
    queryKey: calendarKeys.items(from, to),
    queryFn: () => calendarApi.list(from, to),
  });
}

/** Refresh the calendar after creating items in other modules. */
export function useInvalidateCalendar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: calendarKeys.all });
}
