import { useQuery } from "@tanstack/react-query";

import { calendarApi } from "../services/calendarApi";

export const calendarKeys = {
  all: ["calendar"] as const,
  items: (from: string, to: string) => [...calendarKeys.all, "items", from, to] as const,
};

export function useCalendarItems(from: string, to: string) {
  return useQuery({
    queryKey: calendarKeys.items(from, to),
    // Events and tasks refresh every query when they change, so this stays current.
    queryFn: () => calendarApi.list(from, to),
  });
}
