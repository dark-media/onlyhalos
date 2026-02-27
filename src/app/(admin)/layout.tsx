// ============================================================================
// Admin Panel Layout
// ============================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/../auth";
import { adminSidebarSections } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

// ---------------------------------------------------------------------------
// Sidebar Nav Item
// ---------------------------------------------------------------------------

function SidebarItem({
  href,
  icon: Icon,
  title,
  disabled,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
        <Icon className="h-4 w-4" />
        {title}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "text-muted-foreground hover:bg-destructive/10 hover:text-red-400",
      )}
    >
      <Icon className="h-4 w-4" />
      {title}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only admins can access the admin panel
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-card">
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                <Shield className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
                <p className="text-xs text-red-400">OnlyHalos Administration</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6">
            {adminSidebarSections.map((section) => (
              <div key={section.label}>
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      title={item.title}
                      disabled={item.disabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Back to main */}
          <div className="mt-4 border-t border-border pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>&larr;</span>
              Back to OnlyHalos
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20">
          <Shield className="h-3.5 w-3.5 text-red-400" />
        </div>
        <span className="font-bold text-foreground">Admin Panel</span>
        <Link href="/" className="ml-auto text-xs text-muted-foreground">
          &larr; Back
        </Link>
      </div>

      {/* Main content area */}
      <main className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
