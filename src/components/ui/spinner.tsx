import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Spinner variants
// ---------------------------------------------------------------------------

const spinnerVariants = cva("animate-spin text-primary", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  /** Accessible label for screen readers. Defaults to "Loading". */
  label?: string;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, label = "Loading", ...props }, ref) => (
    <svg
      ref={ref}
      className={cn(spinnerVariants({ size }), className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={label}
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
