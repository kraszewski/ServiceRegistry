/**
 * Custom hooks for service entry mutations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateServiceEntryCommand, UpdateServiceEntryCommand, ServiceEntryResponseDTO, DeleteResponse } from "@/types";

/**
 * Hook for creating a new service entry
 */
export function useCreateServiceEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { equipmentId: string; command: CreateServiceEntryCommand }) => {
      const response = await fetch(`/api/equipment/${data.equipmentId}/service-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.command),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json() as Promise<ServiceEntryResponseDTO>;
    },
    onSuccess: (_data, variables) => {
      // Invalidate service entries list
      queryClient.invalidateQueries({
        queryKey: ["service-entries", "list", { equipmentId: variables.equipmentId }],
      });
    },
  });
}

/**
 * Hook for updating a service entry
 */
export function useUpdateServiceEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { entryId: string; equipmentId: string; command: UpdateServiceEntryCommand }) => {
      const response = await fetch(`/api/service-entries/${data.entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.command),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json() as Promise<ServiceEntryResponseDTO>;
    },
    onSuccess: (data, variables) => {
      // Invalidate entry detail
      queryClient.invalidateQueries({
        queryKey: ["service-entries", "detail", variables.entryId],
      });
      // Invalidate entries list
      queryClient.invalidateQueries({
        queryKey: ["service-entries", "list", { equipmentId: variables.equipmentId }],
      });
    },
  });
}

/**
 * Hook for deleting a service entry
 */
export function useDeleteServiceEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { entryId: string; equipmentId: string }) => {
      const response = await fetch(`/api/service-entries/${data.entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json() as Promise<DeleteResponse>;
    },
    onSuccess: (_data, variables) => {
      // Invalidate entries list
      queryClient.invalidateQueries({
        queryKey: ["service-entries", "list", { equipmentId: variables.equipmentId }],
      });
    },
  });
}
