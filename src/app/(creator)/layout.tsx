// ============================================================================
// Creator Dashboard Layout
// ============================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/../auth";
import { creatorSidebarSections } from "@/config/nav";
import { cn } from "@/lib/utils";

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
        "text-muted-foreground hover:bg-primary/10 hover:text-primary",
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

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only creators and admins can access the creator dashboard
  const { user } = session;
  if (user.role !== "CREATOR" && user.role !== "ADMIN" && !user.isCreator) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:border-r lg:border-border lg:bg-card">
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="mb-4 px-3">
            <h2 className="text-lg font-bold text-foreground">Creator Studio</h2>
            <p className="text-xs text-muted-foreground">
              Manage your content and earnings
            </p>
          </div>

          <nav className="flex-1 space-y-6">
            {creatorSidebarSections.map((section) => (
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
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
