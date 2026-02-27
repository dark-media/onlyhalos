// ============================================================================
// Admin Users API — Paginated User List
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/admin/users — List users with filtering and pagination
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const verification = searchParams.get("verification") || "";

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (verification && verification !== "ALL") {
      where.verificationStatus = verification;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          creatorBio: true,
          role: true,
          status: true,
          verificationStatus: true,
          isCreator: true,
          createdAt: true,
          location: true,
          platformFeePercent: true,
          stripeConnectOnboarded: true,
          _count: {
            select: {
              posts: true,
              subscriptionsAsCreator: { where: { status: "ACTIVE" } },
              subscriptionsAsSubscriber: { where: { status: "ACTIVE" } },
            },
          },
          creatorCategories: {
            include: {
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[ADMIN_USERS_LIST]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
