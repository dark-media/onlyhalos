// ============================================================================
// Mark All Notifications Read API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/notifications/read — Mark all unread notifications as read
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Update all unread notifications for this user
    const result = await prisma.notification.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (err) {
    console.error("[Notifications Read POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to mark notifications as read." },
      { status: 500 },
    );
  }
}
