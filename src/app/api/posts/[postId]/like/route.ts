// ============================================================================
// Like / Unlike API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/like — Like a post
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { postId } = await params;
    const userId = session.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Already liked." },
        { status: 409 },
      );
    }

    // Create like and increment count atomically
    await prisma.$transaction([
      prisma.like.create({
        data: { userId, postId },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    // Create notification for post creator
    const postWithCreator = await prisma.post.findUnique({
      where: { id: postId },
      select: { creatorId: true },
    });

    if (postWithCreator && postWithCreator.creatorId !== userId) {
      await prisma.notification.create({
        data: {
          receiverId: postWithCreator.creatorId,
          type: "NEW_LIKE",
          title: "New Like",
          body: `${session.user.name || "Someone"} liked your post.`,
          linkUrl: `/post/${postId}`,
        },
      }).catch(() => {
        // Non-critical, don't fail the request
      });
    }

    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error("[Like POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to like post." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/posts/[postId]/like — Unlike a post
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { postId } = await params;
    const userId = session.user.id;

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: "Not liked." },
        { status: 404 },
      );
    }

    // Delete like and decrement count atomically
    await prisma.$transaction([
      prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ liked: false });
  } catch (err) {
    console.error("[Like DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to unlike post." },
      { status: 500 },
    );
  }
}
