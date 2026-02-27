"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When true the input renders with a red error border. */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          [
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "ring-offset-background transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" "),
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "border-input",
          className,
        )}
        ref={ref}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
