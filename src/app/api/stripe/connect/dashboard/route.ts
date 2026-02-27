// ============================================================================
// Stripe Connect Dashboard — Login link for Express dashboard
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/stripe/connect/dashboard
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isCreator: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
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
        { error: "You must be a creator to access the Stripe dashboard." },
        { status: 403 },
      );
    }

    if (!user.stripeConnectAccountId) {
      return NextResponse.json(
        { error: "No Stripe account found. Please complete onboarding first." },
        { status: 400 },
      );
    }

    if (!user.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "Stripe onboarding is not complete. Please finish onboarding first." },
        { status: 400 },
      );
    }

    const loginLink = await stripe.accounts.createLoginLink(
      user.stripeConnectAccountId,
    );

    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    console.error("[Stripe Connect Dashboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe dashboard link." },
      { status: 500 },
    );
  }
}
