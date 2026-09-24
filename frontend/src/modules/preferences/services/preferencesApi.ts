import { apiClient } from "@/shared/lib/apiClient";

import type { Preferences, PreferencesUpdateInput } from "../types/preferences";

const BASE_PATH = "/v1/preferences/preferences";

export const preferencesApi = {
  async get(): Promise<Preferences> {
    const { data } = await apiClient.get<Preferences>(BASE_PATH);
    return data;
  },

  async update(input: PreferencesUpdateInput): Promise<Preferences> {
    const { data } = await apiClient.patch<Preferences>(BASE_PATH, input);
    return data;
  },
};
