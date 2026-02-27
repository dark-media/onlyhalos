// ============================================================================
// Verification Badge — Gold halo icon with checkmark for verified creators
// ============================================================================

"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationBadgeProps {
  /** Additional class names. */
  className?: string;
  /** Size variant. */
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: { outer: "h-4 w-4", check: "h-2 w-2" },
  default: { outer: "h-5 w-5", check: "h-2.5 w-2.5" },
  lg: { outer: "h-6 w-6", check: "h-3 w-3" },
} as const;

// ---------------------------------------------------------------------------
// VerificationBadge
// ---------------------------------------------------------------------------

export function VerificationBadge({
  className,
  size = "default",
}: VerificationBadgeProps) {
  const { outer, check } = sizeMap[size];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "relative inline-flex shrink-0 items-center justify-center rounded-full",
              "bg-gold-gradient shadow-gold-sm",
              "animate-pulse-glow",
              outer,
              className,
            )}
            aria-label="Verified Creator"
          >
            {/* Halo ring */}
            <span
              className={cn(
                "absolute inset-0 rounded-full",
                "ring-2 ring-primary/30 ring-offset-1 ring-offset-transparent",
              )}
            />
            <Check className={cn("text-primary-foreground", check)} strokeWidth={3} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Verified Creator
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
