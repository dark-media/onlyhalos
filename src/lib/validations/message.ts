// ============================================================================
// Message Validation Schemas (Zod)
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Create Conversation
// ---------------------------------------------------------------------------

export const createConversationSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
});

// ---------------------------------------------------------------------------
// Send Message
// ---------------------------------------------------------------------------

export const sendMessageSchema = z
  .object({
    content: z
      .string()
      .max(2000, "Message must be at most 2000 characters.")
      .optional()
      .or(z.literal("")),
    mediaUrl: z.string().url("Invalid media URL.").optional().or(z.literal("")),
    mediaType: z
      .enum(["IMAGE", "VIDEO"], {
        error: "Media type must be IMAGE or VIDEO.",
      })
      .optional(),
    ppvPrice: z
      .number()
      .min(1.99, "Price must be at least $1.99.")
      .max(499.99, "Price must be at most $499.99.")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      const hasContent = data.content && data.content.trim().length > 0;
      const hasMedia = data.mediaUrl && data.mediaUrl.trim().length > 0;
      return hasContent || hasMedia;
    },
    {
      message: "At least a text message or media attachment is required.",
      path: ["content"],
    },
  )
  .refine(
    (data) => {
      if (data.mediaUrl && data.mediaUrl.trim().length > 0) {
        return !!data.mediaType;
      }
      return true;
    },
    {
      message: "Media type is required when a media URL is provided.",
      path: ["mediaType"],
    },
  );

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
