"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerUser } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Password strength utilities
// ---------------------------------------------------------------------------

type PasswordStrength = "empty" | "weak" | "medium" | "strong";

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  const isLong = password.length >= 12;

  const checks = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough, isLong];
  const score = checks.filter(Boolean).length;

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

const strengthConfig: Record<
  Exclude<PasswordStrength, "empty">,
  { label: string; color: string; barColor: string; width: string }
> = {
  weak: {
    label: "Weak",
    color: "text-red-400",
    barColor: "bg-red-400",
    width: "w-1/3",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400",
    barColor: "bg-yellow-400",
    width: "w-2/3",
  },
  strong: {
    label: "Strong",
    color: "text-emerald-400",
    barColor: "bg-emerald-400",
    width: "w-full",
  },
};

// ---------------------------------------------------------------------------
// Username availability hook
// ---------------------------------------------------------------------------

function useUsernameAvailability() {
  const [status, setStatus] = React.useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const check = React.useCallback((username: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!username || username.length < 3) {
      setStatus("idle");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(username)}`
        );
        if (res.ok) {
          const data = await res.json();
          setStatus(data.available ? "available" : "taken");
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      }
    }, 500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { status, check };
}

// ---------------------------------------------------------------------------
// RegisterForm
// ---------------------------------------------------------------------------

interface RegisterFormProps {
  className?: string;
}

export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [confirmPasswordError, setConfirmPasswordError] = React.useState<
    string | null
  >(null);

  const { status: usernameStatus, check: checkUsername } =
    useUsernameAvailability();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      displayName: "",
    },
  });

  const passwordValue = watch("password");
  const passwordStrength = getPasswordStrength(passwordValue);

  // Watch username for availability checking
  const usernameValue = watch("username");
  React.useEffect(() => {
    checkUsername(usernameValue);
  }, [usernameValue, checkUsername]);

  async function onSubmit(data: RegisterInput) {
    // Validate confirm password
    if (confirmPassword !== data.password) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }
    setConfirmPasswordError(null);

    if (!acceptedTerms) {
      setServerError("You must accept the Terms of Service to continue.");
      return;
    }

    try {
      setServerError(null);

      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("username", data.username);
      formData.append("displayName", data.displayName);

      const result = await registerUser(formData);

      if (!result.success) {
        setServerError(result.error || "Registration failed. Please try again.");
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed; send to login page
        router.push("/login?registered=true");
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
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
        <Label
          htmlFor="register-email"
          variant={errors.email ? "error" : "default"}
        >
          Email
        </Label>
        <Input
          id="register-email"
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

      {/* ── Username ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label
          htmlFor="register-username"
          variant={errors.username ? "error" : "default"}
        >
          Username
        </Label>
        <div className="relative">
          <Input
            id="register-username"
            type="text"
            placeholder="your_username"
            autoComplete="username"
            className="pr-10"
            error={
              !!errors.username ||
              usernameStatus === "taken" ||
              usernameStatus === "invalid"
            }
            {...register("username")}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {usernameStatus === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {usernameStatus === "available" && (
              <Check className="h-4 w-4 text-emerald-400" />
            )}
            {usernameStatus === "taken" && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {errors.username && (
          <p className="text-xs text-destructive">{errors.username.message}</p>
        )}
        {usernameStatus === "taken" && !errors.username && (
          <p className="text-xs text-destructive">
            This username is already taken.
          </p>
        )}
        {usernameStatus === "available" && !errors.username && (
          <p className="text-xs text-emerald-400">Username is available!</p>
        )}
      </div>

      {/* ── Display Name ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label
          htmlFor="register-display-name"
          variant={errors.displayName ? "error" : "default"}
        >
          Display Name
        </Label>
        <Input
          id="register-display-name"
          type="text"
          placeholder="Your Display Name"
          autoComplete="name"
          error={!!errors.displayName}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive">
            {errors.displayName.message}
          </p>
        )}
      </div>

      {/* ── Password ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label
          htmlFor="register-password"
          variant={errors.password ? "error" : "default"}
        >
          Password
        </Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            autoComplete="new-password"
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
        {/* Strength indicator */}
        {passwordStrength !== "empty" && (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  strengthConfig[passwordStrength].barColor,
                  strengthConfig[passwordStrength].width
                )}
              />
            </div>
            <p
              className={cn(
                "text-xs",
                strengthConfig[passwordStrength].color
              )}
            >
              {strengthConfig[passwordStrength].label}
            </p>
          </div>
        )}
      </div>

      {/* ── Confirm Password ────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label
          htmlFor="register-confirm-password"
          variant={confirmPasswordError ? "error" : "default"}
        >
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            autoComplete="new-password"
            className="pr-10"
            error={!!confirmPasswordError}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError(null);
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {confirmPasswordError && (
          <p className="text-xs text-destructive">{confirmPasswordError}</p>
        )}
      </div>

      {/* ── Terms of Service ────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        <input
          id="accept-terms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border bg-dark-50 text-primary accent-primary focus:ring-primary"
        />
        <Label
          htmlFor="accept-terms"
          className="cursor-pointer text-sm leading-tight text-muted-foreground"
        >
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-primary transition-colors hover:text-halo-gold-light"
            target="_blank"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-primary transition-colors hover:text-halo-gold-light"
            target="_blank"
          >
            Privacy Policy
          </Link>
        </Label>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────── */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        disabled={isSubmitting || !acceptedTerms}
      >
        Create Account
      </Button>

      {/* ── Login link ──────────────────────────────────────────────── */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-halo-gold-light"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
