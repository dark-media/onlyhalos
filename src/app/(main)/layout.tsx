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
      {/* Top navbar — fixed, full width */}
      <Navbar user={user} />

      {/* Desktop sidebar — fixed, left side, hidden on mobile */}
      <Sidebar user={user} />

      {/* Main content area */}
      <main
        className={
          "min-h-screen pt-16 " + // offset for fixed navbar (h-16)
          "lg:pl-60 " + // offset for desktop sidebar (w-60)
          "pb-20 md:pb-6" // offset for mobile bottom nav, normal padding on desktop
        }
      >
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation — visible on md and below */}
      <MobileNav user={user} />
    </ThemeProvider>
  );
}
