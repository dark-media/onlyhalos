// ============================================================================
// Creator Profile Page — Dynamic [username] route
// ============================================================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { CreatorProfileHeader } from "@/components/creator/creator-profile-header";
import { CreatorTiersDisplay } from "@/components/creator/creator-tiers-display";
import { ProfilePostsFeed } from "@/components/creator/profile-posts-feed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ username: string }>;
}

interface TierSelectResult {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  _count: { subscriptions: number };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { displayName: true, bio: true, avatarUrl: true, isCreator: true },
  });

  if (!user || !user.isCreator) {
    return { title: "Profile Not Found" };
  }

  return {
    title: `${user.displayName ?? username} — ${siteConfig.name}`,
    description:
      user.bio?.slice(0, 160) ??
      `Check out ${user.displayName ?? username} on ${siteConfig.name}`,
    openGraph: {
      title: `${user.displayName ?? username} on ${siteConfig.name}`,
      description:
        user.bio?.slice(0, 160) ??
        `Subscribe to ${user.displayName ?? username} for exclusive content.`,
      images: user.avatarUrl ? [{ url: user.avatarUrl }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.displayName ?? username} on ${siteConfig.name}`,
      description:
        user.bio?.slice(0, 160) ??
        `Subscribe to ${user.displayName ?? username} for exclusive content.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: Fetch full creator profile
// ---------------------------------------------------------------------------

async function getCreatorProfile(username: string, currentUserId?: string) {
  const creator = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      creatorBio: true,
      location: true,
      websiteUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      isCreator: true,
      verificationStatus: true,
      subscriptionTiers: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          features: true,
          _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
        },
      },
      _count: {
        select: {
          posts: { where: { isPublished: true } },
          subscriptionsAsCreator: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  if (!creator || !creator.isCreator) return null;

  // Get total likes across all posts
  const likeAgg = await prisma.post.aggregate({
    where: { creatorId: creator.id, isPublished: true },
    _sum: { likeCount: true },
  });

  // Check subscription status for current user
  let subscription: { tier: { name: string }; tierId: string } | null = null;
  if (currentUserId && currentUserId !== creator.id) {
    subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: currentUserId,
          creatorId: creator.id,
        },
      },
      select: { tierId: true, tier: { select: { name: true } } },
    });
  }

  return {
    id: creator.id,
    username: creator.username!,
    displayName: creator.displayName ?? creator.username!,
    avatarUrl: creator.avatarUrl,
    coverUrl: creator.coverUrl,
    bio: creator.bio,
    creatorBio: creator.creatorBio,
    location: creator.location,
    websiteUrl: creator.websiteUrl,
    twitterUrl: creator.twitterUrl,
    instagramUrl: creator.instagramUrl,
    tiktokUrl: creator.tiktokUrl,
    isVerified: creator.verificationStatus === "VERIFIED",
    postCount: creator._count.posts,
    subscriberCount: creator._count.subscriptionsAsCreator,
    likeCount: likeAgg._sum.likeCount ?? 0,
    tiers: (creator.subscriptionTiers as TierSelectResult[]).map(
      (t: TierSelectResult) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        description: t.description,
        features: t.features,
        subscriberCount: t._count.subscriptions,
      }),
    ),
    isSubscribed: !!subscription,
    currentTierName: subscription?.tier.name,
    currentTierId: subscription?.tierId ?? null,
    isOwnProfile: currentUserId === creator.id,
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function CreatorProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();
  const profile = await getCreatorProfile(username, session?.user?.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <CreatorProfileHeader creator={profile} />

      {/* Subscription tiers */}
      {profile.tiers.length > 0 && (
        <CreatorTiersDisplay
          creatorId={profile.id}
          creatorName={profile.displayName}
          tiers={profile.tiers}
          currentTierId={profile.currentTierId}
        />
      )}

      {/* Posts feed with tabs */}
      <ProfilePostsFeed
        creatorId={profile.id}
        creatorUsername={profile.username}
        isOwnProfile={profile.isOwnProfile}
        isSubscribed={profile.isSubscribed}
      />
    </div>
  );
}
