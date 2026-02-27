// ============================================================================
// Creator Profile Loading Skeleton
// ============================================================================

import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Cover */}
        <Skeleton className="h-52 w-full" />

        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-16 mb-3">
            <Skeleton className="h-32 w-32 rounded-full ring-4 ring-card" />
          </div>

          {/* Name + username */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-1 h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-full max-w-md" />
              <Skeleton className="mt-1 h-4 w-3/4 max-w-sm" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 flex gap-6 border-t border-border pt-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>

      {/* Tiers skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-4 h-10 w-32" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Posts skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-xs" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-4 h-48 w-full rounded-md" />
            <div className="mt-3 flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
