"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  User,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import type { Session } from "next-auth";

import { cn, getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserMenuProps {
  user: Session["user"];
}

// ---------------------------------------------------------------------------
// UserMenu
// ---------------------------------------------------------------------------

export function UserMenu({ user }: UserMenuProps) {
  const initials = getInitials(user.name ?? user.username ?? "U");
  const isCreator = user.isCreator;
  const isAdmin = user.role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg p-1 transition-colors",
            "hover:bg-dark-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="User menu"
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
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        {/* ── User info ──────────────────────────────────────────────── */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name ?? "User"}
              </p>
              {isCreator && (
                <Badge variant="premium" className="px-1.5 py-0 text-2xs">
                  Creator
                </Badge>
              )}
              {isAdmin && (
                <Badge variant="destructive" className="px-1.5 py-0 text-2xs">
                  Admin
                </Badge>
              )}
            </div>
            {user.username && (
              <p className="truncate text-xs text-muted-foreground">
                @{user.username}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* ── Navigation items ───────────────────────────────────────── */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href={user.username ? `/${user.username}` : "/profile"}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* ── Creator section ────────────────────────────────────────── */}
        {isCreator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/creator/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Creator Dashboard
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {/* ── Admin section ──────────────────────────────────────────── */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="cursor-pointer">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />

        {/* ── Sign out ───────────────────────────────────────────────── */}
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
