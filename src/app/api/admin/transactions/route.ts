// ============================================================================
// Admin Transactions API — Transaction Monitoring
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/admin/transactions — Paginated transaction list
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
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const search = searchParams.get("search")?.trim() || "";

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sender: { OR: [
          { username: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
        ] } },
        { receiver: { OR: [
          { username: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
        ] } },
      ];
    }

    // Build the completed filter for totals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedWhere: Record<string, any> = { ...where, status: "COMPLETED" };

    const [transactions, total, totalsAgg] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where: completedWhere,
        _sum: {
          amount: true,
          platformFee: true,
          netAmount: true,
        },
      }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totals: {
        totalAmount: Math.round((totalsAgg._sum.amount ?? 0) * 100),
        totalPlatformFee: Math.round((totalsAgg._sum.platformFee ?? 0) * 100),
        totalNet: Math.round((totalsAgg._sum.netAmount ?? 0) * 100),
      },
    });
  } catch (error) {
    console.error("[ADMIN_TRANSACTIONS_LIST]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
