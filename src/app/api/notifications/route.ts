// ============================================================================
// Notifications API — List notifications for the current user
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
// NotificationType enum values (mirrors Prisma schema)
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
// Valid notification type filter values
// ---------------------------------------------------------------------------

const VALID_TYPES: NotificationType[] = [
  "NEW_SUBSCRIBER",
  "NEW_TIP",
  "NEW_MESSAGE",
  "NEW_COMMENT",
  "NEW_LIKE",
  "POST_PURCHASED",
  "SUBSCRIPTION_EXPIRED",
  "PAYOUT_COMPLETED",
  "VERIFICATION_APPROVED",
  "VERIFICATION_REJECTED",
  "SYSTEM",
];

/**
 * Maps user-facing filter categories to one or more NotificationType values.
 * This allows the frontend to use simpler filter names while the API
 * translates them to the underlying enum values.
 */
const FILTER_CATEGORY_MAP: Record<string, NotificationType[]> = {
  subscriptions: ["NEW_SUBSCRIBER", "SUBSCRIPTION_EXPIRED"],
  messages: ["NEW_MESSAGE"],
  engagement: ["NEW_LIKE", "NEW_COMMENT"],
  tips: ["NEW_TIP", "POST_PURCHASED", "PAYOUT_COMPLETED"],
  system: ["VERIFICATION_APPROVED", "VERIFICATION_REJECTED", "SYSTEM"],
};

// ---------------------------------------------------------------------------
// GET /api/notifications — Paginated notifications for the current user
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const typeFilter = searchParams.get("type");
    const category = searchParams.get("category");

    // Build the where clause
    const where: Record<string, unknown> = {
      receiverId: userId,
    };

    // Apply type filter (exact enum value)
    if (typeFilter && VALID_TYPES.includes(typeFilter as NotificationType)) {
      where.type = typeFilter;
    }

    // Apply category filter (maps to multiple types)
    if (category && FILTER_CATEGORY_MAP[category]) {
      where.type = { in: FILTER_CATEGORY_MAP[category] };
    }

    // Cursor-based pagination
    const cursorObj = cursor ? { id: cursor } : undefined;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limit + 1,
        ...(cursorObj && { skip: 1, cursor: cursorObj }),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          isRead: true,
          linkUrl: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      }),
    ]);

    // Determine next cursor
    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem!.id;
    }

    // Serialize dates
    const serialized = notifications.map((n: any) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: serialized,
      nextCursor,
      unreadCount,
    });
  } catch (err) {
    console.error("[Notifications GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 },
    );
  }
}
