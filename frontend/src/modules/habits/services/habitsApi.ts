import { apiClient } from "@/shared/lib/apiClient";

import type {
  DateRange,
  Habit,
  HabitCreateInput,
  HabitProgress,
  HabitUpdateInput,
} from "../types/habit";

const BASE_PATH = "/v1/habits/habits";

export const habitsApi = {
  /** Active habits; with `includeArchived`, archived ones too. */
  async list(range: DateRange, today: string, includeArchived = false): Promise<HabitProgress[]> {
    const { data } = await apiClient.get<HabitProgress[]>(BASE_PATH, {
      params: { from: range.from, to: range.to, today, include_archived: includeArchived },
    });
    return data;
  },

  async create(input: HabitCreateInput): Promise<Habit> {
    const { data } = await apiClient.post<Habit>(BASE_PATH, input);
    return data;
  },

  async update(id: number, input: HabitUpdateInput): Promise<Habit> {
    const { data } = await apiClient.patch<Habit>(`${BASE_PATH}/${id}`, input);
    return data;
  },

  /** Moves the habit to the trash. */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  async completeDay(id: number, day: string): Promise<void> {
    await apiClient.put(`${BASE_PATH}/${id}/entries/${day}`);
  },

  async uncompleteDay(id: number, day: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id}/entries/${day}`);
  },
};
