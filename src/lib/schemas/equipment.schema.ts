/**
 * Equipment Schemas
 *
 * Zod schemas for validating equipment-related request data.
 * Used by equipment API endpoints for input validation.
 */
import { z } from "zod";

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

/**
 * Equipment category enum matching database enum.
 */
export const equipmentCategoryEnum = z.enum([
  "computer",
  "printer",
  "monitor",
  "network_device",
  "phone",
  "tablet",
  "peripheral",
  "other",
]);

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for equipment list query parameters (GET /api/equipment).
 * Extends pagination with sorting and filtering options.
 */
export const equipmentListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z
    .enum(["created_at", "name", "equipment_id", "category", "manufacturer"])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  category: equipmentCategoryEnum.optional(),
  search: z.string().optional(),
});

export type EquipmentListParamsInput = z.infer<typeof equipmentListParamsSchema>;

// =============================================================================
// PATH PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for validating equipment UUID path parameter.
 */
export const equipmentIdSchema = z.string().uuid("Invalid equipment ID format");

export type EquipmentIdInput = z.infer<typeof equipmentIdSchema>;

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for creating equipment (POST /api/equipment).
 * All required fields must be provided.
 */
export const createEquipmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  category: equipmentCategoryEnum,
  manufacturer: z
    .string()
    .min(1, "Manufacturer is required")
    .max(100, "Manufacturer must be at most 100 characters"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(100, "Model must be at most 100 characters"),
  serial_number: z
    .string()
    .min(1, "Serial number is required")
    .max(100, "Serial number must be at most 100 characters"),
  description: z.string().nullable().optional(),
  location: z
    .string()
    .max(200, "Location must be at most 200 characters")
    .nullable()
    .optional(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
    .nullable()
    .optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

/**
 * Schema for updating equipment (PATCH /api/equipment/{id}).
 * All fields are optional - partial update.
 */
export const updateEquipmentSchema = createEquipmentSchema.partial();

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
