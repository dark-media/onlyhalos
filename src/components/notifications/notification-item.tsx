"use client";

// ============================================================================
// Notification Item — Single notification row
// ============================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageSquare,
  UserPlus,
  DollarSign,
  Star,
  ShoppingCart,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  Bell,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationItemData {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  linkUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkRead?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Type-specific icon and color mapping
// ---------------------------------------------------------------------------

interface TypeConfig {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  NEW_LIKE: {
    icon: Heart,
    colorClass: "text-red-400",
    bgClass: "bg-red-400/10",
  },
  NEW_COMMENT: {
    icon: MessageSquare,
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
  },
  NEW_SUBSCRIBER: {
    icon: UserPlus,
    colorClass: "text-halo-gold",
    bgClass: "bg-halo-gold/10",
  },
  NEW_TIP: {
    icon: DollarSign,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
  },
  NEW_MESSAGE: {
    icon: MessageSquare,
    colorClass: "text-purple-400",
    bgClass: "bg-purple-400/10",
  },
  POST_PURCHASED: {
    icon: ShoppingCart,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
  },
  SUBSCRIPTION_EXPIRED: {
    icon: Clock,
    colorClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
  },
  PAYOUT_COMPLETED: {
    icon: CreditCard,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
  },
  VERIFICATION_APPROVED: {
    icon: CheckCircle,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
  },
  VERIFICATION_REJECTED: {
    icon: XCircle,
    colorClass: "text-red-400",
    bgClass: "bg-red-400/10",
  },
  SYSTEM: {
    icon: Bell,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
};

const DEFAULT_CONFIG: TypeConfig = {
  icon: Star,
  colorClass: "text-halo-gold",
  bgClass: "bg-halo-gold/10",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNotificationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true })
      .replace("about ", "")
      .replace("less than a minute ago", "just now");
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const router = useRouter();
  const config = TYPE_CONFIG[notification.type] ?? DEFAULT_CONFIG;
  const Icon = config.icon;
  const timeStr = formatNotificationTime(notification.createdAt);

  const handleClick = React.useCallback(() => {
    // Mark as read
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }

    // Navigate to link
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  }, [notification, onMarkRead, router]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-start gap-3 rounded-lg px-4 py-3 transition-colors cursor-pointer",
        "hover:bg-dark-200",
        !notification.isRead && "bg-dark-100",
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bgClass,
        )}
      >
        <Icon className={cn("h-5 w-5", config.colorClass)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title row with unread dot */}
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-halo-gold"
              aria-label="Unread"
            />
          )}
          <span
            className={cn(
              "text-sm",
              notification.isRead
                ? "font-medium text-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {notification.title}
          </span>
        </div>

        {/* Body text */}
        {notification.body && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-xs text-muted-foreground">{timeStr}</p>
      </div>
    </div>
  );
}
