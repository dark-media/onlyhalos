// ============================================================================
// Profile Posts Feed — Tabbed content for creator profile page
// ============================================================================

"use client";

import * as React from "react";
import {
  FileText,
  Image as ImageIcon,
  User,
  Lock,
  Heart,
  MessageCircle,
  Bookmark,
} from "lucide-react";

import { cn, formatNumber, formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostItem {
  id: string;
  caption: string | null;
  visibility: string;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  mediaCount: number;
  thumbnailUrl: string | null;
  isLocked: boolean;
}

interface ProfilePostsFeedProps {
  creatorId: string;
  creatorUsername: string;
  isOwnProfile: boolean;
  isSubscribed: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// ProfilePostsFeed
// ---------------------------------------------------------------------------

export function ProfilePostsFeed({
  creatorId,
  creatorUsername,
  isOwnProfile,
  isSubscribed,
  className,
}: ProfilePostsFeedProps) {
  const [activeTab, setActiveTab] = React.useState("posts");
  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [mediaOnly, setMediaOnly] = React.useState(false);

  const fetchPosts = React.useCallback(
    async (pageNum: number, isMediaOnly: boolean) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          creatorId,
          page: pageNum.toString(),
          limit: "12",
        });
        if (isMediaOnly) params.set("mediaOnly", "true");

        const res = await fetch(`/api/posts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch posts");

        const data = await res.json();
        const newPosts = data.posts ?? [];

        setPosts((prev) =>
          pageNum === 1 ? newPosts : [...prev, ...newPosts],
        );
        setHasMore(newPosts.length === 12);
      } catch (error) {
        console.error("[ProfilePostsFeed] Error:", error);
      } finally {
        setLoading(false);
      }
    },
    [creatorId],
  );

  // Fetch on mount and tab change
  React.useEffect(() => {
    const isMedia = activeTab === "media";
    setMediaOnly(isMedia);
    setPage(1);
    setPosts([]);
    setHasMore(true);
    fetchPosts(1, isMedia);
  }, [activeTab, fetchPosts]);

  const loadMore = React.useCallback(() => {
    if (loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, mediaOnly);
  }, [loading, page, mediaOnly, fetchPosts]);

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline" className="w-full">
          <TabsTrigger variant="underline" value="posts">
            <FileText className="mr-1.5 h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger variant="underline" value="media">
            <ImageIcon className="mr-1.5 h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger variant="underline" value="about">
            <User className="mr-1.5 h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        {/* Posts tab */}
        <TabsContent value="posts">
          <PostsList
            posts={posts}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            isOwnProfile={isOwnProfile}
            isSubscribed={isSubscribed}
          />
        </TabsContent>

        {/* Media tab */}
        <TabsContent value="media">
          <PostsList
            posts={posts}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            isOwnProfile={isOwnProfile}
            isSubscribed={isSubscribed}
            gridView
          />
        </TabsContent>

        {/* About tab */}
        <TabsContent value="about">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Visit @{creatorUsername}&apos;s profile to learn more about their
                content and subscribe to their exclusive posts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostsList sub-component
// ---------------------------------------------------------------------------

function PostsList({
  posts,
  loading,
  hasMore,
  onLoadMore,
  isOwnProfile,
  isSubscribed,
  gridView = false,
}: {
  posts: PostItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isOwnProfile: boolean;
  isSubscribed: boolean;
  gridView?: boolean;
}) {
  // First load spinner
  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" label="Loading posts" />
      </div>
    );
  }

  // Empty state
  if (posts.length === 0 && !loading) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="No posts yet"
        description={
          isOwnProfile
            ? "Share your first post with your subscribers!"
            : "This creator hasn't posted yet. Check back later!"
        }
      />
    );
  }

  return (
    <InfiniteScroll
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      loading={loading}
      endMessage="You've reached the end"
    >
      <div
        className={cn(
          gridView
            ? "grid grid-cols-2 gap-2 sm:grid-cols-3"
            : "flex flex-col gap-4",
        )}
      >
        {posts.map((post) => (
          <PostListItem
            key={post.id}
            post={post}
            isSubscribed={isSubscribed || isOwnProfile}
            gridView={gridView}
          />
        ))}
      </div>
    </InfiniteScroll>
  );
}

// ---------------------------------------------------------------------------
// PostListItem sub-component
// ---------------------------------------------------------------------------

function PostListItem({
  post,
  isSubscribed,
  gridView,
}: {
  post: PostItem;
  isSubscribed: boolean;
  gridView: boolean;
}) {
  const isLocked = post.isLocked && !isSubscribed;

  if (gridView) {
    return (
      <div
        className={cn(
          "group relative aspect-square overflow-hidden rounded-lg border border-border bg-card",
          "transition-all hover:border-primary/40 hover:shadow-gold-sm",
        )}
      >
        {post.thumbnailUrl && !isLocked ? (
          <img
            src={post.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {isLocked ? (
              <Lock className="h-8 w-8 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Hover overlay with stats */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1 text-sm font-semibold text-white">
            <Heart className="h-4 w-4" />
            {formatNumber(post.likeCount)}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-white">
            <MessageCircle className="h-4 w-4" />
            {formatNumber(post.commentCount)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card hover className="overflow-hidden">
      <CardContent className="p-4">
        {isLocked ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Subscriber-only content
              </p>
              <p className="text-xs text-muted-foreground">
                Subscribe to unlock this post.
              </p>
            </div>
          </div>
        ) : (
          <>
            {post.caption && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-4">
                {post.caption}
              </p>
            )}

            {post.mediaCount > 0 && (
              <Badge variant="secondary" className="mt-2">
                <ImageIcon className="mr-1 h-3 w-3" />
                {post.mediaCount} {post.mediaCount === 1 ? "file" : "files"}
              </Badge>
            )}
          </>
        )}

        {/* Footer stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatNumber(post.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatNumber(post.commentCount)}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5" />
            {formatNumber(post.bookmarkCount)}
          </span>
          <span className="ml-auto">{formatDate(post.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
