/**
 * Login form validation schema
 * Zod schema for client-side validation of login form
 */

import { z } from "zod";

/**
 * Schema for login form
 */
export const loginFormSchema = z.object({
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
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
