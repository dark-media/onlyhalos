// ============================================================================
// Admin Stats API — Platform Statistics
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// GET /api/admin/stats — Platform statistics and chart data
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
    const includeCharts = searchParams.get("charts") === "true";

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // -----------------------------------------------------------------------
    // Core stats
    // -----------------------------------------------------------------------

    const [
      totalUsers,
      activeCreators,
      activeSubscriptions,
      currentMonthTransactions,
      previousMonthTransactions,
      totalTransactionCount,
      newUsersCurrentPeriod,
      usersLastPeriod,
      newCreatorsCurrentPeriod,
      creatorsLastPeriod,
      newSubsCurrentPeriod,
      subsLastPeriod,
      transactionsCurrentPeriod,
      transactionsLastPeriod,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isCreator: true, status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: "COMPLETED" },
        _sum: { amount: true, platformFee: true },
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: "COMPLETED" },
        _sum: { amount: true, platformFee: true },
      }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.user.count({ where: { isCreator: true, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { isCreator: true, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.subscription.count({ where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.count({ where: { status: "ACTIVE", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.transaction.count({ where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.transaction.count({ where: { status: "COMPLETED", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const monthlyRevenue = currentMonthTransactions._sum.amount ?? 0;
    const platformEarnings = currentMonthTransactions._sum.platformFee ?? 0;
    const prevRevenue = previousMonthTransactions._sum.amount ?? 0;
    const prevEarnings = previousMonthTransactions._sum.platformFee ?? 0;

    const stats = {
      totalUsers,
      activeCreators,
      activeSubscriptions,
      monthlyRevenue: Math.round(monthlyRevenue * 100),
      totalTransactions: totalTransactionCount,
      platformEarnings: Math.round(platformEarnings * 100),
      userGrowthTrend: calcTrend(newUsersCurrentPeriod, usersLastPeriod),
      revenueTrend: calcTrend(monthlyRevenue, prevRevenue),
      creatorTrend: calcTrend(newCreatorsCurrentPeriod, creatorsLastPeriod),
      subscriptionTrend: calcTrend(newSubsCurrentPeriod, subsLastPeriod),
      transactionTrend: calcTrend(transactionsCurrentPeriod, transactionsLastPeriod),
      earningsTrend: calcTrend(platformEarnings, prevEarnings),
    };

    // -----------------------------------------------------------------------
    // Chart data (optional)
    // -----------------------------------------------------------------------

    let chartData = {};

    if (includeCharts) {
      // Revenue chart - last 30 days, grouped by day
      const revenueByDay = await prisma.transaction.groupBy({
        by: ["createdAt"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: "COMPLETED",
        },
        _sum: { amount: true, platformFee: true },
        orderBy: { createdAt: "asc" },
      });

      // Build revenue chart data with day buckets
      const revenueChart: Array<{ date: string; revenue: number; platformFees: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStr = format(day, "MMM dd");
        const dayTransactions = revenueByDay.filter(
          (t: { createdAt: Date; _sum: { amount: number | null; platformFee: number | null } }) =>
            format(new Date(t.createdAt), "MMM dd") === dayStr,
        );
        let dayRevenue = 0;
        let dayFees = 0;
        for (const dt of dayTransactions) {
          dayRevenue += dt._sum.amount ?? 0;
          dayFees += dt._sum.platformFee ?? 0;
        }
        revenueChart.push({
          date: dayStr,
          revenue: Math.round(dayRevenue * 100),
          platformFees: Math.round(dayFees * 100),
        });
      }

      // User growth chart - last 30 days
      const userGrowthChart: Array<{ date: string; totalUsers: number; newUsers: number }> = [];
      let runningTotal = await prisma.user.count({
        where: { createdAt: { lt: subDays(now, 29) } },
      });

      for (let i = 29; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStr = format(day, "MMM dd");
        const nextDay = subDays(now, i - 1);
        const newUsersDay = await prisma.user.count({
          where: {
            createdAt: {
              gte: day,
              lt: i === 0 ? now : nextDay,
            },
          },
        });
        runningTotal += newUsersDay;
        userGrowthChart.push({
          date: dayStr,
          totalUsers: runningTotal,
          newUsers: newUsersDay,
        });
      }

      // Tier distribution
      const tiers = await prisma.subscriptionTier.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { price: "asc" },
        take: 10,
      });

      const tierDistributionChart = tiers.map((tier: { name: string; price: number; _count: { subscriptions: number } }) => ({
        tier: tier.name,
        subscribers: tier._count.subscriptions,
        revenue: Math.round(tier._count.subscriptions * tier.price * 100),
      }));

      chartData = {
        revenueChart,
        userGrowthChart,
        tierDistributionChart,
      };
    }

    return NextResponse.json({ ...stats, ...chartData });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
