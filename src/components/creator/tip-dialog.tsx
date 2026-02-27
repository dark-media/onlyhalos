// ============================================================================
// Tip Dialog — Modal for sending tips to creators
// ============================================================================

"use client";

import * as React from "react";
import { DollarSign, Gift, MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TipDialogProps {
  /** Creator's user ID. */
  creatorId: string;
  /** Creator's display name. */
  creatorName: string;
  /** Additional class names for the trigger button. */
  className?: string;
  /** Custom trigger element (overrides default button). */
  trigger?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Preset amounts
// ---------------------------------------------------------------------------

const PRESET_AMOUNTS = [5, 10, 25, 50, 100] as const;

// ---------------------------------------------------------------------------
// TipDialog
// ---------------------------------------------------------------------------

export function TipDialog({
  creatorId,
  creatorName,
  className,
  trigger,
}: TipDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState<number | null>(null);
  const [customAmount, setCustomAmount] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveAmount = amount ?? (customAmount ? parseFloat(customAmount) : 0);
  const isValidAmount = effectiveAmount >= 1 && effectiveAmount <= 10000;

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
      setCustomAmount(val);
      setAmount(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!isValidAmount) {
      setError("Please enter a valid tip amount ($1 - $10,000).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/creators/${creatorId}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process tip.");
      }

      // Redirect to Stripe Checkout if a URL is returned
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Success — close and refresh
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount(null);
    setCustomAmount("");
    setMessage("");
    setError(null);
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="default" className={className}>
            <Gift className="h-4 w-4" />
            Tip
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Send a Tip to {creatorName}
          </DialogTitle>
          <DialogDescription>
            Show your appreciation with a one-time tip. Your support means the
            world!
          </DialogDescription>
        </DialogHeader>

        {/* Preset amounts */}
        <div className="grid grid-cols-5 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "flex h-12 items-center justify-center rounded-lg border text-sm font-semibold transition-all",
                "hover:border-primary/50 hover:shadow-gold-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                amount === preset
                  ? "border-primary bg-primary/10 text-primary shadow-gold-sm"
                  : "border-border bg-card text-foreground",
              )}
            >
              ${preset}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="space-y-2">
          <Label htmlFor="tip-custom-amount">Custom Amount</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tip-custom-amount"
              type="text"
              inputMode="decimal"
              placeholder="Enter amount"
              value={customAmount}
              onChange={handleCustomChange}
              className="pl-8"
              error={!!error && !isValidAmount}
            />
          </div>
        </div>

        {/* Optional message */}
        <div className="space-y-2">
          <Label htmlFor="tip-message" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Message (optional)
          </Label>
          <Textarea
            id="tip-message"
            placeholder="Write a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxCharacters={500}
            rows={3}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!isValidAmount || loading}
            className="shadow-gold-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" />
                Send ${effectiveAmount > 0 ? effectiveAmount.toFixed(2) : "0.00"} Tip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
