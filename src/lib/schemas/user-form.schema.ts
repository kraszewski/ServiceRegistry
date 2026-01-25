/**
 * User form validation schemas
 * Zod schemas for client-side validation of user forms
 */

import { z } from "zod";

/**
 * Schema for creating a new user
 */
export const createUserFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane")
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(72, "Hasło może mieć maksymalnie 72 znaki"),
  name: z.string().min(1, "Imię jest wymagane").max(100, "Imię może mieć maksymalnie 100 znaków"),
});

export type CreateUserFormInput = z.infer<typeof createUserFormSchema>;
