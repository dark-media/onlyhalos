// ============================================================================
// API: /api/users/me — Current User Profile
// ============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/user";

// ---------------------------------------------------------------------------
// GET /api/users/me — Return current user profile with full details
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        status: true,
        isCreator: true,
        creatorBio: true,
        location: true,
        websiteUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        verificationStatus: true,
        stripeCustomerId: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            subscriptionsAsSubscriber: { where: { status: "ACTIVE" } },
            subscriptionsAsCreator: { where: { status: "ACTIVE" } },
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/users/me] Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/users/me — Update current user profile
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstError?.message ?? "Invalid input.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      displayName,
      bio,
      location,
      websiteUrl,
      twitterUrl,
      instagramUrl,
      tiktokUrl,
    } = parsed.data;

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio || null;
    if (location !== undefined) updateData.location = location || null;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl || null;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl || null;
    if (tiktokUrl !== undefined) updateData.tiktokUrl = tiktokUrl || null;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        status: true,
        isCreator: true,
        creatorBio: true,
        location: true,
        websiteUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[PATCH /api/users/me] Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
