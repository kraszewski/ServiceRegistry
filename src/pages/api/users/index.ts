/**
 * API Endpoints: /api/users
 *
 * GET /api/users - Returns a paginated list of all users (owner only)
 * POST /api/users - Creates a new worker account (owner only)
 */
import type { APIRoute } from "astro";

import { paginationSchema } from "../../../lib/schemas/pagination.schema";
import { createUserSchema } from "../../../lib/schemas/user.schema";
import { createUserService } from "../../../lib/services/user.service";
import type { ErrorResponse, UserListItemDTO, UserListResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/users
 *
 * Returns a paginated list of all users in the system.
 * Only accessible by users with the 'owner' role.
 *
 * Query Parameters:
 * - page (optional): Page number, default 1, min 1
 * - limit (optional): Items per page, default 50, min 1, max 100
 *
 * Responses:
 * - 200: Success with paginated user list
 * - 400: Validation error (invalid query params)
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (user is not an owner)
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parse query parameters
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  };

  // 2. Validate parameters
  const validationResult = paginationSchema.safeParse(queryParams);
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

  const { page, limit } = validationResult.data;

  // 3. Check authentication
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

  // 4. Check authorization (owner only)
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

  // 5. Fetch users list
  try {
    const userService = createUserService(supabase);
    const result = await userService.listUsers(page, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/users
 *
 * Creates a new worker account.
 * Only accessible by users with the 'owner' role.
 *
 * Request Body:
 * - email (required): Valid email address
 * - password (required): Minimum 8 characters
 * - name (required): User display name, 2-100 characters
 *
 * Responses:
 * - 201: User created successfully
 * - 400: Validation error (invalid request body)
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (user is not an owner)
 * - 409: Conflict (email already exists)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Check authentication
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

  // 2. Check authorization (owner only)
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

  // 3. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorResponse = { error: "Invalid JSON body" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = createUserSchema.safeParse(body);
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

  // 4. Create user
  try {
    const userService = createUserService(supabase);
    const result = await userService.createUser(validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes("already exists")) {
      const errorResponse: ErrorResponse = { error: "Email already exists" };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
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
