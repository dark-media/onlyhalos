// ============================================================================
// Stripe Webhook Handler
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Disable Next.js body parsing so we can verify the Stripe signature
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST /api/stripe/webhook
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "payout.paid":
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    // Return 200 so Stripe does not retry (we log the error for investigation)
    return NextResponse.json({ received: true, error: "Handler error" });
  }

  return NextResponse.json({ received: true });
}

// ============================================================================
// Event Handlers
// ============================================================================

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription") return;

  const subscriberId = session.metadata?.subscriberId;
  const creatorId = session.metadata?.creatorId;
  const tierId = session.metadata?.tierId;

  if (!subscriberId || !creatorId || !tierId) {
    console.error(
      "[Stripe Webhook] checkout.session.completed missing metadata:",
      session.id,
    );
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!stripeSubscriptionId) {
    console.error(
      "[Stripe Webhook] checkout.session.completed missing subscription ID:",
      session.id,
    );
    return;
  }

  // Fetch the Stripe subscription to get period dates
  const stripeSubscriptionResponse =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // In Stripe SDK v20, current_period_start/end moved to subscription items
  const firstItem = stripeSubscriptionResponse.items.data[0];
  const periodStart = firstItem?.current_period_start ?? 0;
  const periodEnd = firstItem?.current_period_end ?? 0;

  // Upsert the subscription (handles edge case of re-subscribing)
  await prisma.subscription.upsert({
    where: {
      subscriberId_creatorId: {
        subscriberId,
        creatorId,
      },
    },
    create: {
      subscriberId,
      creatorId,
      tierId,
      status: "ACTIVE",
      stripeSubscriptionId,
      currentPeriodStart: new Date(
        periodStart * 1000,
      ),
      currentPeriodEnd: new Date(
        periodEnd * 1000,
      ),
      cancelAtPeriodEnd: false,
    },
    update: {
      tierId,
      status: "ACTIVE",
      stripeSubscriptionId,
      currentPeriodStart: new Date(
        periodStart * 1000,
      ),
      currentPeriodEnd: new Date(
        periodEnd * 1000,
      ),
      cancelAtPeriodEnd: false,
    },
  });

  // Notify the creator
  const subscriber = await prisma.user.findUnique({
    where: { id: subscriberId },
    select: { displayName: true, username: true },
  });

  const displayLabel =
    subscriber?.displayName || subscriber?.username || "Someone";

  await prisma.notification.create({
    data: {
      receiverId: creatorId,
      type: "NEW_SUBSCRIBER",
      title: "New Subscriber!",
      body: `${displayLabel} just subscribed to your content.`,
      linkUrl: `/profile/${subscriberId}`,
    },
  });
}

// ---------------------------------------------------------------------------
// invoice.paid
// ---------------------------------------------------------------------------

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // In Stripe SDK v20, subscription is accessed via invoice.parent?.subscription_details
  const invoiceAny = invoice as any;
  const stripeSubscriptionId =
    typeof invoiceAny.subscription === "string"
      ? invoiceAny.subscription
      : invoiceAny.subscription?.id ??
        (typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : (invoice.parent?.subscription_details?.subscription as Stripe.Subscription | undefined)?.id);

  if (!stripeSubscriptionId) return;

  // Fetch the Stripe subscription for latest period dates
  const stripeSubscriptionResponse =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // In Stripe SDK v20, current_period_start/end moved to subscription items
  const firstItem = stripeSubscriptionResponse.items.data[0];
  const periodStart = firstItem?.current_period_start ?? 0;
  const periodEnd = firstItem?.current_period_end ?? 0;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.error(
      "[Stripe Webhook] invoice.paid: No subscription found for",
      stripeSubscriptionId,
    );
    return;
  }

  // Update subscription period dates and ensure ACTIVE status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      currentPeriodStart: new Date(
        periodStart * 1000,
      ),
      currentPeriodEnd: new Date(
        periodEnd * 1000,
      ),
    },
  });

  // Record the transaction
  const amountPaid = (invoice.amount_paid ?? 0) / 100;
  const platformFee = amountPaid * (PLATFORM_FEE_PERCENT / 100);
  const netAmount = amountPaid - platformFee;

  // In Stripe SDK v20, payment_intent is accessed via payments list
  const paymentIntentId: string | null =
    (invoiceAny.payment_intent
      ? (typeof invoiceAny.payment_intent === "string"
          ? invoiceAny.payment_intent
          : invoiceAny.payment_intent?.id)
      : null) ?? null;

  await prisma.transaction.create({
    data: {
      senderId: subscription.subscriberId,
      receiverId: subscription.creatorId,
      type: "SUBSCRIPTION",
      status: "COMPLETED",
      amount: amountPaid,
      platformFee,
      netAmount,
      stripePaymentIntentId: paymentIntentId,
      description: `Subscription renewal`,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        tierId: subscription.tierId,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// invoice.payment_failed
// ---------------------------------------------------------------------------

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // In Stripe SDK v20, subscription is accessed via invoice.parent?.subscription_details
  const invoiceAny = invoice as any;
  const stripeSubscriptionId =
    typeof invoiceAny.subscription === "string"
      ? invoiceAny.subscription
      : invoiceAny.subscription?.id ??
        (typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : (invoice.parent?.subscription_details?.subscription as Stripe.Subscription | undefined)?.id);

  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });

  // Notify subscriber
  await prisma.notification.create({
    data: {
      receiverId: subscription.subscriberId,
      type: "SUBSCRIPTION_EXPIRED",
      title: "Payment Failed",
      body: "Your subscription payment failed. Please update your payment method to maintain access.",
      linkUrl: "/settings/billing",
    },
  });
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------------

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "EXPIRED" },
  });

  // Notify subscriber
  await prisma.notification.create({
    data: {
      receiverId: subscription.subscriberId,
      type: "SUBSCRIPTION_EXPIRED",
      title: "Subscription Ended",
      body: "Your subscription has expired. Re-subscribe to regain access.",
      linkUrl: `/creators/${subscription.creatorId}`,
    },
  });
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// ---------------------------------------------------------------------------

async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

// ---------------------------------------------------------------------------
// payment_intent.succeeded — Tips & PPV purchases
// ---------------------------------------------------------------------------

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const paymentType = paymentIntent.metadata?.type;

  if (paymentType === "tip") {
    await handleTipPayment(paymentIntent);
  } else if (paymentType === "ppv") {
    await handlePPVPayment(paymentIntent);
  }
  // If no type metadata, this is likely a subscription payment — handled by invoice.paid
}

async function handleTipPayment(paymentIntent: Stripe.PaymentIntent) {
  const senderId = paymentIntent.metadata?.senderId;
  const receiverId = paymentIntent.metadata?.receiverId;
  const message = paymentIntent.metadata?.message;

  if (!senderId || !receiverId) {
    console.error(
      "[Stripe Webhook] tip payment_intent.succeeded missing metadata:",
      paymentIntent.id,
    );
    return;
  }

  const amount = paymentIntent.amount / 100;
  const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
  const netAmount = amount - platformFee;

  // Update the existing PENDING transaction to COMPLETED
  await prisma.transaction.updateMany({
    where: {
      stripePaymentIntentId: paymentIntent.id,
      status: "PENDING",
    },
    data: {
      status: "COMPLETED",
    },
  });

  // If no pending transaction existed (edge case), create one
  const existing = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!existing) {
    await prisma.transaction.create({
      data: {
        senderId,
        receiverId,
        type: "TIP",
        status: "COMPLETED",
        amount,
        platformFee,
        netAmount,
        stripePaymentIntentId: paymentIntent.id,
        description: message || "Tip",
      },
    });
  }

  // Notify the creator
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { displayName: true, username: true },
  });

  const displayLabel =
    sender?.displayName || sender?.username || "Someone";

  await prisma.notification.create({
    data: {
      receiverId,
      type: "NEW_TIP",
      title: "You received a tip!",
      body: `${displayLabel} tipped you $${amount.toFixed(2)}${message ? `: "${message}"` : ""}.`,
      linkUrl: "/dashboard/earnings",
      metadata: {
        amount,
        senderId,
        message: message || null,
      },
    },
  });
}

async function handlePPVPayment(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  const postId = paymentIntent.metadata?.postId;
  const creatorId = paymentIntent.metadata?.creatorId;

  if (!userId || !postId || !creatorId) {
    console.error(
      "[Stripe Webhook] ppv payment_intent.succeeded missing metadata:",
      paymentIntent.id,
    );
    return;
  }

  const amount = paymentIntent.amount / 100;
  const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
  const netAmount = amount - platformFee;

  // Create PPV purchase record
  await prisma.pPVPurchase.upsert({
    where: {
      userId_postId: { userId, postId },
    },
    create: {
      userId,
      postId,
      amount,
      stripePaymentIntentId: paymentIntent.id,
    },
    update: {
      amount,
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  // Update the PENDING transaction to COMPLETED
  await prisma.transaction.updateMany({
    where: {
      stripePaymentIntentId: paymentIntent.id,
      status: "PENDING",
    },
    data: {
      status: "COMPLETED",
    },
  });

  // If no pending transaction existed, create one
  const existing = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!existing) {
    await prisma.transaction.create({
      data: {
        senderId: userId,
        receiverId: creatorId,
        type: "PPV_PURCHASE",
        status: "COMPLETED",
        amount,
        platformFee,
        netAmount,
        stripePaymentIntentId: paymentIntent.id,
        description: "PPV content purchase",
        metadata: { postId },
      },
    });
  }

  // Notify the creator
  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, username: true },
  });

  const displayLabel =
    buyer?.displayName || buyer?.username || "Someone";

  await prisma.notification.create({
    data: {
      receiverId: creatorId,
      type: "POST_PURCHASED",
      title: "Content Purchased!",
      body: `${displayLabel} purchased your content for $${amount.toFixed(2)}.`,
      linkUrl: `/posts/${postId}`,
      metadata: {
        amount,
        postId,
        buyerId: userId,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// account.updated — Stripe Connect onboarding status
// ---------------------------------------------------------------------------

async function handleAccountUpdated(account: Stripe.Account) {
  const isOnboarded =
    account.charges_enabled && account.payouts_enabled;

  await prisma.user.updateMany({
    where: { stripeConnectAccountId: account.id },
    data: { stripeConnectOnboarded: isOnboarded },
  });
}

// ---------------------------------------------------------------------------
// payout.paid — Record payout completion
// ---------------------------------------------------------------------------

async function handlePayoutPaid(payout: Stripe.Payout) {
  if (!payout.id) return;

  // Try to find an existing payout record
  const existingPayout = await prisma.payout.findUnique({
    where: { stripePayoutId: payout.id },
  });

  if (existingPayout) {
    await prisma.payout.update({
      where: { id: existingPayout.id },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        receiverId: existingPayout.creatorId,
        type: "PAYOUT_COMPLETED",
        title: "Payout Completed",
        body: `Your payout of $${existingPayout.amount.toFixed(2)} has been sent to your bank account.`,
        linkUrl: "/dashboard/earnings",
      },
    });
  } else {
    // Payout originated from Stripe (automatic payouts)
    // Try to find the creator by the Connect account on the payout
    const connectAccountId = (payout as Stripe.Payout & { account?: string })
      .account;

    if (connectAccountId && typeof connectAccountId === "string") {
      const creator = await prisma.user.findUnique({
        where: { stripeConnectAccountId: connectAccountId },
      });

      if (creator) {
        const amount = payout.amount / 100;

        await prisma.payout.create({
          data: {
            creatorId: creator.id,
            amount,
            status: "COMPLETED",
            currency: payout.currency,
            stripePayoutId: payout.id,
            processedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            receiverId: creator.id,
            type: "PAYOUT_COMPLETED",
            title: "Payout Completed",
            body: `Your payout of $${amount.toFixed(2)} has been sent to your bank account.`,
            linkUrl: "/dashboard/earnings",
          },
        });
      }
    }
  }
}
