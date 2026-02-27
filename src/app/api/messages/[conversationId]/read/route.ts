// ============================================================================
// Mark Messages as Read API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/messages/[conversationId]/read — Mark all unread messages as read
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { conversationId } = await params;

    // Verify the user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, user1Id: true, user2Id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }

    if (
      conversation.user1Id !== userId &&
      conversation.user2Id !== userId
    ) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation." },
        { status: 403 },
      );
    }

    // Mark all unread messages sent to the current user as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedAsRead: result.count,
    });
  } catch (err) {
    console.error("[Messages Read POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to mark messages as read." },
      { status: 500 },
    );
  }
}
