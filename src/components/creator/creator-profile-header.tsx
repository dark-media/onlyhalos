// ============================================================================
// Creator Profile Header — Full profile header with cover, avatar, stats
// ============================================================================

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  MapPin,
  Heart,
  Users,
  FileText,
  Share2,
  Settings,
} from "lucide-react";

import { cn, formatNumber, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/creator/verification-badge";
import { SubscribeButton } from "@/components/creator/subscribe-button";
import { TipDialog } from "@/components/creator/tip-dialog";
import type { SubscriptionTier } from "@/components/creator/subscribe-button";

// ---------------------------------------------------------------------------
// Social icon helper
// ---------------------------------------------------------------------------

function SocialIcon({
  platform,
}: {
  platform: "twitter" | "instagram" | "tiktok" | "website";
}) {
  switch (platform) {
    case "twitter":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.58a8.27 8.27 0 0 0 4.85 1.56V6.69h-1.09z" />
        </svg>
      );
    case "website":
    default:
      return <Globe className="h-4 w-4" />;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatorProfileData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  creatorBio: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  isVerified: boolean;
  postCount: number;
  subscriberCount: number;
  likeCount: number;
  tiers: SubscriptionTier[];
  isSubscribed: boolean;
  currentTierName?: string;
  isOwnProfile: boolean;
}

export interface CreatorProfileHeaderProps {
  creator: CreatorProfileData;
  className?: string;
}

// ---------------------------------------------------------------------------
// CreatorProfileHeader
// ---------------------------------------------------------------------------

export function CreatorProfileHeader({
  creator,
  className,
}: CreatorProfileHeaderProps) {
  const [shareTooltip, setShareTooltip] = React.useState(false);

  const socialLinks = [
    { platform: "website" as const, url: creator.websiteUrl },
    { platform: "twitter" as const, url: creator.twitterUrl },
    { platform: "instagram" as const, url: creator.instagramUrl },
    { platform: "tiktok" as const, url: creator.tiktokUrl },
  ].filter((s) => s.url);

  const handleShare = async () => {
    const url = `${window.location.origin}/${creator.username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${creator.displayName} on OnlyHalos`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      {/* Cover photo */}
      <div className="relative h-40 sm:h-52 md:h-64 w-full overflow-hidden">
        {creator.coverUrl ? (
          <Image
            src={creator.coverUrl}
            alt={`${creator.displayName} cover photo`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5" />
        )}
        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* Profile info */}
      <div className="relative px-4 sm:px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-12 sm:-mt-16 mb-3">
          <Avatar
            size="xl"
            className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-card hover:ring-primary/50"
          >
            {creator.avatarUrl ? (
              <AvatarImage src={creator.avatarUrl} alt={creator.displayName} />
            ) : null}
            <AvatarFallback className="text-xl sm:text-2xl">
              {getInitials(creator.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Top row: name + actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            {/* Name + verification */}
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-foreground">
                {creator.displayName}
              </h1>
              {creator.isVerified && <VerificationBadge size="lg" />}
            </div>

            {/* Username */}
            <p className="text-base text-muted-foreground">
              @{creator.username}
            </p>

            {/* Bio */}
            {(creator.creatorBio || creator.bio) && (
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {creator.creatorBio || creator.bio}
              </p>
            )}

            {/* Location + social links */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {creator.location && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {creator.location}
                </span>
              )}
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={`Visit ${social.platform}`}
                >
                  <SocialIcon platform={social.platform} />
                </a>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {creator.isOwnProfile ? (
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            ) : (
              <>
                <SubscribeButton
                  creatorId={creator.id}
                  creatorName={creator.displayName}
                  tiers={creator.tiers}
                  isSubscribed={creator.isSubscribed}
                  currentTierName={creator.currentTierName}
                />
                <TipDialog
                  creatorId={creator.id}
                  creatorName={creator.displayName}
                />
              </>
            )}

            {/* Share */}
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              {shareTooltip && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-dark-lg">
                  Link copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex items-center gap-6 border-t border-border pt-4">
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(creator.postCount)}
            </span>
            <span className="text-sm text-muted-foreground">Posts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(creator.subscriberCount)}
            </span>
            <span className="text-sm text-muted-foreground">Subscribers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(creator.likeCount)}
            </span>
            <span className="text-sm text-muted-foreground">Likes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
