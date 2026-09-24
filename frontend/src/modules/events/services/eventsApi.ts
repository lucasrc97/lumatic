import { apiClient } from "@/shared/lib/apiClient";

import type { CalendarEvent, EventInput, EventUpdateInput } from "../types/event";

const BASE_PATH = "/v1/events/events";

export const eventsApi = {
  /** Events within the inclusive `yyyy-MM-dd` range. */
  async list(from: string, to: string): Promise<CalendarEvent[]> {
    const { data } = await apiClient.get<CalendarEvent[]>(BASE_PATH, { params: { from, to } });
    return data;
  },

  async create(input: EventInput): Promise<CalendarEvent> {
    const { data } = await apiClient.post<CalendarEvent>(BASE_PATH, input);
    return data;
  },

  async update(id: number, input: EventUpdateInput): Promise<CalendarEvent> {
    const { data } = await apiClient.patch<CalendarEvent>(`${BASE_PATH}/${id}`, input);
    return data;
  },

  /** Moves the event to the trash. */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },
};
