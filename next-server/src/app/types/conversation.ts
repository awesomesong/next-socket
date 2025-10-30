import { Conversation, Message, User } from "@prisma/client";
import { IUserList } from "./common";

export type FullMessageType = Message & {
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  conversation: {
    isGroup: boolean | null;
    userIds: string[];
  };
  clientMessageId?: string; // ✅ 낙관적 업데이트용 임시 ID
  isAIResponse?: boolean;
  isWaiting?: boolean;
  isTyping?: boolean;
  isError?: boolean;
  seenUsersForLastMessage?: Array<{ id: string; name: string | null; email: string | null }>;
};

export type MessageType = Message & {
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export type FullConversationType = Conversation & {
  users: IUserList[];
  messages: MessageType[];
  unReadCount?: number;
  lastMessageAt?: Date | string;
};

export type ConversationProps = {
  conversations: FullConversationType[];
};

// 소켓 이벤트 페이로드 타입
export interface ReadMessagePayload {
  conversationId: string;
  seenUser: User;
}

export interface ExitUserPayload {
  conversationId: string;
  userIds: string[];
}

// 로딩 중 메시지 타입
export interface LoadingMessage {
  message: {
    id: string;
    conversationId: string;
    sender: { email: string };
    body: string;
    type: "text" | "image" | "system";
    createdAt: Date;
    isAIResponse: boolean;
  };
  targetEmail: string;
}