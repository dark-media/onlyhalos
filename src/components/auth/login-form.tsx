"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/feed";

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    try {
      setServerError(null);

      const result = await signIn("credentials", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Map NextAuth error messages to user-friendly text
        if (result.error.includes("banned")) {
          setServerError(
            "Your account has been banned. Please contact support for assistance."
          );
        } else if (
          result.error.includes("Invalid") ||
          result.error.includes("invalid")
        ) {
          setServerError(
            "Invalid email or password. Please check your credentials and try again."
          );
        } else {
          setServerError(
            result.error || "Something went wrong. Please try again."
          );
        }
        return;
      }

      // Successful login — redirect
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-5", className)}
      noValidate
    >
      {/* ── Server error alert ──────────────────────────────────────── */}
      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* ── Email ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="login-email" variant={errors.email ? "error" : "default"}>
          Email
        </Label>
        <Input
          id="login-email"
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

      {/* ── Password ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            variant={errors.password ? "error" : "default"}
          >
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary transition-colors hover:text-halo-gold-light"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="pr-10"
            error={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* ── Remember me ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <input
          id="remember-me"
          type="checkbox"
          className="h-4 w-4 rounded border-border bg-dark-50 text-primary accent-primary focus:ring-primary"
        />
        <Label htmlFor="remember-me" className="cursor-pointer text-sm text-muted-foreground">
          Remember me
        </Label>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────── */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
      >
        Log In
      </Button>

      {/* ── Register link ───────────────────────────────────────────── */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary transition-colors hover:text-halo-gold-light"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
