// ============================================================================
// Edge-safe Auth Configuration (no Prisma imports)
// ============================================================================

import type { NextAuthConfig } from "next-auth";

// Public routes that do not require authentication
const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// Known application route prefixes (non-username routes)
const knownRoutePrefixes = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "dashboard",
  "posts",
  "subscribers",
  "earnings",
  "analytics",
  "tiers",
  "payouts",
  "admin",
  "api",
  "settings",
  "messages",
  "notifications",
  "subscriptions",
  "profile",
  "bookmarks",
  "feed",
  "explore",
  "search",
  "_next",
]);

// Creator-only routes requiring CREATOR or ADMIN role
const creatorRoutes = new Set([
  "/dashboard",
  "/posts",
  "/subscribers",
  "/earnings",
  "/analytics",
  "/tiers",
  "/payouts",
]);

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // ------------------------------------------------------------------
      // 1. Public API routes
      // ------------------------------------------------------------------
      if (pathname.startsWith("/api/auth")) return true;
      if (pathname.startsWith("/api/stripe/webhook")) return true;
      if (
        pathname.startsWith("/api/creators") &&
        nextUrl.searchParams.get("_method") !== "POST"
      ) {
        // GET requests to /api/creators are public
        return true;
      }

      // ------------------------------------------------------------------
      // 2. Public page routes
      // ------------------------------------------------------------------
      if (publicRoutes.has(pathname)) return true;

      // ------------------------------------------------------------------
      // 3. Public profile pages: /[username] (single segment, not a known route)
      // ------------------------------------------------------------------
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length === 1 && !knownRoutePrefixes.has(segments[0])) {
        return true;
      }

      // ------------------------------------------------------------------
      // 4. Admin routes - require ADMIN role
      // ------------------------------------------------------------------
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        const role = auth?.user?.role;
        if (role !== "ADMIN") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // ------------------------------------------------------------------
      // 5. Creator routes - require CREATOR or ADMIN role
      // ------------------------------------------------------------------
      if (creatorRoutes.has(pathname) || creatorRoutes.has(`/${segments[0]}`)) {
        if (!isLoggedIn) return false;
        const role = auth?.user?.role;
        if (role !== "CREATOR" && role !== "ADMIN") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // ------------------------------------------------------------------
      // 6. Everything else requires authentication
      // ------------------------------------------------------------------
      if (!isLoggedIn) return false;

      return true;
    },
  },
  providers: [], // Providers are configured in auth.ts (not edge-safe)
};
