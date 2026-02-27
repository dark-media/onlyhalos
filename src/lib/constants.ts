// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

/** Platform fee as a percentage of creator earnings. */
export const PLATFORM_FEE_PERCENT = 20;

// ---------------------------------------------------------------------------
// Upload Limits
// ---------------------------------------------------------------------------

/** Maximum image upload size in bytes (20 MB). */
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

/** Maximum video upload size in bytes (2 GB). */
export const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Allowed MIME Types
// ---------------------------------------------------------------------------

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export type AllowedVideoType = (typeof ALLOWED_VIDEO_TYPES)[number];

// ---------------------------------------------------------------------------
// Subscription Tier Limits
// ---------------------------------------------------------------------------

/**
 * Defines the maximum number of subscription tiers a creator can configure,
 * as well as the min/max price (in cents) for each tier.
 */
export const SUBSCRIPTION_TIER_LIMITS = {
  /** Maximum number of tiers a creator may define. */
  maxTiers: 3,

  /** Minimum monthly price in cents ($4.99). */
  minPriceCents: 499,

  /** Maximum monthly price in cents ($499.99). */
  maxPriceCents: 49999,
} as const;

// ---------------------------------------------------------------------------
// Default Assets
// ---------------------------------------------------------------------------

/** Fallback avatar URL for users without a profile picture. */
export const DEFAULT_AVATAR_URL = "/images/default-avatar.png";

/** Fallback cover image URL for creator profiles. */
export const DEFAULT_COVER_URL = "/images/default-cover.png";

// ---------------------------------------------------------------------------
// Roles (mirrors the Prisma UserRole enum for convenience)
// ---------------------------------------------------------------------------

export const USER_ROLES = ["FAN", "CREATOR", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ---------------------------------------------------------------------------
// Post Visibility (mirrors Prisma PostVisibility enum)
// ---------------------------------------------------------------------------

export const POST_VISIBILITY = ["PUBLIC", "SUBSCRIBERS", "TIER", "PPV"] as const;
export type PostVisibility = (typeof POST_VISIBILITY)[number];
