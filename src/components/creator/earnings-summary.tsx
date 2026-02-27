"use client";

// ============================================================================
// Earnings Summary - Breakdown of creator earnings
// ============================================================================

import React from "react";
import {
  DollarSign,
  CreditCard,
  Heart,
  ShoppingBag,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EarningsBreakdown {
  subscriptions: number;
  tips: number;
  ppv: number;
}

export interface EarningsSummaryProps {
  currentMonthTotal?: number;
  breakdown?: EarningsBreakdown;
  lastMonthTotal?: number;
  nextPayoutDate?: string;
  nextPayoutAmount?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BreakdownRow({
  icon: Icon,
  label,
  amount,
  percentage,
}: {
  icon: React.ElementType;
  label: string;
  amount: number;
  percentage: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EarningsSummary({
  currentMonthTotal = 4285.0,
  breakdown = { subscriptions: 2890.0, tips: 845.5, ppv: 549.5 },
  lastMonthTotal = 3620.0,
  nextPayoutDate = "March 1, 2026",
  nextPayoutAmount = 3842.25,
  className,
}: EarningsSummaryProps) {
  const percentChange = calcPercentChange(currentMonthTotal, lastMonthTotal);
  const isPositive = percentChange >= 0;
  const total = breakdown.subscriptions + breakdown.tips + breakdown.ppv;

  const subPercent = total > 0 ? Math.round((breakdown.subscriptions / total) * 100) : 0;
  const tipPercent = total > 0 ? Math.round((breakdown.tips / total) * 100) : 0;
  const ppvPercent = total > 0 ? Math.round((breakdown.ppv / total) * 100) : 0;

  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-2", className)}>
      {/* Current Month Earnings */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total with gold gradient */}
          <div className="rounded-xl bg-gold-gradient p-6">
            <p className="text-sm font-medium text-primary-foreground/80">
              Current Month Earnings
            </p>
            <p className="mt-1 text-3xl font-bold text-primary-foreground">
              {formatCurrency(currentMonthTotal)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  isPositive
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-destructive/30 text-white",
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {percentChange}%
              </div>
              <span className="text-xs text-primary-foreground/70">
                vs last month ({formatCurrency(lastMonthTotal)})
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-1 divide-y divide-border/50">
            <BreakdownRow
              icon={CreditCard}
              label="Subscriptions"
              amount={breakdown.subscriptions}
              percentage={subPercent}
            />
            <BreakdownRow
              icon={Heart}
              label="Tips"
              amount={breakdown.tips}
              percentage={tipPercent}
            />
            <BreakdownRow
              icon={ShoppingBag}
              label="PPV Purchases"
              amount={breakdown.ppv}
              percentage={ppvPercent}
            />
          </div>
        </CardContent>
      </Card>

      {/* Next Payout */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Next Payout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-border bg-dark-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(nextPayoutAmount)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Scheduled for {nextPayoutDate}</span>
            </div>
          </div>

          {/* Mini progress bars for breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">
              Revenue Distribution
            </h4>

            {/* Stacked bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-dark-300">
              <div className="flex h-full">
                <div
                  className="bg-halo-gold transition-all"
                  style={{ width: `${subPercent}%` }}
                />
                <div
                  className="bg-halo-amber transition-all"
                  style={{ width: `${tipPercent}%` }}
                />
                <div
                  className="bg-halo-bronze transition-all"
                  style={{ width: `${ppvPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-halo-gold" />
                Subscriptions ({subPercent}%)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-halo-amber" />
                Tips ({tipPercent}%)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-halo-bronze" />
                PPV ({ppvPercent}%)
              </div>
            </div>
          </div>

          {/* Platform fee note */}
          <div className="rounded-lg border border-border/50 bg-dark-50 p-4">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5 shrink-0">
                Note
              </Badge>
              <p className="text-xs text-muted-foreground">
                Platform fee of 15% is deducted from gross earnings. The payout
                amount shown is after fees.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
