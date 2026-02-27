// ============================================================================
// Single Post API — Get, Update, Delete
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { updatePostSchema } from "@/lib/validations/post";
import { getSignedUrl } from "@/lib/cloudfront";
import { canEditPost, canDeletePost } from "@/lib/permissions";

// ---------------------------------------------------------------------------
// GET /api/posts/[postId]
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth();
    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
        minimumTier: {
          select: { id: true, name: true, price: true },
        },
        media: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    const userId = session?.user?.id;
    const isOwn = userId === post.creatorId;
    const isAdmin = session?.user?.role === "ADMIN";

    // Check access
    let hasAccess = false;
    let isLiked = false;
    let isBookmarked = false;
    let isPurchased = false;

    if (isOwn || isAdmin) {
      hasAccess = true;
    } else if (post.visibility === "PUBLIC") {
      hasAccess = true;
    } else if (userId) {
      if (post.visibility === "SUBSCRIBERS" || post.visibility === "TIER") {
        const sub = await prisma.subscription.findFirst({
          where: {
            subscriberId: userId,
            creatorId: post.creatorId,
            status: "ACTIVE",
          },
        });
        if (sub) {
          if (post.visibility === "SUBSCRIBERS") {
            hasAccess = true;
          } else if (post.visibility === "TIER" && sub.tierId === post.minimumTierId) {
            hasAccess = true;
          }
        }
      } else if (post.visibility === "PPV") {
        const purchase = await prisma.pPVPurchase.findUnique({
          where: { userId_postId: { userId, postId } },
        });
        if (purchase) {
          hasAccess = true;
          isPurchased = true;
        }
      }
    }

    // Get engagement status
    if (userId) {
      const [like, bookmark, purchase] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_postId: { userId, postId } },
        }),
        prisma.bookmark.findUnique({
          where: { userId_postId: { userId, postId } },
        }),
        post.visibility === "PPV" && !isPurchased
          ? prisma.pPVPurchase.findUnique({
              where: { userId_postId: { userId, postId } },
            })
          : null,
      ]);
      isLiked = !!like;
      isBookmarked = !!bookmark;
      if (purchase) isPurchased = true;
    }

    // Sign media URLs
    const signedMedia = post.media.map((m: any) => ({
      id: m.id,
      type: m.type,
      url: hasAccess ? getSignedUrl(m.url) : "",
      thumbnailUrl: m.thumbnailUrl
        ? hasAccess
          ? getSignedUrl(m.thumbnailUrl)
          : ""
        : null,
      width: m.width,
      height: m.height,
      duration: m.duration,
    }));

    return NextResponse.json({
      id: post.id,
      caption: post.caption,
      visibility: post.visibility,
      ppvPrice: post.ppvPrice,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      bookmarkCount: post.bookmarkCount,
      createdAt: post.createdAt.toISOString(),
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      isPublished: post.isPublished,
      creator: post.creator,
      minimumTier: post.minimumTier,
      media: signedMedia,
      isLiked,
      isBookmarked,
      isPurchased,
      hasAccess,
    });
  } catch (err) {
    console.error("[Post GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch post." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/posts/[postId] — Update post (creator only)
// ---------------------------------------------------------------------------

export async function PATCH(
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, creatorId: true, visibility: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    if (!canEditPost(session.user.id, { ...post, tierId: null, ppvPriceCents: null })) {
      return NextResponse.json(
        { error: "You can only edit your own posts." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return NextResponse.json(
        { error: "Validation failed.", errors: fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updateData: Record<string, unknown> = {};

    if (data.caption !== undefined) updateData.caption = data.caption || null;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.visibility === "TIER" || post.visibility === "TIER") {
      updateData.minimumTierId = data.visibility === "TIER" ? data.minimumTierId : null;
    }
    if (data.visibility === "PPV" || post.visibility === "PPV") {
      updateData.ppvPrice = data.visibility === "PPV" ? data.ppvPrice : null;
    }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
      updateData.isPublished = !data.scheduledAt || new Date(data.scheduledAt) <= new Date();
    }

    // Update media if provided
    if (data.mediaIds) {
      // Disconnect old media and connect new
      await prisma.post.update({
        where: { id: postId },
        data: {
          media: {
            set: [], // Disconnect all
          },
        },
      });

      await Promise.all(
        data.mediaIds.map((id, index) =>
          prisma.postMedia.update({
            where: { id },
            data: { sortOrder: index, postId },
          }),
        ),
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        media: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (err) {
    console.error("[Post PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update post." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/posts/[postId] — Delete post (creator or admin)
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, creatorId: true, visibility: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    const userRole = (session.user.role === "USER" ? "FAN" : session.user.role) as "CREATOR" | "ADMIN" | "FAN";
    if (
      !canDeletePost(session.user.id, { ...post, tierId: null, ppvPriceCents: null }, userRole)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to delete this post." },
        { status: 403 },
      );
    }

    // Delete the post (cascading deletes handle media, likes, etc.)
    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Post DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete post." },
      { status: 500 },
    );
  }
}
