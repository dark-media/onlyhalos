// ============================================================================
// Stripe Checkout Session — Create subscription checkout
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// POST /api/stripe/checkout
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

    const body = await req.json();
    const { creatorId, tierId } = body as {
      creatorId?: string;
      tierId?: string;
    };

    if (!creatorId || !tierId) {
      return NextResponse.json(
        { error: "creatorId and tierId are required." },
        { status: 400 },
      );
    }

    // Prevent self-subscription
    if (session.user.id === creatorId) {
      return NextResponse.json(
        { error: "You cannot subscribe to yourself." },
        { status: 400 },
      );
    }

    // Check if user already has an active subscription to this creator
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: session.user.id,
          creatorId,
        },
      },
    });

    if (
      existingSubscription &&
      (existingSubscription.status === "ACTIVE" ||
        existingSubscription.status === "PAST_DUE")
    ) {
      return NextResponse.json(
        { error: "You already have an active subscription to this creator." },
        { status: 409 },
      );
    }

    // Fetch the creator
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        displayName: true,
        username: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found." },
        { status: 404 },
      );
    }

    if (!creator.stripeConnectAccountId || !creator.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "This creator has not completed payment setup." },
        { status: 400 },
      );
    }

    // Fetch the tier
    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
    });

    if (!tier || tier.creatorId !== creatorId) {
      return NextResponse.json(
        { error: "Subscription tier not found." },
        { status: 404 },
      );
    }

    if (!tier.isActive) {
      return NextResponse.json(
        { error: "This subscription tier is no longer available." },
        { status: 400 },
      );
    }

    // Get or create Stripe Product and Price for this tier
    let stripeProductId = tier.stripeProductId;
    let stripePriceId = tier.stripePriceId;

    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: `${creator.displayName || creator.username} - ${tier.name}`,
        metadata: {
          tierId: tier.id,
          creatorId: creator.id,
        },
      });
      stripeProductId = product.id;
    }

    if (!stripePriceId) {
      const price = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(tier.price * 100),
        currency: "usd",
        recurring: { interval: "month" },
        metadata: {
          tierId: tier.id,
          creatorId: creator.id,
        },
      });
      stripePriceId = price.id;

      // Persist the Stripe IDs back to the tier
      await prisma.subscriptionTier.update({
        where: { id: tier.id },
        data: {
          stripeProductId,
          stripePriceId,
        },
      });
    }

    // Get or create Stripe Customer for the subscriber
    let stripeCustomerId = (
      await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true, email: true },
      })
    )!;

    let customerId = stripeCustomerId.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: stripeCustomerId.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create the Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: PLATFORM_FEE_PERCENT,
        transfer_data: {
          destination: creator.stripeConnectAccountId,
        },
        metadata: {
          subscriberId: session.user.id,
          creatorId: creator.id,
          tierId: tier.id,
        },
      },
      metadata: {
        subscriberId: session.user.id,
        creatorId: creator.id,
        tierId: tier.id,
      },
      success_url: `${baseUrl}/creators/${creatorId}?subscribed=true`,
      cancel_url: `${baseUrl}/creators/${creatorId}?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[Stripe Checkout] Error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
