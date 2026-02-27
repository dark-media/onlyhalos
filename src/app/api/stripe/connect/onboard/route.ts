// ============================================================================
// Stripe Connect Onboarding — Create Express account & account link
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/stripe/connect/onboard
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        isCreator: true,
        stripeConnectAccountId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    if (!user.isCreator) {
      return NextResponse.json(
        { error: "You must be a creator to set up payouts." },
        { status: 403 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let connectAccountId = user.stripeConnectAccountId;

    // Create Express account if the creator does not have one yet
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { userId: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      connectAccountId = account.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: connectAccountId },
      });
    }

    // Create an account link for onboarding / re-onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
      return_url: `${baseUrl}/dashboard/settings?stripe=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("[Stripe Connect Onboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to create onboarding link." },
      { status: 500 },
    );
  }
}
