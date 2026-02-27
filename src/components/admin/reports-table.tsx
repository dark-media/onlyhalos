"use client";

// ============================================================================
// Admin Reports Moderation Table
// ============================================================================

import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Flag,
} from "lucide-react";

import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  reportedPostId: string | null;
  reason: string;
  description: string | null;
  status: string;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: ReportUser;
  reportedUser: ReportUser | null;
}

interface ReportsResponse {
  reports: AdminReport[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "default" },
  REVIEWING: { label: "Reviewing", variant: "secondary" },
  RESOLVED: { label: "Resolved", variant: "success" },
  DISMISSED: { label: "Dismissed", variant: "outline" },
};

const REASON_BADGE_MAP: Record<string, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
  SPAM: { label: "Spam", variant: "secondary" },
  HARASSMENT: { label: "Harassment", variant: "destructive" },
  INAPPROPRIATE_CONTENT: { label: "Inappropriate", variant: "destructive" },
  UNDERAGE: { label: "Underage", variant: "destructive" },
  IMPERSONATION: { label: "Impersonation", variant: "secondary" },
  COPYRIGHT: { label: "Copyright", variant: "secondary" },
  OTHER: { label: "Other", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportsTable() {
  const [reports, setReports] = React.useState<AdminReport[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [reasonFilter, setReasonFilter] = React.useState("ALL");

  // Resolve dialog
  const [resolveTarget, setResolveTarget] = React.useState<AdminReport | null>(null);
  const [resolveNote, setResolveNote] = React.useState("");
  const [resolveAction, setResolveAction] = React.useState<"resolve" | "dismiss">("resolve");
  const [banUser, setBanUser] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Detail dialog
  const [detailReport, setDetailReport] = React.useState<AdminReport | null>(null);

  // Fetch reports
  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (reasonFilter !== "ALL") params.set("reason", reasonFilter);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reports");

      const data: ReportsResponse = await res.json();
      setReports(data.reports);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, reasonFilter]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle resolve/dismiss
  async function handleResolve() {
    if (!resolveTarget) return;
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        status: resolveAction === "resolve" ? "RESOLVED" : "DISMISSED",
        adminNote: resolveNote || undefined,
      };
      if (banUser && resolveTarget.reportedUserId) {
        body.banReportedUser = true;
      }

      const res = await fetch(`/api/admin/reports/${resolveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      toast.success(
        resolveAction === "resolve"
          ? "Report resolved successfully"
          : "Report dismissed",
      );
      setResolveTarget(null);
      setResolveNote("");
      setBanUser(false);
      fetchReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWING">Reviewing</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Reasons</SelectItem>
              <SelectItem value="SPAM">Spam</SelectItem>
              <SelectItem value="HARASSMENT">Harassment</SelectItem>
              <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate</SelectItem>
              <SelectItem value="UNDERAGE">Underage</SelectItem>
              <SelectItem value="IMPERSONATION">Impersonation</SelectItem>
              <SelectItem value="COPYRIGHT">Copyright</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground sm:ml-auto">
          {total} report{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Reporter</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Reported</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No reports found matching your filters.
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const reasonBadge = REASON_BADGE_MAP[report.reason] ?? { label: report.reason, variant: "outline" as const };
                const statusBadge = STATUS_BADGE_MAP[report.status] ?? { label: report.status, variant: "outline" as const };
                const reporterName = report.reporter.displayName || report.reporter.username || "Unknown";
                const reportedName = report.reportedUser
                  ? (report.reportedUser.displayName || report.reportedUser.username || "Unknown")
                  : report.reportedPostId
                    ? `Post #${report.reportedPostId.slice(0, 8)}`
                    : "Unknown";

                return (
                  <tr
                    key={report.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {report.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {report.reporter.avatarUrl && (
                            <AvatarImage src={report.reporter.avatarUrl} alt={reporterName} />
                          )}
                          <AvatarFallback>{getInitials(reporterName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-foreground">{reporterName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {report.reportedUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {report.reportedUser.avatarUrl && (
                              <AvatarImage src={report.reportedUser.avatarUrl} alt={reportedName} />
                            )}
                            <AvatarFallback>{getInitials(reportedName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-foreground">{reportedName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{reportedName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={reasonBadge.variant}>{reasonBadge.label}</Badge>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-muted-foreground">
                        {report.description || "--"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDetailReport(report)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {report.status === "PENDING" || report.status === "REVIEWING" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setResolveTarget(report);
                                  setResolveAction("resolve");
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Resolve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setResolveTarget(report);
                                  setResolveAction("dismiss");
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Dismiss
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Detail Dialog */}
      <DialogRoot open={!!detailReport} onOpenChange={(open) => !open && setDetailReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Report ID</p>
                  <p className="font-mono text-foreground">{detailReport.id.slice(0, 12)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_BADGE_MAP[detailReport.status]?.variant ?? "outline"}>
                    {STATUS_BADGE_MAP[detailReport.status]?.label ?? detailReport.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <Badge variant={REASON_BADGE_MAP[detailReport.reason]?.variant ?? "outline"}>
                    {REASON_BADGE_MAP[detailReport.reason]?.label ?? detailReport.reason}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Filed</p>
                  <p className="text-foreground">{formatDate(detailReport.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground">Reporter</p>
                <p className="text-foreground">
                  {detailReport.reporter.displayName || detailReport.reporter.username || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Reported</p>
                <p className="text-foreground">
                  {detailReport.reportedUser
                    ? (detailReport.reportedUser.displayName || detailReport.reportedUser.username || "Unknown")
                    : detailReport.reportedPostId
                      ? `Post #${detailReport.reportedPostId.slice(0, 8)}`
                      : "Unknown"}
                </p>
              </div>

              {detailReport.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap text-foreground">{detailReport.description}</p>
                </div>
              )}

              {detailReport.adminNote && (
                <div>
                  <p className="text-muted-foreground">Admin Note</p>
                  <p className="whitespace-pre-wrap text-foreground">{detailReport.adminNote}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Resolve/Dismiss Dialog */}
      <DialogRoot
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolveNote("");
            setBanUser(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveAction === "resolve" ? "Resolve Report" : "Dismiss Report"}
            </DialogTitle>
            <DialogDescription>
              {resolveAction === "resolve"
                ? "Mark this report as resolved. You can optionally add a note and ban the reported user."
                : "Dismiss this report as unfounded. You can optionally add a note."}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Admin note (optional)..."
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            maxCharacters={1000}
          />

          {resolveAction === "resolve" && resolveTarget?.reportedUserId && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={banUser}
                onChange={(e) => setBanUser(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
              />
              <span className="text-destructive">Also ban the reported user</span>
            </label>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={actionLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={resolveAction === "resolve" ? "default" : "secondary"}
              loading={actionLoading}
              onClick={handleResolve}
            >
              {resolveAction === "resolve" ? "Resolve" : "Dismiss"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
