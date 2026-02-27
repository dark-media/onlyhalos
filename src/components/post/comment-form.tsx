"use client";

// ============================================================================
// Comment Form — Text input for adding comments/replies
// ============================================================================

import React, { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommentFormProps {
  postId: string;
  /** If replying to a comment, pass the parent comment ID. */
  parentId?: string | null;
  /** Called after successful submission. */
  onSubmitted?: (comment: {
    id: string;
    content: string;
    parentId?: string | null;
  }) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Whether to auto-focus the input. */
  autoFocus?: boolean;
  className?: string;
}

const MAX_COMMENT_LENGTH = 500;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommentForm({
  postId,
  parentId = null,
  onSubmitted,
  placeholder = "Add a comment...",
  autoFocus = false,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !loading;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/posts/${postId}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            parentId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to post comment.");
        }

        const comment = await res.json();
        setContent("");
        onSubmitted?.(comment);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        setLoading(false);
      }
    },
    [canSubmit, content, parentId, postId, onSubmitted],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isOverLimit
                ? "border-destructive focus:ring-destructive"
                : "border-border",
            )}
            disabled={loading}
          />
          {charCount > 0 && (
            <span
              className={cn(
                "absolute bottom-1 right-2 text-[10px]",
                isOverLimit ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {charCount}/{MAX_COMMENT_LENGTH}
            </span>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!canSubmit}
          loading={loading}
          className="h-9 w-9 shrink-0"
          aria-label="Post comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </form>
  );
}
