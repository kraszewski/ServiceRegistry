/**
 * Custom hook for fetching equipment list
 * Uses TanStack Query for caching and state management
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { EquipmentListParams } from "@/types";
import { fetchEquipmentList } from "@/lib/api/equipment";

/**
 * Hook for fetching paginated equipment list with filters
 * @param params - Query parameters (page, limit, sort, filters)
 * @returns Query result with equipment data
 */
export function useEquipmentList(params: EquipmentListParams) {
  return useQuery({
    queryKey: ["equipment", "list", params],
    queryFn: () => fetchEquipmentList(params),
    placeholderData: keepPreviousData, // Keep previous data while loading new page
    staleTime: 30_000, // Data is fresh for 30 seconds
  });
}
