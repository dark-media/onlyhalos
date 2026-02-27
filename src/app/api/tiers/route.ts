// ============================================================================
// Tiers API — List and create subscription tiers
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { createTierSchema } from "@/lib/validations/tier";
import { stripe } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TIERS_PER_CREATOR = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierSelectResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  sortOrder: number;
  isActive: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { subscriptions: number };
}

// ---------------------------------------------------------------------------
// GET /api/tiers — List tiers for the current creator
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a creator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isCreator: true },
    });

    if (!user?.isCreator) {
      return NextResponse.json(
        { error: "Only creators can manage tiers." },
        { status: 403 },
      );
    }

    const tiers = (await prisma.subscriptionTier.findMany({
      where: { creatorId: session.user.id },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        features: true,
        sortOrder: true,
        isActive: true,
        stripePriceId: true,
        stripeProductId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { subscriptions: { where: { status: "ACTIVE" } } },
        },
      },
    })) as unknown as TierSelectResult[];

    return NextResponse.json({
      tiers: tiers.map((t: TierSelectResult) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        price: t.price,
        features: t.features,
        sortOrder: t.sortOrder,
        isActive: t.isActive,
        stripePriceId: t.stripePriceId,
        stripeProductId: t.stripeProductId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        subscriberCount: t._count.subscriptions,
      })),
    });
  } catch (error) {
    console.error("[GET /api/tiers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/tiers — Create a new subscription tier
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a creator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isCreator: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        displayName: true,
        username: true,
      },
    });

    if (!user?.isCreator) {
      return NextResponse.json(
        { error: "Only creators can create tiers." },
        { status: 403 },
      );
    }

    // Check tier limit
    const existingCount = await prisma.subscriptionTier.count({
      where: { creatorId: session.user.id },
    });

    if (existingCount >= MAX_TIERS_PER_CREATOR) {
      return NextResponse.json(
        { error: `You can create a maximum of ${MAX_TIERS_PER_CREATOR} tiers.` },
        { status: 400 },
      );
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = createTierSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input." },
        { status: 400 },
      );
    }

    const { name, description, price, features } = parsed.data;

    // Calculate sort order (put new tier at the end)
    const maxSortOrder = await prisma.subscriptionTier.findFirst({
      where: { creatorId: session.user.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

    // ── Create Stripe Product + Price (if connected) ────────────────
    let stripeProductId: string | undefined;
    let stripePriceId: string | undefined;

    if (user.stripeConnectAccountId && user.stripeConnectOnboarded) {
      const product = await stripe.products.create(
        {
          name: `${user.displayName ?? user.username} — ${name}`,
          description: description || undefined,
        },
        { stripeAccount: user.stripeConnectAccountId },
      );

      const stripePrice = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: Math.round(price * 100),
          currency: "usd",
          recurring: { interval: "month" },
        },
        { stripeAccount: user.stripeConnectAccountId },
      );

      stripeProductId = product.id;
      stripePriceId = stripePrice.id;
    }

    // ── Create tier in database ─────────────────────────────────────
    const tier = await prisma.subscriptionTier.create({
      data: {
        creatorId: session.user.id,
        name,
        description: description || null,
        price,
        features,
        sortOrder,
        stripeProductId,
        stripePriceId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        features: true,
        sortOrder: true,
        isActive: true,
        stripePriceId: true,
        stripeProductId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tiers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
