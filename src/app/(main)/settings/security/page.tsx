"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Key,
  Loader2,
  Lock,
  Monitor,
  Save,
  Shield,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Security Settings Page
// ---------------------------------------------------------------------------

export default function SecuritySettingsPage() {
  const [changingPassword, setChangingPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  // ── Change Password ──────────────────────────────────────────────
  async function onChangePassword(data: ChangePasswordInput) {
    try {
      setChangingPassword(true);

      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Failed to change password.");
      }

      reset();
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and account security
        </p>
      </div>

      {/* ── Change Password ──────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Change Password
            </h3>
            <p className="text-xs text-muted-foreground">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onChangePassword)}
          className="mt-6 space-y-4"
        >
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                className="pl-9"
                error={!!errors.currentPassword}
                {...register("currentPassword")}
              />
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                className="pl-9"
                error={!!errors.newPassword}
                {...register("newPassword")}
              />
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be 8+ characters with uppercase, lowercase, and a number.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="pl-9"
                error={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                "bg-gold-gradient text-dark shadow-gold-sm hover:shadow-gold-md",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Two-Factor Authentication ────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Two-Factor Authentication
              </h3>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-border bg-dark-200 px-3 py-1 text-xs font-medium text-muted-foreground">
            Coming Soon
          </span>
        </div>

        <div className="mt-4 rounded-lg bg-dark-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Two-factor authentication is not yet available. When enabled, you
            will need to enter a code from your authenticator app in addition to
            your password when signing in.
          </p>
        </div>
      </div>

      {/* ── Active Sessions ──────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Active Sessions
            </h3>
            <p className="text-xs text-muted-foreground">
              Manage devices where you are currently signed in
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {/* Current session */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Current Session
                </p>
                <p className="text-xs text-muted-foreground">
                  This device — Active now
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              Active
            </span>
          </div>

          {/* Placeholder sessions */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3 opacity-50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mobile Device
                </p>
                <p className="text-xs text-muted-foreground">
                  Session management coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
