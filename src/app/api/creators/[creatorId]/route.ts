// ============================================================================
// Single Creator API — GET full creator profile
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryResult {
  category: { name: string; slug: string };
}

interface TierResult {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  _count: { subscriptions: number };
}

// ---------------------------------------------------------------------------
// GET /api/creators/[creatorId] — Full creator profile with tiers and stats
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> },
) {
  try {
    const { creatorId } = await params;
    const session = await auth();
    const currentUserId = session?.user?.id;

    // ── Fetch creator ───────────────────────────────────────────────
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        creatorBio: true,
        location: true,
        websiteUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        isCreator: true,
        verificationStatus: true,
        createdAt: true,
        creatorCategories: {
          select: {
            category: { select: { name: true, slug: true } },
          },
        },
        subscriptionTiers: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            features: true,
            _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
          },
        },
        _count: {
          select: {
            posts: { where: { isPublished: true } },
            subscriptionsAsCreator: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!creator || !creator.isCreator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 },
      );
    }

    // ── Get total likes ─────────────────────────────────────────────
    const likeAgg = await prisma.post.aggregate({
      where: { creatorId: creator.id, isPublished: true },
      _sum: { likeCount: true },
    });

    // ── Check subscription status ───────────────────────────────────
    let subscription: { tierId: string; tierName: string } | null = null;

    if (currentUserId && currentUserId !== creator.id) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberId_creatorId: {
            subscriberId: currentUserId,
            creatorId: creator.id,
          },
        },
        select: { tierId: true, tier: { select: { name: true } } },
      });
      if (sub) {
        subscription = { tierId: sub.tierId, tierName: sub.tier.name };
      }
    }

    // ── Format response ─────────────────────────────────────────────
    return NextResponse.json({
      id: creator.id,
      username: creator.username!,
      displayName: creator.displayName ?? creator.username!,
      avatarUrl: creator.avatarUrl,
      coverUrl: creator.coverUrl,
      bio: creator.bio,
      creatorBio: creator.creatorBio,
      location: creator.location,
      websiteUrl: creator.websiteUrl,
      twitterUrl: creator.twitterUrl,
      instagramUrl: creator.instagramUrl,
      tiktokUrl: creator.tiktokUrl,
      isVerified: creator.verificationStatus === "VERIFIED",
      categories: (creator.creatorCategories as CategoryResult[]).map(
        (cc: CategoryResult) => ({
          name: cc.category.name,
          slug: cc.category.slug,
        }),
      ),
      postCount: creator._count.posts,
      subscriberCount: creator._count.subscriptionsAsCreator,
      likeCount: likeAgg._sum.likeCount ?? 0,
      tiers: (creator.subscriptionTiers as TierResult[]).map(
        (t: TierResult) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          features: t.features,
          subscriberCount: t._count.subscriptions,
        }),
      ),
      isSubscribed: !!subscription,
      currentTierId: subscription?.tierId ?? null,
      currentTierName: subscription?.tierName ?? null,
      isOwnProfile: currentUserId === creator.id,
      createdAt: creator.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/creators/[creatorId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
