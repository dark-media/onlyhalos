"use client";

// ============================================================================
// Content Paywall Overlay
// ============================================================================

import React from "react";
import { Lock, Crown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentPaywallProps {
  visibility: "SUBSCRIBERS" | "TIER" | "PPV";
  /** Subscription price in cents (for SUBSCRIBERS visibility). */
  subscriptionPriceCents?: number;
  /** Tier name (for TIER visibility). */
  tierName?: string;
  /** Tier price in cents (for TIER visibility). */
  tierPriceCents?: number;
  /** PPV price in dollars (for PPV visibility). */
  ppvPrice?: number;
  /** Creator username for subscribe link. */
  creatorUsername?: string;
  /** Called when user clicks the PPV purchase button. */
  onPurchase?: () => void;
  /** Whether a purchase is in progress. */
  purchasing?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContentPaywall({
  visibility,
  subscriptionPriceCents,
  tierName,
  tierPriceCents,
  ppvPrice,
  creatorUsername,
  onPurchase,
  purchasing = false,
  className,
}: ContentPaywallProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center",
        "bg-dark-900/60 backdrop-blur-lg",
        "rounded-lg border border-primary/20",
        className,
      )}
    >
      {/* Lock icon with gold glow */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30">
        {visibility === "PPV" ? (
          <ShoppingCart className="h-8 w-8 text-primary" />
        ) : visibility === "TIER" ? (
          <Crown className="h-8 w-8 text-primary" />
        ) : (
          <Lock className="h-8 w-8 text-primary" />
        )}
      </div>

      {/* Message */}
      {visibility === "SUBSCRIBERS" && (
        <>
          <p className="mb-1 text-lg font-semibold text-foreground">
            Subscribe to see this content
          </p>
          {subscriptionPriceCents != null && (
            <p className="mb-4 text-sm text-muted-foreground">
              Starting at {formatPrice(subscriptionPriceCents)}/month
            </p>
          )}
          <Button asChild>
            <a href={creatorUsername ? `/${creatorUsername}` : "#"}>
              Subscribe Now
            </a>
          </Button>
        </>
      )}

      {visibility === "TIER" && (
        <>
          <p className="mb-1 text-lg font-semibold text-foreground">
            Upgrade to {tierName || "a higher tier"} to unlock
          </p>
          {tierPriceCents != null && (
            <p className="mb-4 text-sm text-muted-foreground">
              {formatPrice(tierPriceCents)}/month
            </p>
          )}
          <Button asChild>
            <a href={creatorUsername ? `/${creatorUsername}` : "#"}>
              Upgrade Tier
            </a>
          </Button>
        </>
      )}

      {visibility === "PPV" && (
        <>
          <p className="mb-1 text-lg font-semibold text-foreground">
            Exclusive Content
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            Unlock this post for{" "}
            <span className="font-semibold text-primary">
              ${ppvPrice?.toFixed(2) ?? "0.00"}
            </span>
          </p>
          <Button onClick={onPurchase} loading={purchasing}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase Now
          </Button>
        </>
      )}
    </div>
  );
}
