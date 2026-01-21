/**
 * Custom hook for fetching equipment details
 */

import { useQuery } from "@tanstack/react-query";
import type { EquipmentDTO, ErrorResponse } from "@/types";

/**
 * Hook for fetching single equipment details
 */
export function useEquipmentDetails(equipmentId: string) {
  return useQuery<EquipmentDTO, ErrorResponse>({
    queryKey: ["equipment", "detail", equipmentId],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}`);

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    staleTime: 60000, // 60 seconds
    retry: 1,
    enabled: !!equipmentId,
  });
}
