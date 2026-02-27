// ============================================================================
// Admin Platform Analytics Page
// ============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { PlatformChart } from "@/components/admin/platform-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Globe,
} from "lucide-react";
import { subDays, subMonths, format } from "date-fns";

export const metadata: Metadata = {
  title: "Analytics | Admin | OnlyHalos",
  description: "Platform analytics and insights",
};

// ---------------------------------------------------------------------------
// Types for groupBy results
// ---------------------------------------------------------------------------

interface TransactionGroupByType {
  type: string;
  _sum: { amount: number | null };
  _count: { id: number };
}

interface UserGroupByRole {
  role: string;
  _count: { id: number };
}

interface UserGroupByStatus {
  status: string;
  _count: { id: number };
}

interface CategoryGroupResult {
  categoryId: string;
  _count: { userId: number };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // Key metrics
  const [
    totalUsers,
    newUsersThisMonth,
    totalCreators,
    totalSubscriptions,
    revenueAgg,
    transactionsByType,
    usersByRole,
    usersByStatus,
    topCategories,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { isCreator: true } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true, platformFee: true, netAmount: true },
      _count: { id: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.creatorCategory.groupBy({
      by: ["categoryId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  // Resolve category names
  const categoryIds = (topCategories as CategoryGroupResult[]).map((c) => c.categoryId);
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      })
    : [];
  const categoryMap = new Map(categories.map((c: { id: string; name: string }) => [c.id, c.name]));

  // Monthly revenue for the last 6 months
  const monthlyRevenue: Array<{ month: string; revenue: number; fees: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = subMonths(now, i);
    const monthLabel = format(monthStart, "MMM yyyy");
    const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

    const agg = await prisma.transaction.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true, platformFee: true },
    });

    monthlyRevenue.push({
      month: monthLabel,
      revenue: agg._sum.amount ?? 0,
      fees: agg._sum.platformFee ?? 0,
    });
  }

  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const totalPlatformFees = revenueAgg._sum.platformFee ?? 0;

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  }

  const TYPE_LABELS: Record<string, string> = {
    SUBSCRIPTION: "Subscriptions",
    TIP: "Tips",
    PPV_PURCHASE: "PPV Purchases",
    PAYOUT: "Payouts",
    REFUND: "Refunds",
  };

  const typedTransactionsByType = transactionsByType as TransactionGroupByType[];
  const typedUsersByRole = usersByRole as UserGroupByRole[];
  const typedUsersByStatus = usersByStatus as UserGroupByStatus[];
  const typedTopCategories = topCategories as CategoryGroupResult[];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive platform insights and metrics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold text-foreground">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-emerald-400">+{newUsersThisMonth} this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{(revenueAgg._count?.id ?? 0).toLocaleString()} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform Earnings</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalPlatformFees)}</p>
                <p className="text-xs text-muted-foreground">
                  {totalRevenue > 0 ? ((totalPlatformFees / totalRevenue) * 100).toFixed(1) : 0}% take rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Globe className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                <p className="text-xl font-bold text-foreground">{totalSubscriptions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{totalCreators} creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <PlatformChart />

      {/* Detailed Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Type */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typedTransactionsByType.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No transaction data available.
                </p>
              ) : (
                typedTransactionsByType
                  .sort((a: TransactionGroupByType, b: TransactionGroupByType) =>
                    (b._sum.amount ?? 0) - (a._sum.amount ?? 0),
                  )
                  .map((item: TransactionGroupByType) => {
                    const total = typedTransactionsByType.reduce(
                      (sum: number, t: TransactionGroupByType) => sum + (t._sum.amount ?? 0),
                      0,
                    );
                    const percentage =
                      total > 0
                        ? (((item._sum.amount ?? 0) / total) * 100).toFixed(1)
                        : "0";

                    return (
                      <div key={item.type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {TYPE_LABELS[item.type] ?? item.type}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(item._sum.amount ?? 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs text-muted-foreground">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyRevenue.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
                >
                  <span className="text-sm text-foreground">{item.month}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(item.revenue)}
                    </p>
                    <p className="text-xs text-primary">
                      {formatCurrency(item.fees)} fees
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Demographics */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">User Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">By Role</h4>
                <div className="flex flex-wrap gap-3">
                  {typedUsersByRole.map((item: UserGroupByRole) => (
                    <div
                      key={item.role}
                      className="rounded-lg border border-border/50 px-4 py-2 text-center"
                    >
                      <p className="text-lg font-bold text-foreground">
                        {item._count.id.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          item.role === "ADMIN"
                            ? "premium"
                            : item.role === "CREATOR"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {item.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">By Status</h4>
                <div className="flex flex-wrap gap-3">
                  {typedUsersByStatus.map((item: UserGroupByStatus) => (
                    <div
                      key={item.status}
                      className="rounded-lg border border-border/50 px-4 py-2 text-center"
                    >
                      <p className="text-lg font-bold text-foreground">
                        {item._count.id.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          item.status === "ACTIVE"
                            ? "success"
                            : item.status === "BANNED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Top Creator Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {typedTopCategories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No category data available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {typedTopCategories.map((item: CategoryGroupResult, index: number) => {
                  const catName = categoryMap.get(item.categoryId) ?? "Unknown";
                  const maxCount = typedTopCategories[0]?._count.userId ?? 1;
                  const percentage = ((item._count.userId / maxCount) * 100).toFixed(0);

                  return (
                    <div key={item.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {index + 1}. {String(catName)}
                        </span>
                        <span className="font-medium text-foreground">
                          {item._count.userId} creator{item._count.userId !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
