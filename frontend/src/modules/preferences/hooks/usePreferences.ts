import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { preferencesApi } from "../services/preferencesApi";
import type { PreferencesUpdateInput } from "../types/preferences";

export const preferencesKeys = {
  all: ["preferences"] as const,
};

export function usePreferences() {
  return useQuery({ queryKey: preferencesKeys.all, queryFn: preferencesApi.get });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PreferencesUpdateInput) => preferencesApi.update(input),
    onSuccess: (preferences) => queryClient.setQueryData(preferencesKeys.all, preferences),
  });
}
