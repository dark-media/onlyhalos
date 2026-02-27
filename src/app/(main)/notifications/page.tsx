// ============================================================================
// Notifications Page
// ============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import type { Metadata } from "next";

import { NotificationList } from "@/components/notifications/notification-list";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Notifications | OnlyHalos",
  description:
    "View your notifications — new subscribers, messages, likes, comments, tips, and more.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <NotificationList />;
}
