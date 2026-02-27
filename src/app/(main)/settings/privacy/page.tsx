"use client";

import * as React from "react";
import {
  Eye,
  Loader2,
  Lock,
  MessageSquare,
  Save,
  ShieldOff,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AllowMessagesFrom = "everyone" | "subscribers" | "nobody";

interface PrivacySettings {
  showOnlineStatus: boolean;
  showSubscriberCount: boolean;
  allowMessagesFrom: AllowMessagesFrom;
}

// ---------------------------------------------------------------------------
// Default Settings
// ---------------------------------------------------------------------------

const defaultSettings: PrivacySettings = {
  showOnlineStatus: true,
  showSubscriberCount: true,
  allowMessagesFrom: "everyone",
};

const messageOptions: { value: AllowMessagesFrom; label: string; description: string }[] = [
  {
    value: "everyone",
    label: "Everyone",
    description: "Anyone can send you messages",
  },
  {
    value: "subscribers",
    label: "Subscribers Only",
    description: "Only your subscribers can message you",
  },
  {
    value: "nobody",
    label: "Nobody",
    description: "Disable direct messages entirely",
  },
];

// ---------------------------------------------------------------------------
// Privacy Settings Page
// ---------------------------------------------------------------------------

export default function PrivacySettingsPage() {
  const [settings, setSettings] = React.useState<PrivacySettings>(defaultSettings);
  const [initialSettings, setInitialSettings] = React.useState<PrivacySettings>(defaultSettings);
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Fetch settings on mount
  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/users/me/privacy");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
            setInitialSettings(data.settings);
          }
        }
      } catch {
        // Use defaults if fetch fails
      }
    }
    fetchSettings();
  }, []);

  // Track changes
  React.useEffect(() => {
    const changed =
      settings.showOnlineStatus !== initialSettings.showOnlineStatus ||
      settings.showSubscriberCount !== initialSettings.showSubscriberCount ||
      settings.allowMessagesFrom !== initialSettings.allowMessagesFrom;
    setHasChanges(changed);
  }, [settings, initialSettings]);

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch("/api/users/me/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save privacy settings.");
      }

      setInitialSettings({ ...settings });
      setHasChanges(false);
      toast.success("Privacy settings saved.");
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
        <h2 className="text-lg font-semibold text-foreground">Privacy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control who can see your activity and reach out to you
        </p>
      </div>

      {/* ── Visibility Toggles ───────────────────────────────────── */}
      <div className="space-y-2">
        {/* Show Online Status */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Show Online Status
              </h3>
              <p className="text-xs text-muted-foreground">
                Let others see when you are currently online
              </p>
            </div>
          </div>
          <Switch
            checked={settings.showOnlineStatus}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, showOnlineStatus: checked }))
            }
            aria-label="Show online status"
          />
        </div>

        {/* Show Subscriber Count */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Show Subscriber Count
              </h3>
              <p className="text-xs text-muted-foreground">
                Display your subscriber count on your profile
              </p>
            </div>
          </div>
          <Switch
            checked={settings.showSubscriberCount}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                showSubscriberCount: checked,
              }))
            }
            aria-label="Show subscriber count"
          />
        </div>
      </div>

      {/* ── Allow Messages From ──────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Allow Messages From
            </h3>
            <p className="text-xs text-muted-foreground">
              Control who can send you direct messages
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 pl-12">
          {messageOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                settings.allowMessagesFrom === option.value
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : "bg-dark-50 hover:bg-dark-200",
              )}
            >
              <input
                type="radio"
                name="allowMessagesFrom"
                value={option.value}
                checked={settings.allowMessagesFrom === option.value}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    allowMessagesFrom: option.value,
                  }))
                }
                className="sr-only"
              />
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  settings.allowMessagesFrom === option.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground",
                )}
              >
                {settings.allowMessagesFrom === option.value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-dark" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Blocked Users ────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldOff className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Blocked Users
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage users you have blocked
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-dark-50 px-4 py-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            You haven&apos;t blocked anyone yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can block users from their profile page or from messages.
          </p>
        </div>
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
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
