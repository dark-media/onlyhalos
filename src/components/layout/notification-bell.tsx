"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  DollarSign,
  Star,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "subscribe"
  | "tip"
  | "mention"
  | "system";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  like: Heart,
  comment: MessageSquare,
  follow: UserPlus,
  subscribe: Star,
  tip: DollarSign,
  mention: MessageSquare,
  system: Bell,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  like: "text-red-400",
  comment: "text-blue-400",
  follow: "text-primary",
  subscribe: "text-primary",
  tip: "text-green-400",
  mention: "text-purple-400",
  system: "text-muted-foreground",
};

// ---------------------------------------------------------------------------
// NotificationBell
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // ── Fetch notifications ─────────────────────────────────────────────────
  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data: NotificationsResponse = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // Non-critical; silent failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and on an interval
  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000); // Every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // ── Click outside to close ──────────────────────────────────────────────
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Mark all as read ────────────────────────────────────────────────────
  async function handleMarkAllRead() {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true })),
        );
        setUnreadCount(0);
      }
    } catch {
      // Non-critical
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Bell trigger ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          "text-muted-foreground hover:bg-dark-200 hover:text-foreground",
          isOpen && "bg-dark-200 text-foreground",
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full",
              "min-w-[18px] px-1 py-0.5 text-2xs font-bold",
              "bg-primary text-primary-foreground shadow-gold-sm",
              "animate-in zoom-in-50",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg",
            "border border-border bg-popover shadow-dark-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-halo-gold-light"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="p-1">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type];
                  const iconColor = NOTIFICATION_COLORS[notification.type];

                  const content = (
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                        "hover:bg-accent",
                        !notification.read && "bg-primary/5",
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-200",
                          iconColor,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Body */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notification.read
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notification.read && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  );

                  if (notification.href) {
                    return (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => setIsOpen(false)}
                        className="block"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={notification.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
                "text-primary transition-colors hover:bg-primary/10",
              )}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
