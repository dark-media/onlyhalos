// ============================================================================
// Subscriptions API — List current user's active subscriptions
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/subscriptions
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

    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriberId: session.user.id,
        status: { in: ["ACTIVE", "PAST_DUE", "CANCELED"] },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
            isCreator: true,
            verificationStatus: true,
          },
        },
        tier: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            features: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = subscriptions.map((sub: any) => ({
      id: sub.id,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      createdAt: sub.createdAt,
      creator: {
        id: sub.creator.id,
        username: sub.creator.username,
        displayName: sub.creator.displayName,
        avatarUrl: sub.creator.avatarUrl,
        coverUrl: sub.creator.coverUrl,
        isCreator: sub.creator.isCreator,
        verificationStatus: sub.creator.verificationStatus,
      },
      tier: {
        id: sub.tier.id,
        name: sub.tier.name,
        description: sub.tier.description,
        price: sub.tier.price,
        features: sub.tier.features,
      },
    }));

    return NextResponse.json({ subscriptions: formatted });
  } catch (err) {
    console.error("[Subscriptions List] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions." },
      { status: 500 },
    );
  }
}
