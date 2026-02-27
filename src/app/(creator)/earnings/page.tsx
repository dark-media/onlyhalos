"use client";

// ============================================================================
// Earnings Page - Transaction history with filters and export
// ============================================================================

import React, { useState, useMemo, useCallback } from "react";
import {
  Download,
  Search,
  Filter,
  CreditCard,
  Heart,
  ShoppingBag,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EarningsSummary } from "@/components/creator/earnings-summary";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionType = "subscription" | "tip" | "ppv";
type TransactionStatus = "completed" | "pending" | "refunded";
type SortField = "date" | "gross" | "net";
type SortDir = "asc" | "desc";
type DateRange = "7d" | "30d" | "90d" | "1y" | "all";

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: TransactionStatus;
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

const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  subscription: {
    label: "Subscription",
    icon: CreditCard,
    badgeClass: "bg-halo-gold/10 text-halo-gold border-halo-gold/20",
  },
  tip: {
    label: "Tip",
    icon: Heart,
    badgeClass: "bg-halo-amber/10 text-halo-amber border-halo-amber/20",
  },
  ppv: {
    label: "PPV",
    icon: ShoppingBag,
    badgeClass: "bg-halo-bronze/10 text-halo-bronze border-halo-bronze/20",
  },
};

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  pending: {
    label: "Pending",
    className: "bg-halo-gold/10 text-halo-gold border-halo-gold/20",
  },
  refunded: {
    label: "Refunded",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

// ---------------------------------------------------------------------------
// Mock Transactions
// ---------------------------------------------------------------------------

function generateTransactions(): Transaction[] {
  const types: TransactionType[] = ["subscription", "tip", "ppv"];
  const statuses: TransactionStatus[] = ["completed", "completed", "completed", "pending", "refunded"];
  const names = [
    "graceful_sarah", "blessed_james", "faithful_anna", "hope_walker",
    "spirit_mike", "praise_nina", "joyful_david", "mercy_rachel",
    "light_bearer", "glory_thomas", "peace_lily", "faith_stone",
    "divine_grace", "holy_spirit", "angel_wings", "pure_heart",
    "sacred_joy", "gentle_soul", "bright_star", "heavenly_voice",
  ];

  const transactions: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < 87; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - i * 4 - Math.floor(Math.random() * 8));
    const type = types[Math.floor(Math.random() * types.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let grossAmount: number;
    let description: string;

    switch (type) {
      case "subscription":
        grossAmount = [9.99, 19.99, 49.99][Math.floor(Math.random() * 3)];
        description = `Subscription from @${name}`;
        break;
      case "tip":
        grossAmount = [5, 10, 15, 25, 50, 100][Math.floor(Math.random() * 6)];
        description = `Tip from @${name}`;
        break;
      case "ppv":
        grossAmount = [4.99, 9.99, 14.99, 24.99][Math.floor(Math.random() * 4)];
        description = `PPV purchase by @${name}`;
        break;
    }

    const platformFee = Math.round(grossAmount * 0.15 * 100) / 100;
    const netAmount = Math.round((grossAmount - platformFee) * 100) / 100;

    transactions.push({
      id: `txn_${i}`,
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      type,
      description,
      grossAmount,
      platformFee,
      netAmount,
      status,
    });
  }

  return transactions;
}

const ALL_TRANSACTIONS = generateTransactions();

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 15;

export default function EarningsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter transactions
  const filtered = useMemo(() => {
    let result = ALL_TRANSACTIONS;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.type.includes(q),
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Date range filtering
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (dateRange) {
        case "7d":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "30d":
          cutoff.setDate(now.getDate() - 30);
          break;
        case "90d":
          cutoff.setDate(now.getDate() - 90);
          break;
        case "1y":
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      result = result.filter((t) => new Date(t.date) >= cutoff);
    }

    return result;
  }, [search, typeFilter, dateRange]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // Totals
  const totalGross = filtered.reduce((s, t) => s + t.grossAmount, 0);
  const totalFees = filtered.reduce((s, t) => s + t.platformFee, 0);
  const totalNet = filtered.reduce((s, t) => s + t.netAmount, 0);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      "Date",
      "Type",
      "Description",
      "Gross Amount",
      "Platform Fee",
      "Net Amount",
      "Status",
    ];
    const rows = filtered.map((t) => [
      t.date,
      t.type,
      t.description,
      t.grossAmount.toFixed(2),
      t.platformFee.toFixed(2),
      t.netAmount.toFixed(2),
      t.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onlyhalos-earnings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
          <p className="mt-1 text-muted-foreground">
            Track your earnings and transaction history.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Earnings Summary */}
      <EarningsSummary />

      {/* Transaction History */}
      <Card variant="glass">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-[220px] pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Filter Bar */}
        {showFilters && (
          <div className="border-t border-border/50 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type filter */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <div className="flex gap-1">
                  {(
                    ["all", "subscription", "tip", "ppv"] as const
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        typeFilter === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-dark-200 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t === "all" ? "All" : t === "ppv" ? "PPV" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Date Range
                </label>
                <div className="flex gap-1">
                  {(["7d", "30d", "90d", "1y", "all"] as const).map(
                    (d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDateRange(d);
                          setPage(1);
                        }}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                          dateRange === d
                            ? "bg-primary text-primary-foreground"
                            : "bg-dark-200 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {d === "all" ? "All Time" : d.toUpperCase()}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent>
          {/* Summary bar */}
          <div className="mb-4 flex flex-wrap gap-4 rounded-lg bg-dark-100 p-3 text-xs">
            <div>
              <span className="text-muted-foreground">Transactions: </span>
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Gross: </span>
              <span className="font-medium text-foreground">
                {formatCurrency(totalGross)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Fees: </span>
              <span className="font-medium text-destructive">
                -{formatCurrency(totalFees)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Net: </span>
              <span className="font-medium text-halo-gold">
                {formatCurrency(totalNet)}
              </span>
            </div>
          </div>

          {/* Table */}
          {paginated.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No transactions found matching your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium text-right">Gross</th>
                    <th className="pb-3 pr-4 font-medium text-right">Fee</th>
                    <th className="pb-3 pr-4 font-medium text-right">Net</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginated.map((txn) => {
                    const typeConf = TYPE_CONFIG[txn.type];
                    const statusConf = STATUS_CONFIG[txn.status];
                    const TypeIcon = typeConf.icon;

                    return (
                      <tr key={txn.id} className="group hover:bg-dark-50/50">
                        <td className="whitespace-nowrap py-3 pr-4 text-xs text-muted-foreground">
                          {txn.date}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              typeConf.badgeClass,
                            )}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {typeConf.label}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate py-3 pr-4 text-sm text-foreground">
                          {txn.description}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right text-sm text-foreground">
                          {formatCurrency(txn.grossAmount)}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right text-sm text-destructive/70">
                          -{formatCurrency(txn.platformFee)}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right text-sm font-medium text-halo-gold">
                          {formatCurrency(txn.netAmount)}
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              statusConf.className,
                            )}
                          >
                            {statusConf.label}
                          </span>
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
                {filtered.length}
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
