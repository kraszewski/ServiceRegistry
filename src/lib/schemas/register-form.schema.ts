/**
 * Register form validation schema
 * Zod schema for client-side validation of registration form
 */

import { z } from "zod";

/**
 * Schema for registration form
 */
export const registerFormSchema = z
  .object({
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
    confirmPassword: z
      .string()
      .min(1, "Potwierdzenie hasła jest wymagane"),
    name: z
      .string()
      .min(1, "Imię i nazwisko jest wymagane")
      .max(100, "Imię może mieć maksymalnie 100 znaków"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;
