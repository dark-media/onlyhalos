"use client";

// ============================================================================
// Create Post Page
// ============================================================================

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/post/post-form";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierOption {
  id: string;
  name: string;
  price: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CreatePostPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  // Fetch creator's tiers
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const fetchTiers = async () => {
      try {
        const res = await fetch("/api/tiers");
        if (res.ok) {
          const data = await res.json();
          setTiers(
            (data.tiers || data || []).map(
              (t: { id: string; name: string; price: number }) => ({
                id: t.id,
                name: t.name,
                price: t.price,
              }),
            ),
          );
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingTiers(false);
      }
    };

    fetchTiers();
  }, [router, session, sessionStatus]);

  if (sessionStatus === "loading" || loadingTiers) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/creator/posts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create New Post</h1>
        <p className="text-sm text-muted-foreground">
          Share content with your subscribers
        </p>
      </div>

      {/* Post Form */}
      <PostForm mode="create" tiers={tiers} />
    </div>
  );
}
