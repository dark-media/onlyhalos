// ============================================================================
// Tier Validation Schemas (Zod)
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Create Tier
// ---------------------------------------------------------------------------

export const createTierSchema = z.object({
  name: z
    .string()
    .min(2, "Tier name must be at least 2 characters.")
    .max(50, "Tier name must be at most 50 characters."),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters.")
    .optional()
    .or(z.literal("")),
  price: z
    .number()
    .min(4.99, "Price must be at least $4.99.")
    .max(499.99, "Price must be at most $499.99."),
  features: z
    .array(
      z.string().min(1, "Feature cannot be empty.").max(200, "Feature must be at most 200 characters."),
    )
    .max(20, "You can add up to 20 features.")
    .default([]),
});

// ---------------------------------------------------------------------------
// Update Tier
// ---------------------------------------------------------------------------

export const updateTierSchema = z.object({
  name: z
    .string()
    .min(2, "Tier name must be at least 2 characters.")
    .max(50, "Tier name must be at most 50 characters.")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters.")
    .optional()
    .or(z.literal("")),
  price: z
    .number()
    .min(4.99, "Price must be at least $4.99.")
    .max(499.99, "Price must be at most $499.99.")
    .optional(),
  features: z
    .array(
      z.string().min(1, "Feature cannot be empty.").max(200, "Feature must be at most 200 characters."),
    )
    .max(20, "You can add up to 20 features.")
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreateTierInput = z.infer<typeof createTierSchema>;
export type UpdateTierInput = z.infer<typeof updateTierSchema>;
