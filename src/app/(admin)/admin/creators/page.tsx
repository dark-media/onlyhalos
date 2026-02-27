// ============================================================================
// Admin Creator Management Page
// ============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { CreatorVerificationTable } from "@/components/admin/creator-verification-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import { ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Creator Management | Admin | OnlyHalos",
  description: "Manage creator verification and platform creators",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorWithStats {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  verificationStatus: string;
  status: string;
  createdAt: Date;
  _count: {
    posts: number;
    subscriptionsAsCreator: number;
  };
}

interface CreatorWithEarnings extends CreatorWithStats {
  totalEarnings: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminCreatorsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Stats
  const [
    pendingCount,
    totalCreators,
    verifiedCreators,
  ] = await Promise.all([
    prisma.user.count({ where: { verificationStatus: "PENDING" } }),
    prisma.user.count({ where: { isCreator: true } }),
    prisma.user.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  // All creators with stats
  const creators: CreatorWithStats[] = await prisma.user.findMany({
    where: { isCreator: true },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      verificationStatus: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          subscriptionsAsCreator: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Creator earnings (top earners)
  const creatorEarnings: CreatorWithEarnings[] = await Promise.all(
    creators.slice(0, 20).map(async (creator: CreatorWithStats) => {
      const earnings = await prisma.transaction.aggregate({
        where: { receiverId: creator.id, status: "COMPLETED" },
        _sum: { netAmount: true },
      });
      return {
        ...creator,
        totalEarnings: earnings._sum.netAmount ?? 0,
      };
    }),
  );

  const VERIFICATION_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
    UNVERIFIED: { label: "Unverified", variant: "outline" },
    PENDING: { label: "Pending", variant: "default" },
    VERIFIED: { label: "Verified", variant: "success" },
    REJECTED: { label: "Rejected", variant: "destructive" },
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Creator Management</h1>
          <p className="text-sm text-muted-foreground">
            Verify creators and manage the creator ecosystem
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCreators}</p>
                <p className="text-xs text-muted-foreground">Total Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{verifiedCreators}</p>
                <p className="text-xs text-muted-foreground">Verified Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Queue */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">
            Verification Queue
            {pendingCount > 0 && (
              <Badge variant="default" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreatorVerificationTable />
        </CardContent>
      </Card>

      {/* All Creators */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">All Creators</CardTitle>
        </CardHeader>
        <CardContent>
          {creatorEarnings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No creators on the platform yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creator</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Verification</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Subscribers</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Posts</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Earnings</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorEarnings.map((creator: CreatorWithEarnings) => {
                    const name = creator.displayName || creator.username || "Unknown";
                    const verBadge = VERIFICATION_BADGE_MAP[creator.verificationStatus] ?? {
                      label: creator.verificationStatus,
                      variant: "outline" as const,
                    };

                    return (
                      <tr
                        key={creator.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              {creator.avatarUrl && (
                                <AvatarImage src={creator.avatarUrl} alt={name} />
                              )}
                              <AvatarFallback>{getInitials(name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{name}</p>
                              {creator.username && (
                                <p className="text-xs text-muted-foreground">@{creator.username}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={creator.status === "ACTIVE" ? "success" : "destructive"}
                          >
                            {creator.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={verBadge.variant}>{verBadge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {creator._count.subscriptionsAsCreator}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {creator._count.posts}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary">
                          ${creator.totalEarnings.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatDate(creator.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
