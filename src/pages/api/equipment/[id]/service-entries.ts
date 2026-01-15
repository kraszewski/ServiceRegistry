/**
 * API Endpoints: /api/equipment/{id}/service-entries
 *
 * GET /api/equipment/{id}/service-entries - Lists service entries for equipment
 * POST /api/equipment/{id}/service-entries - Creates new service entry
 */
import type { APIRoute } from "astro";

import { equipmentIdSchema } from "../../../../lib/schemas/equipment.schema";
import {
  createServiceEntrySchema,
  serviceEntryListParamsSchema,
} from "../../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../../lib/services/service-entry.service";
import type { ErrorResponse } from "../../../../types";

export const prerender = false;

/**
 * GET /api/equipment/{equipmentId}/service-entries
 *
 * Lists service entries for specific equipment with pagination.
 * Accessible by all authenticated users (owner and worker).
 *
 * Path Parameters:
 * - id (required): Equipment UUID
 *
 * Query Parameters:
 * - page (optional): Page number (default: 1, min: 1)
 * - limit (optional): Items per page (default: 50, min: 1, max: 100)
 *
 * Responses:
 * - 200: Success with paginated service entry list
 * - 400: Invalid UUID or query parameters
 * - 401: Unauthorized (no valid session)
 * - 404: Equipment not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = equipmentIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid equipment ID format" };
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

  // 3. Parse and validate query params
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  };

  const paramsValidation = serviceEntryListParamsSchema.safeParse(queryParams);
  if (!paramsValidation.success) {
    const errorResponse: ErrorResponse = {
      error: "Validation failed",
      details: paramsValidation.error.flatten().fieldErrors,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Fetch service entries
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.listByEquipment(
      idValidation.data,
      paramsValidation.data
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching service entries:", error);

    if (error instanceof Error && error.message === "Equipment not found") {
      const errorResponse: ErrorResponse = { error: "Equipment not found" };
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
 * POST /api/equipment/{equipmentId}/service-entries
 *
 * Creates a new service entry for equipment.
 * performer_id is automatically set to the authenticated user.
 * Accessible by all authenticated users (owner and worker).
 *
 * Path Parameters:
 * - id (required): Equipment UUID
 *
 * Request Body:
 * - service_timestamp (optional): ISO 8601 datetime string (defaults to NOW)
 * - service_type (required): enum (inspection, repair, maintenance)
 * - description (required): string (min 5 characters)
 *
 * Responses:
 * - 201: Service entry created successfully
 * - 400: Invalid UUID, JSON, or validation error
 * - 401: Unauthorized (no valid session)
 * - 404: Equipment not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = equipmentIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid equipment ID format" };
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
  const validationResult = createServiceEntrySchema.safeParse(body);
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

  // 5. Create service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.createServiceEntry(
      idValidation.data,
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating service entry:", error);

    if (error instanceof Error && error.message === "Equipment not found") {
      const errorResponse: ErrorResponse = { error: "Equipment not found" };
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
