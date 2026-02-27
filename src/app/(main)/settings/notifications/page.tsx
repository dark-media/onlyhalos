"use client";

import * as React from "react";
import {
  Bell,
  CreditCard,
  Heart,
  Loader2,
  Mail,
  MessageSquare,
  Megaphone,
  Save,
  Smartphone,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  emailKey: string;
  inAppKey: string;
}

interface NotificationPrefs {
  [key: string]: boolean;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categories: NotificationCategory[] = [
  {
    key: "subscriptions",
    label: "Subscriptions",
    description: "When someone subscribes to you or your subscription renews",
    icon: Users,
    emailKey: "emailSubscriptions",
    inAppKey: "inAppSubscriptions",
  },
  {
    key: "messages",
    label: "Messages",
    description: "New direct messages and message requests",
    icon: MessageSquare,
    emailKey: "emailMessages",
    inAppKey: "inAppMessages",
  },
  {
    key: "likesComments",
    label: "Likes & Comments",
    description: "When someone likes or comments on your posts",
    icon: Heart,
    emailKey: "emailLikesComments",
    inAppKey: "inAppLikesComments",
  },
  {
    key: "tips",
    label: "Tips",
    description: "When someone sends you a tip",
    icon: CreditCard,
    emailKey: "emailTips",
    inAppKey: "inAppTips",
  },
  {
    key: "platformUpdates",
    label: "Platform Updates",
    description: "Product announcements, features, and policy updates",
    icon: Megaphone,
    emailKey: "emailPlatformUpdates",
    inAppKey: "inAppPlatformUpdates",
  },
];

// Default preferences
const defaultPrefs: NotificationPrefs = {
  emailSubscriptions: true,
  emailMessages: true,
  emailLikesComments: false,
  emailTips: true,
  emailPlatformUpdates: true,
  inAppSubscriptions: true,
  inAppMessages: true,
  inAppLikesComments: true,
  inAppTips: true,
  inAppPlatformUpdates: true,
};

// ---------------------------------------------------------------------------
// Notification Preferences Page
// ---------------------------------------------------------------------------

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(defaultPrefs);
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [initialPrefs, setInitialPrefs] =
    React.useState<NotificationPrefs>(defaultPrefs);

  // Fetch preferences on mount
  React.useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await fetch("/api/users/me/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPrefs(data.preferences);
            setInitialPrefs(data.preferences);
          }
        }
      } catch {
        // Use defaults if fetch fails
      }
    }
    fetchPrefs();
  }, []);

  // Track changes
  React.useEffect(() => {
    const changed = Object.keys(prefs).some(
      (key) => prefs[key] !== initialPrefs[key],
    );
    setHasChanges(changed);
  }, [prefs, initialPrefs]);

  function togglePref(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch("/api/users/me/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences.");
      }

      setInitialPrefs({ ...prefs });
      setHasChanges(false);
      toast.success("Notification preferences saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how you want to be notified about activity on OnlyHalos
        </p>
      </div>

      {/* ── Column Headers ───────────────────────────────────────── */}
      <div className="hidden items-center justify-end gap-8 px-4 sm:flex">
        <div className="flex w-16 items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Email
        </div>
        <div className="flex w-16 items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          In-App
        </div>
      </div>

      {/* ── Notification Categories ──────────────────────────────── */}
      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <div
              key={category.key}
              className="rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Category info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {category.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Toggle switches */}
                <div className="flex items-center gap-8 pl-12 sm:pl-0">
                  {/* Email toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      Email
                    </span>
                    <Switch
                      checked={prefs[category.emailKey] ?? false}
                      onCheckedChange={() => togglePref(category.emailKey)}
                      aria-label={`${category.label} email notifications`}
                    />
                  </div>

                  {/* In-app toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      In-App
                    </span>
                    <Switch
                      checked={prefs[category.inAppKey] ?? false}
                      onCheckedChange={() => togglePref(category.inAppKey)}
                      aria-label={`${category.label} in-app notifications`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Save Button ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end border-t border-border pt-6">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasChanges
              ? "bg-gold-gradient text-dark shadow-gold-sm hover:shadow-gold-md"
              : "bg-dark-300 text-muted-foreground",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
