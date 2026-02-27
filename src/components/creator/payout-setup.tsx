"use client";

// ============================================================================
// Payout Setup - Stripe Connect onboarding & payout management
// ============================================================================

import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  CreditCard,
  Shield,
  Clock,
  DollarSign,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  stripePayoutId: string;
}

export interface PayoutSetupProps {
  isOnboarded?: boolean;
  pendingAmount?: number;
  availableBalance?: number;
  payoutHistory?: PayoutRecord[];
  stripeDashboardUrl?: string;
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

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  completed: {
    className: "bg-success/10 text-success border-success/20",
    label: "Completed",
  },
  pending: {
    className: "bg-halo-gold/10 text-halo-gold border-halo-gold/20",
    label: "Pending",
  },
  failed: {
    className: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Failed",
  },
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PAYOUT_HISTORY: PayoutRecord[] = [
  {
    id: "1",
    date: "Feb 15, 2026",
    amount: 3842.25,
    status: "completed",
    stripePayoutId: "po_1NqRSTuvwxYZ",
  },
  {
    id: "2",
    date: "Jan 15, 2026",
    amount: 3076.8,
    status: "completed",
    stripePayoutId: "po_1MpQRSabcDEF",
  },
  {
    id: "3",
    date: "Dec 15, 2025",
    amount: 2945.6,
    status: "completed",
    stripePayoutId: "po_1LoNOPghiJKL",
  },
  {
    id: "4",
    date: "Nov 15, 2025",
    amount: 2410.0,
    status: "completed",
    stripePayoutId: "po_1KnMNOmnoPQR",
  },
  {
    id: "5",
    date: "Mar 1, 2026",
    amount: 4285.0,
    status: "pending",
    stripePayoutId: "po_1OrSTUstuvWX",
  },
];

// ---------------------------------------------------------------------------
// Onboarding Steps
// ---------------------------------------------------------------------------

const ONBOARDING_STEPS = [
  {
    icon: CreditCard,
    title: "Connect your bank account",
    description: "Link a bank account or debit card to receive payouts.",
  },
  {
    icon: Shield,
    title: "Verify your identity",
    description: "Complete identity verification as required by Stripe.",
  },
  {
    icon: DollarSign,
    title: "Start earning",
    description: "Payouts are processed bi-monthly on the 1st and 15th.",
  },
];

// ---------------------------------------------------------------------------
// Component: Not Onboarded
// ---------------------------------------------------------------------------

function OnboardingCard() {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    // In a real app, this would call an API to create a Stripe Connect onboarding link
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    // window.location.href = onboardingUrl;
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">Set Up Payouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Connect your Stripe account to start receiving payouts for your
          earnings. The setup takes about 5 minutes.
        </p>

        <div className="space-y-4">
          {ONBOARDING_STEPS.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {idx + 1}. {step.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleSetup} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Connect with Stripe
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-2xs text-muted-foreground/60">
          Powered by Stripe. Your financial information is encrypted and secure.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: Onboarded
// ---------------------------------------------------------------------------

function OnboardedCard({
  availableBalance = 4285.0,
  pendingAmount = 0,
  stripeDashboardUrl = "#",
}: {
  availableBalance?: number;
  pendingAmount?: number;
  stripeDashboardUrl?: string;
}) {
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Payouts Active</CardTitle>
        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Connected
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-dark-100 p-4">
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatCurrency(availableBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-dark-100 p-4">
            <p className="text-xs text-muted-foreground">Pending Payouts</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatCurrency(pendingAmount)}
            </p>
            {pendingAmount > 0 && (
              <div className="mt-1 flex items-center gap-1 text-xs text-halo-gold">
                <Clock className="h-3 w-3" />
                Processing
              </div>
            )}
          </div>
        </div>

        <a
          href={stripeDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Open Stripe Express Dashboard
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: Payout History Table
// ---------------------------------------------------------------------------

function PayoutHistoryTable({ history }: { history: PayoutRecord[] }) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">Payout History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No payouts yet. Your first payout will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Stripe Payout ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {history.map((payout) => {
                  const style = STATUS_STYLES[payout.status];
                  return (
                    <tr key={payout.id} className="group">
                      <td className="py-3 pr-4 text-foreground">
                        {payout.date}
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            style.className,
                          )}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {payout.stripePayoutId}
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
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PayoutSetup({
  isOnboarded = true,
  pendingAmount = 4285.0,
  availableBalance = 4285.0,
  payoutHistory = MOCK_PAYOUT_HISTORY,
  stripeDashboardUrl = "#",
  className,
}: PayoutSetupProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {isOnboarded ? (
        <OnboardedCard
          availableBalance={availableBalance}
          pendingAmount={pendingAmount}
          stripeDashboardUrl={stripeDashboardUrl}
        />
      ) : (
        <OnboardingCard />
      )}
      <PayoutHistoryTable history={payoutHistory} />
    </div>
  );
}
