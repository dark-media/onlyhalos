"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// ForgotPasswordForm
// ---------------------------------------------------------------------------

interface ForgotPasswordFormProps {
  className?: string;
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [sent, setSent] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      setServerError(null);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.toLowerCase().trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setServerError(
          body?.error || "Something went wrong. Please try again."
        );
        return;
      }

      setSent(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  // ── Success state ────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className={cn("space-y-6 text-center", className)}>
        {/* Animated envelope icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 animate-halo-pulse text-primary" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Check Your Email
          </h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">
              {getValues("email")}
            </span>
            . The link will expire in 1 hour.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Try a different email
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-halo-gold-light"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-5", className)}
      noValidate
    >
      {/* Server error */}
      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label
          htmlFor="forgot-email"
          variant={errors.email ? "error" : "default"}
        >
          Email
        </Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
      >
        Send Reset Link
      </Button>

      {/* Back to login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-halo-gold-light"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    </form>
  );
}
