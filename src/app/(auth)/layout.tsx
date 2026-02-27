// ============================================================================
// Auth Layout
// ============================================================================

import Link from "next/link";

import { siteConfig } from "@/config/site";

// ---------------------------------------------------------------------------
// Halo Logo (inline SVG)
// ---------------------------------------------------------------------------

function HaloLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="drop-shadow-[0_0_8px_rgba(255,199,0,0.4)]"
    >
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="url(#haloGradient)"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="20"
        cy="20"
        r="10"
        stroke="url(#haloGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <defs>
        <linearGradient
          id="haloGradient"
          x1="4"
          y1="4"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFD740" />
          <stop offset="0.5" stopColor="#FFC700" />
          <stop offset="1" stopColor="#E0AF00" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* ── Background ambient glow ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Top-center gold glow */}
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-halo-gold/5 blur-[120px]" />
        {/* Bottom-right subtle glow */}
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-halo-gold/[0.03] blur-[100px]" />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(48 100% 50%) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="group relative z-10 mb-8 flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <HaloLogo />
        <span className="bg-gold-gradient bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          {siteConfig.name}
        </span>
      </Link>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md">{children}</div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
        reserved.
      </p>
    </div>
  );
}
