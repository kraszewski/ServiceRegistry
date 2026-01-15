/**
 * Pagination Schema
 *
 * Zod schema for validating pagination query parameters.
 * Used across multiple list endpoints in the API.
 */
import { z } from "zod";

/**
 * Schema for pagination query parameters.
 *
 * @property page - Page number (1-indexed), defaults to 1, minimum 1
 * @property limit - Items per page, defaults to 50, minimum 1, maximum 100
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** Type inferred from paginationSchema */
export type PaginationInput = z.infer<typeof paginationSchema>;
