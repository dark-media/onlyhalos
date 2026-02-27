// ============================================================================
// Trending Creators API — Most new subscribers in last 7 days
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorResult {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  verificationStatus: string;
  creatorCategories: { category: { name: string } }[];
  subscriptionTiers: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    features: string[];
  }[];
  _count: { subscriptionsAsCreator: number };
}

interface SubResult {
  creatorId: string;
  tier: { name: string };
}

type TierItem = CreatorResult["subscriptionTiers"][number];

function formatCreator(
  c: CreatorResult,
  subscriptions: Map<string, string>,
) {
  return {
    id: c.id,
    username: c.username!,
    displayName: c.displayName ?? c.username!,
    avatarUrl: c.avatarUrl,
    coverUrl: c.coverUrl,
    bio: c.bio,
    isVerified: c.verificationStatus === "VERIFIED",
    subscriberCount: c._count.subscriptionsAsCreator,
    category: c.creatorCategories[0]?.category.name ?? null,
    tiers: c.subscriptionTiers.map((t: TierItem) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      description: t.description,
      features: t.features,
    })),
    isSubscribed: subscriptions.has(c.id),
    currentTierName: subscriptions.get(c.id),
  };
}

// ---------------------------------------------------------------------------
// GET /api/creators/trending — Creators with most new subs in 7 days
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "6", 10)));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const creatorSelect = {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      verificationStatus: true,
      creatorCategories: {
        select: { category: { select: { name: true } } },
        take: 1,
      },
      subscriptionTiers: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" as const },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          features: true,
        },
      },
      _count: {
        select: { subscriptionsAsCreator: { where: { status: "ACTIVE" as const } } },
      },
    };

    // ── Find creators with most recent subscriptions ────────────────
    const trendingData = await prisma.subscription.groupBy({
      by: ["creatorId"],
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: "ACTIVE",
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    if (trendingData.length === 0) {
      // Fallback to newest creators if no trending data
      const newestCreators = (await prisma.user.findMany({
        where: { isCreator: true, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: creatorSelect,
      })) as unknown as CreatorResult[];

      const empty = new Map<string, string>();
      return NextResponse.json({
        creators: newestCreators.map((c: CreatorResult) => formatCreator(c, empty)),
      });
    }

    const creatorIds = trendingData.map(
      (t: { creatorId: string }) => t.creatorId,
    );

    // ── Fetch full creator data ─────────────────────────────────────
    const creators = (await prisma.user.findMany({
      where: {
        id: { in: creatorIds },
        isCreator: true,
        status: "ACTIVE",
      },
      select: creatorSelect,
    })) as unknown as CreatorResult[];

    // Maintain trending order
    const creatorMap = new Map(
      creators.map((c: CreatorResult) => [c.id, c]),
    );
    const orderedCreators = creatorIds
      .map((id: string) => creatorMap.get(id))
      .filter(Boolean) as CreatorResult[];

    // ── Check subscription status for current user ────────────────────
    let subscriptions = new Map<string, string>();

    if (currentUserId) {
      const subs = (await prisma.subscription.findMany({
        where: {
          subscriberId: currentUserId,
          creatorId: { in: creatorIds },
          status: "ACTIVE",
        },
        select: {
          creatorId: true,
          tier: { select: { name: true } },
        },
      })) as unknown as SubResult[];
      subscriptions = new Map(subs.map((s: SubResult) => [s.creatorId, s.tier.name]));
    }

    // ── Format ────────────────────────────────────────────────────────
    const formatted = orderedCreators.map((c: CreatorResult) =>
      formatCreator(c, subscriptions),
    );

    return NextResponse.json({ creators: formatted });
  } catch (error) {
    console.error("[GET /api/creators/trending] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
