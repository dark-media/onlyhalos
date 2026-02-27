// ============================================================================
// Main Authenticated Layout
// ============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <ThemeProvider session={session}>
      {/* Simplified layout for debugging */}
      <div className="min-h-screen bg-background p-8">
        <p className="text-foreground mb-4">Logged in as: {user.name ?? user.email} (role: {String(user.role ?? "unknown")})</p>
        {children}
      </div>
    </ThemeProvider>
  );
}
