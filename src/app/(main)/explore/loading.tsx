// ============================================================================
// Explore Loading Skeleton
// ============================================================================

import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="space-y-8">
      {/* Header + search */}
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      {/* Featured carousel skeleton */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-72 shrink-0">
              <div className="rounded-lg border border-border bg-card">
                <Skeleton className="h-28 w-full rounded-t-lg" />
                <div className="p-4">
                  <Skeleton className="h-16 w-16 rounded-full -mt-12" />
                  <Skeleton className="mt-2 h-5 w-32" />
                  <Skeleton className="mt-1 h-4 w-24" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-3/4" />
                  <Skeleton className="mt-3 h-4 w-20" />
                  <Skeleton className="mt-3 h-9 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending skeleton */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card">
              <Skeleton className="h-28 w-full rounded-t-lg" />
              <div className="p-4">
                <Skeleton className="h-16 w-16 rounded-full -mt-8" />
                <Skeleton className="mt-2 h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-24" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-3 h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All creators skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <div className="flex gap-1">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card">
              <Skeleton className="h-28 w-full rounded-t-lg" />
              <div className="p-4">
                <Skeleton className="h-16 w-16 rounded-full -mt-8" />
                <Skeleton className="mt-2 h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-24" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
                <Skeleton className="mt-3 h-4 w-20" />
                <Skeleton className="mt-3 h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
