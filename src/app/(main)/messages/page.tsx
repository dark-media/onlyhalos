// ============================================================================
// Messages Inbox Page
// ============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { MessageSquare } from "lucide-react";

import { ConversationList } from "@/components/messages/conversation-list";

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  return (
    <>
      {/* ── Mobile: full conversation list ───────────────────────────── */}
      <div className="h-full md:hidden">
        <ConversationList currentUserId={currentUserId} />
      </div>

      {/* ── Desktop: "Select a conversation" placeholder ─────────────── */}
      <div className="hidden h-full flex-col items-center justify-center md:flex">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-200">
            <MessageSquare className="h-10 w-10 text-halo-gold" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Your Messages
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Select a conversation from the sidebar to start chatting, or start
              a new conversation with a creator.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
