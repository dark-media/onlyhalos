"use client";

// ============================================================================
// Admin User Management Table
// ============================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  Ban,
  UserCheck,
  Pause,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
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
import { getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  verificationStatus: string;
  isCreator: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "premium" }> = {
  USER: { label: "User", variant: "secondary" },
  CREATOR: { label: "Creator", variant: "default" },
  ADMIN: { label: "Admin", variant: "premium" },
};

const STATUS_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
  BANNED: { label: "Banned", variant: "destructive" },
  DEACTIVATED: { label: "Deactivated", variant: "secondary" },
};

const VERIFICATION_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  UNVERIFIED: { label: "Unverified", variant: "outline" },
  PENDING: { label: "Pending", variant: "default" },
  VERIFIED: { label: "Verified", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserTable() {
  const router = useRouter();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [verificationFilter, setVerificationFilter] = React.useState("ALL");

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = React.useState<{
    userId: string;
    action: string;
    userName: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

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

  // Fetch users
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (verificationFilter !== "ALL") params.set("verification", verificationFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");

      const data: UsersResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter, verificationFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle user action
  async function handleAction(userId: string, action: string) {
    setActionLoading(true);
    try {
      const updates: Record<string, unknown> = {};

      switch (action) {
        case "ban":
          updates.status = "BANNED";
          break;
        case "unban":
          updates.status = "ACTIVE";
          break;
        case "suspend":
          updates.status = "SUSPENDED";
          break;
        case "verify":
          updates.verificationStatus = "VERIFIED";
          break;
        case "make-creator":
          updates.role = "CREATOR";
          updates.isCreator = true;
          break;
        case "make-user":
          updates.role = "USER";
          updates.isCreator = false;
          break;
        case "make-admin":
          updates.role = "ADMIN";
          break;
        default:
          return;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      toast.success("User updated successfully");
      setConfirmAction(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  const destructiveActions = ["ban", "suspend"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="CREATOR">Creator</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="BANNED">Banned</SelectItem>
              <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={verificationFilter} onValueChange={(v) => { setVerificationFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Verification</SelectItem>
              <SelectItem value="UNVERIFIED">Unverified</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total count */}
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} user{total !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Verification</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No users found matching your filters.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleBadge = ROLE_BADGE_MAP[user.role] ?? { label: user.role, variant: "secondary" as const };
                const statusBadge = STATUS_BADGE_MAP[user.status] ?? { label: user.status, variant: "secondary" as const };
                const verBadge = VERIFICATION_BADGE_MAP[user.verificationStatus] ?? { label: user.verificationStatus, variant: "outline" as const };
                const name = user.displayName || user.username || "Unknown";

                return (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={name} />}
                          <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{name}</p>
                          {user.username && (
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={verBadge.variant}>{verBadge.label}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(user.createdAt)}
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
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {/* Role changes */}
                          {user.role !== "CREATOR" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  action: "make-creator",
                                  userName: name,
                                })
                              }
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Make Creator
                            </DropdownMenuItem>
                          )}
                          {user.role === "CREATOR" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  action: "make-user",
                                  userName: name,
                                })
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Demote to User
                            </DropdownMenuItem>
                          )}

                          {/* Verification */}
                          {user.verificationStatus !== "VERIFIED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  action: "verify",
                                  userName: name,
                                })
                              }
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Verify
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Status changes */}
                          {user.status !== "SUSPENDED" && user.status !== "BANNED" && (
                            <DropdownMenuItem
                              className="text-amber-500 focus:text-amber-500"
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  action: "suspend",
                                  userName: name,
                                })
                              }
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status !== "BANNED" ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  action: "ban",
                                  userName: name,
                                })
                              }
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  action: "unban",
                                  userName: name,
                                })
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unban User
                            </DropdownMenuItem>
                          )}
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
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Confirmation Dialog */}
      <DialogRoot
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "ban"
                ? "Ban User"
                : confirmAction?.action === "suspend"
                  ? "Suspend User"
                  : "Confirm Action"}
            </DialogTitle>
            <DialogDescription>
              {destructiveActions.includes(confirmAction?.action ?? "")
                ? `Are you sure you want to ${confirmAction?.action} "${confirmAction?.userName}"? This action can be reversed later.`
                : `Are you sure you want to perform this action on "${confirmAction?.userName}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={actionLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={
                destructiveActions.includes(confirmAction?.action ?? "")
                  ? "destructive"
                  : "default"
              }
              loading={actionLoading}
              onClick={() =>
                confirmAction &&
                handleAction(confirmAction.userId, confirmAction.action)
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
