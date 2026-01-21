/**
 * Custom hooks for service entries queries
 */

import { useQuery } from "@tanstack/react-query";
import type { ServiceEntryDTO, ServiceEntryListResponse, ErrorResponse, PaginationParams } from "@/types";

/**
 * Hook for fetching service entries list for equipment
 */
export function useServiceEntries(equipmentId: string, params: PaginationParams = { page: 1, limit: 50 }) {
  const { page = 1, limit = 50 } = params;

  return useQuery<ServiceEntryListResponse, ErrorResponse>({
    queryKey: ["service-entries", "list", { equipmentId, page, limit }],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/equipment/${equipmentId}/service-entries?${searchParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
    enabled: !!equipmentId,
  });
}

/**
 * Hook for fetching single service entry details (for edit)
 */
export function useServiceEntryDetail(entryId: string, enabled: boolean) {
  return useQuery<ServiceEntryDTO, ErrorResponse>({
    queryKey: ["service-entries", "detail", entryId],
    queryFn: async () => {
      const response = await fetch(`/api/service-entries/${entryId}`);

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    staleTime: 60000,
    enabled: enabled && !!entryId,
  });
}
