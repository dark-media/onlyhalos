"use client";

// ============================================================================
// Admin Transaction Monitoring Table
// ============================================================================

import * as React from "react";
import { toast } from "sonner";
import { Search, DollarSign } from "lucide-react";

import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TransactionUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AdminTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  description: string | null;
  createdAt: string;
  sender: TransactionUser | null;
  receiver: TransactionUser;
}

interface TransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  totalPages: number;
  totals: {
    totalAmount: number;
    totalPlatformFee: number;
    totalNet: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  SUBSCRIPTION: { label: "Subscription", variant: "default" },
  TIP: { label: "Tip", variant: "success" },
  PPV_PURCHASE: { label: "PPV", variant: "secondary" },
  PAYOUT: { label: "Payout", variant: "outline" },
  REFUND: { label: "Refund", variant: "destructive" },
};

const STATUS_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransactionTable() {
  const [transactions, setTransactions] = React.useState<AdminTransaction[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [totals, setTotals] = React.useState({ totalAmount: 0, totalPlatformFee: 0, totalNet: 0 });

  // Filters
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Fetch transactions
  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");

      const data: TransactionsResponse = await res.json();
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setTotals(data.totals);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, statusFilter, dateFrom, dateTo]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Volume</p>
            <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totals.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Platform Fees</p>
            <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(totals.totalPlatformFee)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Net to Creators</p>
            <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totals.totalNet)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
            <SelectItem value="TIP">Tip</SelectItem>
            <SelectItem value="PPV_PURCHASE">PPV</SelectItem>
            <SelectItem value="PAYOUT">Payout</SelectItem>
            <SelectItem value="REFUND">Refund</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-[150px]"
            placeholder="From"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-[150px]"
            placeholder="To"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} transaction{total !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Sender</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Receiver</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">Fee</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No transactions found matching your filters.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const typeBadge = TYPE_BADGE_MAP[tx.type] ?? { label: tx.type, variant: "outline" as const };
                const statusBadge = STATUS_BADGE_MAP[tx.status] ?? { label: tx.status, variant: "outline" as const };
                const senderName = tx.sender
                  ? (tx.sender.displayName || tx.sender.username || "Unknown")
                  : "System";
                const receiverName = tx.receiver.displayName || tx.receiver.username || "Unknown";

                return (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {tx.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {tx.sender ? (
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {tx.sender.avatarUrl && (
                              <AvatarImage src={tx.sender.avatarUrl} alt={senderName} />
                            )}
                            <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-foreground">{senderName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {tx.receiver.avatarUrl && (
                            <AvatarImage src={tx.receiver.avatarUrl} alt={receiverName} />
                          )}
                          <AvatarFallback>{getInitials(receiverName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-foreground">{receiverName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary">
                      {formatCurrency(tx.platformFee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                      {formatCurrency(tx.netAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Totals Footer */}
          {!loading && transactions.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-muted/30">
                <td colSpan={5} className="px-4 py-3 text-right font-semibold text-foreground">
                  Page Totals
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-foreground">
                  {formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-primary">
                  {formatCurrency(transactions.reduce((sum, tx) => sum + tx.platformFee, 0))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-foreground">
                  {formatCurrency(transactions.reduce((sum, tx) => sum + tx.netAmount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
