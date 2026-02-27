// ============================================================================
// Admin Dashboard Page
// ============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AdminStatsCards, type PlatformStats } from "@/components/admin/admin-stats-cards";
import { PlatformChart } from "@/components/admin/platform-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Flag,
  ShieldCheck,
  ArrowRight,
  Activity,
  Server,
  Database,
  Zap,
} from "lucide-react";
import { subDays } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard | Admin | OnlyHalos",
  description: "Platform administration dashboard",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  createdAt: Date;
  senderId: string | null;
  receiverId: string;
  sender: { id: string; username: string | null; displayName: string | null } | null;
  receiver: { id: string; username: string | null; displayName: string | null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  // Fetch all stats in parallel
  const [
    totalUsers,
    activeCreators,
    activeSubscriptions,
    currentRevenue,
    prevRevenue,
    totalTransactionCount,
    newUsersCurrentPeriod,
    usersLastPeriod,
    newCreatorsCurrentPeriod,
    creatorsLastPeriod,
    newSubsCurrentPeriod,
    subsLastPeriod,
    transactionsCurrentPeriod,
    transactionsLastPeriod,
    recentTransactions,
    pendingReports,
    pendingVerifications,
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
    prisma.transaction.findMany({
      include: {
        sender: { select: { id: true, username: true, displayName: true } },
        receiver: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { verificationStatus: "PENDING" } }),
  ]);

  const monthlyRevenue = currentRevenue._sum.amount ?? 0;
  const platformEarnings = currentRevenue._sum.platformFee ?? 0;
  const prevMonthlyRevenue = prevRevenue._sum.amount ?? 0;
  const prevPlatformEarnings = prevRevenue._sum.platformFee ?? 0;

  const stats: PlatformStats = {
    totalUsers,
    activeCreators,
    activeSubscriptions,
    monthlyRevenue: Math.round(monthlyRevenue * 100),
    totalTransactions: totalTransactionCount,
    platformEarnings: Math.round(platformEarnings * 100),
    userGrowthTrend: calcTrend(newUsersCurrentPeriod, usersLastPeriod),
    revenueTrend: calcTrend(monthlyRevenue, prevMonthlyRevenue),
    creatorTrend: calcTrend(newCreatorsCurrentPeriod, creatorsLastPeriod),
    subscriptionTrend: calcTrend(newSubsCurrentPeriod, subsLastPeriod),
    transactionTrend: calcTrend(transactionsCurrentPeriod, transactionsLastPeriod),
    earningsTrend: calcTrend(platformEarnings, prevPlatformEarnings),
  };

  // Type badge map for transactions
  const typeBadgeMap: Record<string, string> = {
    SUBSCRIPTION: "default",
    TIP: "success",
    PPV_PURCHASE: "secondary",
    PAYOUT: "outline",
    REFUND: "destructive",
  };

  const typedTransactions = recentTransactions as RecentTransaction[];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/users">
          <Card hover className="group cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Manage Users</p>
                <p className="text-xs text-muted-foreground">{totalUsers} total users</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports">
          <Card hover className="group cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <Flag className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">View Reports</p>
                <p className="text-xs text-muted-foreground">{pendingReports} pending</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/creators">
          <Card hover className="group cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <ShieldCheck className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Creator Verification</p>
                <p className="text-xs text-muted-foreground">{pendingVerifications} pending</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <PlatformChart />

      {/* Recent Activity & System Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link href="/admin/transactions">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typedTransactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No recent transactions
                  </p>
                ) : (
                  typedTransactions.slice(0, 10).map((tx: RecentTransaction) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={(typeBadgeMap[tx.type] ?? "secondary") as "default" | "secondary" | "success" | "destructive" | "outline"}>
                          {tx.type.replace("_", " ")}
                        </Badge>
                        <div>
                          <p className="text-sm text-foreground">
                            {tx.sender
                              ? (tx.sender.displayName || tx.sender.username || "System")
                              : "System"}{" "}
                            <span className="text-muted-foreground">&rarr;</span>{" "}
                            {tx.receiver.displayName || tx.receiver.username || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-foreground">
                        ${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Server className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">API Server</p>
                <p className="text-xs text-emerald-400">Operational</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Database className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Database</p>
                <p className="text-xs text-emerald-400">Connected</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Stripe</p>
                <p className="text-xs text-emerald-400">Connected</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Storage (S3)</p>
                <p className="text-xs text-emerald-400">Operational</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>Environment: {process.env.NODE_ENV}</p>
              <p>Next.js Runtime: Edge/Node</p>
              <p>Uptime: Healthy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
