// ============================================================================
// Creators API — List / Search creators
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types for Prisma select results
// ---------------------------------------------------------------------------

interface CreatorSelectResult {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  verificationStatus: string;
  createdAt: Date;
  creatorCategories: {
    category: { name: string; slug: string };
  }[];
  subscriptionTiers: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    features: string[];
  }[];
  _count: {
    subscriptionsAsCreator: number;
  };
}

interface SubscriptionResult {
  creatorId: string;
  tier: { name: string };
}

// ---------------------------------------------------------------------------
// GET /api/creators — List/search creators with pagination & filters
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip = (page - 1) * limit;
    const query = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const sort = searchParams.get("sort") ?? "popular";

    // ── Build where clause ────────────────────────────────────────────
    const where: Record<string, unknown> = {
      isCreator: true,
      status: "ACTIVE",
    };

    // Text search on displayName and username
    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      where.creatorCategories = {
        some: {
          category: { slug: category },
        },
      };
    }

    // ── Build orderBy ─────────────────────────────────────────────────
    let orderBy: Record<string, unknown> = { createdAt: "desc" };

    if (sort === "popular") {
      orderBy = {
        subscriptionsAsCreator: { _count: "desc" },
      };
    } else if (sort === "new") {
      orderBy = { createdAt: "desc" };
    }

    // ── Fetch creators ────────────────────────────────────────────────
    const [creators, total] = await Promise.all([
      prisma.user.findMany({
        where: where as never,
        orderBy: orderBy as never,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          coverUrl: true,
          bio: true,
          verificationStatus: true,
          createdAt: true,
          creatorCategories: {
            select: {
              category: { select: { name: true, slug: true } },
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
      }) as unknown as CreatorSelectResult[],
      prisma.user.count({ where: where as never }),
    ]);

    // ── Check subscription status for current user ────────────────────
    let subscriptions = new Map<string, { tierName: string }>();

    if (currentUserId) {
      const subs = (await prisma.subscription.findMany({
        where: {
          subscriberId: currentUserId,
          creatorId: { in: creators.map((c: CreatorSelectResult) => c.id) },
          status: "ACTIVE",
        },
        select: {
          creatorId: true,
          tier: { select: { name: true } },
        },
      })) as unknown as SubscriptionResult[];
      subscriptions = new Map(
        subs.map((s: SubscriptionResult) => [s.creatorId, { tierName: s.tier.name }]),
      );
    }

    // ── Format response ───────────────────────────────────────────────
    const formattedCreators = creators.map((c: CreatorSelectResult) => {
      const sub = subscriptions.get(c.id);
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
        tiers: c.subscriptionTiers.map((t: { id: string; name: string; price: number; description: string | null; features: string[] }) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          features: t.features,
        })),
        isSubscribed: !!sub,
        currentTierName: sub?.tierName,
      };
    });

    return NextResponse.json({
      creators: formattedCreators,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/creators] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
