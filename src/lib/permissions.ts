import type { UserRole, PostVisibility } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal user shape required by permission checks. */
export interface PermissionUser {
  id: string;
  role: UserRole;
}

/** Minimal post shape required by permission checks. */
export interface PermissionPost {
  id: string;
  creatorId: string;
  visibility: PostVisibility;
  tierId?: string | null;
  ppvPriceCents?: number | null;
}

/** Minimal subscription shape for access checks. */
export interface PermissionSubscription {
  id: string;
  tierId: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Role-based checks
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the given role may access the creator dashboard.
 */
export function canAccessCreatorDashboard(role: UserRole): boolean {
  return role === "CREATOR" || role === "ADMIN";
}

/**
 * Returns `true` if the given role may access the admin panel.
 */
export function canAccessAdminPanel(role: UserRole): boolean {
  return role === "ADMIN";
}

// ---------------------------------------------------------------------------
// Post-level checks
// ---------------------------------------------------------------------------

/**
 * Determines whether a user can view a post, taking into account the post's
 * visibility setting and the viewer's subscription (if any).
 *
 * Rules:
 * - Admins can always view any post.
 * - The post creator can always view their own posts.
 * - `PUBLIC` posts are viewable by everyone.
 * - `SUBSCRIBERS` posts require an active subscription to the creator.
 * - `TIER` posts require an active subscription at the matching tier.
 * - `PPV` posts are only viewable after purchase (tracked externally).
 *   This function returns `false` for PPV unless the viewer is the creator
 *   or an admin; actual purchase verification should be done by the caller.
 */
export function canViewPost(
  user: PermissionUser | null,
  post: PermissionPost,
  subscription?: PermissionSubscription | null,
): boolean {
  // Unauthenticated users may only see public posts.
  if (!user) {
    return post.visibility === "PUBLIC";
  }

  // Admins see everything.
  if (user.role === "ADMIN") {
    return true;
  }

  // Post owner always has access.
  if (user.id === post.creatorId) {
    return true;
  }

  switch (post.visibility) {
    case "PUBLIC":
      return true;

    case "SUBSCRIBERS":
      return subscription?.status === "ACTIVE";

    case "TIER":
      return (
        subscription?.status === "ACTIVE" &&
        subscription.tierId === post.tierId
      );

    case "PPV":
      // PPV access depends on purchase records; the caller must verify
      // that the user has purchased the post before granting access.
      return false;

    default:
      return false;
  }
}

/**
 * Returns `true` if the given user may edit the post.
 * Only the post creator can edit their own posts.
 */
export function canEditPost(userId: string, post: PermissionPost): boolean {
  return userId === post.creatorId;
}

/**
 * Returns `true` if the given user may delete the post.
 * The post creator and admins are allowed.
 */
export function canDeletePost(
  userId: string,
  post: PermissionPost,
  role: UserRole,
): boolean {
  if (role === "ADMIN") {
    return true;
  }
  return userId === post.creatorId;
}

// ---------------------------------------------------------------------------
// Messaging checks
// ---------------------------------------------------------------------------

/**
 * Determines whether `user` is allowed to send a message to `targetUser`.
 *
 * Rules:
 * - Admins can message anyone.
 * - Creators can message their subscribers and other creators.
 * - Fans can message creators they are subscribed to.
 * - Users cannot message themselves.
 */
export function canSendMessage(
  user: PermissionUser,
  targetUser: PermissionUser,
): boolean {
  // Cannot message yourself.
  if (user.id === targetUser.id) {
    return false;
  }

  // Admins can message anyone.
  if (user.role === "ADMIN") {
    return true;
  }

  // Creators can message other users (subscriber verification can be
  // layered on top at the API route level if stricter rules are desired).
  if (user.role === "CREATOR") {
    return true;
  }

  // Fans can only message creators (subscription check should be done at
  // the API layer via `isSubscribedTo`).
  if (user.role === "FAN" && targetUser.role === "CREATOR") {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Async subscription lookup
// ---------------------------------------------------------------------------

/**
 * Checks whether `userId` has an active subscription to `creatorId`.
 *
 * This performs a database query via Prisma and should only be called
 * server-side.
 */
export async function isSubscribedTo(
  userId: string,
  creatorId: string,
): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      subscriberId: userId,
      creatorId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return subscription !== null;
}
