/**
 * API Endpoints: /api/equipment/{id}
 *
 * GET /api/equipment/{id} - Returns equipment details
 * PATCH /api/equipment/{id} - Updates equipment
 * DELETE /api/equipment/{id} - Deletes equipment (owner only)
 */
import type { APIRoute } from "astro";

import { equipmentIdSchema, updateEquipmentSchema } from "../../../../lib/schemas/equipment.schema";
import { createEquipmentService } from "../../../../lib/services/equipment.service";
import type { DeleteResponse, ErrorResponse } from "../../../../types";

export const prerender = false;

/**
 * GET /api/equipment/{id}
 *
 * Returns detailed information about a specific equipment.
 * Accessible by all authenticated users (owner and worker).
 *
 * Path Parameters:
 * - id (required): Equipment UUID
 *
 * Responses:
 * - 200: Success with equipment details
 * - 400: Invalid UUID format
 * - 401: Unauthorized (no valid session)
 * - 404: Equipment not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

  const id = idValidation.data;

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

  // 3. Fetch equipment details
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.getEquipment(id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching equipment:", error);

    // Handle not found error
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
 * PATCH /api/equipment/{id}
 *
 * Updates existing equipment. Cannot modify equipment_id.
 * Accessible by all authenticated users (owner and worker).
 *
 * Path Parameters:
 * - id (required): Equipment UUID
 *
 * Request Body (all fields optional):
 * - name: Equipment name, 1-100 characters
 * - category: Equipment category enum
 * - manufacturer: Manufacturer name, 1-100 characters
 * - model: Model name, 1-100 characters
 * - serial_number: Unique serial number, 1-100 characters
 * - description: Equipment description (nullable)
 * - location: Equipment location, max 200 characters (nullable)
 * - purchase_date: Purchase date in YYYY-MM-DD format (nullable)
 *
 * Responses:
 * - 200: Equipment updated successfully
 * - 400: Invalid UUID, JSON, or validation error
 * - 401: Unauthorized (no valid session)
 * - 404: Equipment not found
 * - 409: Conflict (serial number already exists)
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, locals, request }) => {
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

  const id = idValidation.data;

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
  const validationResult = updateEquipmentSchema.safeParse(body);
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

  // 6. Update equipment
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.updateEquipment(id, validationResult.data, user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating equipment:", error);

    if (error instanceof Error) {
      if (error.message === "Equipment not found") {
        const errorResponse: ErrorResponse = { error: "Equipment not found" };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (error.message.includes("serial_number")) {
        const errorResponse: ErrorResponse = { error: "Serial number already exists" };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/equipment/{id}
 *
 * Deletes equipment and all associated service entries (cascade).
 * Only accessible by users with the 'owner' role.
 *
 * Path Parameters:
 * - id (required): Equipment UUID
 *
 * Responses:
 * - 200: Equipment deleted successfully
 * - 400: Invalid UUID format
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (user is not an owner)
 * - 404: Equipment not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  const id = idValidation.data;

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
    const errorResponse: ErrorResponse = { error: "Only owner can delete equipment" };
    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Delete equipment
  try {
    const equipmentService = createEquipmentService(supabase);
    await equipmentService.deleteEquipment(id);

    const successResponse: DeleteResponse = { message: "Equipment deleted successfully" };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting equipment:", error);

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
