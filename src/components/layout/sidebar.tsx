"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Session } from "next-auth";

import { cn, getInitials } from "@/lib/utils";
import { mainNavItems } from "@/config/nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SidebarProps {
  user: Session["user"];
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const initials = getInitials(user.name ?? user.username ?? "U");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-dark-50 pt-16 transition-all duration-300 lg:flex",
        collapsed ? "w-[68px]" : "w-60",
      )}
    >
      {/* ── Navigation Items ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary shadow-gold-sm"
                    : "text-muted-foreground hover:bg-dark-200 hover:text-foreground",
                  collapsed && "justify-center px-2",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />

                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-2xs font-semibold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            // In collapsed mode, wrap each item with a tooltip
            if (collapsed) {
              return (
                <li key={item.href}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={item.href}>{linkContent}</li>;
          })}
        </ul>
      </nav>

      {/* ── Collapse toggle ──────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors",
            "hover:bg-dark-200 hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* ── User profile section ─────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-3">
        <Link
          href={user.username ? `/${user.username}` : "/profile"}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
            "hover:bg-dark-200",
            collapsed && "justify-center",
          )}
        >
          <Avatar size="sm">
            {user.avatarUrl && (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name ?? "Avatar"}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name ?? "User"}
              </p>
              {user.username && (
                <p className="truncate text-xs text-muted-foreground">
                  @{user.username}
                </p>
              )}
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
