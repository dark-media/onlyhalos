"use client";

// ============================================================================
// Media Upload Zone — Drag-and-drop multi-file upload with S3 presigned URLs
// ============================================================================

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  ImageIcon,
  Film,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadedMedia {
  id: string;
  key: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  previewUrl: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
  previewUrl: string;
  type: "IMAGE" | "VIDEO";
}

interface MediaUploadZoneProps {
  /** Called whenever the uploaded media list changes. */
  onChange: (media: UploadedMedia[]) => void;
  /** Current list of uploaded media. */
  value?: UploadedMedia[];
  /** Maximum number of files allowed. */
  maxFiles?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

function getFileCategory(type: string): "IMAGE" | "VIDEO" | null {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) return "IMAGE";
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(type)) return "VIDEO";
  return null;
}

function getMaxSize(category: "IMAGE" | "VIDEO"): number {
  return category === "IMAGE" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function generateId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

async function getVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve("");
      }
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      resolve("");
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaUploadZone({
  onChange,
  value = [],
  maxFiles = 10,
  className,
}: MediaUploadZoneProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedRef = useRef<UploadedMedia[]>(value);

  // Keep ref in sync with value prop
  React.useEffect(() => {
    uploadedRef.current = value;
  }, [value]);

  // -----------------------------------------------------------------------
  // Upload a single file
  // -----------------------------------------------------------------------
  const uploadFile = useCallback(
    async (uploadingFile: UploadingFile) => {
      try {
        // 1. Get presigned URL
        const presignedRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: uploadingFile.file.name,
            contentType: uploadingFile.file.type,
            fileSize: uploadingFile.file.size,
          }),
        });

        if (!presignedRes.ok) {
          const data = await presignedRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get upload URL.");
        }

        const { presignedUrl, key } = await presignedRes.json();

        // 2. Upload to S3 with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", uploadingFile.file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === uploadingFile.id
                    ? { ...u, progress: pct, status: "uploading" }
                    : u,
                ),
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed."));
          xhr.send(uploadingFile.file);
        });

        // 3. Get image dimensions if applicable
        let width: number | undefined;
        let height: number | undefined;

        if (uploadingFile.type === "IMAGE") {
          const dims = await getImageDimensions(uploadingFile.file);
          width = dims.width;
          height = dims.height;
        }

        // 4. Confirm upload
        const completeRes = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            type: uploadingFile.type,
            width,
            height,
            size: uploadingFile.file.size,
          }),
        });

        if (!completeRes.ok) {
          throw new Error("Failed to confirm upload.");
        }

        const completeData = await completeRes.json();

        // 5. Mark as complete
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadingFile.id
              ? { ...u, progress: 100, status: "complete" }
              : u,
          ),
        );

        // 6. Add to uploaded list
        const newMedia: UploadedMedia = {
          id: completeData.id || key,
          key,
          url: completeData.url || `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${key}`,
          type: uploadingFile.type,
          width,
          height,
          size: uploadingFile.file.size,
          mimeType: uploadingFile.file.type,
          previewUrl: uploadingFile.previewUrl,
        };

        const updated = [...uploadedRef.current, newMedia];
        uploadedRef.current = updated;
        onChange(updated);

        // Remove from uploading list after a short delay
        setTimeout(() => {
          setUploading((prev) => prev.filter((u) => u.id !== uploadingFile.id));
        }, 1000);
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadingFile.id
              ? {
                  ...u,
                  status: "error",
                  error:
                    err instanceof Error
                      ? err.message
                      : "Upload failed.",
                }
              : u,
          ),
        );
      }
    },
    [onChange],
  );

  // -----------------------------------------------------------------------
  // Process selected files
  // -----------------------------------------------------------------------
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const totalCount = value.length + uploading.length + fileArray.length;

      if (totalCount > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed. You have ${value.length} uploaded.`);
        return;
      }

      const newUploading: UploadingFile[] = [];

      for (const file of fileArray) {
        const category = getFileCategory(file.type);
        if (!category) {
          alert(`File type "${file.type}" is not supported.`);
          continue;
        }

        const maxSize = getMaxSize(category);
        if (file.size > maxSize) {
          alert(
            `"${file.name}" exceeds the ${formatFileSize(maxSize)} limit for ${category.toLowerCase()} files.`,
          );
          continue;
        }

        let previewUrl = "";
        if (category === "IMAGE") {
          previewUrl = URL.createObjectURL(file);
        } else {
          previewUrl = await getVideoThumbnail(file);
        }

        newUploading.push({
          id: generateId(),
          file,
          progress: 0,
          status: "pending",
          previewUrl,
          type: category,
        });
      }

      setUploading((prev) => [...prev, ...newUploading]);

      // Start uploads
      for (const uf of newUploading) {
        uploadFile(uf);
      }
    },
    [maxFiles, uploadFile, uploading.length, value.length],
  );

  // -----------------------------------------------------------------------
  // Drag and drop handlers
  // -----------------------------------------------------------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files);
        // Reset input so the same file can be selected again
        e.target.value = "";
      }
    },
    [processFiles],
  );

  // -----------------------------------------------------------------------
  // Remove uploaded file
  // -----------------------------------------------------------------------
  const handleRemoveUploaded = useCallback(
    (mediaId: string) => {
      const updated = value.filter((m) => m.id !== mediaId);
      onChange(updated);
    },
    [value, onChange],
  );

  const handleRemoveUploading = useCallback((uploadId: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== uploadId));
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const hasContent = value.length > 0 || uploading.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        <Upload
          className={cn(
            "mb-2 h-8 w-8",
            dragActive ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="text-sm font-medium text-foreground">
          {dragActive ? "Drop files here" : "Drag & drop or click to upload"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images (JPG, PNG, WebP, GIF) up to 20MB | Videos (MP4, MOV, WebM) up
          to 2GB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Uploaded + Uploading previews */}
      {hasContent && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {/* Already uploaded */}
          {value.map((media) => (
            <div
              key={media.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-dark-300"
            >
              {media.type === "IMAGE" ? (
                <Image
                  src={media.previewUrl || media.url}
                  alt="Uploaded media"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {media.previewUrl ? (
                    <Image
                      src={media.previewUrl}
                      alt="Video thumbnail"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Film className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Type badge */}
              <div className="absolute left-2 top-2">
                {media.type === "IMAGE" ? (
                  <ImageIcon className="h-4 w-4 text-white drop-shadow" />
                ) : (
                  <Film className="h-4 w-4 text-white drop-shadow" />
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveUploaded(media.id);
                }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Success badge */}
              <div className="absolute bottom-2 right-2">
                <CheckCircle className="h-4 w-4 text-green-500 drop-shadow" />
              </div>
            </div>
          ))}

          {/* Currently uploading */}
          {uploading.map((uf) => (
            <div
              key={uf.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-dark-300"
            >
              {uf.previewUrl ? (
                <Image
                  src={uf.previewUrl}
                  alt="Uploading"
                  fill
                  className={cn(
                    "object-cover",
                    uf.status === "uploading" && "opacity-60",
                  )}
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Film className="h-10 w-10 text-muted-foreground" />
                </div>
              )}

              {/* Progress overlay */}
              {uf.status === "uploading" && (
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <Progress value={uf.progress} className="h-1.5" />
                  <p className="mt-1 text-center text-[10px] text-white">
                    {uf.progress}%
                  </p>
                </div>
              )}

              {/* Error state */}
              {uf.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2">
                  <AlertCircle className="mb-1 h-5 w-5 text-destructive" />
                  <p className="text-center text-[10px] text-destructive">
                    {uf.error || "Upload failed"}
                  </p>
                </div>
              )}

              {/* Remove button */}
              {(uf.status === "error" || uf.status === "pending") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveUploading(uf.id);
                  }}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File count */}
      {hasContent && (
        <p className="text-xs text-muted-foreground">
          {value.length} file{value.length !== 1 ? "s" : ""} uploaded
          {uploading.length > 0 && `, ${uploading.length} uploading`}
          {" "}&middot; Max {maxFiles} files
        </p>
      )}
    </div>
  );
}
