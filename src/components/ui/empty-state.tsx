import * as React from "react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon element displayed above the title. */
  icon?: React.ReactNode;
  /** Main heading text. */
  title: string;
  /** Supporting description text. */
  description?: string;
  /** Action slot — typically a Button or link. */
  action?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className,
      )}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Text */}
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Action */}
      {action && <div className="mt-2">{action}</div>}

      {/* Extra children */}
      {children}
    </div>
  ),
);
EmptyState.displayName = "EmptyState";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { EmptyState };
