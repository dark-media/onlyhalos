"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageSquare, X } from "lucide-react";
import type { Session } from "next-auth";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { mainNavItems } from "@/config/nav";
import { SearchBar } from "@/components/layout/search-bar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavbarProps {
  user: Session["user"];
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-16 border-b border-border/50",
          "bg-dark/80 backdrop-blur-xl supports-[backdrop-filter]:bg-dark/60",
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          {/* ── Left: Logo ───────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <Link
              href="/feed"
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              {/* Halo icon */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-gold-gradient shadow-gold-sm",
                  "transition-shadow group-hover:shadow-gold-md",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-dark"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <span className="hidden text-lg font-bold text-foreground sm:block">
                {siteConfig.name}
              </span>
            </Link>
          </div>

          {/* ── Center: Search ───────────────────────────────────────── */}
          <div className="flex flex-1 items-center justify-center px-4">
            <SearchBar compact className="max-w-md" />
          </div>

          {/* ── Right: Actions ───────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            {/* Messages */}
            <Link
              href="/messages"
              className={cn(
                "hidden h-10 w-10 items-center justify-center rounded-lg transition-colors sm:flex",
                "text-muted-foreground hover:bg-dark-200 hover:text-foreground",
                pathname?.startsWith("/messages") &&
                  "bg-dark-200 text-primary",
              )}
              aria-label="Messages"
            >
              <MessageSquare className="h-5 w-5" />
            </Link>

            {/* Notifications */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* User menu */}
            <div className="hidden sm:block">
              <UserMenu user={user} />
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors sm:hidden",
                "text-muted-foreground hover:bg-dark-200 hover:text-foreground",
              )}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <nav
            className={cn(
              "fixed inset-x-0 top-16 z-40 sm:hidden",
              "border-b border-border bg-dark/95 backdrop-blur-xl",
              "animate-in slide-in-from-top-2 fade-in-0",
              "max-h-[calc(100vh-4rem)] overflow-y-auto",
            )}
          >
            <div className="space-y-1 p-4">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-dark-200 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-2xs font-semibold text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile user section */}
            <div className="border-t border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserMenu user={user} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {user.name ?? "User"}
                    </p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>
                <NotificationBell />
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
