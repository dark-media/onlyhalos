"use client";

// ============================================================================
// Subscribers Management Page
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Search,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Crown,
  Star,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { cn, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubscriptionTier = "basic" | "premium" | "vip";
type SubscriptionStatus = "active" | "expired" | "cancelled";
type SortOption = "newest" | "oldest" | "highest";

interface Subscriber {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  subscribedSince: string;
  status: SubscriptionStatus;
  amountPerMonth: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<
  SubscriptionTier,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    badgeVariant: "default" | "secondary" | "premium";
  }
> = {
  basic: {
    label: "Basic",
    icon: Star,
    className: "bg-dark-300 text-muted-foreground",
    badgeVariant: "secondary",
  },
  premium: {
    label: "Premium",
    icon: Crown,
    className: "bg-halo-gold/10 text-halo-gold",
    badgeVariant: "default",
  },
  vip: {
    label: "VIP",
    icon: Sparkles,
    className: "bg-gold-gradient text-primary-foreground",
    badgeVariant: "premium",
  },
};

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  expired: {
    label: "Expired",
    className: "bg-dark-400 text-muted-foreground border-dark-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Sarah", "James", "Anna", "Michael", "Rachel", "David", "Nina",
  "Thomas", "Lily", "Daniel", "Grace", "Peter", "Emma", "John",
  "Sophia", "Andrew", "Maria", "Luke", "Hannah", "Mark", "Ruth",
  "Paul", "Esther", "Matthew", "Rebecca", "Joseph", "Naomi", "Samuel",
  "Abigail", "Benjamin", "Martha", "Isaac", "Elizabeth", "Joshua",
  "Mary", "Caleb", "Deborah", "Elijah", "Lydia", "Noah",
];

const LAST_NAMES = [
  "Walker", "Stone", "Light", "Faith", "Spirit", "Grace", "Hope",
  "Joy", "Peace", "Love", "Cross", "Haven", "Angel", "Bright",
  "Divine", "Holy", "Sacred", "Blessed", "Pure", "Gentle",
];

function generateSubscribers(): Subscriber[] {
  const tiers: SubscriptionTier[] = ["basic", "basic", "basic", "premium", "premium", "vip"];
  const statuses: SubscriptionStatus[] = ["active", "active", "active", "active", "expired", "cancelled"];
  const tierPrices: Record<SubscriptionTier, number> = {
    basic: 9.99,
    premium: 19.99,
    vip: 49.99,
  };

  const subscribers: Subscriber[] = [];
  const now = new Date();

  for (let i = 0; i < 64; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${Math.floor(Math.random() * 99)}`;
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const daysAgo = Math.floor(Math.random() * 365) + 1;
    const subDate = new Date(now);
    subDate.setDate(subDate.getDate() - daysAgo);

    subscribers.push({
      id: `sub_${i}`,
      name,
      username: `@${username}`,
      tier,
      subscribedSince: subDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status,
      amountPerMonth: tierPrices[tier],
    });
  }

  return subscribers;
}

const ALL_SUBSCRIBERS = generateSubscribers();

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 12;

export default function SubscribersPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = ALL_SUBSCRIBERS;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q),
      );
    }

    if (tierFilter !== "all") {
      result = result.filter((s) => s.tier === tierFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.subscribedSince).getTime() - new Date(a.subscribedSince).getTime();
        case "oldest":
          return new Date(a.subscribedSince).getTime() - new Date(b.subscribedSince).getTime();
        case "highest":
          return b.amountPerMonth - a.amountPerMonth;
        default:
          return 0;
      }
    });

    return result;
  }, [search, tierFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // Summary stats
  const activeCount = ALL_SUBSCRIBERS.filter((s) => s.status === "active").length;
  const totalMRR = ALL_SUBSCRIBERS.filter((s) => s.status === "active").reduce(
    (s, sub) => s + sub.amountPerMonth,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Subscribers</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and view your subscriber community.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {ALL_SUBSCRIBERS.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-halo-gold">
              <TrendingUp className="h-3 w-3" />
              +7.4%
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {activeCount}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {Math.round((activeCount / ALL_SUBSCRIBERS.length) * 100)}% retention
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-halo-gold/10">
              <Crown className="h-6 w-6 text-halo-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                ${totalMRR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Table */}
      <Card variant="glass">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All Subscribers</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-[260px] pl-9"
              />
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <div className="border-t border-border/50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tier filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tier</label>
              <div className="flex gap-1">
                {(["all", "basic", "premium", "vip"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTierFilter(t);
                      setPage(1);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      tierFilter === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-dark-200 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <div className="flex gap-1">
                {(["all", "active", "expired", "cancelled"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        statusFilter === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-dark-200 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s === "all"
                        ? "All"
                        : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Sort by</label>
              <div className="flex gap-1">
                {(
                  [
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "highest", label: "Highest Tier" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setPage(1);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      sortBy === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-dark-200 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <CardContent>
          {paginated.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No subscribers found matching your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Subscriber</th>
                    <th className="pb-3 pr-4 font-medium">Tier</th>
                    <th className="pb-3 pr-4 font-medium">Subscribed Since</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">
                      Amount/month
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginated.map((sub) => {
                    const tierConf = TIER_CONFIG[sub.tier];
                    const statusConf = STATUS_CONFIG[sub.status];
                    const TierIcon = tierConf.icon;

                    return (
                      <tr key={sub.id} className="group hover:bg-dark-50/50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              {sub.avatarUrl ? (
                                <AvatarImage
                                  src={sub.avatarUrl}
                                  alt={sub.name}
                                />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {getInitials(sub.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {sub.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sub.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={tierConf.badgeVariant}>
                            <TierIcon className="mr-1 h-3 w-3" />
                            {tierConf.label}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-sm text-muted-foreground">
                          {sub.subscribedSince}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              statusConf.className,
                            )}
                          >
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 text-right text-sm font-medium text-foreground">
                          ${sub.amountPerMonth.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}
                {" - "}
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} subscribers
              </p>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
