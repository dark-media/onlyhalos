// ============================================================================
// Single Notification API — Mark as read
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// PATCH /api/notifications/[notificationId] — Mark a single notification read
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { notificationId } = await params;
    const userId = session.user.id;

    // Find the notification and verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, receiverId: true, isRead: true },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 },
      );
    }

    if (notification.receiverId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to modify this notification." },
        { status: 403 },
      );
    }

    // Already read — return early
    if (notification.isRead) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, alreadyRead: false });
  } catch (err) {
    console.error("[Notification PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update notification." },
      { status: 500 },
    );
  }
}
