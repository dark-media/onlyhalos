"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Optional NextAuth session to hydrate SessionProvider. */
  session?: Parameters<typeof SessionProvider>[0]["session"];
}

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

/**
 * Root provider wrapper that composes all context providers required by the
 * authenticated application shell.
 *
 * - `SessionProvider` — NextAuth v5 session context for `useSession()`.
 * - `TooltipProvider` — Radix UI tooltip context for all tooltips in the tree.
 *
 * Wrap this around the top-level layout `children` so that every page has
 * access to these contexts.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { ThemeProvider } from "@/components/layout/theme-provider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en" className="dark">
 *       <body>
 *         <ThemeProvider>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children, session }: ThemeProviderProps) {
  return (
    <SessionProvider session={session}>
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
        {children}
      </TooltipProvider>
    </SessionProvider>
  );
}
