/**
 * Users API client functions
 * Handles communication with user endpoints
 */

import type {
  PaginationParams,
  UserListResponse,
  CreateUserCommand,
  UserListItemDTO,
  DeleteResponse,
  UserDTO,
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
 * Fetch users list with pagination
 * @param params - Query parameters for pagination
 * @returns Paginated users list
 */
export async function fetchUsersList(params: PaginationParams): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await fetch(`/api/users?${searchParams}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}

/**
 * Fetch single user by ID
 * @param userId - User ID
 * @returns User details
 */
export async function fetchUser(userId: string): Promise<UserDTO> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}

/**
 * Create new user (worker)
 * @param command - User data
 * @returns Created user
 */
export async function createUser(command: CreateUserCommand): Promise<UserListItemDTO> {
  const response = await fetch("/api/users", {
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
 * Delete user
 * @param userId - User ID
 * @returns Delete confirmation
 */
export async function deleteUser(userId: string): Promise<DeleteResponse> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error);
  }

  return response.json();
}
