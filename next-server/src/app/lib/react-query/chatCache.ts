import type { QueryClient, InfiniteData } from "@tanstack/react-query";
import type {
  FullConversationType,
  FullMessageType,
  ConversationMessagePreview,
  UnnormalizedMessage,
  SenderUserBase,
  PartialConversationType,
} from "@/src/app/types/conversation";
import { getMessageSenderId, normalizeMessageType, normalizePreviewType } from "@/src/app/types/conversation";
import { hasCustomMeta, lastMessageMs, memberCount, pickMsgs } from "../../utils/chat";
import { normalizeDate } from "./utils";

// ===== Query Keys =====
export const CHAT_MEMBER_KEY = ["chatMember"] as const;
export const conversationListKey = ["conversationList"] as const;
export const conversationKey = (conversationId: string) => ["conversation", conversationId] as const;
export const messagesKey = (conversationId: string) => ["messages", conversationId] as const;

// ===== Types =====
export type ConversationListData = { 
  conversations: FullConversationType[];
};
export type MessagesPage = {
  messages: FullMessageType[];
  nextCursor: string | null;
  seenUsersForLastMessage?: Array<{ id: string; name: string | null; image: string | null }>;
};
export type MessagesInfinite = InfiniteData<MessagesPage> | undefined;

// sender/user 정규화 헬퍼
const deriveSenderAndUser = (base: SenderUserBase) => {
  const s = base?.sender;
  const u = base?.user;
  const user = u ?? (s ? { id: s.id, name: s.name, email: s.email, image: s.image } : undefined);
  const sender = s ?? (u ? { id: u.id, name: u.name, email: u.email, image: u.image } : undefined);
  return { sender: sender || {}, user: user || {} };
};

// NaN 방어 헬퍼
const asMs = (t?: number, d?: Date | string | number) => {
  if (Number.isFinite(t)) return t as number;
  const ms = new Date(d as Date | string).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

// 메시지 변경 감지를 위한 핵심 키 정의
const MESSAGE_DIFF_KEYS = [
  "id",
  "clientMessageId", 
  "serverCreatedAtMs",
  "createdAt",
  "type",
  "body",
  "image",
  "isError",
] as const;

// 안전한 값 비교 함수
const eq = (a: unknown, b: unknown): boolean => {
  // Date 값 비교 보정
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return Object.is(a, b); // NaN 포함 안전
};

// 메시지 변경 감지 함수
const changed = (prev: Partial<FullMessageType> | Partial<UnnormalizedMessage>, next: Partial<FullMessageType> | Partial<UnnormalizedMessage>): boolean => {
  // 1) 핵심 키 비교
  for (const k of MESSAGE_DIFF_KEYS) {
    const prevVal = (prev as Record<string, unknown>)?.[k];
    const nextVal = (next as Record<string, unknown>)?.[k];
    if (!eq(prevVal, nextVal)) return true;
  }
  
  // 2) 중첩: sender는 포인트 비교만
  const ps = prev?.sender ?? {};
  const ns = next?.sender ?? {};
  if (!eq(ps.id, ns.id)) return true;
  if (!eq(ps.email, ns.email)) return true;

  return false;
};

// 오래→최신(ASC). 동시간대는 id로 안정화
const cmpAsc = (a: Partial<UnnormalizedMessage>, b: Partial<UnnormalizedMessage>): number => {
  const ta = asMs(a?.serverCreatedAtMs, a?.createdAt);
  const tb = asMs(b?.serverCreatedAtMs, b?.createdAt);
  if (ta !== tb) return ta - tb;

  const ai = String(a?.id ?? a?.clientMessageId ?? "");
  const bi = String(b?.id ?? b?.clientMessageId ?? "");
  if (ai && bi && ai !== bi) return ai.localeCompare(bi);

  return 0;
};

// 메시지 정규화 함수 (통합)
export function normalizeMessage(message: UnnormalizedMessage): FullMessageType {
  // 1) createdAt을 Date로 안전 정규화
  let created: Date;
  if (message.createdAt instanceof Date) {
    created = message.createdAt;
  } else {
    const d = new Date(message.createdAt as Date | string);
    created = Number.isFinite(d.getTime()) ? d : new Date();
  }

  // 2) ms 타임스탬프(숫자) 확보
  const ms =
    typeof message.serverCreatedAtMs === "number" &&
    Number.isFinite(message.serverCreatedAtMs)
      ? message.serverCreatedAtMs
      : created.getTime();

  // 3) 타입 정규화
  const type = normalizeMessageType(message?.type);

  // 4) sender/user 정규화 (헬퍼 사용)
  const { sender } = deriveSenderAndUser(message);

  return {
    ...message,
    createdAt: created,
    serverCreatedAtMs: ms,
    type,
    sender: {
      id: sender.id || "",
      name: sender.name ?? null,
      email: sender.email ?? null,
      image: sender.image ?? null,
    },
    senderId: message.senderId || sender.id || "",
    isAIResponse: Boolean(message.isAIResponse),
    isError: Boolean(message.isError),
    conversation: {
      ...(message.conversation || { isGroup: null, userIds: [] }),
      isGroup: message.conversation?.isGroup ?? null,
      userIds:
        message.conversation?.userIds ??
        (Array.isArray(message.conversation?.users)
          ? message.conversation.users
              .map((u: { id?: string; userId?: string }) => String(u?.id ?? u?.userId ?? ""))
              .filter(Boolean)
          : []),
    },
    image: type === "image" ? (message?.image ?? null) : null,
    conversationId: String(message?.conversationId ?? ""),
  } as FullMessageType;
}

// normalizeMessageForSocket는 normalizeMessage로 통합됨

// ID 중복 체크 헬퍼들
const isSameId = (a: Partial<UnnormalizedMessage> | Partial<FullMessageType>, b: Partial<UnnormalizedMessage> | Partial<FullMessageType>): boolean => {
  const ai = a?.id;
  const bi = b?.id;
  return ai != null && bi != null && String(ai) === String(bi);
};

const isSameClientId = (a: Partial<UnnormalizedMessage> | Partial<FullMessageType>, b: Partial<UnnormalizedMessage> | Partial<FullMessageType>): boolean => {
  const ac = a?.clientMessageId;
  const bc = b?.clientMessageId;
  return ac != null && bc != null && String(ac) === String(bc);
};

// 같은 사용자가 보낸 같은 메시지인지 확인 (중복 체크용)
function isSameUserMessage(a: Partial<UnnormalizedMessage> | Partial<FullMessageType>, b: Partial<UnnormalizedMessage> | Partial<FullMessageType>): boolean {
  const idEq = (x?: string, y?: string) => x && y && String(x) === String(y);
  const email = (x: Partial<UnnormalizedMessage>) => String(x?.sender?.email ?? "").trim().toLowerCase();
  const sameSender = idEq(a?.sender?.id, b?.sender?.id) || (email(a) && email(a) === email(b));
  if (!sameSender) return false;
  return isSameId(a, b) || isSameClientId(a, b);
}

// 정렬 삽입(오래→최신 ASC), 같은 사용자의 동일 메시지는 중복 삽입 방지
function binaryInsertSorted(arr: FullMessageType[], msg: FullMessageType, cmp = cmpAsc): void {
  // ✅ 최적화: ID 기반 중복 체크를 먼저 수행 (빠른 종료)
  const msgId = msg?.id ? String(msg.id) : null;
  const clientId = msg?.clientMessageId ? String(msg.clientMessageId) : null;
  
  // 1) ID 중복 체크 (가장 빠름)
  if (msgId) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.id && String(arr[i].id) === msgId) return;
    }
  }
  
  // 2) clientMessageId 중복 체크
  if (clientId) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.clientMessageId && String(arr[i].clientMessageId) === clientId) return;
    }
  }
  
  // 3) 동일 사용자 메시지 체크 (느림, 마지막에)
  // ID 체크에서 걸러지지 않았다면 같은 사용자의 같은 메시지인지 확인
  for (let i = 0; i < arr.length; i++) {
    if (isSameUserMessage(arr[i], msg)) return;
  }
  
  // 4) 이진 삽입 (cmpAsc가 이미 ms→id→clientId 순 tie-break 처리)
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    // cmpAsc: serverCreatedAtMs → createdAt → id/clientId 순으로 안정 정렬
    if (cmp(arr[mid], msg) <= 0) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, msg);
}


// ✅ 헬퍼: 메시지가 리스트의 마지막(top, 최신)인지 확인
// p.messages는 오래→최신(ASC) 정렬 기준
const isTop = (arr: FullMessageType[], msg: FullMessageType) => {
  if (!arr.length) return true;
  const last = arr[arr.length - 1];
  return cmpAsc(last, msg) <= 0; // last <= msg 이면 msg가 top(또는 동률)
};

/**
 * messages 캐시에 정렬 삽입
 * InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }>
 * 구조라고 가정하고, 최신 페이지를 pages[0]로 본다.
 */
export function upsertMessageSortedInCache(
  qc: QueryClient,
  conversationId: string,
  message: UnnormalizedMessage | FullMessageType,
) {
  qc.setQueryData(messagesKey(conversationId), (old: MessagesInfinite) => {
    const normalized = normalizeMessage(message);

    // ✅ 3) 방어 로직: 다른 방 메시지 필터링
    if (String(normalized.conversationId) !== String(conversationId)) {
      console.warn(`[chatCache] 메시지 conversationId 불일치: ${normalized.conversationId} !== ${conversationId}`);
      return old; // 잘못 들어온 메시지 무시
    }

    // 초기 구조 생성
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) {
      return {
        pageParams: [null],
        pages: [{
          messages: [normalized],
          nextCursor: null,
          seenUsersForLastMessage: [],
        }],
      } as InfiniteData<MessagesPage>;
    }

    let anyPageChanged = false;

    const pages = old.pages.map((p: MessagesPage, i: number) => {
      if (i !== 0) return p; // 최신 페이지만 수정

      const origList: FullMessageType[] = Array.isArray(p.messages) ? p.messages : [];
      let list = origList;      // 변경 없으면 참조 유지
      let pageChanged = false;  // 이 페이지 변경 여부
      let resetSeen = false;    // seenUsersForLastMessage 초기화 여부

      // ✅ 최적화: ID/clientId를 미리 추출하여 재사용
      const normalizedId = normalized?.id ? String(normalized.id) : null;
      const normalizedClientId = normalized?.clientMessageId ? String(normalized.clientMessageId) : null;

      // 1) ID 멱등 교체
      const byId = normalizedId 
        ? origList.findIndex(m => m?.id && String(m.id) === normalizedId)
        : -1;
      
      if (byId >= 0) {
        // 1) ID 멱등 교체: 시간/상태 보존으로 불필요한 재정렬/깜빡임 방지
        const before = origList[byId];
        if (changed(before, normalized)) {
          list = [...origList];
          list[byId] = { 
            ...before, 
            ...normalized,
            // ✅ 2) 서버 시간이 없으면 기존 시간 보존 (null/undefined만 대체)
            createdAt: normalized.createdAt ?? before.createdAt,
            serverCreatedAtMs: normalized.serverCreatedAtMs ?? before.serverCreatedAtMs,
            // ✅ 확정 메시지는 에러/대기 상태 제거
            isError: normalized.isError ?? false,
            isWaiting: normalized.isWaiting ?? false,
          };
          pageChanged = true;
          // resetSeen = false; (같은 ID 교체는 초기화 안 함)
        }
      } else if (normalizedClientId) {
        // 2) clientMessageId 브릿지: 낙관→서버 확정 교체
        const byClient = origList.findIndex(m => m?.clientMessageId && String(m.clientMessageId) === normalizedClientId);
        if (byClient >= 0) {
          const before = origList[byClient];
          list = [...origList];
          list[byClient] = { 
            ...before,
            ...normalized,
            // ✅ 2) 서버 시간이 없으면 낙관 시간 보존 (null/undefined만 대체)
            createdAt: normalized.createdAt ?? before.createdAt,
            serverCreatedAtMs: normalized.serverCreatedAtMs ?? before.serverCreatedAtMs,
            // ✅ 확정 메시지는 에러/대기 상태 제거
            isError: false,
            isWaiting: false,
          };
          pageChanged = true;
          // ✅ 1) 브릿지 교체 시 top에만 resetSeen
          resetSeen = byClient === origList.length - 1 || isTop(origList, normalized);
        } else {
          // 3) 새 메시지: 정렬 삽입
          const beforeLen = origList.length;
          const copy = [...origList];
          binaryInsertSorted(copy, normalized);
          if (copy.length !== beforeLen) {
            list = copy;
            pageChanged = true;
            // ✅ 1) 새 삽입 시 top에만 resetSeen
            resetSeen = isTop(copy, normalized);
          }
        }
      } else {
        // clientMessageId 없음 → 그냥 삽입 시도
        const beforeLen = origList.length;
        const copy = [...origList];
        binaryInsertSorted(copy, normalized);
        if (copy.length !== beforeLen) {
          list = copy;
          pageChanged = true;
          // ✅ 1) 새 삽입 시 top에만 resetSeen
          resetSeen = isTop(copy, normalized);
        }
      }

      if (!pageChanged) return p; // 이 페이지는 그대로 반환(참조 유지)

      anyPageChanged = true;
      // resetSeen이 true일 때만 seenUsersForLastMessage 초기화
      return resetSeen
        ? { ...p, messages: list, seenUsersForLastMessage: [] }
        : { ...p, messages: list };
    });

    // 어떤 페이지도 안 바뀌었으면 전체 old 그대로 반환
    if (!anyPageChanged) return old;

    // 바뀐 페이지가 있으면 pages만 새로 끼워서 반환
    return { ...old, pages };
  });
}


// ===== Conversation List Utilities =====
export function withConversationList(
  queryClient: QueryClient,
  updater: (
    old: ConversationListData | undefined,
  ) => ConversationListData | undefined,
): void {
  queryClient.setQueryData(
    conversationListKey,
    (old: ConversationListData | undefined) => updater(old),
  );
}

export function upsertConversation(
  queryClient: QueryClient,
  conversation: Partial<FullConversationType> & { id: string },
): void {
  withConversationList(queryClient, (old) => {
    const prev = old?.conversations ?? [];
    const idx = prev.findIndex((c) => String(c.id) === String(conversation.id));
    const next: FullConversationType[] =
      idx === -1
        ? [conversation as FullConversationType, ...prev]
        : prev.map((c, i) =>
            i === idx ? ({ ...c, ...conversation } as FullConversationType) : c,
          );
    // sort by lastMessageAt desc, then last message id, then id
    const reordered = [...next].sort((a, b) => {
      const aTime = new Date(
        a.lastMessageAt || a.messages?.[0]?.createdAt || 0,
      ).getTime();
      const bTime = new Date(
        b.lastMessageAt || b.messages?.[0]?.createdAt || 0,
      ).getTime();
      if (aTime !== bTime) return bTime - aTime;
      const aMsgId = a.messages?.[0]?.id ? String(a.messages[0].id) : "";
      const bMsgId = b.messages?.[0]?.id ? String(b.messages[0].id) : "";
      if (aMsgId && bMsgId && aMsgId !== bMsgId)
        return bMsgId.localeCompare(aMsgId);
      return String(b.id).localeCompare(String(a.id));
    });
    return { ...(old ?? {}), conversations: reordered };
  });
}

// 대화 리스트의 대화방의 일부만 수정
export function updateConversationById(
  queryClient: QueryClient,
  conversationId: string,
  patch: Partial<FullConversationType>,
): void {
  withConversationList(queryClient, (old) => {
    if (!old?.conversations) return old;
    const next: FullConversationType[] = old.conversations.map((c) =>
      String(c.id) === String(conversationId) ? { ...c, ...patch } : c,
    );
    return { ...(old ?? {}), conversations: next };
  });
}

// 하나의 대화방 제거
export function removeConversationById(
  queryClient: QueryClient,
  conversationId: string,
): void {
  withConversationList(queryClient, (old) => {
    if (!old?.conversations) return old;
    const next = old.conversations.filter(
      (c) => String(c.id) !== String(conversationId),
    );
    return { ...(old ?? {}), conversations: next };
  });
}

// prependConversationIfMissing는 upsertConversation으로 통합됨

// incrementConversationUnread는 updateConversationById로 통합됨

// ✅ 안읽은 수 값 안전장치 (클램프) - 정수+음수차단
export const clampUnread = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
};

// ✅ 공통 유틸리티 함수 - 대화방 업데이트 패턴
export const updateConversationInList = (qc: QueryClient, convId: string, updater: (conv: FullConversationType) => FullConversationType | null) => {
  qc.setQueryData(conversationListKey, (prev: ConversationListData | undefined) => {
    if (!prev?.conversations?.length) return prev;
    const next = { ...prev, conversations: [...prev.conversations] };
    const i = next.conversations.findIndex(c => String(c.id) === String(convId));
      if (i < 0) return prev; 
    
    const updated = updater(next.conversations[i]);
    if (updated === null) return prev; // 변경 없음
    
    next.conversations[i] = updated;
    return next;
  });
};

export function computeTotalUnread(
  list: ConversationListData | undefined,
): number {
  const total =
    list?.conversations?.reduce((sum: number, c: FullConversationType) =>
        sum + clampUnread(c.unReadCount),
      0,
    ) ?? 0;
  return Number.isFinite(total) ? total : 0;
}

// ✅ 스토어 배지 업데이트의 중복 방지 - 단일 유틸로 통합
export const setTotalUnreadFromList = (qc: QueryClient) => {
  const list = qc.getQueryData(conversationListKey) as ConversationListData | undefined;
  if (!list?.conversations?.length) return undefined;
  const next = computeTotalUnread(list);
  return next;
};

// ✅ 대화방의 이전 미리보기 메시지 조회
export const getPrevPreview = (qc: QueryClient, convId: string) => {
  const list = qc.getQueryData(conversationListKey) as ConversationListData | undefined;
  return list?.conversations?.find((c) => String(c.id) === convId)?.messages?.[0];
};

// ===== Messages (Infinite) Utilities =====
// prependOptimisticMessage 제거됨 (사용되지 않음)

export function mapMessageById(
  queryClient: QueryClient,
  conversationId: string,
  matchId: string,
  transform: (msg: FullMessageType) => FullMessageType,
): void {
  const convId = String(conversationId);
  if (!convId) return;
  
  queryClient.setQueriesData({ queryKey: messagesKey(convId) }, (old: MessagesInfinite) => {
      if (!old) return old as unknown as InfiniteData<MessagesPage>;
      const pages = old.pages.map((page) => ({
        ...page,
        messages: page.messages.map((m) =>
          String(m.id) === String(matchId) ? transform(m) : m,
        ),
        // ✅ seenUsersForLastMessage 유지 (기존 값 보존)
        seenUsersForLastMessage: page.seenUsersForLastMessage,
      }));
      const next: InfiniteData<MessagesPage> = { ...old, pages };
      return next;
    },
  );
}

export function updateMessagePartialById(
  queryClient: QueryClient,
  conversationId: string,
  matchId: string,
  partial: Partial<FullMessageType>,
): void {
  mapMessageById(
    queryClient,
    conversationId,
    matchId,
    (msg) => ({ ...msg, ...partial }) as FullMessageType,
  );
}

export function markConversationRead(
  queryClient: QueryClient,
  conversationId: string,
): void {
  updateConversationById(queryClient, String(conversationId), {
    unReadCount: 0,
  });
}

// 대화방 메시지 추가 시 최신 메시지로 업데이트와 대화방 리스트 최신순으로 정렬
export function bumpConversationOnNewMessage(
  queryClient: QueryClient,
  conversationId: string,
  message: ConversationMessagePreview,
): void {
  withConversationList(queryClient, (old) => {
    if (!old?.conversations) return old;

    const incomingAt = normalizeDate(message.createdAt);
    const conversations = old.conversations.map((c) => {
        if (String(c.id) !== String(conversationId)) return c;

        const prevMs = new Date(c.lastMessageAt ?? 0).getTime() || 0;  // 현재 대화방의 마지막 메시지 시간(db 조회)
        const incMs  = incomingAt.getTime(); // 메시지의 실제 시간(ms 단위), 낙관적 업데이트로 메시지 시간이 바뀜

        // ✅ 과거 메시지면 아무 것도 바꾸지 않음
        if (incMs < prevMs) return c;

        // ✅ 중복 메시지 체크: 낙관적 → 서버 확정 전환 허용
        const last = c.messages?.[0] as FullMessageType | undefined;
        
        // 1) 동일한 ID면 무조건 스킵
        if (last?.id && message.id && String(last.id) === String(message.id)) {
          return c;
        }
        
        // 2) 낙관적 → 서버 확정 전환: clientMessageId가 같으면 ID 비교하여 처리
        if (last?.clientMessageId && message.clientMessageId && 
            String(last.clientMessageId) === String(message.clientMessageId)) {
          if (last?.id === message.id) {
            return c;
          }
        }
        
        // 3) 같은 시간대 + 같은 내용이면 스킵 (미세 중복 방지)
        const lastTime = new Date(last?.createdAt || 0).getTime();
        const incomingTime = new Date(message.createdAt).getTime();
        const timeDiff = Math.abs(incomingTime - lastTime);
        
        if (timeDiff < 1000 && // 1초 이내
            last?.body === message.body && 
            last?.type === message.type &&
            last?.id === message.id) { // ID도 같아야 스킵
          return c;
        }

        const nextLastAt = new Date(incMs);

        // ✅ system 메시지는 미리보기 유지
        const isSystem = message.type === "system";
        let nextMessages = c.messages || [];
        if (!isSystem) {
          const previewType = normalizePreviewType(message.type) ?? "text";
          // 이미지 타입일 때 body가 명시적으로 전달되면 그대로 사용, 없으면 null
          // system 타입은 항상 null
          const previewBody = message.type === "system" 
            ? null 
            : (message.type === "image" 
              ? (message.body !== undefined ? message.body : null)
              : (message.body ?? null));
          
          const preview: Partial<FullMessageType> = {
            id: message.id,
            clientMessageId: message.clientMessageId,
            type: previewType,
            body: previewBody,
            image: message.image,
            isAIResponse: !!message.isAIResponse,
            createdAt: nextLastAt,
            conversationId: conversationId,
            sender: {
              id: getMessageSenderId(message),
              name: message.sender?.name || null,
              email: message.sender?.email || null,
              image: message.sender?.image || null,
            },
            senderId: message.senderId,
          };
          nextMessages = [preview as FullMessageType];
        }

        // ✅ 이중 보호막: 기존 unReadCount를 명시적으로 보존
        const prevUnread = typeof c.unReadCount === 'number' ? c.unReadCount : 0;
        
        return {
          ...c,
          lastMessageAt: nextLastAt, // Date 객체
          lastMessageAtMs: incMs,   // subscribe 루프 방지 (ms 단위)
          messages: nextMessages,   // ✅ 미리보기 갱신(시스템 제외)
          unReadCount: prevUnread,  // 🔒 절대 보존: 기존 값 그대로 유지
        };
      })
      .sort(
        (a: FullConversationType, b: FullConversationType) => {
          const aTime = new Date(a.lastMessageAt || 0).getTime();
          const bTime = new Date(b.lastMessageAt || 0).getTime();
          if (aTime !== bTime) return bTime - aTime;
          
          // 동률 타임스탬프 tie-break
          const aMsValue = (a as PartialConversationType).lastMessageAtMs;
          const aMs = typeof aMsValue === 'number' ? aMsValue : 0;
          const bMsValue = (b as PartialConversationType).lastMessageAtMs;
          const bMs = typeof bMsValue === 'number' ? bMsValue : 0;
          if (aMs !== bMs) return bMs - aMs;
          
          return String(b.id).localeCompare(String(a.id));
        }
      );

    return { ...old, conversations }; // 리스트 메타 보존
  });
}

export type CanonicalMessage = {
  id?: string;
  conversationId: string;
  body: string;
  createdAt: Date;
  sender: { 
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  isAIResponse: boolean;
  type: "text" | "image" | "system";
  image?: string; // string만 사용
  serverCreatedAtMs?: number;
} & {
  conversation?: { userIds?: string[]; isGroup?: boolean };
};

const asDate = (d: unknown): Date => d instanceof Date ? d : new Date(d as Date | string);

// 일관된 형태의 메시지로 정규화
export const toCanonicalMsg = (raw: UnnormalizedMessage | FullMessageType): CanonicalMessage => {
  const type = normalizeMessageType(raw?.type);

  return {
    ...(raw?.id ? { id: String(raw.id) } : {}),
    conversationId: String(raw?.conversationId ?? ""),
    body: raw?.body ?? "",
    createdAt: asDate(raw?.createdAt),
    sender: { 
      id: raw?.sender?.id ?? "",
      name: raw?.sender?.name ?? null,
      email: raw?.sender?.email ?? null,
      image: raw?.sender?.image ?? null,
    },
    // ✅ conversation 정보 보존 (깜빡임 방지)
    ...(raw?.conversation ? { 
      conversation: {
        ...(raw.conversation.userIds ? { userIds: raw.conversation.userIds } : {}),
        ...(typeof raw.conversation.isGroup === 'boolean' ? { isGroup: raw.conversation.isGroup } : {}),
      } 
    } : {}),
    isAIResponse: !!raw?.isAIResponse,
    type,
    // 검증/추출 없이 그대로 전달
    image: type === "image" ? (raw?.image as string | undefined) : undefined,
    ...(Number.isFinite(raw?.serverCreatedAtMs)
      ? { serverCreatedAtMs: raw.serverCreatedAtMs }
      : {}),
  };
};

// 남은 사용자만 반영 (불필요한 카운트 필드 쓰거나 만들지 않음)
export const patchConvWithRemaining = (conv: FullConversationType, remainingIds: string[] = []): FullConversationType => {
  if (!conv) return conv;

  const ids = remainingIds.map(String);
  const idSet = new Set(ids);

  const nextUsers = Array.isArray(conv.users)
    ? conv.users.filter((u) => {
        const uid = String(u?.id ?? "");
        return idSet.has(uid);
      })
    : conv.users;

  return {
    ...conv,
    users: nextUsers,
    userIds: ids,
  };
};

export const safePatchConversation = (
  qc: QueryClient,
  id: string,
  remainingIds: string[],
) => {
  qc.setQueryData(conversationKey(id), (prev: { conversation?: FullConversationType } | FullConversationType | undefined) => {
    const fromList = (qc.getQueryData(conversationListKey) as ConversationListData | undefined)?.conversations
        ?.find((c: FullConversationType) => String(c.id) === String(id));

    // prev가 { conversation: ... } 형태인 정상 케이스
    if (prev && 'conversation' in prev && prev.conversation) {
      return {
        ...prev,
        conversation: patchConvWithRemaining(prev.conversation, remainingIds),
      };
    }

    // 혹시 prev가 대화 객체 자체로 저장돼 있던 이력 호환
    if (prev && !('conversation' in prev)) {
      return patchConvWithRemaining(prev as FullConversationType, remainingIds);
    }

    // prev가 없을 때 리스트에서 끌어와 형태 맞춰 저장
    return {
      conversation: patchConvWithRemaining(fromList ?? {} as FullConversationType, remainingIds),
    };
  });
};

export const hasMessagesCached = (qc: QueryClient, convId: string): boolean => {
  const datas = qc.getQueriesData({ queryKey: messagesKey(convId) }).map(([, d]) => d);
  return datas.some((d) => pickMsgs(d as { messages?: FullMessageType[]; pages?: Array<{ messages?: FullMessageType[] }> }).length > 0);
};

export const findAICandidateIndex = (qc: QueryClient, newId: string): number => {
  const list = qc.getQueryData(conversationListKey) as ConversationListData | undefined;
  const convs = list?.conversations ?? [];
  if (!convs.length) return -1;

  // 완전 빈 AI 방만 머지
  return convs.findIndex((c: FullConversationType) =>
    c?.isAIChat &&
    String(c.id) !== newId &&
    // 서버 기준 미리보기(마지막 메시지 시각) 없음
    lastMessageMs(c) === 0 &&
    // 1명 이하(스크래치성)
    memberCount(c) <= 1 &&
    // 제목 등 커스텀 메타 없음
    !hasCustomMeta(c) &&
    // 로컬 메시지 캐시도 없음
    !hasMessagesCached(qc, String(c.id)),
  );
};

// ===== seenUsersForLastMessage 관리 (chatCacheSeen.ts 통합) =====

export function setSeenUsersForLastMessage(
  queryClient: QueryClient,
  conversationId: string,
  lastMessageId: string,
  seenUsers: Array<{ id: string; name: string | null; image: string | null }>
) {
  const convId = String(conversationId);
  if (!convId) return;
  
  const queryKey = messagesKey(convId);

  queryClient.setQueryData(queryKey, (oldData: MessagesInfinite) => {
    if (!oldData?.pages) return oldData;

    return {
      ...oldData,
      pages: oldData.pages.map((page: MessagesPage, index: number) => {
        if (index !== 0) return page;
        const msgs: FullMessageType[] = Array.isArray(page.messages) ? page.messages : [];
        const top = msgs[msgs.length - 1];
        if (!top || String(top.id ?? "") !== String(lastMessageId)) return page;

        return {
          ...page,
          seenUsersForLastMessage: seenUsers,
        };
      }),
    };
  });
}

export function resetSeenUsersForLastMessage(
  queryClient: QueryClient,
  conversationId: string,
  lastMessageId: string
) {
  setSeenUsersForLastMessage(queryClient, conversationId, lastMessageId, []);
}

/**
 * 낙관적 메시지를 서버 확정 메시지로 교체
 * clientMessageId로 매칭하여 교체 후 필요시 재삽입
 */
export function replaceOptimisticMessage(
  queryClient: QueryClient,
  conversationId: string,
  clientMessageId: string,
  serverMessage: UnnormalizedMessage | FullMessageType,
  reinsert = false, // 재시도 시에만 재정렬
) {
  queryClient.setQueryData(messagesKey(conversationId), (old: MessagesInfinite) => {
    if (!old?.pages) return old;

    const pages = old.pages.map((p: MessagesPage, i: number) => {
      if (i !== 0) return p;

      let list: FullMessageType[] = Array.isArray(p.messages) ? [...p.messages] : [];

      const normalizedMsg = normalizeMessage(serverMessage);
      const normalized: FullMessageType = {
        ...normalizedMsg,
        clientMessageId: serverMessage.clientMessageId ?? clientMessageId,
        conversation: normalizedMsg.conversation,
        conversationId: String(serverMessage?.conversationId ?? conversationId),
      };

      const eq = (a: string | undefined, b: string | undefined): boolean => String(a) === String(b);

      if (!reinsert) {
        // ✅ 일반 성공: 자리 유지 교체 (끊김 없음)
        const updatedList = list.map((m) => {
          const same = String(m.clientMessageId) === String(clientMessageId) || String(m.id) === String(clientMessageId);
          if (!same) return m;
          
          return {
            ...m,
            id: serverMessage.id,
            // createdAt은 낙관값 유지로 재정렬/리렌더 최소화
            body: serverMessage.body ?? m.body,
            image: serverMessage.image ?? m.image,
            isError: false,
            isWaiting: false,
            isTyping: false,
            clientMessageId: m.clientMessageId,
          };
        });
        return { ...p, messages: updatedList, seenUsersForLastMessage: p.seenUsersForLastMessage };
      } else {
        // ✅ 재시도: 삭제 → 재삽입(정렬 반영) - 시간 변경으로 인한 재정렬
        list = list.filter((m) => {
          const sameOptimistic =
            (m.clientMessageId && eq(m.clientMessageId, clientMessageId)) ||
            (m.id && eq(m.id, clientMessageId));
          const sameServerId =
            (normalized.id && m.id && eq(m.id, normalized.id)) ||
            (normalized.clientMessageId && m.clientMessageId && eq(m.clientMessageId, normalized.clientMessageId));
          return !(sameOptimistic || sameServerId);
        });
        
        // 정렬 삽입
        let lo = 0, hi = list.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cmpAsc(list[mid], normalized) <= 0) lo = mid + 1;
          else hi = mid;
        }
        list.splice(lo, 0, { ...normalized, isError: false, isWaiting: false, isTyping: normalized.isTyping ?? false });
      }

      return { ...p, messages: list, seenUsersForLastMessage: p.seenUsersForLastMessage };
    });

    return { ...old, pages };
  });
}