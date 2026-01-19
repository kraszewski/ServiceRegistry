/**
 * Custom hook for updating equipment
 * Uses TanStack Query mutation for updating equipment
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateEquipmentCommand } from "@/types";
import { updateEquipment } from "@/lib/api/equipment";

/**
 * Hook for updating existing equipment
 * Automatically invalidates equipment list query on success
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentCommand }) => updateEquipment(id, data),
    onSuccess: () => {
      // Invalidate and refetch equipment list
      queryClient.invalidateQueries({ queryKey: ["equipment", "list"] });
    },
  });
}
