// ============================================================================
// Tip Creator — Create Stripe PaymentIntent
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { tipSchema } from "@/lib/validations/payment";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// POST /api/creators/[creatorId]/tip
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
    const parsed = tipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 },
      );
    }

    const { amount, message } = parsed.data;

    // Prevent self-tipping
    if (session.user.id === creatorId) {
      return NextResponse.json(
        { error: "You cannot tip yourself." },
        { status: 400 },
      );
    }

    // Fetch creator
    const creator = await prisma.user.findUnique({
      where: { id: creatorId, isCreator: true },
      select: {
        id: true,
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

    // Get or create Stripe Customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user!.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Calculate fees
    const amountInCents = Math.round(amount * 100);
    const applicationFeeAmount = Math.round(
      amountInCents * (PLATFORM_FEE_PERCENT / 100),
    );

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer: customerId,
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: creator.stripeConnectAccountId,
      },
      metadata: {
        type: "tip",
        senderId: session.user.id,
        receiverId: creatorId,
        message: message || "",
      },
    });

    // Record a PENDING transaction
    const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
    const netAmount = amount - platformFee;

    await prisma.transaction.create({
      data: {
        senderId: session.user.id,
        receiverId: creatorId,
        type: "TIP",
        status: "PENDING",
        amount,
        platformFee,
        netAmount,
        stripePaymentIntentId: paymentIntent.id,
        description: message || "Tip",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[Tip] Error:", err);
    return NextResponse.json(
      { error: "Failed to create tip payment." },
      { status: 500 },
    );
  }
}
