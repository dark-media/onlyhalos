"use client";

// ============================================================================
// Admin Platform Settings Page
// ============================================================================

import * as React from "react";
import { toast } from "sonner";
import {
  Settings,
  DollarSign,
  ToggleLeft,
  Server,
  Save,
  RefreshCw,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlatformSettings {
  platformFeePercent: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  creatorApplicationsEnabled: boolean;
  tipsEnabled: boolean;
  ppvEnabled: boolean;
  messagingEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<PlatformSettings>({
    platformFeePercent: PLATFORM_FEE_PERCENT,
    maintenanceMode: false,
    registrationEnabled: true,
    creatorApplicationsEnabled: true,
    tipsEnabled: true,
    ppvEnabled: true,
    messagingEnabled: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Track changes
  const originalRef = React.useRef(settings);

  function updateSetting<K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // In a full implementation, this would call an API endpoint.
      // For now, we simulate the save operation.
      await new Promise((resolve) => setTimeout(resolve, 800));
      originalRef.current = settings;
      setHasChanges(false);
      toast.success("Platform settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSettings(originalRef.current);
    setHasChanges(false);
    toast.info("Settings reset to last saved state");
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure platform behavior and features
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="default" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!hasChanges || saving}
            onClick={handleReset}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            disabled={!hasChanges}
            loading={saving}
            onClick={handleSave}
          >
            <Save className="mr-1.5 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Platform Fee */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Revenue Settings</CardTitle>
          </div>
          <CardDescription>
            Configure platform fee percentages and financial settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="platformFee">Platform Fee Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="platformFee"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settings.platformFeePercent}
                onChange={(e) =>
                  updateSetting("platformFeePercent", parseFloat(e.target.value) || 0)
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The percentage taken from each transaction. Creators receive the remainder.
              Currently set to {settings.platformFeePercent}% (creators keep{" "}
              {100 - settings.platformFeePercent}%).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Feature Flags</CardTitle>
          </div>
          <CardDescription>
            Enable or disable platform features. Changes take effect immediately after saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, only admins can access the platform. Users will see a maintenance page.
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">User Registration</p>
                <p className="text-xs text-muted-foreground">
                  Allow new users to sign up for the platform.
                </p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => updateSetting("registrationEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Creator Applications</p>
                <p className="text-xs text-muted-foreground">
                  Allow users to apply for creator verification.
                </p>
              </div>
              <Switch
                checked={settings.creatorApplicationsEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("creatorApplicationsEnabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Tips</p>
                <p className="text-xs text-muted-foreground">
                  Allow fans to send tips to creators.
                </p>
              </div>
              <Switch
                checked={settings.tipsEnabled}
                onCheckedChange={(checked) => updateSetting("tipsEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Pay-Per-View</p>
                <p className="text-xs text-muted-foreground">
                  Allow creators to sell individual posts as pay-per-view content.
                </p>
              </div>
              <Switch
                checked={settings.ppvEnabled}
                onCheckedChange={(checked) => updateSetting("ppvEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Direct Messaging</p>
                <p className="text-xs text-muted-foreground">
                  Allow users to send direct messages to each other.
                </p>
              </div>
              <Switch
                checked={settings.messagingEnabled}
                onCheckedChange={(checked) => updateSetting("messagingEnabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">System Information</CardTitle>
          </div>
          <CardDescription>
            Platform technical details and environment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg bg-muted/30 p-4">
              <h4 className="text-sm font-medium text-foreground">Application</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="text-foreground">OnlyHalos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework</span>
                  <span className="text-foreground">Next.js 14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database</span>
                  <span className="text-foreground">PostgreSQL (Prisma)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auth</span>
                  <span className="text-foreground">NextAuth v5</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-muted/30 p-4">
              <h4 className="text-sm font-medium text-foreground">Environment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <Badge variant={process.env.NODE_ENV === "production" ? "success" : "secondary"}>
                    {process.env.NODE_ENV}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payments</span>
                  <span className="text-foreground">Stripe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="text-foreground">AWS S3 + CloudFront</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Node.js</span>
                  <span className="text-foreground">{process.version || "v20.x"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
