"use client";

import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Toaster — drop this once in your root layout
// ---------------------------------------------------------------------------

/**
 * Pre-themed Sonner toaster for OnlyHalos.
 *
 * Place `<Toaster />` in your root layout. Then call `toast.success(...)`,
 * `toast.error(...)`, etc. from anywhere.
 */
function Toaster({ className, ...props }: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="bottom-right"
      className={cn("toaster group", className)}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: cn(
            "group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-dark-lg",
            "text-sm text-card-foreground",
          ),
          title: "font-semibold text-foreground",
          description: "text-muted-foreground text-xs",
          actionButton:
            "bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-halo-gold-light transition-colors",
          cancelButton:
            "bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors",
          success: "border-primary/30",
          error: "border-destructive/30",
          warning: "border-warning/30",
          info: "border-info/30",
          closeButton:
            "text-muted-foreground hover:text-foreground transition-colors",
        },
      }}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/**
 * Themed toast helpers that wrap `sonner.toast` with OnlyHalos styling.
 *
 * @example
 * ```ts
 * import { toast } from "@/components/ui/toast";
 *
 * toast.success("Profile updated!");
 * toast.error("Something went wrong", { description: "Please try again." });
 * toast.warning("Approaching limit");
 * toast.info("New feature available");
 * ```
 */
const toast = {
  /** Raw sonner toast — use for fully custom toasts. */
  raw: sonnerToast,

  /** Success toast with gold accent border. */
  success(message: string, options?: Parameters<typeof sonnerToast.success>[1]) {
    return sonnerToast.success(message, options);
  },

  /** Error toast with destructive accent. */
  error(message: string, options?: Parameters<typeof sonnerToast.error>[1]) {
    return sonnerToast.error(message, options);
  },

  /** Warning toast with amber accent. */
  warning(message: string, options?: Parameters<typeof sonnerToast.warning>[1]) {
    return sonnerToast.warning(message, options);
  },

  /** Info toast with blue accent. */
  info(message: string, options?: Parameters<typeof sonnerToast.info>[1]) {
    return sonnerToast.info(message, options);
  },

  /** Plain toast with no icon/variant. */
  message(message: string, options?: Parameters<typeof sonnerToast>[1]) {
    return sonnerToast(message, options);
  },

  /** Async promise toast — shows loading, then success or error automatically. */
  promise<T>(
    promise: Promise<T>,
    options: Parameters<typeof sonnerToast.promise<T>>[1],
  ) {
    return sonnerToast.promise(promise, options);
  },

  /** Dismiss a toast by ID, or all toasts if no ID is given. */
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Toaster, toast };
