"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Called when the sentinel element becomes visible. */
  onLoadMore: () => void;
  /** Whether more items are available to load. */
  hasMore: boolean;
  /** Whether a fetch is currently in progress. */
  loading?: boolean;
  /** IntersectionObserver threshold (0-1). Defaults to 0.1. */
  threshold?: number;
  /** IntersectionObserver rootMargin. Defaults to "200px" for early loading. */
  rootMargin?: string;
  /** Custom loading element. Defaults to a centered Spinner. */
  loader?: React.ReactNode;
  /** Message to display when all items have been loaded. */
  endMessage?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// InfiniteScroll
// ---------------------------------------------------------------------------

const InfiniteScroll = React.forwardRef<HTMLDivElement, InfiniteScrollProps>(
  (
    {
      className,
      children,
      onLoadMore,
      hasMore,
      loading = false,
      threshold = 0.1,
      rootMargin = "200px",
      loader,
      endMessage,
      ...props
    },
    ref,
  ) => {
    const sentinelRef = React.useRef<HTMLDivElement>(null);

    // Stable callback ref to avoid re-creating observer when onLoadMore changes
    const onLoadMoreRef = React.useRef(onLoadMore);
    React.useEffect(() => {
      onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    React.useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry?.isIntersecting) {
            onLoadMoreRef.current();
          }
        },
        {
          threshold,
          rootMargin,
        },
      );

      observer.observe(sentinel);

      return () => {
        observer.disconnect();
      };
    }, [hasMore, threshold, rootMargin]);

    return (
      <div ref={ref} className={cn(className)} {...props}>
        {children}

        {/* Sentinel — triggers loading when scrolled into view */}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-4"
            aria-hidden="true"
          >
            {loading &&
              (loader ?? <Spinner size="default" label="Loading more items" />)}
          </div>
        )}

        {/* End message */}
        {!hasMore && endMessage && (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            {endMessage}
          </div>
        )}
      </div>
    );
  },
);
InfiniteScroll.displayName = "InfiniteScroll";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { InfiniteScroll };
