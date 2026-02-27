// ============================================================================
// Creator Tiers Display — Shows all subscription tiers for a creator
// ============================================================================

"use client";

import * as React from "react";
import { Check, Crown, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier } from "@/components/creator/subscribe-button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatorTiersDisplayProps {
  /** Creator's user ID. */
  creatorId: string;
  /** Creator's display name. */
  creatorName: string;
  /** List of subscription tiers. */
  tiers: (SubscriptionTier & { subscriberCount?: number })[];
  /** ID of the tier the current user is subscribed to (if any). */
  currentTierId?: string | null;
  /** Callback when a tier's subscribe button is clicked. */
  onSubscribe?: (tierId: string) => void;
  /** Additional class names. */
  className?: string;
}

// ---------------------------------------------------------------------------
// CreatorTiersDisplay
// ---------------------------------------------------------------------------

export function CreatorTiersDisplay({
  creatorId,
  creatorName,
  tiers,
  currentTierId,
  onSubscribe,
  className,
}: CreatorTiersDisplayProps) {
  const sortedTiers = React.useMemo(
    () => [...tiers].sort((a, b) => a.price - b.price),
    [tiers],
  );

  if (sortedTiers.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Crown className="h-5 w-5 text-primary" />
        Subscription Tiers
      </h2>

      <div
        className={cn(
          "grid gap-4",
          sortedTiers.length === 1 && "grid-cols-1 max-w-sm",
          sortedTiers.length === 2 && "grid-cols-1 sm:grid-cols-2",
          sortedTiers.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {sortedTiers.map((tier, index) => {
          const isCurrentTier = currentTierId === tier.id;
          const isPremium = index === sortedTiers.length - 1 && sortedTiers.length > 1;

          return (
            <Card
              key={tier.id}
              hover
              className={cn(
                "relative flex flex-col overflow-hidden transition-all",
                tier.isPopular && "ring-2 ring-primary/40",
                isPremium && "border-primary/30",
              )}
            >
              {/* Gold gradient accent on premium tiers */}
              {isPremium && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
              )}

              {/* Most Popular badge */}
              {tier.isPopular && (
                <div className="absolute -right-8 top-3 rotate-45 bg-gold-gradient px-8 py-0.5">
                  <span className="text-[10px] font-bold uppercase text-primary-foreground">
                    Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {isPremium && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                      {tier.name}
                    </CardTitle>
                    {tier.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">
                    ${tier.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col">
                {/* Features list */}
                {tier.features.length > 0 && (
                  <ul className="flex flex-col gap-2 pb-4">
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                {/* Subscribe / Current button */}
                {isCurrentTier ? (
                  <Badge
                    variant="premium"
                    className="mt-3 w-full justify-center py-2 text-sm"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Your Current Plan
                  </Badge>
                ) : (
                  <Button
                    variant={isPremium || tier.isPopular ? "default" : "outline"}
                    className={cn(
                      "mt-3 w-full",
                      (isPremium || tier.isPopular) && "shadow-gold-sm",
                    )}
                    onClick={() => onSubscribe?.(tier.id)}
                  >
                    <Crown className="h-4 w-4" />
                    Subscribe — ${tier.price.toFixed(2)}/mo
                  </Button>
                )}

                {/* Subscriber count */}
                {tier.subscriberCount !== undefined && tier.subscriberCount > 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {tier.subscriberCount.toLocaleString()}{" "}
                    {tier.subscriberCount === 1 ? "subscriber" : "subscribers"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
