// ============================================================================
// Notification Creation Helpers
// ============================================================================

import { prisma } from "@/lib/prisma";
// NotificationType mirrors the enum defined in prisma/schema.prisma.
// We declare it locally so the module compiles before `prisma generate` runs.
type NotificationType =
  | "NEW_SUBSCRIBER"
  | "NEW_TIP"
  | "NEW_MESSAGE"
  | "NEW_COMMENT"
  | "NEW_LIKE"
  | "POST_PURCHASED"
  | "SUBSCRIPTION_EXPIRED"
  | "PAYOUT_COMPLETED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "SYSTEM";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateNotificationData {
  receiverId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Creates a notification record in the database.
 *
 * This function is intentionally fire-and-forget safe — callers should
 * `.catch()` errors to avoid failing the primary operation (e.g. liking
 * a post) when a notification fails to be created.
 */
export async function createNotification(data: CreateNotificationData) {
  return prisma.notification.create({
    data: {
      receiverId: data.receiverId,
      type: data.type,
      title: data.title,
      body: data.body,
      linkUrl: data.linkUrl ?? null,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
    },
  });
}

// ---------------------------------------------------------------------------
// Typed helper functions
// ---------------------------------------------------------------------------

/**
 * Notify a creator that they have a new subscriber.
 */
export async function notifyNewSubscriber(
  creatorId: string,
  subscriberName: string,
) {
  return createNotification({
    receiverId: creatorId,
    type: "NEW_SUBSCRIBER",
    title: "New Subscriber",
    body: `${subscriberName} just subscribed to your content.`,
    linkUrl: "/settings",
  });
}

/**
 * Notify a creator that they received a tip.
 */
export async function notifyNewTip(
  creatorId: string,
  senderName: string,
  amount: number,
) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount / 100);

  return createNotification({
    receiverId: creatorId,
    type: "NEW_TIP",
    title: "New Tip Received",
    body: `${senderName} sent you a ${formatted} tip.`,
    linkUrl: "/settings",
    metadata: { amount, senderName },
  });
}

/**
 * Notify a user that they received a new message.
 */
export async function notifyNewMessage(
  receiverId: string,
  senderName: string,
  conversationId: string,
) {
  return createNotification({
    receiverId,
    type: "NEW_MESSAGE",
    title: "New Message",
    body: `${senderName} sent you a message.`,
    linkUrl: `/messages/${conversationId}`,
    metadata: { conversationId, senderName },
  });
}

/**
 * Notify a creator that someone commented on their post.
 */
export async function notifyNewComment(
  creatorId: string,
  commenterName: string,
  postId: string,
) {
  return createNotification({
    receiverId: creatorId,
    type: "NEW_COMMENT",
    title: "New Comment",
    body: `${commenterName} commented on your post.`,
    linkUrl: `/post/${postId}`,
    metadata: { postId, commenterName },
  });
}

/**
 * Notify a creator that someone liked their post.
 */
export async function notifyNewLike(
  creatorId: string,
  likerName: string,
  postId: string,
) {
  return createNotification({
    receiverId: creatorId,
    type: "NEW_LIKE",
    title: "New Like",
    body: `${likerName} liked your post.`,
    linkUrl: `/post/${postId}`,
    metadata: { postId, likerName },
  });
}

/**
 * Notify a creator that someone purchased their PPV post.
 */
export async function notifyPostPurchased(
  creatorId: string,
  buyerName: string,
  postId: string,
  amount: number,
) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount / 100);

  return createNotification({
    receiverId: creatorId,
    type: "POST_PURCHASED",
    title: "Post Purchased",
    body: `${buyerName} purchased your post for ${formatted}.`,
    linkUrl: `/post/${postId}`,
    metadata: { postId, buyerName, amount },
  });
}

/**
 * Notify a user that their subscription to a creator has expired.
 */
export async function notifySubscriptionExpired(
  userId: string,
  creatorName: string,
) {
  return createNotification({
    receiverId: userId,
    type: "SUBSCRIPTION_EXPIRED",
    title: "Subscription Expired",
    body: `Your subscription to ${creatorName} has expired. Resubscribe to keep access to their exclusive content.`,
    linkUrl: "/explore",
    metadata: { creatorName },
  });
}

/**
 * Notify a creator that their payout has been completed.
 */
export async function notifyPayoutCompleted(
  creatorId: string,
  amount: number,
) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount / 100);

  return createNotification({
    receiverId: creatorId,
    type: "PAYOUT_COMPLETED",
    title: "Payout Completed",
    body: `Your payout of ${formatted} has been processed and sent to your bank account.`,
    linkUrl: "/settings",
    metadata: { amount },
  });
}

/**
 * Notify a user that their creator verification has been approved.
 */
export async function notifyVerificationApproved(userId: string) {
  return createNotification({
    receiverId: userId,
    type: "VERIFICATION_APPROVED",
    title: "Verification Approved",
    body: "Congratulations! Your creator verification has been approved. You can now start creating content.",
    linkUrl: "/settings",
  });
}

/**
 * Notify a user that their creator verification has been rejected.
 */
export async function notifyVerificationRejected(userId: string) {
  return createNotification({
    receiverId: userId,
    type: "VERIFICATION_REJECTED",
    title: "Verification Rejected",
    body: "Your creator verification has been rejected. Please review the requirements and try again.",
    linkUrl: "/settings",
  });
}
