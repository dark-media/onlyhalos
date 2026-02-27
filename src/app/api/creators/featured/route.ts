// ============================================================================
// Featured Creators API — Verified creators with highest subscriber counts
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

// ---------------------------------------------------------------------------
// GET /api/creators/featured — Returns featured/verified top creators
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

    // ── Fetch verified creators ordered by subscriber count ─────────
    const creators = (await prisma.user.findMany({
      where: {
        isCreator: true,
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
      },
      orderBy: {
        subscriptionsAsCreator: { _count: "desc" },
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        verificationStatus: true,
        creatorCategories: {
          select: {
            category: { select: { name: true } },
          },
          take: 1,
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
          },
        },
        _count: {
          select: {
            subscriptionsAsCreator: { where: { status: "ACTIVE" } },
          },
        },
      },
    })) as unknown as CreatorResult[];

    // ── Check subscription status for current user ────────────────────
    let subscriptions = new Map<string, string>();

    if (currentUserId) {
      const subs = (await prisma.subscription.findMany({
        where: {
          subscriberId: currentUserId,
          creatorId: { in: creators.map((c: CreatorResult) => c.id) },
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
    const formatted = creators.map((c: CreatorResult) => ({
      id: c.id,
      username: c.username!,
      displayName: c.displayName ?? c.username!,
      avatarUrl: c.avatarUrl,
      coverUrl: c.coverUrl,
      bio: c.bio,
      isVerified: true,
      subscriberCount: c._count.subscriptionsAsCreator,
      category: c.creatorCategories[0]?.category.name ?? null,
      tiers: c.subscriptionTiers.map((t: CreatorResult["subscriptionTiers"][number]) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        description: t.description,
        features: t.features,
      })),
      isSubscribed: subscriptions.has(c.id),
      currentTierName: subscriptions.get(c.id),
    }));

    return NextResponse.json({ creators: formatted });
  } catch (error) {
    console.error("[GET /api/creators/featured] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
