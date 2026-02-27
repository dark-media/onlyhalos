// ============================================================================
// Admin User Detail Page
// ============================================================================

import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { formatDate, getInitials } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Calendar,
  MapPin,
  Globe,
  CreditCard,
  FileText,
  Heart,
  Users,
  Flag,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "User Detail | Admin | OnlyHalos",
  description: "View and manage user account details",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserTransaction {
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

interface UserPost {
  id: string;
  caption: string | null;
  visibility: string;
  createdAt: Date;
  _count: { likes: number; comments: number };
}

interface UserTier {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Badge maps
// ---------------------------------------------------------------------------

const ROLE_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "premium" }> = {
  USER: { label: "User", variant: "secondary" },
  CREATOR: { label: "Creator", variant: "default" },
  ADMIN: { label: "Admin", variant: "premium" },
};

const STATUS_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
  BANNED: { label: "Banned", variant: "destructive" },
  DEACTIVATED: { label: "Deactivated", variant: "secondary" },
};

const VERIFICATION_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  UNVERIFIED: { label: "Unverified", variant: "outline" },
  PENDING: { label: "Pending", variant: "default" },
  VERIFIED: { label: "Verified", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminUserDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
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
          category: { select: { name: true } },
        },
      },
      subscriptionTiers: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Earnings
  const earnings = await prisma.transaction.aggregate({
    where: { receiverId: user.id, status: "COMPLETED" },
    _sum: { netAmount: true, amount: true, platformFee: true },
  });

  // Recent transactions
  const recentTransactions: UserTransaction[] = await prisma.transaction.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    include: {
      sender: { select: { id: true, username: true, displayName: true } },
      receiver: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  // Recent posts (if creator)
  const recentPosts: UserPost[] = user.isCreator
    ? await prisma.post.findMany({
        where: { creatorId: user.id },
        select: {
          id: true,
          caption: true,
          visibility: true,
          createdAt: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  const name = user.displayName || user.username || "Unknown";
  const roleBadge = ROLE_BADGE_MAP[user.role] ?? { label: user.role, variant: "secondary" as const };
  const statusBadge = STATUS_BADGE_MAP[user.status] ?? { label: user.status, variant: "secondary" as const };
  const verBadge = VERIFICATION_BADGE_MAP[user.verificationStatus] ?? { label: user.verificationStatus, variant: "outline" as const };
  const typedTiers = user.subscriptionTiers as UserTier[];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/admin/users">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </Link>

      {/* User Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar size="xl">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={name} />}
          <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            {user.username && (
              <p className="text-muted-foreground">@{user.username}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Badge variant={verBadge.variant}>{verBadge.label}</Badge>
            {user.isCreator && <Badge variant="premium">Creator</Badge>}
          </div>

          {user.bio && (
            <p className="max-w-2xl text-sm text-muted-foreground">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {formatDate(user.createdAt)}
              </div>
              {user.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </div>
              )}
              {user.websiteUrl && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  {user.websiteUrl}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Activity Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                {user._count.posts} posts
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                {user._count.likes} likes
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                {user._count.subscriptionsAsCreator} subscribers
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                {user._count.subscriptionsAsSubscriber} subscriptions
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                {user._count.reportsAgainst} reports against
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                {user._count.reportsFiled} reports filed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Financial</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Earnings</span>
                <span className="font-medium text-foreground">
                  ${(earnings._sum.netAmount ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume Generated</span>
                <span className="font-medium text-foreground">
                  ${(earnings._sum.amount ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fees Paid</span>
                <span className="font-medium text-primary">
                  ${(earnings._sum.platformFee ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custom Fee Rate</span>
                <span className="font-medium text-foreground">
                  {user.platformFeePercent != null
                    ? `${user.platformFeePercent}%`
                    : "Default (20%)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe Connected</span>
                <span className="font-medium text-foreground">
                  {user.stripeConnectOnboarded ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creator Tiers */}
      {user.isCreator && typedTiers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Subscription Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {typedTiers.map((tier: UserTier) => (
                <div
                  key={tier.id}
                  className="rounded-lg border border-border/50 p-4"
                >
                  <p className="font-semibold text-foreground">{tier.name}</p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    ${tier.price.toFixed(2)}/mo
                  </p>
                  {tier.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {tier.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No transactions found for this user.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">With</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx: UserTransaction) => {
                    const isIncoming = tx.receiverId === user.id;
                    const otherParty = isIncoming
                      ? (tx.sender?.displayName || tx.sender?.username || "System")
                      : (tx.receiver.displayName || tx.receiver.username || "Unknown");

                    return (
                      <tr key={tx.id} className="border-b border-border/50">
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-xs">
                            {tx.type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-foreground">
                          {isIncoming ? "From " : "To "}
                          {otherParty}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-foreground">
                          {isIncoming ? "+" : "-"}${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              tx.status === "COMPLETED"
                                ? "success"
                                : tx.status === "FAILED"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {tx.status}
                          </Badge>
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

      {/* Recent Posts (if creator) */}
      {user.isCreator && recentPosts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPosts.map((post: UserPost) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm text-foreground line-clamp-1">
                      {post.caption || "No caption"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(post.createdAt)} &middot; {post._count.likes} likes &middot;{" "}
                      {post._count.comments} comments
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-3 text-xs">
                    {post.visibility}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
