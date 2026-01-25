/**
 * API Endpoints: /api/users/{id}
 *
 * GET /api/users/{id} - Returns a specific user's profile (owner only)
 * DELETE /api/users/{id} - Deletes a worker account (owner only)
 */
import type { APIRoute } from "astro";

import { userIdSchema } from "../../../lib/schemas/user.schema";
import { createUserService } from "../../../lib/services/user.service";
import type { ErrorResponse, UserDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/users/{id}
 *
 * Returns a specific user's profile including email, name, role, and timestamps.
 * Only accessible by users with the 'owner' role.
 *
 * Path Parameters:
 * - id (required): User UUID
 *
 * Responses:
 * - 200: Success with user details
 * - 400: Validation error (invalid UUID format)
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (user is not an owner)
 * - 404: User not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const validationResult = userIdSchema.safeParse({ id: params.id });
  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Validation failed",
      details: validationResult.error.flatten().fieldErrors,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = validationResult.data;

  // 2. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponse = { error: "Unauthorized" };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Check authorization (owner only)
  const { data: isOwner, error: roleError } = await supabase.rpc("is_owner");

  if (roleError || !isOwner) {
    const errorResponse: ErrorResponse = {
      error: "Only owner can perform this action",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Fetch user details
  try {
    const userService = createUserService(supabase);
    const result = await userService.getUser(id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user:", error);

    // Handle not found error
    if (error instanceof Error && error.message === "User not found") {
      const errorResponse: ErrorResponse = { error: "User not found" };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
