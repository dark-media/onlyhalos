"use client";

// ============================================================================
// Post Action Buttons — Like, Comment, Bookmark, Share
// ============================================================================

import React, { useState, useCallback, useTransition } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  /** Toggle the comments section open/closed. */
  onToggleComments?: () => void;
  /** Whether the comments section is currently open. */
  commentsOpen?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostActions({
  postId,
  likeCount: initialLikeCount,
  commentCount,
  bookmarkCount: initialBookmarkCount,
  isLiked: initialIsLiked,
  isBookmarked: initialIsBookmarked,
  onToggleComments,
  commentsOpen = false,
  className,
}: PostActionsProps) {
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialIsBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPendingLike, startLikeTransition] = useTransition();
  const [isPendingBookmark, startBookmarkTransition] = useTransition();

  // -----------------------------------------------------------------------
  // Like toggle
  // -----------------------------------------------------------------------
  const handleLike = useCallback(() => {
    const nextLiked = !liked;
    // Optimistic update
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    if (nextLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 400);
    }

    startLikeTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/like`, {
          method: nextLiked ? "POST" : "DELETE",
        });
        if (!res.ok) {
          // Revert on failure
          setLiked(!nextLiked);
          setLikeCount((c) => c + (nextLiked ? -1 : 1));
        }
      } catch {
        setLiked(!nextLiked);
        setLikeCount((c) => c + (nextLiked ? -1 : 1));
      }
    });
  }, [liked, postId]);

  // -----------------------------------------------------------------------
  // Bookmark toggle
  // -----------------------------------------------------------------------
  const handleBookmark = useCallback(() => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setBookmarkCount((c) => c + (nextBookmarked ? 1 : -1));

    startBookmarkTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/bookmark`, {
          method: nextBookmarked ? "POST" : "DELETE",
        });
        if (!res.ok) {
          setBookmarked(!nextBookmarked);
          setBookmarkCount((c) => c + (nextBookmarked ? -1 : 1));
        }
      } catch {
        setBookmarked(!nextBookmarked);
        setBookmarkCount((c) => c + (nextBookmarked ? -1 : 1));
      }
    });
  }, [bookmarked, postId]);

  // -----------------------------------------------------------------------
  // Share (copy link)
  // -----------------------------------------------------------------------
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: use a temporary input
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [postId]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center justify-between", className)}>
        <div className="flex items-center gap-1">
          {/* Like */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLike}
                disabled={isPendingLike}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-red-500/10",
                  liked ? "text-red-500" : "text-muted-foreground",
                )}
                aria-label={liked ? "Unlike" : "Like"}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    liked && "fill-red-500",
                    likeAnimating && "animate-bounce scale-125",
                  )}
                />
                {likeCount > 0 && (
                  <span className="text-xs font-medium">
                    {formatNumber(likeCount)}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{liked ? "Unlike" : "Like"}</TooltipContent>
          </Tooltip>

          {/* Comment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleComments}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-primary/10",
                  commentsOpen
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                aria-label="Comments"
              >
                <MessageCircle className="h-5 w-5" />
                {commentCount > 0 && (
                  <span className="text-xs font-medium">
                    {formatNumber(commentCount)}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Comments</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          {/* Bookmark */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleBookmark}
                disabled={isPendingBookmark}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-primary/10",
                  bookmarked
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Bookmark
                  className={cn(
                    "h-5 w-5 transition-all",
                    bookmarked && "fill-primary",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {bookmarked ? "Remove Bookmark" : "Bookmark"}
            </TooltipContent>
          </Tooltip>

          {/* Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10"
                aria-label="Share"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? "Copied!" : "Copy Link"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
