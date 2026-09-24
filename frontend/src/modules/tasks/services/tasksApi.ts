import { apiClient } from "@/shared/lib/apiClient";

import type {
  ColumnCreateInput,
  ColumnUpdateInput,
  Task,
  TaskColumn,
  TaskCreateInput,
  TaskUpdateInput,
} from "../types/task";

const BASE_PATH = "/v1/tasks";

export const tasksApi = {
  async list(): Promise<Task[]> {
    const { data } = await apiClient.get<Task[]>(`${BASE_PATH}/tasks`);
    return data;
  },

  async create(input: TaskCreateInput): Promise<Task> {
    const { data } = await apiClient.post<Task>(`${BASE_PATH}/tasks`, input);
    return data;
  },

  async update(id: number, input: TaskUpdateInput): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`${BASE_PATH}/tasks/${id}`, input);
    return data;
  },

  /** Moves the task to the trash. */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/tasks/${id}`);
  },
};

export const columnsApi = {
  async list(): Promise<TaskColumn[]> {
    const { data } = await apiClient.get<TaskColumn[]>(`${BASE_PATH}/columns`);
    return data;
  },

  async create(input: ColumnCreateInput): Promise<TaskColumn> {
    const { data } = await apiClient.post<TaskColumn>(`${BASE_PATH}/columns`, input);
    return data;
  },

  async update(id: number, input: ColumnUpdateInput): Promise<TaskColumn> {
    const { data } = await apiClient.patch<TaskColumn>(`${BASE_PATH}/columns/${id}`, input);
    return data;
  },

  async reorder(ids: number[]): Promise<TaskColumn[]> {
    const { data } = await apiClient.put<TaskColumn[]>(`${BASE_PATH}/columns/order`, { ids });
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/columns/${id}`);
  },
};
