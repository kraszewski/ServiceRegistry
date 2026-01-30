/**
 * Equipment API client functions
 * Handles communication with equipment endpoints
 */

import type {
  EquipmentListParams,
  EquipmentListResponse,
  CreateEquipmentCommand,
  UpdateEquipmentCommand,
  EquipmentResponseDTO,
  DeleteResponse,
} from "@/types";

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown
  ) {
    super(`API Error: ${status}`);
    this.name = "ApiError";
  }
}

/**
 * Fetch equipment list with pagination, sorting, and filtering
 * @param params - Query parameters for list
 * @returns Paginated equipment list
 */
export async function fetchEquipmentList(params: EquipmentListParams): Promise<EquipmentListResponse> {
  const searchParams = new URLSearchParams();

  // Always include page and limit (with defaults)
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 10));

  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.category) searchParams.set("category", params.category);
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/equipment?${searchParams}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}

/**
 * Create new equipment
 * @param command - Equipment data
 * @returns Created equipment
 */
export async function createEquipment(command: CreateEquipmentCommand): Promise<EquipmentResponseDTO> {
  const response = await fetch("/api/equipment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}

/**
 * Update existing equipment
 * @param id - Equipment ID
 * @param command - Updated equipment data
 * @returns Updated equipment
 */
export async function updateEquipment(id: string, command: UpdateEquipmentCommand): Promise<EquipmentResponseDTO> {
  const response = await fetch(`/api/equipment/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}

/**
 * Delete equipment
 * @param id - Equipment ID
 * @returns Delete confirmation
 */
export async function deleteEquipment(id: string): Promise<DeleteResponse> {
  const response = await fetch(`/api/equipment/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}
