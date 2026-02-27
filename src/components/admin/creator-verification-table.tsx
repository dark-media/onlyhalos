"use client";

// ============================================================================
// Creator Verification Queue Table
// ============================================================================

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Inbox } from "lucide-react";

import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
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

interface PendingCreator {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  creatorBio: string | null;
  createdAt: string;
  _count?: {
    posts: number;
  };
  creatorCategories?: Array<{
    category: { name: string };
  }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreatorVerificationTable() {
  const [creators, setCreators] = React.useState<PendingCreator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Rejection dialog
  const [rejectTarget, setRejectTarget] = React.useState<PendingCreator | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  // Fetch pending creators
  const fetchPending = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users?verification=PENDING&limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCreators(data.users ?? []);
    } catch {
      toast.error("Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Approve creator
  async function handleApprove(creator: PendingCreator) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${creator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "VERIFIED",
          isCreator: true,
          role: "CREATOR",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      toast.success(`${creator.displayName || creator.username || "Creator"} has been verified`);
      setCreators((prev) => prev.filter((c) => c.id !== creator.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve creator");
    } finally {
      setActionLoading(false);
    }
  }

  // Reject creator
  async function handleReject() {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${rejectTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "REJECTED",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject");
      }

      toast.success(`Verification rejected for ${rejectTarget.displayName || rejectTarget.username || "creator"}`);
      setCreators((prev) => prev.filter((c) => c.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject creator");
    } finally {
      setActionLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  // Empty state
  if (creators.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="Verification Queue Empty"
        description="There are no pending creator verification requests at this time."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted-foreground">
          {creators.length} pending verification{creators.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Creator</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Bio</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">Applied</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => {
              const name = creator.displayName || creator.username || "Unknown";
              const bio = creator.creatorBio || creator.bio || "No bio provided";
              const categories = creator.creatorCategories?.map((cc) => cc.category.name) ?? [];

              return (
                <tr
                  key={creator.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {creator.avatarUrl && <AvatarImage src={creator.avatarUrl} alt={name} />}
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        {creator.username && (
                          <p className="text-xs text-muted-foreground">@{creator.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[300px] px-4 py-3">
                    <p className="truncate text-muted-foreground">{bio}</p>
                  </td>
                  <td className="px-4 py-3">
                    {categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(creator.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        loading={actionLoading}
                        onClick={() => handleApprove(creator)}
                      >
                        <CheckCircle className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectTarget(creator)}
                      >
                        <XCircle className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rejection Dialog */}
      <DialogRoot
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <span className="font-medium text-foreground">
                {rejectTarget?.displayName || rejectTarget?.username || "this creator"}
              </span>
              &apos;s verification request.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Reason for rejection (optional)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxCharacters={500}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={actionLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              loading={actionLoading}
              onClick={handleReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
