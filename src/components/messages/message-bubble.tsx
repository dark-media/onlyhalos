"use client";

// ============================================================================
// Message Bubble — Single message display
// ============================================================================

import * as React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Check, CheckCheck, Lock } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageBubbleData {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  ppvPrice: number | null;
  isPurchased: boolean;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
}

interface MessageBubbleProps {
  message: MessageBubbleData;
  currentUserId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isSent = message.senderId === currentUserId;
  const isPPV = message.ppvPrice && message.ppvPrice > 0;
  const isLocked = isPPV && !message.isPurchased && !isSent;

  const timeStr = (() => {
    try {
      return format(new Date(message.createdAt), "h:mm a");
    } catch {
      return "";
    }
  })();

  return (
    <div
      className={cn(
        "flex w-full",
        isSent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 sm:max-w-[65%]",
          isSent
            ? "rounded-br-md bg-gradient-to-br from-halo-gold/90 to-halo-gold-dark/90 text-dark"
            : "rounded-bl-md bg-dark-200 text-foreground",
        )}
      >
        {/* PPV locked content */}
        {isLocked ? (
          <div className="flex flex-col items-center gap-2 py-2">
            {/* Blurred placeholder */}
            {message.mediaUrl && (
              <div className="relative h-40 w-full overflow-hidden rounded-lg">
                <div className="absolute inset-0 flex items-center justify-center bg-dark-300/80 backdrop-blur-xl">
                  <Lock className="h-8 w-8 text-halo-gold" />
                </div>
              </div>
            )}

            {message.content && (
              <p className="text-center text-sm text-muted-foreground blur-sm select-none">
                {message.content.slice(0, 50)}...
              </p>
            )}

            <Button
              size="sm"
              className="mt-1 bg-halo-gold text-dark hover:bg-halo-gold-light"
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              Unlock for {formatPrice((message.ppvPrice ?? 0) * 100)}
            </Button>
          </div>
        ) : (
          <>
            {/* Media display */}
            {message.mediaUrl && (
              <div className="mb-2 overflow-hidden rounded-lg">
                {message.mediaType === "VIDEO" ? (
                  <video
                    src={message.mediaUrl}
                    controls
                    className="max-h-64 w-full rounded-lg object-cover"
                    preload="metadata"
                  />
                ) : (
                  <div className="relative aspect-auto max-h-64 w-full">
                    <Image
                      src={message.mediaUrl}
                      alt="Message attachment"
                      width={400}
                      height={300}
                      className="max-h-64 w-full rounded-lg object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <p
                className={cn(
                  "whitespace-pre-wrap break-words text-sm leading-relaxed",
                  isSent ? "text-dark" : "text-foreground",
                )}
              >
                {message.content}
              </p>
            )}

            {/* PPV price indicator for sent messages */}
            {isPPV && isSent && (
              <p className="mt-1 text-xs font-medium text-dark/60">
                PPV — {formatPrice((message.ppvPrice ?? 0) * 100)}
              </p>
            )}
          </>
        )}

        {/* Timestamp + read receipt */}
        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            isSent ? "justify-end" : "justify-start",
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              isSent ? "text-dark/50" : "text-muted-foreground",
            )}
          >
            {timeStr}
          </span>

          {/* Read receipt (sent messages only) */}
          {isSent && (
            <span className={cn("text-dark/50")}>
              {message.isRead ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
