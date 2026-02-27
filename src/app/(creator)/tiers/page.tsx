// ============================================================================
// Manage Tiers Page — Creator tier management dashboard
// ============================================================================

"use client";

import * as React from "react";
import {
  Plus,
  Crown,
  Edit,
  Trash2,
  Users,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Loader2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  sortOrder: number;
  isActive: boolean;
  subscriberCount: number;
  stripePriceId: string | null;
  stripeProductId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// ManageTiersPage
// ---------------------------------------------------------------------------

export default function ManageTiersPage() {
  const [tiers, setTiers] = React.useState<Tier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<Tier | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [features, setFeatures] = React.useState<string[]>([]);
  const [newFeature, setNewFeature] = React.useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // ── Fetch tiers ───────────────────────────────────────────────────
  const fetchTiers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tiers");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setTiers(data.tiers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tiers.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // ── Open form for create/edit ─────────────────────────────────────
  const openCreateForm = () => {
    setEditingTier(null);
    setName("");
    setDescription("");
    setPrice("");
    setFeatures([]);
    setNewFeature("");
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (tier: Tier) => {
    setEditingTier(tier);
    setName(tier.name);
    setDescription(tier.description ?? "");
    setPrice(tier.price.toString());
    setFeatures([...tier.features]);
    setNewFeature("");
    setFormError(null);
    setFormOpen(true);
  };

  // ── Add / remove features ─────────────────────────────────────────
  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (trimmed && features.length < 20) {
      setFeatures((prev) => [...prev, trimmed]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit form ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const parsedPrice = parseFloat(price);

    if (!name.trim() || name.length < 2) {
      setFormError("Tier name must be at least 2 characters.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 4.99 || parsedPrice > 499.99) {
      setFormError("Price must be between $4.99 and $499.99.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        features,
      };

      const url = editingTier ? `/api/tiers/${editingTier.id}` : "/api/tiers";
      const method = editingTier ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save tier.");
      }

      setFormOpen(false);
      await fetchTiers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete tier ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/tiers/${deleteId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete tier.");
      }

      setDeleteId(null);
      await fetchTiers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete tier.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Toggle active status ──────────────────────────────────────────
  const handleToggleActive = async (tier: Tier) => {
    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tier.isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      await fetchTiers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update tier.");
    }
  };

  // ── Reorder tiers ─────────────────────────────────────────────────
  const handleReorder = async (tierId: string, direction: "up" | "down") => {
    const index = tiers.findIndex((t) => t.id === tierId);
    if (index === -1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= tiers.length) return;

    try {
      // Swap sort orders
      await Promise.all([
        fetch(`/api/tiers/${tiers[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: tiers[swapIndex].sortOrder }),
        }),
        fetch(`/api/tiers/${tiers[swapIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: tiers[index].sortOrder }),
        }),
      ]);

      await fetchTiers();
    } catch (err) {
      console.error("[Reorder] Error:", err);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading tiers" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <EmptyState
        icon={<Crown className="h-8 w-8" />}
        title="Failed to load tiers"
        description={error}
        action={
          <Button variant="outline" onClick={fetchTiers}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Subscription Tiers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription plans. You can create up to 3 tiers.
          </p>
        </div>

        <Button
          variant="default"
          onClick={openCreateForm}
          disabled={tiers.length >= 3}
          className="shadow-gold-sm"
        >
          <Plus className="h-4 w-4" />
          Create Tier
        </Button>
      </div>

      {/* Tiers list */}
      {tiers.length === 0 ? (
        <EmptyState
          icon={<Crown className="h-8 w-8" />}
          title="No tiers yet"
          description="Create your first subscription tier to start earning from your content."
          action={
            <Button variant="default" onClick={openCreateForm} className="shadow-gold-sm">
              <Plus className="h-4 w-4" />
              Create Your First Tier
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <Card
              key={tier.id}
              className={cn(
                "transition-all",
                !tier.isActive && "opacity-60",
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* Drag handle / order indicator */}
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                  <span className="text-xs font-mono">#{index + 1}</span>
                </div>

                {/* Tier info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {tier.name}
                    </h3>
                    {!tier.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {tier.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {tier.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">
                      ${tier.price.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /mo
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {tier.subscriberCount}{" "}
                      {tier.subscriberCount === 1 ? "subscriber" : "subscribers"}
                    </span>
                    {tier.features.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {tier.features.length} feature
                        {tier.features.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Reorder */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => handleReorder(tier.id, "up")}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === tiers.length - 1}
                    onClick={() => handleReorder(tier.id, "down")}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  {/* Toggle active */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(tier)}
                    title={tier.isActive ? "Deactivate" : "Activate"}
                  >
                    {tier.isActive ? (
                      <ToggleRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditForm(tier)}
                    title="Edit tier"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(tier.id)}
                    disabled={tier.subscriberCount > 0}
                    title={
                      tier.subscriberCount > 0
                        ? "Cannot delete tier with active subscribers"
                        : "Delete tier"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
      <DialogRoot open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? "Edit Tier" : "Create New Tier"}
            </DialogTitle>
            <DialogDescription>
              {editingTier
                ? "Update the details of your subscription tier."
                : "Set up a new subscription tier for your fans."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="tier-name">Tier Name</Label>
              <Input
                id="tier-name"
                placeholder="e.g. Gold, Premium, VIP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="tier-description">Description</Label>
              <Textarea
                id="tier-description"
                placeholder="What do subscribers get at this tier?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxCharacters={500}
                rows={3}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="tier-price">Monthly Price (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="tier-price"
                  type="number"
                  step="0.01"
                  min="4.99"
                  max="499.99"
                  placeholder="9.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum $4.99, maximum $499.99
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  maxLength={200}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddFeature}
                  disabled={!newFeature.trim() || features.length >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {features.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="flex-1 truncate">{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                {features.length}/20 features
              </p>
            </div>

            {/* Error */}
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={formLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={formLoading}
              className="shadow-gold-sm"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTier ? (
                "Save Changes"
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Tier
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* ── Delete Confirmation Dialog ────────────────────────────────── */}
      <DialogRoot
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Tier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tier? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
