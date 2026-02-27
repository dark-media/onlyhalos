"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("OnlyHalos Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Halo icon with error state */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-[hsl(0,84%,60%,0.4)]" />
            <div className="absolute inset-2 rounded-full border-2 border-[hsl(0,84%,60%,0.2)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="mb-4 flex items-center justify-center gap-1 text-xl font-bold tracking-wide">
          <span className="text-foreground">Only</span>
          <span className="text-[hsl(48,100%,50%)]">Halos</span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-foreground">
          Something Went Wrong
        </h1>
        <p className="mb-2 text-muted-foreground">
          We encountered an unexpected error. Our team has been notified.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-[hsl(48,100%,50%)] px-6 py-3 text-sm font-semibold text-[hsl(240,6%,7%)] transition-all hover:bg-[hsl(48,100%,60%)] hover:shadow-lg hover:shadow-[hsl(48,100%,50%,0.2)]"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
