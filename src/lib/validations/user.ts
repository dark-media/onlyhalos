// ============================================================================
// User Validation Schemas (Zod)
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Update Profile
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters.")
    .max(50, "Display name must be at most 50 characters.")
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters.")
    .optional(),
  location: z
    .string()
    .max(100, "Location must be at most 100 characters.")
    .optional(),
  websiteUrl: z
    .string()
    .url("Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
  twitterUrl: z
    .string()
    .url("Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .url("Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
  tiktokUrl: z
    .string()
    .url("Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Update Avatar
// ---------------------------------------------------------------------------

export const updateAvatarSchema = z.object({
  url: z.string().url("Please provide a valid avatar URL."),
});

// ---------------------------------------------------------------------------
// Update Cover
// ---------------------------------------------------------------------------

export const updateCoverSchema = z.object({
  url: z.string().url("Please provide a valid cover image URL."),
});

// ---------------------------------------------------------------------------
// Become Creator
// ---------------------------------------------------------------------------

export const becomeCreatorSchema = z.object({
  creatorBio: z
    .string()
    .min(20, "Creator bio must be at least 20 characters.")
    .max(1000, "Creator bio must be at most 1000 characters."),
  categories: z
    .array(z.string().min(1))
    .min(1, "Please select at least one category."),
});

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

export const notificationPreferencesSchema = z.object({
  emailSubscriptions: z.boolean(),
  emailMessages: z.boolean(),
  emailLikesComments: z.boolean(),
  emailTips: z.boolean(),
  emailPlatformUpdates: z.boolean(),
  inAppSubscriptions: z.boolean(),
  inAppMessages: z.boolean(),
  inAppLikesComments: z.boolean(),
  inAppTips: z.boolean(),
  inAppPlatformUpdates: z.boolean(),
});

// ---------------------------------------------------------------------------
// Privacy Settings
// ---------------------------------------------------------------------------

export const privacySettingsSchema = z.object({
  showOnlineStatus: z.boolean(),
  showSubscriberCount: z.boolean(),
  allowMessagesFrom: z.enum(["everyone", "subscribers", "nobody"]),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
export type UpdateCoverInput = z.infer<typeof updateCoverSchema>;
export type BecomeCreatorInput = z.infer<typeof becomeCreatorSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
