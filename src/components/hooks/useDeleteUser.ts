/**
 * Custom hook for deleting a user
 * Uses TanStack Query mutation
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "@/lib/api/users";

/**
 * Hook for deleting a user
 * Automatically invalidates users list on success
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      // Invalidate queries to refetch users list
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });
}
