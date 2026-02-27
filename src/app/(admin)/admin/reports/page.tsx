// ============================================================================
// Admin Reports Moderation Page
// ============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { ReportsTable } from "@/components/admin/reports-table";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, Clock, Eye, CheckCircle, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports | Admin | OnlyHalos",
  description: "Review and moderate user reports",
};

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Report status counts
  const [
    pendingCount,
    reviewingCount,
    resolvedCount,
    dismissedCount,
  ] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "REVIEWING" } }),
    prisma.report.count({ where: { status: "RESOLVED" } }),
    prisma.report.count({ where: { status: "DISMISSED" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
          <Flag className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports Moderation</h1>
          <p className="text-sm text-muted-foreground">
            Review and resolve user reports
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Eye className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{reviewingCount}</p>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dismissedCount}</p>
                <p className="text-xs text-muted-foreground">Dismissed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <ReportsTable />
    </div>
  );
}
