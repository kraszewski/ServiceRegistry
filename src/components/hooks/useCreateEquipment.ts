/**
 * Custom hook for creating equipment
 * Uses TanStack Query mutation for creating equipment
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateEquipmentCommand } from "@/types";
import { createEquipment } from "@/lib/api/equipment";

/**
 * Hook for creating new equipment
 * Automatically invalidates equipment list query on success
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateEquipmentCommand) => createEquipment(command),
    onSuccess: () => {
      // Invalidate and refetch equipment list
      queryClient.invalidateQueries({ queryKey: ["equipment", "list"] });
    },
  });
}
