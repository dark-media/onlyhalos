"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** When true the textarea renders with a red error border. */
  error?: boolean;
  /** When true the textarea will grow automatically to fit content. */
  autoResize?: boolean;
  /** When set, a character count indicator is displayed. */
  maxCharacters?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      autoResize = false,
      maxCharacters,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = React.useState<number>(
      () => String(value ?? defaultValue ?? "").length,
    );

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
        }
      },
      [ref],
    );

    // Auto-resize logic
    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    React.useEffect(() => {
      resize();
    }, [value, resize]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCharCount(e.target.value.length);
        resize();
        onChange?.(e);
      },
      [onChange, resize],
    );

    const isOverLimit =
      maxCharacters !== undefined && charCount > maxCharacters;

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            [
              "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "ring-offset-background transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" "),
            autoResize && "resize-none overflow-hidden",
            error || isOverLimit
              ? "border-destructive focus-visible:ring-destructive"
              : "border-input",
            className,
          )}
          ref={mergedRef}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={error || isOverLimit || undefined}
          {...props}
        />

        {maxCharacters !== undefined && (
          <span
            className={cn(
              "absolute bottom-2 right-3 text-xs select-none",
              isOverLimit ? "text-destructive" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {charCount}/{maxCharacters}
          </span>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
