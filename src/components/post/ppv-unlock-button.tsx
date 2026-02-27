"use client";

// ============================================================================
// PPV Unlock Button — Initiates Stripe payment for pay-per-view content
// ============================================================================

import React, { useState, useCallback } from "react";
import { ShoppingCart, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PPVUnlockButtonProps {
  postId: string;
  /** PPV price in dollars. */
  price: number;
  /** Called after a successful purchase to refresh post state. */
  onPurchased?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PPVUnlockButton({
  postId,
  price,
  onPurchased,
  className,
}: PPVUnlockButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "confirming" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      // 1. Create PaymentIntent via our API
      const res = await fetch(`/api/posts/${postId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initiate purchase.");
      }

      const { clientSecret } = await res.json();

      if (!clientSecret) {
        throw new Error("No payment secret received.");
      }

      // 2. Load Stripe and confirm payment
      setStatus("confirming");

      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      );

      if (!stripe) {
        throw new Error("Failed to load payment processor.");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: {
              // In a production setup, you would use Stripe Elements here.
              // For now, we use the stored payment method on the customer.
              // This will work if the customer has a default payment method set.
              token: undefined as unknown as string,
            },
          },
        });

      // If no stored payment method, redirect to Stripe Checkout
      if (stripeError) {
        // Fallback: redirect to a Stripe Checkout session
        const checkoutRes = await fetch(`/api/posts/${postId}/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useCheckout: true }),
        });

        if (checkoutRes.ok) {
          const { url } = await checkoutRes.json();
          if (url) {
            window.location.href = url;
            return;
          }
        }

        throw new Error(
          stripeError.message || "Payment failed. Please try again.",
        );
      }

      if (paymentIntent?.status === "succeeded") {
        setStatus("success");
        onPurchased?.();
      } else {
        throw new Error("Payment was not completed.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    }
  }, [postId, onPurchased]);

  if (status === "success") {
    return (
      <Button variant="outline" disabled className={className}>
        <Check className="mr-2 h-4 w-4 text-green-500" />
        Purchased
      </Button>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={handlePurchase}
        loading={status === "loading" || status === "confirming"}
        disabled={status === "loading" || status === "confirming"}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {status === "confirming"
          ? "Processing..."
          : `Unlock for $${price.toFixed(2)}`}
      </Button>

      {status === "error" && errorMessage && (
        <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
