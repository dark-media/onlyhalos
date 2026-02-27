"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Animated halo envelope icon
// ---------------------------------------------------------------------------

function HaloEnvelopeIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Spinning halo ring */}
      <svg
        className="absolute inset-0 h-full w-full animate-halo-spin"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke="url(#verifyHaloGrad)"
          strokeWidth="2"
          strokeDasharray="8 6"
          opacity="0.5"
        />
        <defs>
          <linearGradient
            id="verifyHaloGrad"
            x1="4"
            y1="4"
            x2="76"
            y2="76"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFD740" />
            <stop offset="1" stopColor="#E0AF00" />
          </linearGradient>
        </defs>
      </svg>

      {/* Pulsing glow backdrop */}
      <div className="absolute inset-2 animate-halo-pulse rounded-full bg-primary/10" />

      {/* Envelope SVG */}
      <svg
        className="relative z-10 h-full w-full p-4 text-primary drop-shadow-[0_0_12px_rgba(255,199,0,0.4)]"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M2 7l8.913 5.478a2 2 0 002.174 0L22 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Small gold sparkle */}
        <circle cx="19" cy="5" r="1.5" fill="#FFD740" opacity="0.8">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VerifyEmailContent
// ---------------------------------------------------------------------------

interface VerifyEmailContentProps {
  className?: string;
}

export function VerifyEmailContent({ className }: VerifyEmailContentProps) {
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleResend() {
    try {
      setResending(true);
      setError(null);
      setResent(false);

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ||
            "Could not resend verification email. Please try again."
        );
        return;
      }

      setResent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      className={cn("flex flex-col items-center space-y-6 py-2", className)}
    >
      {/* Animated halo envelope */}
      <HaloEnvelopeIcon className="h-20 w-20" />

      {/* Message */}
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Check Your Email
        </h3>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          We&apos;ve sent a verification link to your email address. Click the
          link to activate your account and start exploring OnlyHalos.
        </p>
      </div>

      {/* Status messages */}
      {resent && (
        <div className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-400">
          Verification email resent successfully!
        </div>
      )}
      {error && (
        <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleResend}
          loading={resending}
          disabled={resending}
        >
          Resend Verification Email
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-halo-gold-light"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-muted-foreground">
        Didn&apos;t receive an email? Check your spam folder or try resending.
      </p>
    </div>
  );
}
