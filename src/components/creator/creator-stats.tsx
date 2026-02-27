// ============================================================================
// Creator Stats Cards
// ============================================================================

import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatCard {
  label: string;
  value: string;
  icon: "dollar" | "users" | "file" | "activity";
  trend: number; // percentage change, e.g. +12.5 or -3.2
  trendLabel?: string;
}

export interface CreatorStatsProps {
  stats?: StatCard[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Icon Map
// ---------------------------------------------------------------------------

const ICON_MAP = {
  dollar: DollarSign,
  users: Users,
  file: FileText,
  activity: Activity,
} as const;

// ---------------------------------------------------------------------------
// Default mock data
// ---------------------------------------------------------------------------

const DEFAULT_STATS: StatCard[] = [
  {
    label: "Total Earnings",
    value: "$12,847.50",
    icon: "dollar",
    trend: 18.2,
    trendLabel: "vs last month",
  },
  {
    label: "Active Subscribers",
    value: "1,284",
    icon: "users",
    trend: 7.4,
    trendLabel: "vs last month",
  },
  {
    label: "Total Posts",
    value: "342",
    icon: "file",
    trend: 12.0,
    trendLabel: "vs last month",
  },
  {
    label: "Engagement Rate",
    value: "24.8%",
    icon: "activity",
    trend: -2.1,
    trendLabel: "vs last month",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreatorStats({
  stats = DEFAULT_STATS,
  className,
}: CreatorStatsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat) => {
        const Icon = ICON_MAP[stat.icon];
        const isPositive = stat.trend >= 0;

        return (
          <Card key={stat.label} variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    isPositive
                      ? "bg-halo-gold/10 text-halo-gold"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {stat.trend}%
                </div>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>

              {stat.trendLabel && (
                <p className="mt-2 text-xs text-muted-foreground/70">
                  {stat.trendLabel}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
