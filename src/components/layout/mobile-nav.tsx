"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlusCircle,
  MessageSquare,
  User,
} from "lucide-react";
import type { Session } from "next-auth";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MobileNavProps {
  user: Session["user"];
}

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isCreate?: boolean;
}

// ---------------------------------------------------------------------------
// Mobile nav items
// ---------------------------------------------------------------------------

function getMobileNavItems(username: string | null): MobileNavItem[] {
  return [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Create", href: "/create", icon: PlusCircle, isCreate: true },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    {
      label: "Profile",
      href: username ? `/${username}` : "/profile",
      icon: User,
    },
  ];
}

// ---------------------------------------------------------------------------
// MobileNav
// ---------------------------------------------------------------------------

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const items = getMobileNavItems(user.username);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 md:hidden",
        "border-t border-border/50",
        "bg-dark/80 backdrop-blur-xl supports-[backdrop-filter]:bg-dark/60",
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.isCreate
            ? pathname === "/create"
            : item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          if (item.isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5"
                aria-label={item.label}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                    "bg-gold-gradient shadow-gold-sm",
                    "hover:shadow-gold-md active:scale-95",
                  )}
                >
                  <Icon className="h-5 w-5 text-dark" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-2xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for devices with home indicators */}
      <div className="h-safe-area-inset-bottom bg-dark/80" />
    </nav>
  );
}
