export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Halo spinner */}
        <div className="relative h-20 w-20">
          {/* Outer ring */}
          <div className="absolute inset-0 animate-halo-spin rounded-full border-4 border-transparent border-t-[hsl(48,100%,50%)] border-r-[hsl(48,100%,50%,0.3)]" />
          {/* Inner ring */}
          <div
            className="absolute inset-2 animate-halo-spin rounded-full border-4 border-transparent border-b-[hsl(48,100%,60%)] border-l-[hsl(48,100%,60%,0.3)]"
            style={{ animationDirection: "reverse", animationDuration: "2s" }}
          />
          {/* Center glow */}
          <div className="absolute inset-5 animate-halo-pulse rounded-full bg-[hsl(48,100%,50%,0.15)]" />
        </div>
        {/* Brand text */}
        <div className="flex items-center gap-1 text-lg font-semibold tracking-wide">
          <span className="text-foreground">Only</span>
          <span className="text-[hsl(48,100%,50%)]">Halos</span>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
