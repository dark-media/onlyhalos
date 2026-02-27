"use client";

// ============================================================================
// Creator Posts Management Page
// ============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Lock,
  Crown,
  ShoppingCart,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  FileText,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorPost {
  id: string;
  caption: string | null;
  visibility: string;
  ppvPrice: number | null;
  isPublished: boolean;
  scheduledAt: string | null;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  media: {
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
  }[];
  minimumTier: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Visibility Icon
// ---------------------------------------------------------------------------

function VisibilityIcon({ visibility }: { visibility: string }) {
  switch (visibility) {
    case "PUBLIC":
      return <Eye className="h-3.5 w-3.5" />;
    case "SUBSCRIBERS":
      return <Lock className="h-3.5 w-3.5" />;
    case "TIER":
      return <Crown className="h-3.5 w-3.5" />;
    case "PPV":
      return <ShoppingCart className="h-3.5 w-3.5" />;
    default:
      return <Eye className="h-3.5 w-3.5" />;
  }
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({
  isPublished,
  scheduledAt,
}: {
  isPublished: boolean;
  scheduledAt: string | null;
}) {
  if (isPublished) {
    return <Badge variant="success">Published</Badge>;
  }
  if (scheduledAt) {
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        Scheduled
      </Badge>
    );
  }
  return <Badge variant="secondary">Draft</Badge>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CreatorPostsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Fetch creator's posts
  // -----------------------------------------------------------------------
  const fetchPosts = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(
        `/api/posts?creatorId=${session.user.id}&limit=50`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      // Silently fail
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    fetchPosts().finally(() => setLoading(false));
  }, [fetchPosts, router, session, sessionStatus]);

  // -----------------------------------------------------------------------
  // Delete post
  // -----------------------------------------------------------------------
  const handleDelete = useCallback(
    async (postId: string) => {
      if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
        return;
      }
      setDeleting(postId);
      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        }
      } catch {
        // Silently fail
      } finally {
        setDeleting(null);
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (sessionStatus === "loading" || loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Posts</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild>
          <Link href="/creator/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Post
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            No posts yet
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Create your first post to start sharing content with your subscribers.
          </p>
          <Button asChild>
            <Link href="/creator/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Post
            </Link>
          </Button>
        </div>
      )}

      {/* Posts list */}
      {posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Media thumbnail */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-dark-300">
                  {post.media.length > 0 ? (
                    post.media[0].type === "IMAGE" ? (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Film className="h-6 w-6 text-muted-foreground" />
                    )
                  ) : (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Post info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge
                      isPublished={post.isPublished}
                      scheduledAt={post.scheduledAt}
                    />
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <VisibilityIcon visibility={post.visibility} />
                      {post.visibility}
                    </Badge>
                    {post.visibility === "PPV" && post.ppvPrice && (
                      <span className="text-xs text-primary font-medium">
                        ${post.ppvPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-foreground truncate">
                    {post.caption || "No caption"}
                  </p>

                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatNumber(post.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(post.commentCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" />
                      {formatNumber(post.bookmarkCount)}
                    </span>
                    <span>&middot;</span>
                    <span>{formatDate(post.createdAt)}</span>
                    {post.scheduledAt && !post.isPublished && (
                      <>
                        <span>&middot;</span>
                        <span className="text-primary">
                          Scheduled: {formatDate(post.scheduledAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                      aria-label="Post actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/creator/posts/${post.id}/edit`} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleting === post.id ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
