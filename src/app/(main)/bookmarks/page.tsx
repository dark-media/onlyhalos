"use client";

// ============================================================================
// Bookmarks Page — View and manage bookmarked posts
// ============================================================================

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bookmark, Sparkles } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/post/post-card";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BookmarksPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id;

  // -----------------------------------------------------------------------
  // Fetch bookmarked posts
  // -----------------------------------------------------------------------
  const fetchBookmarks = useCallback(
    async (cursor?: string | null) => {
      try {
        const params = new URLSearchParams({ limit: "20", bookmarked: "true" });
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

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    fetchBookmarks().finally(() => setLoading(false));
  }, [fetchBookmarks, router, session, sessionStatus]);

  // -----------------------------------------------------------------------
  // Infinite scroll
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchBookmarks(nextCursor).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.5 },
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading, loadingMore, nextCursor, fetchBookmarks]);

  // -----------------------------------------------------------------------
  // Handle post deletion / unbookmark
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
        <h1 className="mb-6 text-2xl font-bold text-foreground">Bookmarks</h1>
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
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Bookmarks</h1>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Bookmark className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            No bookmarks yet
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Save posts you want to come back to by tapping the bookmark icon.
            They will appear here.
          </p>
        </div>
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

          {hasMore && (
            <div ref={observerRef} className="py-4">
              {loadingMore && (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No more bookmarks to show.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
