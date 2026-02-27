// ============================================================================
// Subscribe Button — Handles subscription state & tier selection
// ============================================================================

"use client";

import * as React from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  isPopular?: boolean;
}

export interface SubscribeButtonProps {
  /** Creator's user ID. */
  creatorId: string;
  /** Creator's display name. */
  creatorName: string;
  /** Available subscription tiers. */
  tiers: SubscriptionTier[];
  /** Whether the current user is already subscribed. */
  isSubscribed?: boolean;
  /** Name of the current subscription tier (if subscribed). */
  currentTierName?: string;
  /** Additional class names. */
  className?: string;
  /** Compact mode for card display. */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// SubscribeButton
// ---------------------------------------------------------------------------

export function SubscribeButton({
  creatorId,
  creatorName,
  tiers,
  isSubscribed = false,
  currentTierName,
  className,
  compact = false,
}: SubscribeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedTierId, setSelectedTierId] = React.useState<string | null>(
    null,
  );

  // Default to cheapest tier
  const sortedTiers = React.useMemo(
    () => [...tiers].sort((a, b) => a.price - b.price),
    [tiers],
  );

  const handleSubscribe = async (tierId: string) => {
    setLoading(true);
    setSelectedTierId(tierId);

    try {
      const res = await fetch(`/api/creators/${creatorId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      // Redirect to Stripe Checkout if a URL is returned
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Otherwise refresh and close
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("[SubscribeButton] Error:", error);
    } finally {
      setLoading(false);
      setSelectedTierId(null);
    }
  };

  // -- Already subscribed state --
  if (isSubscribed) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn(
          "border-primary/50 text-primary hover:bg-primary/10",
          className,
        )}
        onClick={() => router.push(`/settings`)}
      >
        <Check className="h-4 w-4" />
        {compact ? "Subscribed" : `Subscribed${currentTierName ? ` — ${currentTierName}` : ""}`}
      </Button>
    );
  }

  // -- No tiers available --
  if (tiers.length === 0) {
    return (
      <Button
        variant="default"
        size={compact ? "sm" : "default"}
        className={className}
        disabled
      >
        No plans available
      </Button>
    );
  }

  // -- Single tier: subscribe directly --
  if (tiers.length === 1) {
    const tier = sortedTiers[0];
    return (
      <Button
        variant="default"
        size={compact ? "sm" : "default"}
        className={cn("shadow-gold-sm", className)}
        loading={loading}
        onClick={() => handleSubscribe(tier.id)}
      >
        <Crown className="h-4 w-4" />
        Subscribe — ${tier.price.toFixed(2)}/mo
      </Button>
    );
  }

  // -- Multiple tiers: open selection modal --
  return (
    <>
      <Button
        variant="default"
        size={compact ? "sm" : "default"}
        className={cn("shadow-gold-sm", className)}
        onClick={() => setOpen(true)}
      >
        <Crown className="h-4 w-4" />
        {compact ? "Subscribe" : `Subscribe from $${sortedTiers[0].price.toFixed(2)}/mo`}
      </Button>

      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to {creatorName}</DialogTitle>
            <DialogDescription>
              Choose a subscription tier to unlock exclusive content.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            {sortedTiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                disabled={loading}
                onClick={() => handleSubscribe(tier.id)}
                className={cn(
                  "relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-gold-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                  tier.isPopular
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                {tier.isPopular && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-gold-gradient px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground shadow-gold-sm">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">
                    {tier.name}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    ${tier.price.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /mo
                    </span>
                  </span>
                </div>

                {tier.description && (
                  <p className="text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                )}

                {tier.features.length > 0 && (
                  <ul className="flex flex-col gap-1 pt-1">
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {loading && selectedTierId === tier.id && (
                  <div className="flex items-center justify-center py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
