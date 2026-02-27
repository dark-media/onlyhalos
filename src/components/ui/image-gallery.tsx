"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GalleryImage {
  /** Image source URL. */
  src: string;
  /** Alt text for accessibility. */
  alt: string;
  /** Optional thumbnail URL; falls back to `src`. */
  thumbnail?: string;
}

export interface ImageGalleryProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of images to display. */
  images: GalleryImage[];
  /** Number of columns in the grid. Defaults to 3. */
  columns?: 2 | 3 | 4;
  /** Aspect ratio of thumbnails. Defaults to "square". */
  aspect?: "square" | "video" | "auto";
}

// ---------------------------------------------------------------------------
// Zoom constants
// ---------------------------------------------------------------------------

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

// ---------------------------------------------------------------------------
// Column class map
// ---------------------------------------------------------------------------

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const ASPECT_MAP: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  auto: "",
};

// ---------------------------------------------------------------------------
// ImageGallery
// ---------------------------------------------------------------------------

const ImageGallery = React.forwardRef<HTMLDivElement, ImageGalleryProps>(
  (
    {
      className,
      images,
      columns = 3,
      aspect = "square",
      ...props
    },
    ref,
  ) => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    const [zoom, setZoom] = React.useState(MIN_ZOOM);
    const isOpen = activeIndex !== null;

    const activeImage = activeIndex !== null ? images[activeIndex] : null;

    // Reset zoom when image changes
    React.useEffect(() => {
      setZoom(MIN_ZOOM);
    }, [activeIndex]);

    // -- Navigation ---------------------------------------------------------

    const goToPrev = React.useCallback(() => {
      setActiveIndex((prev) =>
        prev !== null && prev > 0 ? prev - 1 : images.length - 1,
      );
    }, [images.length]);

    const goToNext = React.useCallback(() => {
      setActiveIndex((prev) =>
        prev !== null && prev < images.length - 1 ? prev + 1 : 0,
      );
    }, [images.length]);

    // -- Zoom ---------------------------------------------------------------

    const zoomIn = React.useCallback(() => {
      setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const zoomOut = React.useCallback(() => {
      setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const zoomReset = React.useCallback(() => {
      setZoom(MIN_ZOOM);
    }, []);

    // -- Keyboard -----------------------------------------------------------

    React.useEffect(() => {
      if (!isOpen) return;

      function handleKey(e: KeyboardEvent) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            goToPrev();
            break;
          case "ArrowRight":
            e.preventDefault();
            goToNext();
            break;
          case "+":
          case "=":
            e.preventDefault();
            zoomIn();
            break;
          case "-":
            e.preventDefault();
            zoomOut();
            break;
          case "0":
            e.preventDefault();
            zoomReset();
            break;
        }
      }

      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, goToPrev, goToNext, zoomIn, zoomOut, zoomReset]);

    // -- Render -------------------------------------------------------------

    return (
      <>
        {/* Thumbnail grid */}
        <div
          ref={ref}
          className={cn(
            "grid gap-2",
            GRID_COLS[columns] ?? "grid-cols-3",
            className,
          )}
          {...props}
        >
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              className={cn(
                "group relative overflow-hidden rounded-md border border-border bg-muted transition-all",
                "hover:border-primary/50 hover:shadow-gold-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                ASPECT_MAP[aspect],
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${image.alt}`}
            >
              <img
                src={image.thumbnail ?? image.src}
                alt={image.alt}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                <Maximize2 className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>

        {/* Lightbox modal */}
        <DialogRoot
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) setActiveIndex(null);
          }}
        >
          <DialogContent
            hideClose
            className="max-w-[90vw] max-h-[90vh] border-0 bg-black/95 p-0 shadow-none sm:max-w-[90vw]"
            onPointerDownOutside={() => setActiveIndex(null)}
          >
            {/* Accessible title (visually hidden) */}
            <DialogTitle className="sr-only">
              {activeImage?.alt ?? "Image preview"}
            </DialogTitle>

            {/* Top toolbar */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-3">
              {/* Counter */}
              <span className="rounded-md bg-black/60 px-2 py-1 text-xs text-white/80">
                {activeIndex !== null ? activeIndex + 1 : 0} / {images.length}
              </span>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <ToolbarButton
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </ToolbarButton>
                <span className="min-w-[3rem] text-center text-xs text-white/80">
                  {Math.round(zoom * 100)}%
                </span>
                <ToolbarButton
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </ToolbarButton>
              </div>

              {/* Close */}
              <DialogClose asChild>
                <ToolbarButton aria-label="Close lightbox">
                  <X className="h-4 w-4" />
                </ToolbarButton>
              </DialogClose>
            </div>

            {/* Image */}
            <div className="flex h-[80vh] items-center justify-center overflow-auto p-12">
              {activeImage && (
                <img
                  src={activeImage.src}
                  alt={activeImage.alt}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                  draggable={false}
                />
              )}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <NavButton
                  direction="prev"
                  onClick={goToPrev}
                  aria-label="Previous image"
                />
                <NavButton
                  direction="next"
                  onClick={goToNext}
                  aria-label="Next image"
                />
              </>
            )}
          </DialogContent>
        </DialogRoot>
      </>
    );
  },
);
ImageGallery.displayName = "ImageGallery";

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

function ToolbarButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white/80 transition-colors",
        "hover:bg-black/80 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

function NavButton({
  direction,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/80 transition-colors",
        "hover:bg-black/80 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isPrev ? "left-3" : "right-3",
        className,
      )}
      {...props}
    >
      {isPrev ? (
        <ChevronLeft className="h-6 w-6" />
      ) : (
        <ChevronRight className="h-6 w-6" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { ImageGallery };
