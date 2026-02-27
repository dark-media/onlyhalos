// ============================================================================
// Post Validation Schemas (Zod)
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Create Post
// ---------------------------------------------------------------------------

export const createPostSchema = z
  .object({
    caption: z
      .string()
      .max(2000, "Caption must be at most 2000 characters.")
      .optional()
      .or(z.literal("")),
    visibility: z.enum(["PUBLIC", "SUBSCRIBERS", "TIER", "PPV"], {
      error: "Visibility is required.",
    }),
    minimumTierId: z.string().optional().nullable(),
    ppvPrice: z
      .number()
      .min(1.99, "Price must be at least $1.99.")
      .max(499.99, "Price must be at most $499.99.")
      .optional()
      .nullable(),
    scheduledAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable(),
    mediaIds: z
      .array(z.string().min(1, "Media ID cannot be empty."))
      .min(1, "At least one media item is required."),
  })
  .refine(
    (data) => {
      if (data.visibility === "TIER") {
        return !!data.minimumTierId;
      }
      return true;
    },
    {
      message: "A tier must be selected for tier-restricted posts.",
      path: ["minimumTierId"],
    },
  )
  .refine(
    (data) => {
      if (data.visibility === "PPV") {
        return data.ppvPrice != null && data.ppvPrice >= 1.99;
      }
      return true;
    },
    {
      message: "A price between $1.99 and $499.99 is required for PPV posts.",
      path: ["ppvPrice"],
    },
  );

// ---------------------------------------------------------------------------
// Update Post
// ---------------------------------------------------------------------------

export const updatePostSchema = z
  .object({
    caption: z
      .string()
      .max(2000, "Caption must be at most 2000 characters.")
      .optional()
      .or(z.literal("")),
    visibility: z
      .enum(["PUBLIC", "SUBSCRIBERS", "TIER", "PPV"])
      .optional(),
    minimumTierId: z.string().optional().nullable(),
    ppvPrice: z
      .number()
      .min(1.99, "Price must be at least $1.99.")
      .max(499.99, "Price must be at most $499.99.")
      .optional()
      .nullable(),
    scheduledAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable(),
    mediaIds: z
      .array(z.string().min(1, "Media ID cannot be empty."))
      .min(1, "At least one media item is required.")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.visibility === "TIER") {
        return !!data.minimumTierId;
      }
      return true;
    },
    {
      message: "A tier must be selected for tier-restricted posts.",
      path: ["minimumTierId"],
    },
  )
  .refine(
    (data) => {
      if (data.visibility === "PPV") {
        return data.ppvPrice != null && data.ppvPrice >= 1.99;
      }
      return true;
    },
    {
      message: "A price between $1.99 and $499.99 is required for PPV posts.",
      path: ["ppvPrice"],
    },
  );

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(500, "Comment must be at most 500 characters."),
  parentId: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
