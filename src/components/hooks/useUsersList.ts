/**
 * Custom hook for fetching users list
 * Uses TanStack Query for caching and state management
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { PaginationParams } from "@/types";
import { fetchUsersList } from "@/lib/api/users";

/**
 * Hook for fetching paginated users list
 * @param params - Query parameters (page, limit)
 * @returns Query result with users data
 */
export function useUsersList(params: PaginationParams) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => fetchUsersList(params),
    placeholderData: keepPreviousData, // Keep previous data while loading new page
    staleTime: 30_000, // Data is fresh for 30 seconds
  });
}
