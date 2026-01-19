/**
 * Custom hook for deleting equipment
 * Uses TanStack Query mutation for deleting equipment
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEquipment } from "@/lib/api/equipment";

/**
 * Hook for deleting equipment
 * Automatically invalidates equipment list query on success
 */
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      // Invalidate and refetch equipment list
      queryClient.invalidateQueries({ queryKey: ["equipment", "list"] });
    },
  });
}
