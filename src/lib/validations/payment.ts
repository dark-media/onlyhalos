// ============================================================================
// Payment Validation Schemas (Zod)
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Tip
// ---------------------------------------------------------------------------

export const tipSchema = z.object({
  amount: z
    .number()
    .min(1, "Tip must be at least $1.")
    .max(10000, "Tip cannot exceed $10,000."),
  message: z
    .string()
    .max(500, "Message must be at most 500 characters.")
    .optional(),
});

// ---------------------------------------------------------------------------
// Subscribe
// ---------------------------------------------------------------------------

export const subscribeSchema = z.object({
  tierId: z
    .string()
    .min(1, "Tier ID is required."),
});

// ---------------------------------------------------------------------------
// PPV Purchase (postId comes from URL params, nothing extra needed in body)
// ---------------------------------------------------------------------------

export const ppvPurchaseSchema = z.object({});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type TipInput = z.infer<typeof tipSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type PPVPurchaseInput = z.infer<typeof ppvPurchaseSchema>;
