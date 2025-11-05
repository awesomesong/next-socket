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
  serverCreatedAtMs?: number; // 정규화 후 타임스탬프
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
  lastMessageAtMs?: number;
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

/**
 * 대화방 삭제/멤버 나감 API 응답의 이벤트 타입
 * DELETE /api/conversations/[conversationId] 엔드포인트에서 사용됩니다.
 */
export type DeleteConversationEvent = 
  | {
      type: "room.deleted";
      conversationId: string;
      ts: number;
      rev: number;
      recipients: string[];
    }
  | {
      type: "member.left";
      conversationId: string;
      ts: number;
      rev: number;
      recipients: string[];
      userId: string;
      systemMessage?: {
        id: string;
        createdAt: Date | string;
        body: string;
        type: string;
        senderId: string;
        conversationId: string;
        sender: {
          id: string;
          name: string | null;
          email: string | null;
          image: string | null;
        };
      };
    };

/**
 * 대화방 삭제 API 성공 응답 타입
 */
export type DeleteConversationSuccessResponse = {
  ok: true;
  event: DeleteConversationEvent;
};

/**
 * 대화방 삭제 API 에러 응답 타입
 */
export type DeleteConversationErrorResponse = {
  message?: string;
  error?: string;
};

/**
 * 대화방 삭제 API 응답 타입 (성공 또는 에러)
 */
export type DeleteConversationResponse = DeleteConversationSuccessResponse | DeleteConversationErrorResponse;

/**
 * room.event 소켓 이벤트 페이로드 타입
 * member.left, member.removed, room.deleted 등의 이벤트에서 사용됩니다.
 */
export interface RoomEventPayload {
  type: "member.left" | "member.joined" | "member.removed" | "room.deleted";
  conversationId: string;
  userId?: string;
  userEmail?: string;
  ts: number;
  rev: number;
  recipients?: string[];
  // 호환성을 위한 옵셔널 필드
  roomId?: string;
  id?: string;
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

/**
 * 대화방 목록에서 특정 대화방의 읽지 않은 메시지 수를 가져옵니다.
 * @param conversationListData - 대화방 목록 데이터 (ConversationListData | undefined)
 * @param conversationId - 찾을 대화방 ID
 * @returns 읽지 않은 메시지 수 (없으면 0)
 */
export function getUnreadCountFromList(
  conversationListData: { conversations?: FullConversationType[] } | undefined | null,
  conversationId: string
): number {
  if (!conversationListData?.conversations || !conversationId) {
    return 0;
  }

  const conversation = conversationListData.conversations.find(
    (c) => c.id === conversationId
  );

  return typeof conversation?.unReadCount === "number" ? conversation.unReadCount : 0;
}

/**
 * 메시지 객체에서 발신자 ID를 안전하게 추출합니다.
 * sender?.id를 우선 확인하고, 없으면 직접 senderId 속성을 확인합니다.
 * @param message - 메시지 객체 (FullMessageType 또는 senderId 속성을 가진 객체)
 * @returns 발신자 ID 문자열 (없으면 빈 문자열)
 */
export function getMessageSenderId(
  message: 
    | FullMessageType 
    | { sender?: { id?: string | null }; senderId?: string | null }
    | null 
    | undefined
): string {
  if (!message) return "";

  // sender?.id를 우선 확인
  if (message.sender?.id) {
    return String(message.sender.id);
  }

  // sender?.id가 없으면 직접 senderId 속성 확인
  if ("senderId" in message && message.senderId) {
    return String(message.senderId);
  }

  return "";
}

/**
 * bumpConversationOnNewMessage 함수에 사용되는 메시지 미리보기 타입
 * 대화방 목록의 미리보기 업데이트에 필요한 최소한의 메시지 정보를 담습니다.
 */
export type ConversationMessagePreview = {
  id?: string;
  clientMessageId?: string;
  type?: "text" | "image" | "system";
  body?: string | null;
  image?: string | null | undefined;
  createdAt: Date | string;
  isAIResponse?: boolean;
  sender?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  senderId?: string;
};

/**
 * 메시지 타입을 정규화합니다.
 * @param type - 원본 메시지 타입 (string | null | undefined 포함 가능)
 * @returns 정규화된 메시지 타입 ("text" | "image" | "system")
 */
export function normalizeMessageType(
  type: string | null | undefined
): "text" | "image" | "system" {
  if (type === "image") return "image";
  if (type === "system") return "system";
  return "text";
}

/**
 * 메시지 타입을 미리보기용으로 정규화합니다.
 * system 타입은 text로 변환되고, 그 외는 text/image만 허용됩니다.
 * @param type - 원본 메시지 타입 (string | null | undefined 포함 가능)
 * @returns 정규화된 미리보기 타입 ("text" | "image" | undefined)
 */
export function normalizePreviewType(
  type: string | null | undefined
): "text" | "image" | undefined {
  if (type === "image") return "image";
  if (type === "text") return "text";
  if (type === "system") return "text"; // system은 text로 변환
  return undefined;
}

/**
 * 대화방 비교를 위한 부분 타입
 * lastMessageMs, memberCount 등의 유틸리티 함수에서 사용
 */
export type PartialConversationType = {
  id?: string;
  lastMessageAt?: Date | string | null;
  lastMessageAtMs?: number | string | null;
  messages?: Array<{ id?: string }>;
  userIds?: string[];
  users?: Array<{ id?: string | null }>;
  _count?: { users?: number };
  name?: string | null;
  isAIChat?: boolean | null;
  unReadCount?: number;
  [key: string]: unknown;
};

/**
 * 메시지 정규화 전의 원본 메시지 타입
 * sender/user가 선택적으로 있을 수 있음
 */
export type UnnormalizedMessage = {
  id?: string;
  conversationId?: string;
  createdAt?: Date | string;
  serverCreatedAtMs?: number;
  type?: string | null;
  body?: string | null;
  image?: string | null;
  sender?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  conversation?: {
    userIds?: string[];
    users?: Array<{ id?: string; userId?: string }>;
    isGroup?: boolean | null;
  };
  isAIResponse?: boolean;
  isError?: boolean;
  clientMessageId?: string;
  [key: string]: unknown;
};

/**
 * Sender/User 정규화를 위한 기반 타입
 */
export type SenderUserBase = {
  sender?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

/**
 * 대화방 목록 API 응답 타입
 */
export type ConversationListResponse = {
  conversations: FullConversationType[];
};