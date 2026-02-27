"use client";

// ============================================================================
// Post Comments Section — List of comments with replies
// ============================================================================

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Reply,
  Trash2,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/post/comment-form";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommentUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  parentId: string | null;
  replies?: CommentData[];
}

interface PostCommentsProps {
  postId: string;
  /** The current user's ID (for delete own comments). */
  currentUserId?: string;
  className?: string;
}

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Single Comment
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  postId,
  currentUserId,
  onDeleted,
  onReplyAdded,
  depth = 0,
}: {
  comment: CommentData;
  postId: string;
  currentUserId?: string;
  onDeleted: (commentId: string) => void;
  onReplyAdded: (comment: CommentData) => void;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwn = currentUserId === comment.user.id;

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id }),
      });
      if (res.ok) {
        onDeleted(comment.id);
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
    }
  }, [comment.id, postId, onDeleted]);

  const handleReplySubmitted = useCallback(
    (newComment: { id: string; content: string; parentId?: string | null }) => {
      setShowReplyForm(false);
      onReplyAdded({
        ...newComment,
        createdAt: new Date().toISOString(),
        user: { id: currentUserId || "", username: null, displayName: "You", avatarUrl: null },
        parentId: comment.id,
        replies: [],
      });
    },
    [comment.id, currentUserId, onReplyAdded],
  );

  return (
    <div className={cn("group", depth > 0 && "ml-8 border-l border-border pl-4")}>
      <div className="flex gap-3 py-2">
        <Link href={`/${comment.user.username || comment.user.id}`}>
          <Avatar size="sm">
            <AvatarImage
              src={comment.user.avatarUrl || DEFAULT_AVATAR_URL}
              alt={comment.user.displayName || "User"}
            />
            <AvatarFallback>
              {getInitials(comment.user.displayName || "U")}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/${comment.user.username || comment.user.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary"
            >
              {comment.user.displayName || comment.user.username || "User"}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-3">
            {/* Reply button (only for top-level comments) */}
            {depth === 0 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}

            {/* Delete button (own comments) */}
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-11 mb-2">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSubmitted={handleReplySubmitted}
            placeholder={`Reply to ${comment.user.displayName || comment.user.username}...`}
            autoFocus
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              onDeleted={onDeleted}
              onReplyAdded={onReplyAdded}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostComments (main export)
// ---------------------------------------------------------------------------

export function PostComments({
  postId,
  currentUserId,
  className,
}: PostCommentsProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch comments
  // -----------------------------------------------------------------------
  const fetchComments = useCallback(
    async (cursorId?: string | null) => {
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (cursorId) params.set("cursor", cursorId);

        const res = await fetch(
          `/api/posts/${postId}/comment?${params.toString()}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        const newComments: CommentData[] = data.comments || [];

        if (cursorId) {
          setComments((prev) => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }

        setCursor(data.nextCursor || null);
        setHasMore(!!data.nextCursor);
      } catch {
        // Silently fail
      }
    },
    [postId],
  );

  useEffect(() => {
    setLoading(true);
    fetchComments().finally(() => setLoading(false));
  }, [fetchComments]);

  // -----------------------------------------------------------------------
  // Load more
  // -----------------------------------------------------------------------
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchComments(cursor);
    setLoadingMore(false);
  }, [cursor, fetchComments, hasMore, loadingMore]);

  // -----------------------------------------------------------------------
  // Handle new comment added
  // -----------------------------------------------------------------------
  const handleCommentSubmitted = useCallback(
    (newComment: { id: string; content: string; parentId?: string | null }) => {
      const commentData: CommentData = {
        ...newComment,
        createdAt: new Date().toISOString(),
        user: {
          id: currentUserId || "",
          username: null,
          displayName: "You",
          avatarUrl: null,
        },
        parentId: null,
        replies: [],
      };
      setComments((prev) => [commentData, ...prev]);
    },
    [currentUserId],
  );

  // -----------------------------------------------------------------------
  // Handle reply added
  // -----------------------------------------------------------------------
  const handleReplyAdded = useCallback((reply: CommentData) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === reply.parentId) {
          return { ...c, replies: [...(c.replies || []), reply] };
        }
        return c;
      }),
    );
  }, []);

  // -----------------------------------------------------------------------
  // Handle delete
  // -----------------------------------------------------------------------
  const handleDeleted = useCallback((commentId: string) => {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== commentId),
        })),
    );
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Comment form */}
      <CommentForm
        postId={postId}
        onSubmitted={handleCommentSubmitted}
      />

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-dark-300" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-dark-300" />
                <div className="h-3 w-3/4 rounded bg-dark-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="flex flex-col items-center py-6 text-center">
          <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}

      {/* Comments list */}
      {!loading && comments.length > 0 && (
        <div className="space-y-1 divide-y divide-border/50">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onDeleted={handleDeleted}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            <ChevronDown className="mr-1 h-4 w-4" />
            Load more comments
          </Button>
        </div>
      )}
    </div>
  );
}
