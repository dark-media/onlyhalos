"use client";

// ============================================================================
// Post Form — Create / Edit post form
// ============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Lock,
  Crown,
  ShoppingCart,
  Calendar,
  Send,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MediaUploadZone,
  type UploadedMedia,
} from "@/components/post/media-upload-zone";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PostVisibility = "PUBLIC" | "SUBSCRIBERS" | "TIER" | "PPV";

interface TierOption {
  id: string;
  name: string;
  price: number;
}

interface PostFormData {
  id?: string;
  caption: string;
  visibility: PostVisibility;
  minimumTierId: string | null;
  ppvPrice: number | null;
  scheduledAt: string | null;
  media: UploadedMedia[];
}

interface PostFormProps {
  /** Existing post data for edit mode. */
  initialData?: PostFormData;
  /** Available tiers for the creator. */
  tiers?: TierOption[];
  /** Form mode. */
  mode?: "create" | "edit";
  className?: string;
}

const MAX_CAPTION = 2000;

const VISIBILITY_OPTIONS: {
  value: PostVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Visible to everyone",
    icon: Eye,
  },
  {
    value: "SUBSCRIBERS",
    label: "Subscribers Only",
    description: "Only your subscribers can see this",
    icon: Lock,
  },
  {
    value: "TIER",
    label: "Specific Tier",
    description: "Minimum subscription tier required",
    icon: Crown,
  },
  {
    value: "PPV",
    label: "Pay-Per-View",
    description: "One-time purchase to unlock",
    icon: ShoppingCart,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostForm({
  initialData,
  tiers = [],
  mode = "create",
  className,
}: PostFormProps) {
  const router = useRouter();

  // Form state
  const [caption, setCaption] = useState(initialData?.caption ?? "");
  const [visibility, setVisibility] = useState<PostVisibility>(
    initialData?.visibility ?? "PUBLIC",
  );
  const [minimumTierId, setMinimumTierId] = useState<string | null>(
    initialData?.minimumTierId ?? null,
  );
  const [ppvPrice, setPpvPrice] = useState<string>(
    initialData?.ppvPrice != null ? initialData.ppvPrice.toString() : "",
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(
    !!initialData?.scheduledAt,
  );
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : "",
  );
  const [media, setMedia] = useState<UploadedMedia[]>(
    initialData?.media ?? [],
  );

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (caption.length > MAX_CAPTION) {
      newErrors.caption = `Caption must be at most ${MAX_CAPTION} characters.`;
    }

    if (media.length === 0) {
      newErrors.media = "At least one media file is required.";
    }

    if (visibility === "TIER" && !minimumTierId) {
      newErrors.minimumTierId = "Please select a tier.";
    }

    if (visibility === "PPV") {
      const price = parseFloat(ppvPrice);
      if (isNaN(price) || price < 1.99 || price > 499.99) {
        newErrors.ppvPrice = "Price must be between $1.99 and $499.99.";
      }
    }

    if (scheduleEnabled && !scheduledDate) {
      newErrors.scheduledAt = "Please select a date and time.";
    }

    if (scheduleEnabled && scheduledDate) {
      const scheduledTime = new Date(scheduledDate);
      if (scheduledTime <= new Date()) {
        newErrors.scheduledAt = "Scheduled time must be in the future.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [caption, media, visibility, minimumTierId, ppvPrice, scheduleEnabled, scheduledDate]);

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);

      try {
        const body: Record<string, unknown> = {
          caption: caption.trim() || null,
          visibility,
          mediaIds: media.map((m) => m.id),
          minimumTierId:
            visibility === "TIER" ? minimumTierId : null,
          ppvPrice:
            visibility === "PPV" ? parseFloat(ppvPrice) : null,
          scheduledAt:
            scheduleEnabled && scheduledDate
              ? new Date(scheduledDate).toISOString()
              : null,
        };

        const url =
          mode === "edit" && initialData?.id
            ? `/api/posts/${initialData.id}`
            : "/api/posts";

        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.errors && typeof data.errors === "object") {
            setErrors(data.errors);
          } else {
            setErrors({
              submit: data.error || "Failed to save post.",
            });
          }
          return;
        }

        const post = await res.json();

        // Redirect to creator posts page
        router.push("/creator/posts");
        router.refresh();
      } catch (err) {
        setErrors({
          submit:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      caption,
      initialData?.id,
      media,
      minimumTierId,
      mode,
      ppvPrice,
      router,
      scheduleEnabled,
      scheduledDate,
      validate,
      visibility,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="caption">Caption</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption for your post..."
          maxCharacters={MAX_CAPTION}
          autoResize
          rows={4}
          error={!!errors.caption}
        />
        {errors.caption && (
          <p className="text-xs text-destructive">{errors.caption}</p>
        )}
      </div>

      {/* Media Upload */}
      <div className="space-y-2">
        <Label>Media</Label>
        <MediaUploadZone
          value={media}
          onChange={setMedia}
          maxFiles={10}
        />
        {errors.media && (
          <p className="text-xs text-destructive">{errors.media}</p>
        )}
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <Label>Visibility</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = visibility === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisibility(option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:border-primary/50",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier selector (conditional) */}
      {visibility === "TIER" && (
        <div className="space-y-2">
          <Label htmlFor="tier">Minimum Tier</Label>
          {tiers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not created any subscription tiers yet.{" "}
              <a href="/creator/tiers" className="text-primary hover:underline">
                Create a tier
              </a>
            </p>
          ) : (
            <select
              id="tier"
              value={minimumTierId || ""}
              onChange={(e) => setMinimumTierId(e.target.value || null)}
              className={cn(
                "w-full rounded-lg border bg-transparent px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                errors.minimumTierId
                  ? "border-destructive"
                  : "border-border",
              )}
            >
              <option value="">Select a tier...</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} — ${tier.price.toFixed(2)}/mo
                </option>
              ))}
            </select>
          )}
          {errors.minimumTierId && (
            <p className="text-xs text-destructive">{errors.minimumTierId}</p>
          )}
        </div>
      )}

      {/* PPV price (conditional) */}
      {visibility === "PPV" && (
        <div className="space-y-2">
          <Label htmlFor="ppvPrice">Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="ppvPrice"
              type="number"
              step="0.01"
              min="1.99"
              max="499.99"
              value={ppvPrice}
              onChange={(e) => setPpvPrice(e.target.value)}
              placeholder="9.99"
              className={cn(
                "pl-7",
                errors.ppvPrice && "border-destructive",
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Set a price between $1.99 and $499.99
          </p>
          {errors.ppvPrice && (
            <p className="text-xs text-destructive">{errors.ppvPrice}</p>
          )}
        </div>
      )}

      {/* Schedule toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="schedule" className="cursor-pointer">
              Schedule Post
            </Label>
          </div>
          <Switch
            id="schedule"
            checked={scheduleEnabled}
            onCheckedChange={setScheduleEnabled}
          />
        </div>

        {scheduleEnabled && (
          <div className="space-y-2">
            <Input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={errors.scheduledAt ? "border-destructive" : ""}
            />
            {errors.scheduledAt && (
              <p className="text-xs text-destructive">{errors.scheduledAt}</p>
            )}
          </div>
        )}
      </div>

      {/* Global error */}
      {errors.submit && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "edit" ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          ) : scheduleEnabled ? (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Post
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publish Post
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
