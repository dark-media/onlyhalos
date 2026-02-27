// ============================================================================
// Creator Dashboard Home
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus,
  BarChart3,
  Layers,
  ArrowRight,
  CreditCard,
  Heart,
  ShoppingBag,
  UserPlus,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatorStats } from "@/components/creator/creator-stats";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Creator Dashboard | OnlyHalos",
  description: "Manage your content, earnings, and subscribers.",
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const RECENT_ACTIVITY = [
  {
    id: "1",
    type: "subscription" as const,
    description: "New subscriber @graceful_sarah",
    amount: 9.99,
    time: "2 minutes ago",
  },
  {
    id: "2",
    type: "tip" as const,
    description: "Tip from @blessed_james",
    amount: 25.0,
    time: "15 minutes ago",
  },
  {
    id: "3",
    type: "ppv" as const,
    description: "PPV purchase by @faithful_anna",
    amount: 14.99,
    time: "32 minutes ago",
  },
  {
    id: "4",
    type: "subscription" as const,
    description: "New subscriber @hope_walker",
    amount: 19.99,
    time: "1 hour ago",
  },
  {
    id: "5",
    type: "tip" as const,
    description: "Tip from @spirit_mike",
    amount: 10.0,
    time: "1 hour ago",
  },
  {
    id: "6",
    type: "subscription" as const,
    description: "Renewal from @praise_nina",
    amount: 9.99,
    time: "2 hours ago",
  },
  {
    id: "7",
    type: "ppv" as const,
    description: "PPV purchase by @joyful_david",
    amount: 14.99,
    time: "3 hours ago",
  },
  {
    id: "8",
    type: "tip" as const,
    description: "Tip from @mercy_rachel",
    amount: 50.0,
    time: "4 hours ago",
  },
  {
    id: "9",
    type: "subscription" as const,
    description: "New subscriber @light_bearer",
    amount: 9.99,
    time: "5 hours ago",
  },
  {
    id: "10",
    type: "tip" as const,
    description: "Tip from @glory_thomas",
    amount: 15.0,
    time: "6 hours ago",
  },
];

const ACTIVITY_ICONS = {
  subscription: UserPlus,
  tip: Heart,
  ppv: ShoppingBag,
} as const;

const ACTIVITY_COLORS = {
  subscription: "text-halo-gold bg-halo-gold/10",
  tip: "text-halo-amber bg-halo-amber/10",
  ppv: "text-halo-bronze bg-halo-bronze/10",
} as const;

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    label: "Create Post",
    href: "/posts/new",
    icon: Plus,
    description: "Share new content",
  },
  {
    label: "View Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Track performance",
  },
  {
    label: "Manage Tiers",
    href: "/tiers",
    icon: Layers,
    description: "Edit subscription tiers",
  },
];

// ---------------------------------------------------------------------------
// Mini earnings data for the sparkline-style display
// ---------------------------------------------------------------------------

const MINI_EARNINGS = [
  { day: "Mon", amount: 185 },
  { day: "Tue", amount: 220 },
  { day: "Wed", amount: 195 },
  { day: "Thu", amount: 310 },
  { day: "Fri", amount: 275 },
  { day: "Sat", amount: 340 },
  { day: "Sun", amount: 290 },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CreatorDashboardPage() {
  const maxEarning = Math.max(...MINI_EARNINGS.map((e) => e.amount));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here is an overview of your creator account.
        </p>
      </div>

      {/* Stats Cards */}
      <CreatorStats />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Mini Earnings Chart */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">This Week&apos;s Earnings</CardTitle>
              <Link
                href="/earnings"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2">
                {MINI_EARNINGS.map((entry) => {
                  const height = Math.max(
                    8,
                    (entry.amount / maxEarning) * 120,
                  );
                  return (
                    <div
                      key={entry.day}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span className="text-xs font-medium text-foreground">
                        ${entry.amount}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-gold-gradient transition-all hover:opacity-80"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-2xs text-muted-foreground">
                        {entry.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link
                href="/earnings"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                See all transactions
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/50">
                {RECENT_ACTIVITY.map((activity) => {
                  const ActivityIcon = ACTIVITY_ICONS[activity.type];
                  const colorClass = ACTIVITY_COLORS[activity.type];

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            colorClass,
                          )}
                        >
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-halo-gold">
                        +${activity.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="group flex items-center gap-4 rounded-lg border border-border/50 bg-dark-100 p-4 transition-all hover:border-primary/50 hover:shadow-gold-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {action.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Payout Summary Card */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Next Payout</CardTitle>
              <Badge variant="premium">March 1</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-gold-gradient p-4">
                <p className="text-xs font-medium text-primary-foreground/80">
                  Estimated Amount
                </p>
                <p className="mt-1 text-2xl font-bold text-primary-foreground">
                  $3,842.25
                </p>
              </div>
              <Link href="/payouts">
                <Button variant="outline" className="w-full" size="sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Payouts
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Content Overview Card */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base">Content Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Published Posts
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    342
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Scheduled Posts
                  </span>
                  <span className="text-sm font-medium text-foreground">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Draft Posts
                  </span>
                  <span className="text-sm font-medium text-foreground">7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Views (30d)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    48.2K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg. Likes/Post
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    127
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
