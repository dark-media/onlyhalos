// ============================================================================
// Single Subscription API — Get details / Cancel
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/subscriptions/[subscriptionId] — Subscription details
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { subscriptionId } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
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
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    // Only the subscriber or the creator can view subscription details
    if (
      subscription.subscriberId !== session.user.id &&
      subscription.creatorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this subscription." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
        creator: subscription.creator,
        tier: subscription.tier,
      },
    });
  } catch (err) {
    console.error("[Subscription Detail] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscription details." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/subscriptions/[subscriptionId] — Cancel subscription
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { subscriptionId } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    // Only the subscriber can cancel
    if (subscription.subscriberId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to cancel this subscription." },
        { status: 403 },
      );
    }

    if (subscription.status !== "ACTIVE" && subscription.status !== "PAST_DUE") {
      return NextResponse.json(
        { error: "This subscription is not active and cannot be canceled." },
        { status: 400 },
      );
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No Stripe subscription found for this record." },
        { status: 400 },
      );
    }

    // Cancel at period end via Stripe (user keeps access until end of billing period)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        status: "CANCELED",
      },
    });

    return NextResponse.json({
      message: "Subscription will be canceled at the end of the current billing period.",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (err) {
    console.error("[Subscription Cancel] Error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription." },
      { status: 500 },
    );
  }
}
