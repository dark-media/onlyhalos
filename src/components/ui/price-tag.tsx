import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, formatPrice } from "@/lib/utils";

// ---------------------------------------------------------------------------
// PriceTag variants
// ---------------------------------------------------------------------------

const priceTagVariants = cva("inline-flex items-baseline gap-1 font-semibold", {
  variants: {
    size: {
      sm: "text-sm",
      default: "text-lg",
      lg: "text-3xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriceTagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof priceTagVariants> {
  /** Price amount in cents. */
  amount: number;
  /** Optional suffix like "/ month" displayed in smaller text. */
  suffix?: string;
  /** Override the formatted price with a custom string (e.g. "Free"). */
  label?: string;
  /** Show a strikethrough original price (in cents) beside the current. */
  originalAmount?: number;
}

// ---------------------------------------------------------------------------
// PriceTag
// ---------------------------------------------------------------------------

const PriceTag = React.forwardRef<HTMLSpanElement, PriceTagProps>(
  (
    { className, size, amount, suffix, label, originalAmount, ...props },
    ref,
  ) => {
    const formattedPrice = label ?? formatPrice(amount);
    const formattedOriginal =
      originalAmount != null ? formatPrice(originalAmount) : null;

    return (
      <span
        ref={ref}
        className={cn(priceTagVariants({ size }), className)}
        {...props}
      >
        {/* Strikethrough original price */}
        {formattedOriginal && (
          <span className="text-muted-foreground line-through decoration-muted-foreground/50">
            <span className="text-[0.65em]">{formattedOriginal}</span>
          </span>
        )}

        {/* Current price */}
        <span className="text-primary">{formattedPrice}</span>

        {/* Suffix */}
        {suffix && (
          <span className="text-muted-foreground font-normal">
            <span className="text-[0.55em]">{suffix}</span>
          </span>
        )}
      </span>
    );
  },
);
PriceTag.displayName = "PriceTag";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { PriceTag, priceTagVariants };
