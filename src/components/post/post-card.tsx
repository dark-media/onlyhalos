"use client";

// ============================================================================
// Post Card — Full post display with media, actions, and paywall
// ============================================================================

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  ShieldCheck,
  Eye,
  Lock,
  Crown,
  ShoppingCart,
  Pencil,
  Trash2,
  Flag,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostMedia, type MediaItem } from "@/components/post/post-media";
import { PostActions } from "@/components/post/post-actions";
import { PostComments } from "@/components/post/post-comments";
import { ContentPaywall } from "@/components/post/content-paywall";
import { PPVUnlockButton } from "@/components/post/ppv-unlock-button";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostCreator {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  verificationStatus: string;
}

interface PostTier {
  id: string;
  name: string;
  price: number;
}

export interface PostCardData {
  id: string;
  caption: string | null;
  visibility: "PUBLIC" | "SUBSCRIBERS" | "TIER" | "PPV";
  ppvPrice: number | null;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  creator: PostCreator;
  minimumTier: PostTier | null;
  media: MediaItem[];
  isLiked: boolean;
  isBookmarked: boolean;
  isPurchased: boolean;
  hasAccess: boolean;
}

interface PostCardProps {
  post: PostCardData;
  /** The current user's ID. */
  currentUserId?: string;
  /** Whether the current user is the creator of this post. */
  isOwnPost?: boolean;
  /** Called when post is deleted. */
  onDeleted?: (postId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Caption Text with expand/collapse
// ---------------------------------------------------------------------------

const MAX_CAPTION_LENGTH = 280;

function CaptionText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > MAX_CAPTION_LENGTH;

  return (
    <div className="px-4">
      <p className="whitespace-pre-wrap break-words text-sm text-foreground/90 leading-relaxed">
        {expanded || !isLong ? text : `${text.slice(0, MAX_CAPTION_LENGTH)}...`}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visibility Badge
// ---------------------------------------------------------------------------

function VisibilityBadge({
  visibility,
  tierName,
  ppvPrice,
}: {
  visibility: string;
  tierName?: string;
  ppvPrice?: number | null;
}) {
  switch (visibility) {
    case "PUBLIC":
      return (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Eye className="h-3 w-3" />
          Public
        </Badge>
      );
    case "SUBSCRIBERS":
      return (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Lock className="h-3 w-3" />
          Subscribers
        </Badge>
      );
    case "TIER":
      return (
        <Badge variant="premium" className="gap-1 text-[10px]">
          <Crown className="h-3 w-3" />
          {tierName || "Tier"}
        </Badge>
      );
    case "PPV":
      return (
        <Badge variant="default" className="gap-1 text-[10px]">
          <ShoppingCart className="h-3 w-3" />
          ${ppvPrice?.toFixed(2)}
        </Badge>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// PostCard (main export)
// ---------------------------------------------------------------------------

export function PostCard({
  post,
  currentUserId,
  isOwnPost = false,
  onDeleted,
  className,
}: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isVerified = post.creator.verificationStatus === "VERIFIED";
  const isLocked = !post.hasAccess && post.visibility !== "PUBLIC";

  // -----------------------------------------------------------------------
  // Delete post
  // -----------------------------------------------------------------------
  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        onDeleted?.(post.id);
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
    }
  }, [post.id, onDeleted]);

  // -----------------------------------------------------------------------
  // PPV purchase callback
  // -----------------------------------------------------------------------
  const handlePurchased = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // Force a page refresh to get the signed URLs
    window.location.reload();
  }, []);

  if (deleted) return null;

  return (
    <Card key={refreshKey} className={cn("overflow-hidden", className)}>
      {/* Header: Creator info */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/${post.creator.username || post.creator.id}`}>
            <Avatar size="default">
              <AvatarImage
                src={post.creator.avatarUrl || DEFAULT_AVATAR_URL}
                alt={post.creator.displayName || "Creator"}
              />
              <AvatarFallback>
                {getInitials(post.creator.displayName || "C")}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${post.creator.username || post.creator.id}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {post.creator.displayName || post.creator.username}
              </Link>
              {isVerified && (
                <ShieldCheck className="h-4 w-4 text-primary" aria-label="Verified creator" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {post.creator.username && (
                <Link
                  href={`/${post.creator.username}`}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  @{post.creator.username}
                </Link>
              )}
              <span className="text-xs text-muted-foreground">
                &middot; {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VisibilityBadge
            visibility={post.visibility}
            tierName={post.minimumTier?.name}
            ppvPrice={post.ppvPrice}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                aria-label="Post options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/creator/posts/${post.id}/edit`} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Post
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="cursor-pointer">
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Caption */}
      {post.caption && <CaptionText text={post.caption} />}

      {/* Media with optional paywall */}
      <div className="relative mt-3">
        <PostMedia
          media={post.media}
          locked={isLocked}
        />

        {isLocked && (
          <ContentPaywall
            visibility={post.visibility as "SUBSCRIBERS" | "TIER" | "PPV"}
            creatorUsername={post.creator.username || undefined}
            tierName={post.minimumTier?.name}
            tierPriceCents={
              post.minimumTier
                ? Math.round(post.minimumTier.price * 100)
                : undefined
            }
            ppvPrice={post.ppvPrice || undefined}
            onPurchase={handlePurchased}
          />
        )}
      </div>

      {/* PPV unlock button (shown below media for PPV posts) */}
      {post.visibility === "PPV" && !post.hasAccess && !isOwnPost && (
        <div className="px-4 pt-3">
          <PPVUnlockButton
            postId={post.id}
            price={post.ppvPrice || 0}
            onPurchased={handlePurchased}
          />
        </div>
      )}

      {/* Action bar */}
      {post.hasAccess && (
        <>
          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            bookmarkCount={post.bookmarkCount}
            isLiked={post.isLiked}
            isBookmarked={post.isBookmarked}
            onToggleComments={() => setCommentsOpen(!commentsOpen)}
            commentsOpen={commentsOpen}
            className="px-4 py-2 border-t border-border"
          />

          {/* Comments section */}
          {commentsOpen && (
            <div className="border-t border-border px-4 py-3">
              <PostComments
                postId={post.id}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
