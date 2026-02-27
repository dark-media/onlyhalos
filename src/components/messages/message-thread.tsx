"use client";

// ============================================================================
// Message Thread — Full conversation view with messages and input
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ArrowLeft, MoreVertical } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageBubble, type MessageBubbleData } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OtherUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
}

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateSeparatorLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageThread({
  conversationId,
  currentUserId,
  className,
}: MessageThreadProps) {
  const router = useRouter();

  const [messages, setMessages] = React.useState<MessageBubbleData[]>([]);
  const [otherUser, setOtherUser] = React.useState<OtherUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isInitialLoad = React.useRef(true);

  // ── Fetch messages ───────────────────────────────────────────────────
  const fetchMessages = React.useCallback(
    async (cursor?: string) => {
      try {
        setError(null);
        const url = new URL(`/api/messages/${conversationId}`, window.location.origin);
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await fetch(url.toString());

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load messages");
        }

        const data = await res.json();

        if (cursor) {
          // Loading older messages — append to end (messages are newest-first)
          setMessages((prev) => [...prev, ...data.messages]);
        } else {
          // Initial load or refresh
          setMessages(data.messages);
        }

        setOtherUser(data.otherUser);
        setNextCursor(data.nextCursor);
      } catch (err) {
        console.error("[MessageThread] Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load messages",
        );
      }
    },
    [conversationId],
  );

  // ── Initial load ─────────────────────────────────────────────────────
  React.useEffect(() => {
    isInitialLoad.current = true;
    setIsLoading(true);
    setMessages([]);
    setNextCursor(null);

    fetchMessages().finally(() => {
      setIsLoading(false);
    });
  }, [fetchMessages]);

  // ── Auto-scroll to bottom on initial load and new messages ───────────
  React.useEffect(() => {
    if (isInitialLoad.current && messages.length > 0 && !isLoading) {
      // Scroll to bottom on first load
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      });
      isInitialLoad.current = false;
    }
  }, [messages, isLoading]);

  // ── Poll for new messages every 5 seconds ────────────────────────────
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (!res.ok) return;

        const data = await res.json();
        const newMessages: MessageBubbleData[] = data.messages;

        setMessages((prev) => {
          // Merge: keep existing messages and add any new ones
          const existingIds = new Set(prev.map((m) => m.id));
          const additions = newMessages.filter((m) => !existingIds.has(m.id));

          if (additions.length === 0) {
            // Update read status of existing messages
            const updatedMap = new Map(newMessages.map((m) => [m.id, m]));
            return prev.map((m) => updatedMap.get(m.id) || m);
          }

          // New messages arrived — prepend them and scroll down
          const merged = [...additions, ...prev];
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          });
          return merged;
        });
      } catch {
        // Silent failure for polling
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, [conversationId]);

  // ── Load older messages on scroll up ─────────────────────────────────
  const handleScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !nextCursor || isLoadingMore) return;

    // Trigger when scrolled near the top
    if (container.scrollTop < 100) {
      setIsLoadingMore(true);
      const previousScrollHeight = container.scrollHeight;

      fetchMessages(nextCursor).finally(() => {
        setIsLoadingMore(false);

        // Maintain scroll position after prepending older messages
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        });
      });
    }
  }, [nextCursor, isLoadingMore, fetchMessages]);

  // ── After sending a message ──────────────────────────────────────────
  const handleMessageSent = React.useCallback(() => {
    // Refetch to get the new message
    fetchMessages().then(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }, [fetchMessages]);

  // ── Reversed display: messages come newest-first from API ────────────
  const displayMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages],
  );

  // ── Group messages by date for separators ────────────────────────────
  const messagesWithSeparators = React.useMemo(() => {
    const items: Array<
      { type: "separator"; label: string; key: string } | { type: "message"; data: MessageBubbleData }
    > = [];

    let lastDate: Date | null = null;

    for (const msg of displayMessages) {
      const msgDate = new Date(msg.createdAt);

      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({
          type: "separator",
          label: getDateSeparatorLabel(msg.createdAt),
          key: `sep-${msg.createdAt}`,
        });
        lastDate = msgDate;
      }

      items.push({ type: "message", data: msg });
    }

    return items;
  }, [displayMessages]);

  // ── Loading state ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn("flex h-full flex-col", className)}>
        {/* Header skeleton */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                i % 2 === 0 ? "justify-start" : "justify-end",
              )}
            >
              <Skeleton
                className={cn(
                  "h-12 rounded-2xl",
                  i % 2 === 0 ? "w-48" : "w-40",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn("flex h-full flex-col items-center justify-center", className)}>
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            setIsLoading(true);
            fetchMessages().finally(() => setIsLoading(false));
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        {/* Back button (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => router.push("/messages")}
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Other user info */}
        {otherUser && (
          <Link
            href={`/${otherUser.username || otherUser.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar size="default" className="hover:ring-0">
              {otherUser.avatarUrl ? (
                <AvatarImage
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName || "User"}
                />
              ) : null}
              <AvatarFallback>
                {getInitials(otherUser.displayName || otherUser.username || "?")}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {otherUser.displayName || otherUser.username || "User"}
              </p>
              {otherUser.username && (
                <p className="truncate text-xs text-muted-foreground">
                  @{otherUser.username}
                </p>
              )}
            </div>
          </Link>
        )}

        <div className="flex-1" />

        {/* Options menu placeholder */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          aria-label="Conversation options"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-3">
            <Spinner size="sm" />
          </div>
        )}

        {/* Empty conversation */}
        {displayMessages.length === 0 ? (
          <EmptyState
            title="Start the conversation"
            description={
              otherUser
                ? `Say hello to ${otherUser.displayName || otherUser.username || "this user"}!`
                : "Send your first message."
            }
            className="py-16"
          />
        ) : (
          <div className="space-y-3">
            {messagesWithSeparators.map((item) => {
              if (item.type === "separator") {
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="h-px flex-1 bg-border" />
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                );
              }

              return (
                <MessageBubble
                  key={item.data.id}
                  message={item.data}
                  currentUserId={currentUserId}
                />
              );
            })}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Message input ─────────────────────────────────────────────── */}
      <MessageInput
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
}
