// ============================================================================
// PPV Purchase — Create Stripe PaymentIntent for pay-per-view content
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/purchase
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { postId } = await params;

    // Fetch the post with creator info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        visibility: true,
        ppvPrice: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            stripeConnectAccountId: true,
            stripeConnectOnboarded: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    // Verify post is PPV
    if (post.visibility !== "PPV") {
      return NextResponse.json(
        { error: "This post is not available for purchase." },
        { status: 400 },
      );
    }

    if (!post.ppvPrice || post.ppvPrice <= 0) {
      return NextResponse.json(
        { error: "This post does not have a valid price." },
        { status: 400 },
      );
    }

    // Prevent creator from purchasing their own content
    if (session.user.id === post.creatorId) {
      return NextResponse.json(
        { error: "You cannot purchase your own content." },
        { status: 400 },
      );
    }

    // Verify creator has Stripe Connect set up
    if (
      !post.creator.stripeConnectAccountId ||
      !post.creator.stripeConnectOnboarded
    ) {
      return NextResponse.json(
        { error: "This creator has not completed payment setup." },
        { status: 400 },
      );
    }

    // Check if user already purchased this post
    const existingPurchase = await prisma.pPVPurchase.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You have already purchased this content." },
        { status: 409 },
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
    const amountInCents = Math.round(post.ppvPrice * 100);
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
        destination: post.creator.stripeConnectAccountId,
      },
      metadata: {
        type: "ppv",
        userId: session.user.id,
        postId: post.id,
        creatorId: post.creatorId,
      },
    });

    // Record a PENDING transaction
    const platformFee = post.ppvPrice * (PLATFORM_FEE_PERCENT / 100);
    const netAmount = post.ppvPrice - platformFee;

    await prisma.transaction.create({
      data: {
        senderId: session.user.id,
        receiverId: post.creatorId,
        type: "PPV_PURCHASE",
        status: "PENDING",
        amount: post.ppvPrice,
        platformFee,
        netAmount,
        stripePaymentIntentId: paymentIntent.id,
        description: "PPV content purchase",
        metadata: { postId: post.id },
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[PPV Purchase] Error:", err);
    return NextResponse.json(
      { error: "Failed to create purchase payment." },
      { status: 500 },
    );
  }
}
