// ============================================================================
// Single Tier API — GET, PATCH, DELETE
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { updateTierSchema } from "@/lib/validations/tier";
import { stripe } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// GET /api/tiers/[tierId] — Get tier details
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tierId: string }> },
) {
  try {
    const { tierId } = await params;

    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
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
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { subscriptions: { where: { status: "ACTIVE" } } },
        },
      },
    });

    if (!tier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      features: tier.features,
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
      stripePriceId: tier.stripePriceId,
      stripeProductId: tier.stripeProductId,
      creatorId: tier.creatorId,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
      subscriberCount: tier._count.subscriptions,
    });
  } catch (error) {
    console.error("[GET /api/tiers/[tierId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/tiers/[tierId] — Update tier
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tierId: string }> },
) {
  try {
    const { tierId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
      select: {
        id: true,
        creatorId: true,
        stripeProductId: true,
        stripePriceId: true,
        price: true,
        creator: {
          select: { stripeConnectAccountId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = updateTierSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input." },
        { status: 400 },
      );
    }

    const { name, description, price, features, sortOrder, isActive } =
      parsed.data;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (features !== undefined) updateData.features = features;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    // ── Handle price change via Stripe ──────────────────────────────
    if (price !== undefined && price !== existing.price) {
      const connectAccountId = existing.creator.stripeConnectAccountId;

      if (connectAccountId && existing.stripeProductId) {
        // Create new price (Stripe prices are immutable)
        const newStripePrice = await stripe.prices.create(
          {
            product: existing.stripeProductId,
            unit_amount: Math.round(price * 100),
            currency: "usd",
            recurring: { interval: "month" },
          },
          { stripeAccount: connectAccountId },
        );

        // Archive old price
        if (existing.stripePriceId) {
          await stripe.prices.update(
            existing.stripePriceId,
            { active: false },
            { stripeAccount: connectAccountId },
          );
        }

        updateData.price = price;
        updateData.stripePriceId = newStripePrice.id;
      } else {
        updateData.price = price;
      }
    }

    // ── Update Stripe product name/description ──────────────────────
    if (
      (name !== undefined || description !== undefined) &&
      existing.stripeProductId &&
      existing.creator.stripeConnectAccountId
    ) {
      const productUpdate: Record<string, string> = {};
      if (name !== undefined) productUpdate.name = name;
      if (description !== undefined) productUpdate.description = description || "";

      await stripe.products.update(
        existing.stripeProductId,
        productUpdate,
        { stripeAccount: existing.creator.stripeConnectAccountId },
      );
    }

    // ── Update in database ──────────────────────────────────────────
    const updated = await prisma.subscriptionTier.update({
      where: { id: tierId },
      data: updateData as never,
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
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      features: updated.features,
      sortOrder: updated.sortOrder,
      isActive: updated.isActive,
      stripePriceId: updated.stripePriceId,
      stripeProductId: updated.stripeProductId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      subscriberCount: updated._count.subscriptions,
    });
  } catch (error) {
    console.error("[PATCH /api/tiers/[tierId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/tiers/[tierId] — Delete tier (only if no active subscribers)
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tierId: string }> },
) {
  try {
    const { tierId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
      select: {
        id: true,
        creatorId: true,
        stripeProductId: true,
        stripePriceId: true,
        creator: {
          select: { stripeConnectAccountId: true },
        },
        _count: {
          select: { subscriptions: { where: { status: "ACTIVE" } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for active subscribers
    if (existing._count.subscriptions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete tier with ${existing._count.subscriptions} active subscriber(s). Deactivate it instead.`,
        },
        { status: 400 },
      );
    }

    // ── Archive in Stripe ───────────────────────────────────────────
    const connectAccountId = existing.creator.stripeConnectAccountId;

    if (connectAccountId) {
      if (existing.stripePriceId) {
        await stripe.prices
          .update(
            existing.stripePriceId,
            { active: false },
            { stripeAccount: connectAccountId },
          )
          .catch(() => {});
      }
      if (existing.stripeProductId) {
        await stripe.products
          .update(
            existing.stripeProductId,
            { active: false },
            { stripeAccount: connectAccountId },
          )
          .catch(() => {});
      }
    }

    // ── Delete from database ────────────────────────────────────────
    await prisma.subscriptionTier.delete({ where: { id: tierId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tiers/[tierId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
