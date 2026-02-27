// ============================================================================
// Messages Layout — Split view with conversation list + thread
// ============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { ConversationList } from "@/components/messages/conversation-list";

export const metadata = {
  title: "Messages | OnlyHalos",
  description: "Your private conversations on OnlyHalos.",
};

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
        {/* ── Conversation list sidebar ─────────────────────────────── */}
        <aside className="hidden w-full max-w-sm shrink-0 border-r border-border md:block">
          <ConversationList currentUserId={currentUserId} />
        </aside>

        {/* ── Thread / content area ─────────────────────────────────── */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
