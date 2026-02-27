"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate, formatPrice } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveSubscription {
  id: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  tierName: string;
  price: number;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Transaction {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  status: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Payment Settings Page
// ---------------------------------------------------------------------------

export default function PaymentSettingsPage() {
  const [subscriptions, setSubscriptions] = React.useState<ActiveSubscription[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loadingSubs, setLoadingSubs] = React.useState(true);
  const [loadingTxns, setLoadingTxns] = React.useState(true);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = React.useState(false);

  // ── Fetch subscriptions ──────────────────────────────────────────
  React.useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/subscriptions/me");
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(data.subscriptions ?? []);
        }
      } catch {
        // Silently fail - empty state will show
      } finally {
        setLoadingSubs(false);
      }
    }
    fetchSubscriptions();
  }, []);

  // ── Fetch transactions ───────────────────────────────────────────
  React.useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/users/me/transactions?limit=20");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions ?? []);
        }
      } catch {
        // Silently fail - empty state will show
      } finally {
        setLoadingTxns(false);
      }
    }
    fetchTransactions();
  }, []);

  // ── Cancel subscription ──────────────────────────────────────────
  async function handleCancel(subscriptionId: string) {
    try {
      setCancellingId(subscriptionId);
      const res = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to cancel subscription.");
      }

      // Update subscription in state
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionId
            ? { ...sub, cancelAtPeriodEnd: true }
            : sub,
        ),
      );

      toast.success("Subscription will be cancelled at the end of the billing period.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  // ── Open Stripe portal ───────────────────────────────────────────
  async function handleManageBilling() {
    try {
      setLoadingPortal(true);
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to open billing portal.");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setLoadingPortal(false);
    }
  }

  // ── Transaction status badge ─────────────────────────────────────
  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return "bg-success/10 text-success border-success/20";
      case "PENDING":
        return "bg-warning/10 text-warning border-warning/20";
      case "FAILED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "REFUNDED":
        return "bg-info/10 text-info border-info/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  }

  // ── Transaction type label ───────────────────────────────────────
  function getTypeLabel(type: string) {
    switch (type) {
      case "SUBSCRIPTION":
        return "Subscription";
      case "TIP":
        return "Tip";
      case "PPV_PURCHASE":
        return "Purchase";
      case "PAYOUT":
        return "Payout";
      case "REFUND":
        return "Refund";
      default:
        return type;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscriptions, view transaction history, and update billing
        </p>
      </div>

      {/* ── Manage Billing Button ────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleManageBilling}
          disabled={loadingPortal}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors",
            "text-foreground hover:bg-dark-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loadingPortal ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Manage Billing
        </button>
      </div>

      {/* ── Active Subscriptions ─────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Active Subscriptions
            </h3>
            <p className="text-xs text-muted-foreground">
              Creators you are currently subscribed to
            </p>
          </div>
        </div>

        {loadingSubs ? (
          <div className="space-y-3 p-5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-dark-200"
              />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t have any active subscriptions.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Explore creators
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-dark-300">
                    {sub.creatorAvatarUrl ? (
                      <img
                        src={sub.creatorAvatarUrl}
                        alt={sub.creatorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
                        {sub.creatorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sub.creatorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.tierName} &middot; {formatPrice(sub.price * 100)}/mo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.cancelAtPeriodEnd
                        ? `Cancels ${formatDate(sub.currentPeriodEnd)}`
                        : `Renews ${formatDate(sub.currentPeriodEnd)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sub.cancelAtPeriodEnd ? (
                    <span className="inline-flex items-center rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                      Cancelling
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCancel(sub.id)}
                      disabled={cancellingId === sub.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                    >
                      {cancellingId === sub.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Transaction History ──────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Transaction History
            </h3>
            <p className="text-xs text-muted-foreground">
              Your recent payments and transactions
            </p>
          </div>
        </div>

        {loadingTxns ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-dark-200"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="text-sm transition-colors hover:bg-dark-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-foreground">
                      {getTypeLabel(txn.type)}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-muted-foreground">
                      {txn.description ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-foreground">
                      {formatPrice(txn.amount * 100)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          getStatusBadge(txn.status),
                        )}
                      >
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
