import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-lg text-center">
        {/* Floating halo animation */}
        <div className="mx-auto mb-8 animate-float">
          <div className="relative mx-auto h-32 w-32">
            {/* Outer halo ring */}
            <div className="absolute inset-0 animate-halo-spin rounded-full border-4 border-[hsl(48,100%,50%,0.3)]" />
            {/* Inner halo ring */}
            <div className="absolute inset-3 rounded-full border-2 border-[hsl(48,100%,50%,0.15)]" />
            {/* 404 text in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-[hsl(48,100%,50%)]">
                404
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-full bg-[hsl(48,100%,50%,0.05)] blur-xl" />
          </div>
        </div>

        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-1 text-xl font-bold tracking-wide">
          <span className="text-foreground">Only</span>
          <span className="text-[hsl(48,100%,50%)]">Halos</span>
        </div>

        <h1 className="mb-3 font-[family-name:var(--font-playfair)] text-4xl font-bold text-foreground">
          Lost in the Halo
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          The page you&apos;re looking for has ascended beyond our reach. It may
          have been moved, deleted, or never existed in the first place.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[hsl(48,100%,50%)] px-8 py-3 text-sm font-semibold text-[hsl(240,6%,7%)] transition-all hover:bg-[hsl(48,100%,60%)] hover:shadow-lg hover:shadow-[hsl(48,100%,50%,0.25)]"
          >
            Return Home
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Explore Creators
          </Link>
        </div>
      </div>
    </div>
  );
}
