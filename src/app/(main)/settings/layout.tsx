"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  Bell,
  Lock,
  CreditCard,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Settings Navigation Items
// ---------------------------------------------------------------------------

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Display name, bio, avatar, and social links",
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password, two-factor authentication, sessions",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Email and in-app notification preferences",
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: Lock,
    description: "Online status, messaging, blocked users",
  },
  {
    title: "Payments",
    href: "/settings/payments",
    icon: CreditCard,
    description: "Subscriptions, transactions, billing",
  },
];

// ---------------------------------------------------------------------------
// Settings Layout
// ---------------------------------------------------------------------------

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // On mobile: if we're on the root /settings page, show the nav list.
  // If we're on a sub-page, show the content with a back link.
  const isRootSettings = pathname === "/settings";
  const isSubPage = !isRootSettings && pathname?.startsWith("/settings/");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences and profile
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ── Sidebar Navigation ─────────────────────────────────── */}
        <nav
          className={cn(
            "w-full shrink-0 lg:w-56",
            // On mobile sub-pages, hide the nav
            isSubPage && "hidden lg:block",
          )}
        >
          <ul className="space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                      "lg:py-2.5",
                      isActive
                        ? "bg-primary/10 text-primary shadow-gold-sm"
                        : "text-muted-foreground hover:bg-dark-200 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{item.title}</span>
                      {/* Show description on mobile nav list */}
                      <span className="block truncate text-xs text-muted-foreground lg:hidden">
                        {item.description}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground lg:hidden",
                        isActive && "text-primary",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Content Area ───────────────────────────────────────── */}
        <div
          className={cn(
            "min-w-0 flex-1",
            // On mobile root page, hide content (nav is shown instead)
            isRootSettings && "hidden lg:block",
          )}
        >
          {/* Mobile back link */}
          {isSubPage && (
            <Link
              href="/settings"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to Settings
            </Link>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
