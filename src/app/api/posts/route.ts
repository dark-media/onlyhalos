// ============================================================================
// Posts API — List (feed) and Create
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations/post";
import { getSignedUrl } from "@/lib/cloudfront";

// ---------------------------------------------------------------------------
// GET /api/posts — Feed endpoint
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
    const creatorId = searchParams.get("creatorId");

    // Build the where clause
    const where: Record<string, unknown> = {
      isPublished: true,
      OR: [
        // Scheduled posts that are past their scheduled time
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    };

    if (creatorId) {
      // Fetching posts from a specific creator
      where.creatorId = creatorId;
    } else {
      // Feed: own posts + posts from subscribed creators + public posts
      const subscriptions = await prisma.subscription.findMany({
        where: { subscriberId: userId, status: "ACTIVE" },
        select: { creatorId: true, tierId: true },
      });

      const subscribedCreatorIds = subscriptions.map((s: any) => s.creatorId);

      where.OR = [
        { creatorId: userId }, // Own posts
        { visibility: "PUBLIC" }, // All public posts from any creator
        {
          creatorId: { in: subscribedCreatorIds },
          visibility: { in: ["SUBSCRIBERS", "TIER", "PPV", "PUBLIC"] },
        },
      ];
    }

    // Cursor-based pagination
    const cursorObj = cursor ? { id: cursor } : undefined;

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      ...(cursorObj && { skip: 1, cursor: cursorObj }),
      orderBy: { createdAt: "desc" },
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
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    // Check if there's a next page
    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    // Get user's likes, bookmarks, and purchases for these posts
    const postIds = posts.map((p: any) => p.id);

    const [userLikes, userBookmarks, userPurchases, userSubscriptions] =
      await Promise.all([
        prisma.like.findMany({
          where: { userId, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.bookmark.findMany({
          where: { userId, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.pPVPurchase.findMany({
          where: { userId, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.subscription.findMany({
          where: { subscriberId: userId, status: "ACTIVE" },
          select: { creatorId: true, tierId: true },
        }),
      ]);

    const likedPostIds = new Set(userLikes.map((l: any) => l.postId));
    const bookmarkedPostIds = new Set(userBookmarks.map((b: any) => b.postId));
    const purchasedPostIds = new Set(userPurchases.map((p: any) => p.postId));
    const subscriptionMap = new Map(
      userSubscriptions.map((s: any) => [s.creatorId, s.tierId]),
    );

    // Determine access and sign media URLs
    const enrichedPosts = posts.map((post: any) => {
      const isOwn = post.creatorId === userId;
      const isAdmin = session.user.role === "ADMIN";
      const subscription = subscriptionMap.get(post.creatorId);
      const isPurchased = purchasedPostIds.has(post.id);

      let hasAccess = false;

      if (isOwn || isAdmin) {
        hasAccess = true;
      } else {
        switch (post.visibility) {
          case "PUBLIC":
            hasAccess = true;
            break;
          case "SUBSCRIBERS":
            hasAccess = !!subscription;
            break;
          case "TIER":
            hasAccess = subscription === post.minimumTierId;
            break;
          case "PPV":
            hasAccess = isPurchased;
            break;
        }
      }

      // Sign media URLs if user has access
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

      return {
        id: post.id,
        caption: post.caption,
        visibility: post.visibility,
        ppvPrice: post.ppvPrice,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        bookmarkCount: post.bookmarkCount,
        createdAt: post.createdAt.toISOString(),
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        creator: post.creator,
        minimumTier: post.minimumTier,
        media: signedMedia,
        isLiked: likedPostIds.has(post.id),
        isBookmarked: bookmarkedPostIds.has(post.id),
        isPurchased,
        hasAccess,
      };
    });

    return NextResponse.json({
      posts: enrichedPosts,
      nextCursor,
    });
  } catch (err) {
    console.error("[Posts GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch posts." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/posts — Create a new post
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

    // Only creators and admins can create posts
    if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN" && !session.user.isCreator) {
      return NextResponse.json(
        { error: "Only creators can create posts." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);

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

    // Determine if post should be published immediately
    const isPublished = !data.scheduledAt || new Date(data.scheduledAt) <= new Date();

    // Create the post with media
    const post = await prisma.post.create({
      data: {
        creatorId: session.user.id,
        caption: data.caption || null,
        visibility: data.visibility,
        minimumTierId: data.visibility === "TIER" ? data.minimumTierId : null,
        ppvPrice: data.visibility === "PPV" ? data.ppvPrice : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        isPublished,
        media: {
          connect: data.mediaIds.map((id, index) => ({ id })),
        },
      },
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

    // Update sort order for connected media
    await Promise.all(
      data.mediaIds.map((id, index) =>
        prisma.postMedia.update({
          where: { id },
          data: { sortOrder: index, postId: post.id },
        }),
      ),
    );

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("[Posts POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create post." },
      { status: 500 },
    );
  }
}
