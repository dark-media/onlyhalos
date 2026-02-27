// ============================================================================
// Feed Loading Skeleton
// ============================================================================

import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Media placeholder */}
            <Skeleton className="h-64 w-full rounded-lg" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
