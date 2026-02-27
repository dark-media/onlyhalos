"use client";

// ============================================================================
// Notification List — Paginated list with filter tabs
// ============================================================================

import * as React from "react";
import {
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  DollarSign,
  UserPlus,
  Settings,
  Inbox,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import {
  NotificationItem,
  type NotificationItemData,
} from "@/components/notifications/notification-item";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterCategory =
  | "all"
  | "subscriptions"
  | "messages"
  | "engagement"
  | "tips"
  | "system";

interface FilterTab {
  key: FilterCategory;
  label: string;
  icon: React.ElementType;
}

interface NotificationListProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Filter configuration
// ---------------------------------------------------------------------------

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "All", icon: Bell },
  { key: "subscriptions", label: "Subscriptions", icon: UserPlus },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "engagement", label: "Engagement", icon: Heart },
  { key: "tips", label: "Tips", icon: DollarSign },
  { key: "system", label: "System", icon: Settings },
];

// ---------------------------------------------------------------------------
// Empty states per filter
// ---------------------------------------------------------------------------

const EMPTY_STATES: Record<FilterCategory, { title: string; description: string }> = {
  all: {
    title: "No notifications yet",
    description: "When you get likes, comments, subscribers, or tips, they will appear here.",
  },
  subscriptions: {
    title: "No subscription notifications",
    description: "New subscriber and subscription expiry notifications will appear here.",
  },
  messages: {
    title: "No message notifications",
    description: "You will be notified here when you receive new messages.",
  },
  engagement: {
    title: "No engagement notifications",
    description: "Likes and comments on your posts will appear here.",
  },
  tips: {
    title: "No tip notifications",
    description: "Tips, purchases, and payout notifications will appear here.",
  },
  system: {
    title: "No system notifications",
    description: "Verification updates and system announcements will appear here.",
  },
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationList({ className }: NotificationListProps) {
  const [notifications, setNotifications] = React.useState<
    NotificationItemData[]
  >([]);
  const [activeFilter, setActiveFilter] =
    React.useState<FilterCategory>("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  // ── Fetch notifications ────────────────────────────────────────────
  const fetchNotifications = React.useCallback(
    async (cursor?: string | null, replace = true) => {
      try {
        if (replace) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const params = new URLSearchParams({ limit: "20" });
        if (cursor) params.set("cursor", cursor);
        if (activeFilter !== "all") params.set("category", activeFilter);

        const res = await fetch(`/api/notifications?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to load notifications");
        }

        const data = await res.json();
        const fetched = (data.notifications ?? []) as NotificationItemData[];

        if (replace) {
          setNotifications(fetched);
        } else {
          setNotifications((prev) => [...prev, ...fetched]);
        }

        setNextCursor(data.nextCursor ?? null);
        setUnreadCount(data.unreadCount ?? 0);
      } catch (err) {
        console.error("[NotificationList] Fetch error:", err);
        setError("Unable to load notifications.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilter],
  );

  // Initial load and reload on filter change
  React.useEffect(() => {
    fetchNotifications(null, true);
  }, [fetchNotifications]);

  // ── Load more ──────────────────────────────────────────────────────
  const handleLoadMore = React.useCallback(() => {
    if (!isLoadingMore && nextCursor) {
      fetchNotifications(nextCursor, false);
    }
  }, [isLoadingMore, nextCursor, fetchNotifications]);

  // ── Mark single notification as read ───────────────────────────────
  const handleMarkRead = React.useCallback(async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[NotificationList] Mark read error:", err);
    }
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────
  const handleMarkAllRead = React.useCallback(async () => {
    try {
      setIsMarkingAll(true);

      const res = await fetch("/api/notifications/read", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to mark all as read");
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("[NotificationList] Mark all read error:", err);
    } finally {
      setIsMarkingAll(false);
    }
  }, []);

  // ── Filter change ──────────────────────────────────────────────────
  const handleFilterChange = React.useCallback(
    (filter: FilterCategory) => {
      if (filter === activeFilter) return;
      setActiveFilter(filter);
      setNextCursor(null);
    },
    [activeFilter],
  );

  // ── Render ─────────────────────────────────────────────────────────
  const hasMore = nextCursor !== null;
  const emptyConfig = EMPTY_STATES[activeFilter];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-halo-gold px-1.5 text-xs font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            loading={isMarkingAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        )}
      </div>

      {/* Filter tabs — horizontally scrollable */}
      <div className="border-b border-border px-4">
        <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <TabIcon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Error state */}
        {error && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNotifications(null, true)}
              className="mt-2"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !error && <NotificationSkeleton />}

        {/* Empty state */}
        {!isLoading && !error && notifications.length === 0 && (
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title={emptyConfig.title}
            description={emptyConfig.description}
          />
        )}

        {/* Notification list with infinite scroll */}
        {!isLoading && !error && notifications.length > 0 && (
          <InfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={isLoadingMore}
            endMessage="You're all caught up."
            className="divide-y divide-border/50"
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
