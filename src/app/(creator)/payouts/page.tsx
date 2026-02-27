"use client";

// ============================================================================
// Payouts Page - Stripe Connect management and payout history
// ============================================================================

import React from "react";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PayoutSetup } from "@/components/creator/payout-setup";
import { cn } from "@/lib/utils";

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

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PayoutsPage() {
  // In a real app these would come from an API / server component
  const isOnboarded = true;
  const availableBalance = 4285.0;
  const pendingAmount = 4285.0;
  const lifetimeEarnings = 38420.15;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your payment settings and view payout history.
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(availableBalance)}
              </p>
              <p className="text-sm text-muted-foreground">Available Balance</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-halo-gold/10">
              <Clock className="h-6 w-6 text-halo-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(pendingAmount)}
              </p>
              <p className="text-sm text-muted-foreground">Pending Payout</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1 rounded-full bg-halo-gold/10 px-2 py-0.5 text-xs font-medium text-halo-gold">
                <Clock className="h-3 w-3" />
                Mar 1
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(lifetimeEarnings)}
              </p>
              <p className="text-sm text-muted-foreground">Lifetime Earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Setup / Management + History */}
      <PayoutSetup
        isOnboarded={isOnboarded}
        availableBalance={availableBalance}
        pendingAmount={pendingAmount}
      />

      {/* Additional Info Card */}
      <Card variant="glass">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">
            How Payouts Work
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Earnings Accumulate
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Revenue from subscriptions, tips, and PPV purchases is
                  tracked throughout the billing period.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Platform Fee Deducted
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A 15% platform fee is deducted from gross earnings. You keep
                  85% of all revenue.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Bi-Monthly Payouts
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Payouts are processed on the 1st and 15th of each month via
                  Stripe to your connected bank account.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
