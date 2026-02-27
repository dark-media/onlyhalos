// ============================================================================
// Subscribe to Creator — Initiates Stripe Checkout
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { subscribeSchema } from "@/lib/validations/payment";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// POST /api/creators/[creatorId]/subscribe
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { creatorId } = await params;
    const body = await req.json();

    // Validate request body
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 },
      );
    }

    const { tierId } = parsed.data;

    // Prevent self-subscription
    if (session.user.id === creatorId) {
      return NextResponse.json(
        { error: "You cannot subscribe to yourself." },
        { status: 400 },
      );
    }

    // Fetch creator with Stripe Connect info
    const creator = await prisma.user.findUnique({
      where: { id: creatorId, isCreator: true },
      select: {
        id: true,
        displayName: true,
        username: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
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

    // Fetch the tier and verify it belongs to the creator and is active
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

    // Check for existing active subscription
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

    // Get or create Stripe Product/Price
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

      await prisma.subscriptionTier.update({
        where: { id: tier.id },
        data: {
          stripeProductId,
          stripePriceId,
        },
      });
    }

    // Get or create Stripe Customer
    const subscriber = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    let customerId = subscriber?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: subscriber!.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Checkout Session
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
    console.error("[Subscribe] Error:", err);
    return NextResponse.json(
      { error: "Failed to initiate subscription." },
      { status: 500 },
    );
  }
}
