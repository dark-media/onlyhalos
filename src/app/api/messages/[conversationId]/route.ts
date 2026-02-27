// ============================================================================
// Conversation Messages API — List & Send
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/message";

// ---------------------------------------------------------------------------
// GET /api/messages/[conversationId] — Paginated messages for a conversation
// ---------------------------------------------------------------------------

export async function GET(
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
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);

    // Verify the user is a participant in this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isCreator: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isCreator: true,
          },
        },
      },
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

    const otherUser =
      conversation.user1Id === userId
        ? conversation.user2
        : conversation.user1;

    // Cursor-based pagination (newest first)
    const cursorObj = cursor ? { id: cursor } : undefined;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(cursorObj && { skip: 1, cursor: cursorObj }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        mediaType: true,
        ppvPrice: true,
        isPurchased: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        createdAt: true,
      },
    });

    // Determine if there are more messages
    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id ?? null;
    }

    // Mark unread messages as read (ones sent TO the current user)
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      messages,
      otherUser,
      conversationId,
      nextCursor,
    });
  } catch (err) {
    console.error("[Messages GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to load messages." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/messages/[conversationId] — Send a message
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
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 },
      );
    }

    // Verify participation
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

    const receiverId =
      conversation.user1Id === userId
        ? conversation.user2Id
        : conversation.user1Id;

    const { content, mediaUrl, mediaType, ppvPrice } = parsed.data;

    // Create the message and update conversation timestamp atomically
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId,
          content: content || null,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          ppvPrice: ppvPrice ?? null,
          isPurchased: !ppvPrice, // Free messages are auto-purchased
        },
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          mediaType: true,
          ppvPrice: true,
          isPurchased: true,
          senderId: true,
          receiverId: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    // Create a notification for the receiver (non-critical)
    await prisma.notification
      .create({
        data: {
          receiverId,
          type: "NEW_MESSAGE",
          title: "New Message",
          body: `${session.user.name || session.user.username || "Someone"} sent you a message.`,
          linkUrl: `/messages/${conversationId}`,
        },
      })
      .catch(() => {
        // Non-critical — don't fail the request
      });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[Messages POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 },
    );
  }
}
