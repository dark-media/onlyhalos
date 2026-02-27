// ============================================================================
// Creator Card — Card component for explore/search grids
// ============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";

import { cn, formatNumber, getInitials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/creator/verification-badge";
import { SubscribeButton } from "@/components/creator/subscribe-button";
import type { SubscriptionTier } from "@/components/creator/subscribe-button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatorCardData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  subscriberCount: number;
  category?: string | null;
  tiers: SubscriptionTier[];
  isSubscribed?: boolean;
  currentTierName?: string;
}

export interface CreatorCardProps {
  creator: CreatorCardData;
  className?: string;
}

// ---------------------------------------------------------------------------
// CreatorCard
// ---------------------------------------------------------------------------

export function CreatorCard({ creator, className }: CreatorCardProps) {
  return (
    <Card
      hover
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:border-primary/50 hover:shadow-gold-md",
        className,
      )}
    >
      {/* Cover image or gradient fallback */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-28 w-full overflow-hidden">
          {creator.coverUrl ? (
            <Image
              src={creator.coverUrl}
              alt={`${creator.displayName} cover`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      </Link>

      <CardContent className="relative -mt-8 px-4 pb-4">
        {/* Avatar */}
        <Link href={`/${creator.username}`} className="block">
          <Avatar size="lg" className="ring-4 ring-card">
            {creator.avatarUrl ? (
              <AvatarImage src={creator.avatarUrl} alt={creator.displayName} />
            ) : null}
            <AvatarFallback>
              {getInitials(creator.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Name + verification */}
        <div className="mt-2">
          <Link
            href={`/${creator.username}`}
            className="group/name flex items-center gap-1.5"
          >
            <h3 className="truncate text-base font-semibold text-foreground group-hover/name:text-primary transition-colors">
              {creator.displayName}
            </h3>
            {creator.isVerified && <VerificationBadge size="sm" />}
          </Link>
          <p className="text-sm text-muted-foreground">@{creator.username}</p>
        </div>

        {/* Category badge */}
        {creator.category && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {creator.category}
            </Badge>
          </div>
        )}

        {/* Bio preview (2 lines) */}
        {creator.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {creator.bio}
          </p>
        )}

        {/* Subscriber count */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{formatNumber(creator.subscriberCount)} subscribers</span>
        </div>

        {/* Subscribe button */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <SubscribeButton
            creatorId={creator.id}
            creatorName={creator.displayName}
            tiers={creator.tiers}
            isSubscribed={creator.isSubscribed}
            currentTierName={creator.currentTierName}
            compact
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
