// ============================================================================
// Messages API — Conversations List & Create
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { createConversationSchema } from "@/lib/validations/message";

// ---------------------------------------------------------------------------
// GET /api/messages — List conversations for the current user
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
    const search = searchParams.get("search") || "";

    // Fetch all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
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
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            mediaUrl: true,
            mediaType: true,
            ppvPrice: true,
            senderId: true,
            createdAt: true,
            isRead: true,
          },
        },
      },
    });

    // Build response with other user info and unread count
    const conversationsWithMeta = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherUser =
          conv.user1Id === userId ? conv.user2 : conv.user1;

        // Count unread messages sent to this user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            isRead: false,
          },
        });

        const lastMessage = conv.messages[0] || null;

        return {
          id: conv.id,
          otherUser,
          lastMessage,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      }),
    );

    // Filter by search query (other user's name or username)
    const filtered = search
      ? conversationsWithMeta.filter((c: any) => {
          const name = c.otherUser.displayName?.toLowerCase() || "";
          const username = c.otherUser.username?.toLowerCase() || "";
          const q = search.toLowerCase();
          return name.includes(q) || username.includes(q);
        })
      : conversationsWithMeta;

    return NextResponse.json({ conversations: filtered });
  } catch (err) {
    console.error("[Messages GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to load conversations." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/messages — Create a new conversation (or return existing)
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

    const currentUserId = session.user.id;
    const body = await req.json();
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 },
      );
    }

    const { userId: otherUserId } = parsed.data;

    // Cannot message yourself
    if (otherUserId === currentUserId) {
      return NextResponse.json(
        { error: "You cannot start a conversation with yourself." },
        { status: 400 },
      );
    }

    // Check that the other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, status: true },
    });

    if (!otherUser || otherUser.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    // Check if conversation already exists (in either direction)
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: currentUserId },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Create new conversation (user1Id is always the smaller id for consistency)
    const [id1, id2] =
      currentUserId < otherUserId
        ? [currentUserId, otherUserId]
        : [otherUserId, currentUserId];

    const newConversation = await prisma.conversation.create({
      data: {
        user1Id: id1,
        user2Id: id2,
      },
    });

    return NextResponse.json(
      { conversation: newConversation },
      { status: 201 },
    );
  } catch (err) {
    console.error("[Messages POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create conversation." },
      { status: 500 },
    );
  }
}
