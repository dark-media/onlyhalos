// ============================================================================
// Bookmark / Unbookmark API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/bookmark — Bookmark a post
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

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: "Already bookmarked." },
        { status: 409 },
      );
    }

    // Create bookmark and increment count atomically
    await prisma.$transaction([
      prisma.bookmark.create({
        data: { userId, postId },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { bookmarkCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ bookmarked: true });
  } catch (err) {
    console.error("[Bookmark POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to bookmark post." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/posts/[postId]/bookmark — Remove bookmark
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

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existingBookmark) {
      return NextResponse.json(
        { error: "Not bookmarked." },
        { status: 404 },
      );
    }

    // Delete bookmark and decrement count atomically
    await prisma.$transaction([
      prisma.bookmark.delete({
        where: { userId_postId: { userId, postId } },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { bookmarkCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ bookmarked: false });
  } catch (err) {
    console.error("[Bookmark DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to remove bookmark." },
      { status: 500 },
    );
  }
}
