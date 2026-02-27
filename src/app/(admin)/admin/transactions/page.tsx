// ============================================================================
// Admin Transactions Monitoring Page
// ============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { TransactionTable } from "@/components/admin/transaction-table";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, ArrowUpDown, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Transactions | Admin | OnlyHalos",
  description: "Monitor platform transactions and revenue",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function AdminTransactionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Aggregate stats
  const [totalAgg, completedCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true, platformFee: true, netAmount: true },
      _avg: { amount: true },
    }),
    prisma.transaction.count({ where: { status: "COMPLETED" } }),
  ]);

  const totalVolume = totalAgg._sum.amount ?? 0;
  const platformRevenue = totalAgg._sum.platformFee ?? 0;
  const avgTransaction = totalAgg._avg.amount ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Track all platform financial activity
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalVolume)}</p>
                <p className="text-xs text-muted-foreground">Total Volume</p>
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
                <p className="text-xl font-bold text-foreground">{formatCurrency(platformRevenue)}</p>
                <p className="text-xs text-muted-foreground">Platform Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <ArrowUpDown className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(avgTransaction)}</p>
                <p className="text-xs text-muted-foreground">Avg Transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{completedCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <TransactionTable />
    </div>
  );
}
