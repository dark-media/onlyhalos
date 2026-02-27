"use client";

// ============================================================================
// Conversation Item — Single conversation row in the list
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationItemUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
}

export interface ConversationItemMessage {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  ppvPrice: number | null;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

export interface ConversationItemProps {
  id: string;
  otherUser: ConversationItemUser;
  lastMessage: ConversationItemMessage | null;
  unreadCount: number;
  lastMessageAt: string;
  isActive?: boolean;
  currentUserId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMessagePreview(
  message: ConversationItemMessage | null,
  currentUserId: string,
): string {
  if (!message) return "No messages yet";

  const isOwn = message.senderId === currentUserId;
  const prefix = isOwn ? "You: " : "";

  if (message.ppvPrice && message.ppvPrice > 0) {
    return `${prefix}PPV message — $${message.ppvPrice.toFixed(2)}`;
  }

  if (message.mediaUrl && !message.content) {
    const type = message.mediaType === "VIDEO" ? "video" : "photo";
    return `${prefix}Sent a ${type}`;
  }

  if (message.content) {
    return `${prefix}${message.content}`;
  }

  return `${prefix}Sent an attachment`;
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: false })
      .replace("about ", "")
      .replace("less than a minute", "now")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" months", "mo")
      .replace(" month", "mo");
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConversationItem({
  id,
  otherUser,
  lastMessage,
  unreadCount,
  lastMessageAt,
  isActive = false,
  currentUserId,
}: ConversationItemProps) {
  const preview = getMessagePreview(lastMessage, currentUserId);
  const timeStr = formatMessageTime(lastMessageAt);
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={`/messages/${id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
        "hover:bg-dark-200",
        isActive && "bg-dark-200 ring-1 ring-halo-gold/20",
        hasUnread && !isActive && "bg-dark-100",
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar size="default" className="hover:ring-0">
          {otherUser.avatarUrl ? (
            <AvatarImage
              src={otherUser.avatarUrl}
              alt={otherUser.displayName || otherUser.username || "User"}
            />
          ) : null}
          <AvatarFallback>
            {getInitials(otherUser.displayName || otherUser.username || "?")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: name + time */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground",
            )}
          >
            {otherUser.displayName || otherUser.username || "Unknown"}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeStr}
          </span>
        </div>

        {/* Bottom row: preview + unread badge */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              hasUnread
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
          {hasUnread && (
            <Badge
              variant="premium"
              className="h-5 min-w-[20px] shrink-0 px-1.5 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
