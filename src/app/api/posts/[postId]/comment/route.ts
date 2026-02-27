// ============================================================================
// Comments API — List, Create, Delete
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations/post";

// ---------------------------------------------------------------------------
// GET /api/posts/[postId]/comment — List comments
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    // Fetch top-level comments with their replies (1 level deep)
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Determine next cursor
    let nextCursor: string | null = null;
    if (comments.length > limit) {
      const nextItem = comments.pop();
      nextCursor = nextItem!.id;
    }

    // Format response
    const formatted = comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      parentId: c.parentId,
      user: c.user,
      replies: c.replies.map((r: any) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        parentId: r.parentId,
        user: r.user,
        replies: [],
      })),
    }));

    return NextResponse.json({
      comments: formatted,
      nextCursor,
    });
  } catch (err) {
    console.error("[Comments GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/comment — Create a comment
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
    const body = await req.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { content, parentId } = parsed.data;

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, creatorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    // If replying, verify parent comment exists and belongs to this post
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: parentId, postId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found." },
          { status: 404 },
        );
      }

      // Ensure only 1 level of nesting
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: "Cannot reply to a reply. Only one level of nesting is allowed." },
          { status: 400 },
        );
      }
    }

    // Create comment and increment count atomically
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          userId: session.user.id,
          postId,
          content,
          parentId: parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    // Create notification for post creator
    if (post.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          receiverId: post.creatorId,
          type: "NEW_COMMENT",
          title: "New Comment",
          body: `${session.user.name || "Someone"} commented on your post.`,
          linkUrl: `/post/${postId}`,
        },
      }).catch(() => {
        // Non-critical
      });
    }

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      user: comment.user,
      replies: [],
    }, { status: 201 });
  } catch (err) {
    console.error("[Comments POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create comment." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/posts/[postId]/comment — Delete own comment
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
    const body = await req.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required." },
        { status: 400 },
      );
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, postId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 },
      );
    }

    // Only the comment author or post creator or admin can delete
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { creatorId: true },
    });

    const isCommentAuthor = comment.userId === session.user.id;
    const isPostCreator = post?.creatorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isCommentAuthor && !isPostCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this comment." },
        { status: 403 },
      );
    }

    // Count replies to decrement properly
    const replyCount = await prisma.comment.count({
      where: { parentId: commentId },
    });

    // Delete comment (cascading deletes handle replies) and decrement count
    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { decrement: 1 + replyCount } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Comments DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete comment." },
      { status: 500 },
    );
  }
}
