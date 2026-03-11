type CreateConversationWithFirstMessageProps = {
  // 대화 유형 (셋 중 하나)
  userId?: string;
  isGroup?: boolean;
  members?: string[];
  groupName?: string | null;
  aiAgentType?: string;
  // 첫 메시지
  message?: string;
  image?: string;
  messageId: string;
};

/**
 * 대화방 생성 + 첫 메시지 저장을 1번의 네트워크 요청으로 처리
 */
export const createConversationWithFirstMessage = async ({
  userId,
  isGroup,
  members,
  groupName,
  aiAgentType,
  message,
  image,
  messageId,
}: CreateConversationWithFirstMessageProps) => {
  const res = await fetch("/api/conversations/first-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      isGroup,
      members,
      name: groupName,
      aiAgentType,
      message,
      image,
      messageId,
    }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg =
      (payload as { message?: string; error?: string })?.message ||
      (payload as { message?: string; error?: string })?.error ||
      `생성 실패 (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const payload = await res.json();

  return payload as {
    conversation: {
      id: string;
      name: string | null;
      isGroup: boolean;
      isAIChat: boolean;
      aiAgentType: string | null;
      userIds: string[];
      users: { id: string; name: string | null; email: string | null; image: string | null }[];
      lastMessageAt: string | null;
      existingConversation: boolean;
    };
    newMessage: {
      id: string;
      body: string | null;
      image: string | null;
      type: string;
      createdAt: string;
      conversationId: string;
      serverCreatedAtMs: number;
      sender: { id: string; name: string | null; email: string | null; image: string | null };
      conversation: { isGroup: boolean; userIds: string[] };
    };
  };
};
