"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginationProps {
  /** Current active page (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called when the user clicks a page button. */
  onPageChange: (page: number) => void;
  /** Number of sibling pages shown around the current page. Defaults to 1. */
  siblingCount?: number;
  /** Additional class name for the root nav element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ELLIPSIS = "..." as const;

type PageItem = number | typeof ELLIPSIS;

/**
 * Generates a list of page numbers and ellipsis markers to display.
 */
function getPageItems(page: number, totalPages: number, siblingCount: number): PageItem[] {
  // Total slots = first + last + current + 2 siblings + 2 ellipsis
  const totalSlots = siblingCount * 2 + 5;

  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from(
      { length: siblingCount * 2 + 3 },
      (_, i) => i + 1,
    );
    return [...leftRange, ELLIPSIS, totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: siblingCount * 2 + 3 },
      (_, i) => totalPages - (siblingCount * 2 + 2) + i,
    );
    return [1, ELLIPSIS, ...rightRange];
  }

  // Both ellipses visible
  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );
  return [1, ELLIPSIS, ...middleRange, ELLIPSIS, totalPages];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PaginationButton({
  className,
  isActive,
  ...props
}: ButtonProps & { isActive?: boolean }) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="icon"
      className={cn(
        "h-9 w-9",
        isActive && "pointer-events-none",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      {...props}
    />
  );
}

function PaginationEllipsis({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 items-center justify-center text-muted-foreground",
        className,
      )}
    >
      <MoreHorizontal className="h-4 w-4" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ page, totalPages, onPageChange, siblingCount = 1, className }, ref) => {
    if (totalPages <= 1) return null;

    const items = getPageItems(page, totalPages, siblingCount);

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn("flex items-center justify-center gap-1", className)}
      >
        {/* Previous */}
        <PaginationButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PaginationButton>

        {/* Page numbers */}
        {items.map((item, idx) =>
          item === ELLIPSIS ? (
            <PaginationEllipsis key={`ellipsis-${idx}`} />
          ) : (
            <PaginationButton
              key={item}
              isActive={item === page}
              onClick={() => onPageChange(item)}
              aria-label={`Go to page ${item}`}
            >
              {item}
            </PaginationButton>
          ),
        )}

        {/* Next */}
        <PaginationButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Pagination };
