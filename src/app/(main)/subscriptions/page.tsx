"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  tier: {
    id: string;
    name: string;
    price: number;
  };
}

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/subscriptions");
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(data.subscriptions ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">My Subscriptions</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">No subscriptions yet</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Subscribe to your favourite creators to see their exclusive content.
          </p>
          <Button asChild>
            <Link href="/explore">Explore Creators</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
            >
              <Link href={`/${sub.creator.username}`} className="flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-dark-200">
                  <Image
                    src={sub.creator.avatarUrl || DEFAULT_AVATAR_URL}
                    alt={sub.creator.displayName || sub.creator.username}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {sub.creator.displayName || sub.creator.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{sub.creator.username} · {sub.tier.name} · ${(sub.tier.price / 100).toFixed(2)}/mo
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  sub.status === "ACTIVE"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {sub.status}
                </span>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/${sub.creator.username}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
