"use client";

import * as React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Globe,
  Loader2,
  MapPin,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn, getInitials } from "@/lib/utils";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/user";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
}

// ---------------------------------------------------------------------------
// Edit Profile Page
// ---------------------------------------------------------------------------

export default function EditProfilePage() {
  const { update: updateSession } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  // ── Fetch profile on mount ───────────────────────────────────────
  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        const user = data.user as UserProfile;
        setProfile(user);
        setAvatarPreview(user.avatarUrl);
        setCoverPreview(user.coverUrl);

        // Populate form with current values
        reset({
          displayName: user.displayName ?? "",
          bio: user.bio ?? "",
          location: user.location ?? "",
          websiteUrl: user.websiteUrl ?? "",
          twitterUrl: user.twitterUrl ?? "",
          instagramUrl: user.instagramUrl ?? "",
          tiktokUrl: user.tiktokUrl ?? "",
        });
      } catch {
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [reset]);

  // ── Image upload handler ─────────────────────────────────────────
  async function handleImageUpload(
    file: File,
    type: "avatar" | "cover",
  ) {
    const setUploading =
      type === "avatar" ? setUploadingAvatar : setUploadingCover;
    const setPreview =
      type === "avatar" ? setAvatarPreview : setCoverPreview;

    try {
      setUploading(true);

      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // Request presigned upload URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          category: type,
        }),
      });

      if (!presignedRes.ok) {
        throw new Error("Failed to get upload URL.");
      }

      const { url: uploadUrl, key } = await presignedRes.json();

      // Upload file to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed.");
      }

      // Complete upload and get final URL
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!completeRes.ok) {
        throw new Error("Failed to complete upload.");
      }

      const { url: finalUrl } = await completeRes.json();

      // Update user profile with new image URL
      const field = type === "avatar" ? "avatarUrl" : "coverUrl";
      const updateRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: finalUrl }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update profile image.");
      }

      setPreview(finalUrl);

      // Refresh session to update navbar avatar
      if (type === "avatar") {
        await updateSession();
      }

      toast.success(
        type === "avatar"
          ? "Avatar updated successfully."
          : "Cover photo updated successfully.",
      );
    } catch (error) {
      // Revert preview on error
      setPreview(
        type === "avatar" ? profile?.avatarUrl ?? null : profile?.coverUrl ?? null,
      );
      toast.error(
        error instanceof Error ? error.message : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  // ── Form submit ──────────────────────────────────────────────────
  async function onSubmit(data: UpdateProfileInput) {
    try {
      setSaving(true);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Failed to update profile.");
      }

      const { user } = await res.json();
      setProfile(user);

      // Reset form dirty state with new values
      reset({
        displayName: user.displayName ?? "",
        bio: user.bio ?? "",
        location: user.location ?? "",
        websiteUrl: user.websiteUrl ?? "",
        twitterUrl: user.twitterUrl ?? "",
        instagramUrl: user.instagramUrl ?? "",
        tiktokUrl: user.tiktokUrl ?? "",
      });

      // Refresh session so navbar reflects changes
      await updateSession();

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-lg bg-dark-200" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-dark-200" />
          ))}
        </div>
      </div>
    );
  }

  const initials = getInitials(
    profile?.displayName ?? profile?.username ?? "U",
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize how others see you on OnlyHalos
        </p>
      </div>

      {/* ── Cover Photo ────────────────────────────────────────────── */}
      <div className="relative">
        <div
          className={cn(
            "relative h-40 w-full overflow-hidden rounded-lg border border-border bg-dark-200 sm:h-52",
            uploadingCover && "opacity-60",
          )}
        >
          {coverPreview ? (
            <Image
              src={coverPreview}
              alt="Cover photo"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No cover photo</p>
            </div>
          )}

          {/* Upload overlay */}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100",
              uploadingCover && "opacity-100",
            )}
          >
            {uploadingCover ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-dark/80 px-4 py-2 text-sm font-medium text-white">
                <Camera className="h-4 w-4" />
                Change Cover
              </div>
            )}
          </button>

          {/* Remove cover button */}
          {coverPreview && !uploadingCover && (
            <button
              onClick={() => setCoverPreview(null)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-dark/80 text-white transition-colors hover:bg-dark"
              aria-label="Remove cover photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, "cover");
            e.target.value = "";
          }}
        />

        {/* ── Avatar ──────────────────────────────────────────────── */}
        <div className="absolute -bottom-10 left-6">
          <div className="relative">
            <div
              className={cn(
                "h-24 w-24 overflow-hidden rounded-full border-4 border-card bg-dark-300",
                uploadingAvatar && "opacity-60",
              )}
            >
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                  {initials}
                </div>
              )}
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-gold-sm transition-shadow hover:shadow-gold-md"
              aria-label="Change avatar"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "avatar");
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      {/* Spacer for avatar overlap */}
      <div className="h-6" />

      {/* ── Profile Form ───────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="Your display name"
            error={!!errors.displayName}
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell people a little about yourself..."
            maxCharacters={500}
            autoResize
            error={!!errors.bio}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="location"
              placeholder="City, Country"
              className="pl-9"
              error={!!errors.location}
              {...register("location")}
            />
          </div>
          {errors.location && (
            <p className="text-xs text-destructive">
              {errors.location.message}
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Social Links
            </h3>
            <p className="text-xs text-muted-foreground">
              Connect your social profiles
            </p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="websiteUrl"
                placeholder="https://yourwebsite.com"
                className="pl-9"
                error={!!errors.websiteUrl}
                {...register("websiteUrl")}
              />
            </div>
            {errors.websiteUrl && (
              <p className="text-xs text-destructive">
                {errors.websiteUrl.message}
              </p>
            )}
          </div>

          {/* Twitter / X */}
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter / X</Label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <Input
                id="twitterUrl"
                placeholder="https://twitter.com/username"
                className="pl-9"
                error={!!errors.twitterUrl}
                {...register("twitterUrl")}
              />
            </div>
            {errors.twitterUrl && (
              <p className="text-xs text-destructive">
                {errors.twitterUrl.message}
              </p>
            )}
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <Input
                id="instagramUrl"
                placeholder="https://instagram.com/username"
                className="pl-9"
                error={!!errors.instagramUrl}
                {...register("instagramUrl")}
              />
            </div>
            {errors.instagramUrl && (
              <p className="text-xs text-destructive">
                {errors.instagramUrl.message}
              </p>
            )}
          </div>

          {/* TikTok */}
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">TikTok</Label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.68a8.21 8.21 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.11z" />
              </svg>
              <Input
                id="tiktokUrl"
                placeholder="https://tiktok.com/@username"
                className="pl-9"
                error={!!errors.tiktokUrl}
                {...register("tiktokUrl")}
              />
            </div>
            {errors.tiktokUrl && (
              <p className="text-xs text-destructive">
                {errors.tiktokUrl.message}
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={saving || (!isDirty)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isDirty
                ? "bg-gold-gradient text-dark shadow-gold-sm hover:shadow-gold-md"
                : "bg-dark-300 text-muted-foreground",
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
