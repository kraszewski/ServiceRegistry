/**
 * API Endpoints: /api/equipment
 *
 * GET /api/equipment - Returns a paginated list of equipment
 * POST /api/equipment - Creates new equipment
 */
import type { APIRoute } from "astro";

import { createEquipmentSchema, equipmentListParamsSchema } from "../../../lib/schemas/equipment.schema";
import { createEquipmentService } from "../../../lib/services/equipment.service";
import type { ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/equipment
 *
 * Returns a paginated list of equipment with sorting and filtering options.
 * Accessible by all authenticated users (owner and worker).
 *
 * Query Parameters:
 * - page (optional): Page number, default 1, min 1
 * - limit (optional): Items per page, default 50, min 1, max 100
 * - sort (optional): Sort field (created_at, name, equipment_id, category, manufacturer)
 * - order (optional): Sort order (asc, desc), default desc
 * - category (optional): Filter by equipment category
 * - search (optional): Search by equipment_id (exact match)
 *
 * Responses:
 * - 200: Success with paginated equipment list
 * - 400: Validation error (invalid query params)
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parse query parameters (filter out null values so Zod can use defaults)
  const url = new URL(request.url);
  const rawParams: Record<string, string | null> = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    sort: url.searchParams.get("sort"),
    order: url.searchParams.get("order"),
    category: url.searchParams.get("category"),
    search: url.searchParams.get("search"),
  };

  // Remove null values so Zod defaults can be applied
  const queryParams = Object.fromEntries(Object.entries(rawParams).filter(([, value]) => value !== null));

  // 2. Validate parameters
  const validationResult = equipmentListParamsSchema.safeParse(queryParams);
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

  // 4. Fetch equipment list
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.listEquipment(validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/equipment
 *
 * Creates new equipment with auto-generated equipment_id.
 * Accessible by all authenticated users (owner and worker).
 *
 * Request Body:
 * - name (required): Equipment name, 1-100 characters
 * - category (required): Equipment category enum
 * - manufacturer (required): Manufacturer name, 1-100 characters
 * - model (required): Model name, 1-100 characters
 * - serial_number (required): Unique serial number, 1-100 characters
 * - description (optional): Equipment description
 * - location (optional): Equipment location, max 200 characters
 * - purchase_date (optional): Purchase date in YYYY-MM-DD format
 *
 * Responses:
 * - 201: Equipment created successfully
 * - 400: Validation error (invalid request body or JSON)
 * - 401: Unauthorized (no valid session)
 * - 409: Conflict (serial number already exists)
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

  // 2. Parse request body
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

  // 3. Validate body
  const validationResult = createEquipmentSchema.safeParse(body);
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

  // 4. Create equipment
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.createEquipment(validationResult.data, user.id);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating equipment:", error);

    // Handle duplicate serial number
    if (error instanceof Error && error.message.includes("serial_number")) {
      const errorResponse: ErrorResponse = {
        error: "Serial number already exists",
      };
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
