"use client";

// ============================================================================
// Message Input — Compose and send messages
// ============================================================================

import * as React from "react";
import Image from "next/image";
import { Send, Paperclip, X, ImageIcon, Film } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MessageInputProps {
  conversationId: string;
  onMessageSent?: () => void;
  disabled?: boolean;
  className?: string;
}

interface AttachmentPreview {
  file: File;
  url: string;
  type: "IMAGE" | "VIDEO";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageInput({
  conversationId,
  onMessageSent,
  disabled = false,
  className,
}: MessageInputProps) {
  const [content, setContent] = React.useState("");
  const [attachment, setAttachment] = React.useState<AttachmentPreview | null>(
    null,
  );
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Auto-resize textarea ─────────────────────────────────────────────
  const resizeTextarea = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  React.useEffect(() => {
    resizeTextarea();
  }, [content, resizeTextarea]);

  // ── File attachment handler ──────────────────────────────────────────
  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Determine media type
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        return; // Only accept images and videos
      }

      const url = URL.createObjectURL(file);
      setAttachment({
        file,
        url,
        type: isVideo ? "VIDEO" : "IMAGE",
      });

      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const removeAttachment = React.useCallback(() => {
    if (attachment) {
      URL.revokeObjectURL(attachment.url);
      setAttachment(null);
    }
  }, [attachment]);

  // ── Send message ─────────────────────────────────────────────────────
  const handleSend = React.useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && !attachment) return;
    if (isSending) return;

    setIsSending(true);

    try {
      // In a real implementation, you would first upload the file to S3
      // and get back a URL. For now, we send the message with text only
      // if there's no media, or with a placeholder URL.
      const body: Record<string, unknown> = {};

      if (trimmedContent) {
        body.content = trimmedContent;
      }

      if (attachment) {
        // TODO: Upload to S3 and get a signed URL
        // For now, we'll use the local blob URL as a placeholder
        body.mediaUrl = attachment.url;
        body.mediaType = attachment.type;
      }

      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      // Clear inputs
      setContent("");
      removeAttachment();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      onMessageSent?.();
    } catch (err) {
      console.error("[MessageInput] Send error:", err);
    } finally {
      setIsSending(false);
    }
  }, [content, attachment, conversationId, isSending, onMessageSent, removeAttachment]);

  // ── Keyboard shortcut: Enter to send, Shift+Enter for newline ────────
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const canSend = (content.trim().length > 0 || !!attachment) && !isSending;

  return (
    <div className={cn("border-t border-border bg-dark-50 p-3", className)}>
      {/* Attachment preview */}
      {attachment && (
        <div className="mb-3 flex items-start gap-2">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-dark-200">
            {attachment.type === "VIDEO" ? (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={attachment.url}
                alt="Attachment preview"
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <button
            type="button"
            onClick={removeAttachment}
            className="rounded-full bg-dark-300 p-1 text-muted-foreground transition-colors hover:bg-dark-400 hover:text-foreground"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-dark-300 bg-dark-100 px-4 py-2.5 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-[120px] overflow-y-auto",
            )}
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className={cn(
            "shrink-0 rounded-xl",
            canSend
              ? "bg-halo-gold text-dark hover:bg-halo-gold-light"
              : "bg-dark-300 text-muted-foreground",
          )}
          onClick={handleSend}
          disabled={!canSend || disabled}
          loading={isSending}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
