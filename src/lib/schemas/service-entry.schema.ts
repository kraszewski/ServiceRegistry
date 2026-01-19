/**
 * Service Entry Schemas
 *
 * Zod schemas for validating service entry-related request data.
 * Used by service entry API endpoints for input validation.
 */
import { z } from "zod";

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

/**
 * Service type enum matching database enum.
 */
export const serviceTypeEnum = z.enum(["inspection", "repair", "maintenance"]);

// =============================================================================
// PATH PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for validating service entry UUID path parameter.
 */
export const serviceEntryIdSchema = z.string().uuid("Invalid service entry ID format");

export type ServiceEntryIdInput = z.infer<typeof serviceEntryIdSchema>;

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for service entry list query parameters.
 * (GET /api/equipment/{id}/service-entries)
 */
export const serviceEntryListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ServiceEntryListParams = z.infer<typeof serviceEntryListParamsSchema>;

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for creating service entry (POST /api/equipment/{id}/service-entries).
 * service_timestamp is optional - defaults to current time if not provided.
 */
export const createServiceEntrySchema = z.object({
  service_timestamp: z.string().datetime({ message: "Invalid datetime format (expected ISO 8601)" }).optional(),
  service_type: serviceTypeEnum,
  description: z.string().min(5, "Description must be at least 5 characters"),
});

export type CreateServiceEntryInput = z.infer<typeof createServiceEntrySchema>;

/**
 * Schema for updating service entry (PATCH /api/service-entries/{id}).
 * All fields are optional - partial update.
 * performer_id cannot be modified.
 */
export const updateServiceEntrySchema = createServiceEntrySchema.partial();

export type UpdateServiceEntryInput = z.infer<typeof updateServiceEntrySchema>;
