/**
 * Validation schema for equipment form
 * Used for both create and edit modes
 */

import { z } from "zod";

/**
 * Equipment form validation schema
 */
export const equipmentFormSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(100, "Nazwa może mieć maksymalnie 100 znaków"),

  category: z.enum(["computer", "printer", "monitor", "network_device", "phone", "tablet", "peripheral", "other"], {
    required_error: "Kategoria jest wymagana",
  }),

  manufacturer: z.string().min(1, "Producent jest wymagany").max(100, "Producent może mieć maksymalnie 100 znaków"),

  model: z.string().min(1, "Model jest wymagany").max(100, "Model może mieć maksymalnie 100 znaków"),

  serial_number: z
    .string()
    .min(1, "Numer seryjny jest wymagany")
    .max(100, "Numer seryjny może mieć maksymalnie 100 znaków"),

  description: z.string().max(500, "Opis może mieć maksymalnie 500 znaków").nullable().optional(),

  location: z.string().max(200, "Lokalizacja może mieć maksymalnie 200 znaków").nullable().optional(),

  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty (oczekiwany: YYYY-MM-DD)")
    .nullable()
    .optional(),
});

/**
 * Inferred type from schema
 */
export type EquipmentFormData = z.infer<typeof equipmentFormSchema>;
