/**
 * Custom hook for creating a new user
 * Uses TanStack Query mutation
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateUserCommand, UserListItemDTO } from "@/types";
import { createUser } from "@/lib/api/users";

/**
 * Hook for creating a new user (worker)
 * Automatically invalidates users list on success
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (command: CreateUserCommand) => createUser(command),
    onSuccess: () => {
      // Invalidate queries to refetch users list
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });
}
