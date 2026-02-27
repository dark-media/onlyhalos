// ============================================================================
// API: /api/users/[userId] — User Profile by ID
// ============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/users/[userId] — Return user profile (public info for non-admin)
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    const { userId } = params;

    // First check user status for non-admins
    if (!isAdmin) {
      const userStatus = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true },
      });

      if (!userStatus) {
        return NextResponse.json(
          { error: "User not found." },
          { status: 404 },
        );
      }

      if (userStatus.status === "BANNED" || userStatus.status === "DEACTIVATED") {
        return NextResponse.json(
          { error: "User not found." },
          { status: 404 },
        );
      }
    }

    // Public fields available to all authenticated users
    const publicSelect = {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      coverUrl: true,
      role: true,
      isCreator: true,
      creatorBio: true,
      location: true,
      websiteUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      verificationStatus: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { isPublished: true } },
          subscriptionsAsCreator: { where: { status: "ACTIVE" as const } },
        },
      },
    };

    // Admin gets additional sensitive fields
    const adminSelect = {
      ...publicSelect,
      email: true,
      status: true,
      stripeCustomerId: true,
      stripeConnectAccountId: true,
      stripeConnectOnboarded: true,
      platformFeePercent: true,
      updatedAt: true,
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: isAdmin ? adminSelect : publicSelect,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/users/[userId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/users/[userId] — Admin-only: update user status, role, etc.
// ---------------------------------------------------------------------------

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // Only admins can update other users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      );
    }

    const { userId } = params;
    const body = await request.json();

    // Validate the target user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    // Prevent admins from demoting themselves
    if (userId === session.user.id && body.role && body.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot change your own admin role." },
        { status: 400 },
      );
    }

    // Build update data — only allow admin-modifiable fields
    const allowedFields = [
      "role",
      "status",
      "verificationStatus",
      "isCreator",
      "platformFeePercent",
    ];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        isCreator: true,
        verificationStatus: true,
        platformFeePercent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[PATCH /api/users/[userId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
