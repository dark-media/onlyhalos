// ============================================================================
// Settings Overview Page
// ============================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Sparkles, ChevronRight, Shield, Calendar, Mail, AtSign } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      isCreator: true,
      verificationStatus: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const roleBadgeColor =
    user.role === "ADMIN"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : user.role === "CREATOR"
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-muted text-muted-foreground border-border";

  const statusBadgeColor =
    user.status === "ACTIVE"
      ? "bg-success/10 text-success border-success/20"
      : user.status === "SUSPENDED"
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <div className="space-y-6">
      {/* Account Overview Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Account Overview
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account information at a glance
        </p>

        <div className="mt-6 space-y-4">
          {/* Username */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <AtSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="text-sm font-medium text-foreground">
                  @{user.username ?? "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor}`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 flex items-center justify-center">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    user.status === "ACTIVE" ? "bg-success" : "bg-warning"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Status</p>
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor}`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between rounded-lg bg-dark-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Become a Creator CTA */}
      {!user.isCreator && (
        <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-dark-100 to-dark-200 p-6">
          {/* Decorative glow */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient shadow-gold-sm">
                <Sparkles className="h-5 w-5 text-dark" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Become a Creator
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start sharing exclusive content and earning from your
                  subscribers. Set up tiers, post premium content, and grow your
                  audience.
                </p>
              </div>
            </div>

            <Link
              href="/creator/apply"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-dark shadow-gold-sm transition-shadow hover:shadow-gold-md"
            >
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Links — visible on desktop when the sidebar handles navigation */}
      <div className="hidden lg:block">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">
            Quick Links
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/settings/profile"
              className="rounded-lg bg-dark-50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-dark-200 hover:text-foreground"
            >
              Edit Profile
            </Link>
            <Link
              href="/settings/security"
              className="rounded-lg bg-dark-50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-dark-200 hover:text-foreground"
            >
              Security Settings
            </Link>
            <Link
              href="/settings/notifications"
              className="rounded-lg bg-dark-50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-dark-200 hover:text-foreground"
            >
              Notifications
            </Link>
            <Link
              href="/settings/payments"
              className="rounded-lg bg-dark-50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-dark-200 hover:text-foreground"
            >
              Payments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
