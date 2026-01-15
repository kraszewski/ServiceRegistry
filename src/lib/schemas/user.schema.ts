/**
 * User Schemas
 *
 * Zod schemas for validating user-related request data.
 */
import { z } from "zod";

/**
 * Schema for creating a new user (POST /api/users).
 *
 * @property email - Valid email address, required
 * @property password - Password, minimum 8 characters, required
 * @property name - User display name, minimum 2 characters, maximum 100, required
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

/** Type inferred from createUserSchema */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema for validating user ID path parameter.
 * Used in GET /api/users/{id} and DELETE /api/users/{id}.
 */
export const userIdSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

/** Type inferred from userIdSchema */
export type UserIdInput = z.infer<typeof userIdSchema>;
