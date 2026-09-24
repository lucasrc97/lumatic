import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trashApi } from "../services/trashApi";
import type { TrashItem } from "../types/trash";

export const trashKeys = {
  all: ["trash"] as const,
};

export function useTrash() {
  return useQuery({ queryKey: trashKeys.all, queryFn: trashApi.list });
}

/**
 * Trash changes affect the owning module's lists too (a restored habit reappears),
 * so invalidate every query instead of coupling this module to each module's keys.
 */
function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useRestoreTrashItem() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (item: TrashItem) => trashApi.restore(item),
    onSuccess: invalidate,
  });
}

export function usePurgeTrashItem() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (item: TrashItem) => trashApi.purge(item),
    onSuccess: invalidate,
  });
}

export function useEmptyTrash() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: trashApi.empty, onSuccess: invalidate });
}
