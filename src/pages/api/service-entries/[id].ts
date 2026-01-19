/**
 * API Endpoints: /api/service-entries/{id}
 *
 * GET /api/service-entries/{id} - Returns service entry details
 * PATCH /api/service-entries/{id} - Updates service entry
 * DELETE /api/service-entries/{id} - Deletes service entry (owner only)
 */
import type { APIRoute } from "astro";

import { serviceEntryIdSchema, updateServiceEntrySchema } from "../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../lib/services/service-entry.service";
import type { DeleteResponse, ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/service-entries/{id}
 *
 * Returns detailed information about a specific service entry.
 * Includes nested user references for performer, created_by, and updated_by.
 * Accessible by all authenticated users (owner and worker).
 *
 * Path Parameters:
 * - id (required): Service entry UUID
 *
 * Responses:
 * - 200: Success with service entry details
 * - 400: Invalid UUID format
 * - 401: Unauthorized (no valid session)
 * - 404: Service entry not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = serviceEntryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid service entry ID format" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  // 3. Fetch service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.getServiceEntry(idValidation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching service entry:", error);

    if (error instanceof Error && error.message === "Service entry not found") {
      const errorResponse: ErrorResponse = { error: "Service entry not found" };
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

/**
 * PATCH /api/service-entries/{id}
 *
 * Updates existing service entry. Cannot modify performer_id.
 * Accessible by all authenticated users (owner and worker).
 *
 * Path Parameters:
 * - id (required): Service entry UUID
 *
 * Request Body (all fields optional):
 * - service_timestamp: ISO 8601 datetime string
 * - service_type: enum (inspection, repair, maintenance)
 * - description: string (min 5 characters)
 *
 * Responses:
 * - 200: Service entry updated successfully
 * - 400: Invalid UUID, JSON, or validation error
 * - 401: Unauthorized (no valid session)
 * - 404: Service entry not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = serviceEntryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid service entry ID format" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  // 3. Parse request body
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

  // 4. Validate body
  const validationResult = updateServiceEntrySchema.safeParse(body);
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

  // 5. Check if body is not empty
  if (Object.keys(validationResult.data).length === 0) {
    const errorResponse: ErrorResponse = { error: "Request body cannot be empty" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Update service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.updateServiceEntry(idValidation.data, validationResult.data, user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating service entry:", error);

    if (error instanceof Error && error.message === "Service entry not found") {
      const errorResponse: ErrorResponse = { error: "Service entry not found" };
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

/**
 * DELETE /api/service-entries/{id}
 *
 * Deletes a service entry.
 * Only accessible by users with the 'owner' role.
 *
 * Path Parameters:
 * - id (required): Service entry UUID
 *
 * Responses:
 * - 200: Service entry deleted successfully
 * - 400: Invalid UUID format
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (user is not an owner)
 * - 404: Service entry not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = serviceEntryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid service entry ID format" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    const errorResponse: ErrorResponse = { error: "Only owner can delete service entries" };
    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Delete service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    await serviceEntryService.deleteServiceEntry(idValidation.data);

    const successResponse: DeleteResponse = { message: "Service entry deleted successfully" };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting service entry:", error);

    if (error instanceof Error && error.message === "Service entry not found") {
      const errorResponse: ErrorResponse = { error: "Service entry not found" };
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
