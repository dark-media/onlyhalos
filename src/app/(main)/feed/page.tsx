"use client";

// ============================================================================
// Home Feed Page — Infinite scroll feed of posts
// ============================================================================

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Feed Loading Skeleton
// ---------------------------------------------------------------------------

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyFeed({ isCreator }: { isCreator: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Your feed is empty
      </h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        {isCreator
          ? "Create your first post or subscribe to other creators to see content here."
          : "Subscribe to your favourite creators to see their posts in your feed."}
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/explore">
            <Search className="mr-2 h-4 w-4" />
            Explore Creators
          </Link>
        </Button>
        {isCreator && (
          <Button variant="outline" asChild>
            <Link href="/creator/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed Page
// ---------------------------------------------------------------------------

export default function FeedPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const isCreator = session?.user?.isCreator ?? false;
  const userId = session?.user?.id;

  // -----------------------------------------------------------------------
  // Fetch posts
  // -----------------------------------------------------------------------
  const fetchPosts = useCallback(
    async (cursor?: string | null) => {
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/posts?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const newPosts: PostCardData[] = data.posts || [];

        if (cursor) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        setNextCursor(data.nextCursor || null);
        setHasMore(!!data.nextCursor);
      } catch {
        // Silently fail
      }
    },
    [],
  );

  // Initial load
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
  // Infinite scroll observer
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchPosts(nextCursor).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.5 },
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading, loadingMore, nextCursor, fetchPosts]);

  // -----------------------------------------------------------------------
  // Handle post deletion
  // -----------------------------------------------------------------------
  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Home</h1>
        <FeedSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
        {isCreator && (
          <Button size="sm" asChild>
            <Link href="/creator/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <EmptyFeed isCreator={isCreator} />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              isOwnPost={post.creator.id === userId}
              onDeleted={handlePostDeleted}
            />
          ))}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerRef} className="py-4">
              {loadingMore && <FeedSkeleton />}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              You have reached the end of your feed.
            </p>
          )}
        </div>
      )}

      {/* Floating create button for creators (mobile) */}
      {isCreator && (
        <Link
          href="/creator/posts/new"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-gold-md transition-transform hover:scale-105 md:bottom-8 lg:hidden"
          aria-label="Create new post"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
