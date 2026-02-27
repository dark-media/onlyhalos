"use client";

import * as React from "react";
import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Google Logo SVG
// ---------------------------------------------------------------------------

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SocialLoginButtons
// ---------------------------------------------------------------------------

interface SocialLoginButtonsProps {
  className?: string;
  /** Where to redirect after social sign-in. Defaults to "/feed". */
  callbackUrl?: string;
}

export function SocialLoginButtons({
  className,
  callbackUrl = "/feed",
}: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl });
    } catch {
      // next-auth redirect will handle navigation
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Google button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full border-border/60 bg-dark-50 text-foreground hover:border-border hover:bg-dark-100"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        loading={isLoading}
      >
        {!isLoading && <GoogleLogo className="h-5 w-5" />}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border/50" />
        <span className="mx-4 text-xs uppercase tracking-wider text-muted-foreground">
          or continue with email
        </span>
        <div className="flex-1 border-t border-border/50" />
      </div>
    </div>
  );
}
