"use client";

// ============================================================================
// Post Media Display — Images gallery and video player
// ============================================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

interface PostMediaProps {
  media: MediaItem[];
  /** Whether the content is locked / blurred. */
  locked?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Video Player
// ---------------------------------------------------------------------------

function VideoPlayer({
  src,
  thumbnail,
  locked,
}: {
  src: string;
  thumbnail?: string | null;
  locked?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const pct =
      (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pct * videoRef.current.duration;
    },
    [],
  );

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail || undefined}
        className={cn(
          "w-full max-h-[600px] object-contain",
          locked && "blur-xl",
        )}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Custom controls overlay */}
      {!locked && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="mb-2 h-1 cursor-pointer rounded-full bg-white/30"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white transition-colors hover:text-primary"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="text-white transition-colors hover:text-primary"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <span className="text-xs text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={handleFullscreen}
              className="text-white transition-colors hover:text-primary"
              aria-label="Fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Center play button when paused */}
      {!playing && !locked && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110">
            <Play className="h-8 w-8 ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Lightbox
// ---------------------------------------------------------------------------

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const current = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 text-white transition-colors hover:text-primary"
        aria-label="Close lightbox"
      >
        <X className="h-8 w-8" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 z-10 text-white transition-colors hover:text-primary"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 z-10 text-white transition-colors hover:text-primary"
            aria-label="Next image"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}

      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {current && (
          <Image
            src={current.url}
            alt={`Image ${currentIndex + 1}`}
            width={current.width || 1200}
            height={current.height || 800}
            className="max-h-[90vh] w-auto rounded-lg object-contain"
            unoptimized
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === currentIndex ? "bg-primary" : "bg-white/40",
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Gallery Grid
// ---------------------------------------------------------------------------

function ImageGallery({
  images,
  locked,
}: {
  images: MediaItem[];
  locked?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const count = images.length;

  const gridClass = cn(
    "grid gap-1 overflow-hidden rounded-lg",
    count === 1 && "grid-cols-1",
    count === 2 && "grid-cols-2",
    count === 3 && "grid-cols-2",
    count >= 4 && "grid-cols-2",
  );

  return (
    <>
      <div className={gridClass}>
        {images.slice(0, 4).map((img, i) => {
          const isLastWithMore = i === 3 && count > 4;
          return (
            <button
              key={img.id}
              onClick={() => !locked && setLightboxIndex(i)}
              className={cn(
                "relative overflow-hidden bg-dark-300",
                count === 3 && i === 0 && "row-span-2",
                count === 1 ? "aspect-video" : "aspect-square",
                !locked && "cursor-pointer",
              )}
            >
              <Image
                src={img.url}
                alt={`Post image ${i + 1}`}
                fill
                className={cn(
                  "object-cover transition-transform hover:scale-105",
                  locked && "blur-xl",
                )}
                sizes="(max-width: 768px) 100vw, 500px"
                unoptimized
              />
              {isLastWithMore && !locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-2xl font-bold text-white">
                    +{count - 4}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// PostMedia (main export)
// ---------------------------------------------------------------------------

export function PostMedia({ media, locked = false, className }: PostMediaProps) {
  if (!media || media.length === 0) return null;

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");

  return (
    <div className={cn("space-y-2", className)}>
      {/* Render videos first */}
      {videos.map((video) => (
        <VideoPlayer
          key={video.id}
          src={video.url}
          thumbnail={video.thumbnailUrl}
          locked={locked}
        />
      ))}

      {/* Render image gallery */}
      {images.length > 0 && (
        <ImageGallery images={images} locked={locked} />
      )}
    </div>
  );
}
