import { apiClient } from "@/shared/lib/apiClient";

import type { TrashItem, TrashPurgeResult } from "../types/trash";

const BASE_PATH = "/v1/trash/items";

export const trashApi = {
  async list(): Promise<TrashItem[]> {
    const { data } = await apiClient.get<TrashItem[]>(BASE_PATH);
    return data;
  },

  async restore(item: TrashItem): Promise<void> {
    await apiClient.post(`${BASE_PATH}/${item.module}/${item.id}/restore`);
  },

  async purge(item: TrashItem): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${item.module}/${item.id}`);
  },

  async empty(): Promise<TrashPurgeResult> {
    const { data } = await apiClient.delete<TrashPurgeResult>(BASE_PATH);
    return data;
  },
};
