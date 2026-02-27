// ============================================================================
// Conversation Thread Page
// ============================================================================

import { redirect, notFound } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/messages/message-thread";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { conversationId } = await params;
  const currentUserId = session.user.id;

  // Validate that the conversation exists and the user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      user1Id: true,
      user2Id: true,
    },
  });

  if (!conversation) {
    notFound();
  }

  if (
    conversation.user1Id !== currentUserId &&
    conversation.user2Id !== currentUserId
  ) {
    notFound();
  }

  return (
    <div className="h-full">
      <MessageThread
        conversationId={conversationId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
