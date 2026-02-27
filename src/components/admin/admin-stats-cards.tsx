// ============================================================================
// Admin Platform Stats Cards
// ============================================================================

import {
  Users,
  ShieldCheck,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlatformStats {
  totalUsers: number;
  activeCreators: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalTransactions: number;
  platformEarnings: number;
  userGrowthTrend: number;
  revenueTrend: number;
  creatorTrend: number;
  subscriptionTrend: number;
  transactionTrend: number;
  earningsTrend: number;
}

interface StatCardConfig {
  label: string;
  valueKey: keyof PlatformStats;
  trendKey: keyof PlatformStats;
  icon: LucideIcon;
  format: "number" | "currency";
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const statCards: StatCardConfig[] = [
  {
    label: "Total Users",
    valueKey: "totalUsers",
    trendKey: "userGrowthTrend",
    icon: Users,
    format: "number",
  },
  {
    label: "Active Creators",
    valueKey: "activeCreators",
    trendKey: "creatorTrend",
    icon: ShieldCheck,
    format: "number",
  },
  {
    label: "Active Subscriptions",
    valueKey: "activeSubscriptions",
    trendKey: "subscriptionTrend",
    icon: CreditCard,
    format: "number",
  },
  {
    label: "Monthly Revenue",
    valueKey: "monthlyRevenue",
    trendKey: "revenueTrend",
    icon: DollarSign,
    format: "currency",
  },
  {
    label: "Total Transactions",
    valueKey: "totalTransactions",
    trendKey: "transactionTrend",
    icon: Activity,
    format: "number",
  },
  {
    label: "Platform Earnings",
    valueKey: "platformEarnings",
    trendKey: "earningsTrend",
    icon: TrendingUp,
    format: "currency",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatStatValue(value: number, format: "number" | "currency"): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }

  return new Intl.NumberFormat("en-US").format(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminStatsCards({ stats }: { stats: PlatformStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.valueKey] as number;
        const trend = stats[card.trendKey] as number;
        const isPositive = trend >= 0;

        return (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {formatStatValue(value, card.format)}
                </p>

                <div className="mt-1 flex items-center gap-1">
                  {isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isPositive ? "text-emerald-500" : "text-destructive",
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {trend.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs last period
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
