import { apiClient } from "@/shared/lib/apiClient";

import type { CalendarItem } from "../types/calendar";

export const calendarApi = {
  /** Items from every module within the inclusive `yyyy-MM-dd` range. */
  async list(from: string, to: string): Promise<CalendarItem[]> {
    const { data } = await apiClient.get<CalendarItem[]>("/v1/calendar/items", {
      params: { from, to },
    });
    return data;
  },
};
