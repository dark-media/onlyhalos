// ============================================================================
// Admin User Management API — Update User
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import {
  notifyVerificationApproved,
  notifyVerificationRejected,
} from "@/lib/notifications";

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/[userId] — Update user role, status, verification
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { userId } = params;

    // Cannot modify own admin status
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot modify your own account through this endpoint." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationStatus: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    const body = await req.json();

    // Build update data — only allow specific fields
    const updateData: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!["USER", "CREATOR", "ADMIN"].includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role." },
          { status: 400 },
        );
      }
      updateData.role = body.role;
    }

    if (body.status !== undefined) {
      if (!["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status." },
          { status: 400 },
        );
      }
      updateData.status = body.status;
    }

    if (body.verificationStatus !== undefined) {
      if (!["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].includes(body.verificationStatus)) {
        return NextResponse.json(
          { error: "Invalid verification status." },
          { status: 400 },
        );
      }
      updateData.verificationStatus = body.verificationStatus;
    }

    if (body.isCreator !== undefined) {
      updateData.isCreator = Boolean(body.isCreator);
    }

    if (body.platformFeePercent !== undefined) {
      const fee = Number(body.platformFeePercent);
      if (isNaN(fee) || fee < 0 || fee > 100) {
        return NextResponse.json(
          { error: "Platform fee must be between 0 and 100." },
          { status: 400 },
        );
      }
      updateData.platformFeePercent = fee;
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
        verificationStatus: true,
        isCreator: true,
        platformFeePercent: true,
      },
    });

    // Send verification notifications
    if (
      body.verificationStatus === "VERIFIED" &&
      user.verificationStatus !== "VERIFIED"
    ) {
      notifyVerificationApproved(userId).catch(console.error);
    }

    if (
      body.verificationStatus === "REJECTED" &&
      user.verificationStatus !== "REJECTED"
    ) {
      notifyVerificationRejected(userId).catch(console.error);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[ADMIN_USER_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/users/[userId] — Get full user details for admin
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            likes: true,
            comments: true,
            subscriptionsAsCreator: { where: { status: "ACTIVE" } },
            subscriptionsAsSubscriber: { where: { status: "ACTIVE" } },
            sentTransactions: true,
            receivedTransactions: true,
            reportsFiled: true,
            reportsAgainst: true,
          },
        },
        creatorCategories: {
          include: {
            category: { select: { name: true, slug: true } },
          },
        },
        subscriptionTiers: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get earnings aggregate
    const earnings = await prisma.transaction.aggregate({
      where: { receiverId: userId, status: "COMPLETED" },
      _sum: { netAmount: true, amount: true, platformFee: true },
    });

    // Remove sensitive fields
    const { hashedPassword, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      recentTransactions,
      earnings: {
        totalEarnings: earnings._sum.netAmount ?? 0,
        totalVolume: earnings._sum.amount ?? 0,
        totalFees: earnings._sum.platformFee ?? 0,
      },
    });
  } catch (error) {
    console.error("[ADMIN_USER_DETAIL]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
