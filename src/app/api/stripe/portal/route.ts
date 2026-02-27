// ============================================================================
// Stripe Customer Portal — Manage billing
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/stripe/portal
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
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. You must have an active subscription first." },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[Stripe Portal] Error:", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session." },
      { status: 500 },
    );
  }
}
