"use client";

// ============================================================================
// Conversation List — Sidebar list of all conversations
// ============================================================================

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, MessageSquarePlus, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ConversationItem,
  type ConversationItemUser,
  type ConversationItemMessage,
} from "@/components/messages/conversation-item";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  otherUser: ConversationItemUser;
  lastMessage: ConversationItemMessage | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

interface ConversationListProps {
  currentUserId: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConversationList({
  currentUserId,
  className,
}: ConversationListProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId as string | undefined;

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // ── Fetch conversations ──────────────────────────────────────────────
  const fetchConversations = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/messages");

      if (!res.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("[ConversationList] Fetch error:", err);
      setError("Unable to load conversations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchConversations();

    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // ── Filter conversations by search ───────────────────────────────────
  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = c.otherUser.displayName?.toLowerCase() || "";
      const username = c.otherUser.username?.toLowerCase() || "";
      return name.includes(q) || username.includes(q);
    });
  }, [conversations, searchQuery]);

  // ── New message handler ──────────────────────────────────────────────
  const handleNewMessage = () => {
    // Navigate to a route that could show a user search/picker
    // For now, this acts as a placeholder for new message flow
    router.push("/messages");
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewMessage}
            aria-label="New message"
            className="text-primary hover:text-halo-gold-light"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-dark-100 border-dark-300 text-sm"
          />
        </div>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setIsLoading(true);
                fetchConversations();
              }}
            >
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-7 w-7" />}
            title={
              searchQuery
                ? "No conversations found"
                : "No messages yet"
            }
            description={
              searchQuery
                ? "Try a different search term."
                : "Start a conversation with a creator to get started."
            }
            className="py-12"
          />
        ) : (
          <div className="space-y-1">
            {filtered.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                id={conversation.id}
                otherUser={conversation.otherUser}
                lastMessage={conversation.lastMessage}
                unreadCount={conversation.unreadCount}
                lastMessageAt={conversation.lastMessageAt}
                isActive={activeId === conversation.id}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
