"use client";

// ============================================================================
// Edit Post Page
// ============================================================================

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { PostForm } from "@/components/post/post-form";
import { type UploadedMedia } from "@/components/post/media-upload-zone";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierOption {
  id: string;
  name: string;
  price: number;
}

interface PostData {
  id: string;
  caption: string | null;
  visibility: "PUBLIC" | "SUBSCRIBERS" | "TIER" | "PPV";
  minimumTierId: string | null;
  ppvPrice: number | null;
  scheduledAt: string | null;
  media: {
    id: string;
    type: "IMAGE" | "VIDEO";
    url: string;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
  }[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EditPostPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Fetch post and tiers
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [postRes, tiersRes] = await Promise.all([
          fetch(`/api/posts/${postId}`),
          fetch("/api/tiers"),
        ]);

        if (!postRes.ok) {
          if (postRes.status === 404) {
            setError("Post not found.");
          } else if (postRes.status === 403) {
            setError("You do not have permission to edit this post.");
          } else {
            setError("Failed to load post.");
          }
          return;
        }

        const postData = await postRes.json();

        // Verify ownership
        if (
          postData.creator?.id !== session.user.id &&
          session.user.role !== "ADMIN"
        ) {
          setError("You can only edit your own posts.");
          return;
        }

        setPost(postData);

        if (tiersRes.ok) {
          const tiersData = await tiersRes.json();
          setTiers(
            (tiersData.tiers || tiersData || []).map(
              (t: { id: string; name: string; price: number }) => ({
                id: t.id,
                name: t.name,
                price: t.price,
              }),
            ),
          );
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, router, session, sessionStatus]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (sessionStatus === "loading" || loading) {
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

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/creator/posts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {error}
          </h2>
          <Link
            href="/creator/posts"
            className="text-sm text-primary hover:underline"
          >
            Return to posts
          </Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  // Map post media to UploadedMedia format for the form
  const formMedia: UploadedMedia[] = post.media.map((m) => ({
    id: m.id,
    key: m.url, // The URL stored is the S3 key
    url: m.url,
    type: m.type,
    width: m.width || undefined,
    height: m.height || undefined,
    size: 0,
    mimeType: "",
    previewUrl: m.thumbnailUrl || m.url,
  }));

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
        <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
        <p className="text-sm text-muted-foreground">
          Update your post content and settings
        </p>
      </div>

      {/* Post Form in edit mode */}
      <PostForm
        mode="edit"
        tiers={tiers}
        initialData={{
          id: post.id,
          caption: post.caption || "",
          visibility: post.visibility,
          minimumTierId: post.minimumTierId,
          ppvPrice: post.ppvPrice,
          scheduledAt: post.scheduledAt,
          media: formMedia,
        }}
      />
    </div>
  );
}
