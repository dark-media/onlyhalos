import * as React from "react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-dark-300 bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_0%,hsl(var(--muted)/0.4)_50%,transparent_100%)] animate-shimmer",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
Skeleton.displayName = "Skeleton";

export { Skeleton };
