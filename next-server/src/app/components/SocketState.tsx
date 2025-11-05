'use client';
import { useQueryClient } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "../context/socketContext";
import useConversation from "../hooks/useConversation";
import useConversationUserList from "../hooks/useConversationUserList";
import { 
  SOCKET_EVENTS,
  normalizeDate,
} from "@/src/app/lib/react-query/utils";
import { 
  prependBlogCard,
  upsertBlogCardById,
  removeBlogCardById,
  upsertBlogDetailPartial,
  incrementBlogDetailCommentsCount,
  prependBlogCommentFirstPage,
  blogDetailKey,
  blogsCommentsKey,
  replaceCommentById,
  removeCommentById,
} from "@/src/app/lib/react-query/blogsCache";
import { 
  conversationListKey,
  conversationKey,
  messagesKey,
  upsertConversation,
  markConversationRead,
  bumpConversationOnNewMessage,
  upsertMessageSortedInCache,
  normalizeMessage,
  ConversationListData,
  toCanonicalMsg,
  updateConversationById,
  patchConvWithRemaining,
  safePatchConversation,
  findAICandidateIndex,
  removeConversationById,
  clampUnread,
  updateConversationInList,
  setTotalUnreadFromList,
  withConversationList,
} from "@/src/app/lib/react-query/chatCache";
import {
  prependReview,
  replaceReviewById,
  removeReviewById,
} from "@/src/app/lib/react-query/reviewsCache";
import getConversations from "@/src/app/lib/getConversations";
import {
  FullMessageType,
  normalizePreviewType,
  RoomEventPayload,
  getMessageSenderId,
} from "@/src/app/types/conversation";
import type { 
  BlogCommentNewPayload,
  BlogNewPayload,
  BlogUpdatedPayload,
  BlogDeletedPayload,
  BlogData,
  BlogDetailQueryData,
} from "@/src/app/types/blog";
import type { 
  BlogCommentUpdatedPayload,
  BlogCommentDeletedPayload,
} from "@/src/app/types/comments";
import type { 
  DrinkReviewPayload,
  DrinkReviewDeletedPayload,
} from "@/src/app/types/drink";
import { lastMessageMs, serverLooksEmpty } from "../utils/chat";
import type { ConvSnap, BufferedMsg } from "../types/socket";
import type { QueryClient } from "@tanstack/react-query";
import type { PartialConversationType, UnnormalizedMessage, FullConversationType } from "../types/conversation";
import type { MessagesPage, MessagesInfinite } from "../lib/react-query/chatCache";

// === AI 빈방 머지 헬퍼 === //
const mergeOrUpsertAIConversation = (
  qc: QueryClient,
  conv: PartialConversationType & { id: string },
): { merged: boolean; oldId?: string; newId?: string } => {
  const newId = String(conv.id);
  // ✅ 메시지가 없는 AI 방만 머지 허용
  const isEmptyAI = !!conv?.isAIChat && serverLooksEmpty(conv);
  // 빈 AI 방이면 후보를 찾아 머지
  const idx = isEmptyAI ? findAICandidateIndex(qc, newId) : -1;
  
  // 머지 불가능하면 업서트 (빈 AI 방이 아니거나 후보 없음)
  if (idx < 0) {
    upsertConversation(qc, { ...conv, id: newId } as Partial<FullConversationType> & { id: string });
    return { merged: false, newId };
  }
  
  // 머지 가능: 기존 빈 AI 방에 새 데이터 덮어쓰기
  let oldId: string | undefined;
  qc.setQueryData(conversationListKey, (prev: ConversationListData | undefined) => {
    if (!prev?.conversations?.length) return prev;
    const next = { ...prev, conversations: [...prev.conversations] };
    oldId = String(next.conversations[idx]?.id ?? "");
    const existing = next.conversations[idx] || {} as FullConversationType;
    next.conversations[idx] = { ...existing, ...conv, id: newId } as FullConversationType;
    return next;
  });
  
  if (oldId && oldId !== newId) {
    qc.removeQueries({ queryKey: messagesKey(oldId), exact: false });
    qc.removeQueries({ queryKey: conversationKey(oldId), exact: true });
  }

  return { merged: true, oldId, newId };
};

// ✅ 래퍼 함수들 - 자주 쓰는 업데이트 패턴
const zeroActiveUnread = (qc: QueryClient, convId: string) =>
  updateConversationInList(qc, convId, (conv) =>
    conv.unReadCount !== 0 ? { ...conv, unReadCount: 0 } : null
  );

// ✅ 증가+클램프 한 번에 처리 (setQueryData 1회화)
const addAndClampUnread = (qc: QueryClient, convId: string, delta: number) =>
  updateConversationInList(qc, convId, (conv) => {
    const curr = clampUnread(conv.unReadCount);
    const next = clampUnread(curr + delta);
    if (next === curr) return null;
    return { ...conv, unReadCount: next };
  });

// ✅ 복합 래퍼 - 두 규칙을 한 번에 적용 (미세 최적화)
const zeroAndClampUnread = (qc: QueryClient, convId: string, activeId?: string) =>
  updateConversationInList(qc, convId, (conv) => {
    const isActive = activeId && String(conv.id) === String(activeId);
    const nextUnread = isActive ? 0 : clampUnread(conv.unReadCount);
    if (nextUnread === conv.unReadCount) return null;
    return { ...conv, unReadCount: nextUnread };
  });

// ✅ 스토어 배지 업데이트 (chatCache.ts의 setTotalUnreadFromList 사용)
const updateTotalUnreadStore = (qc: QueryClient) => {
  const next = setTotalUnreadFromList(qc);
  if (next !== undefined) {
    useUnreadStore.setState((s) => (s.unReadCount === next ? s : { unReadCount: next }));
  }
};

// ✅ 단일 증가 유틸: 리스트 아이템 + 총배지 동기화까지 한 번에
const incUnreadForConv = (qc: QueryClient, convId: string, delta: number) => {
  if (!delta) return;
  addAndClampUnread(qc, convId, delta);
  updateTotalUnreadStore(qc);
};

// ✅ 읽음 처리 통일 - 실수 예방을 위한 헬퍼
const applyLocalRead = (qc: QueryClient, convId: string) => {
  try { markConversationRead(qc, convId); } catch {}
  zeroActiveUnread(qc, convId);
  updateTotalUnreadStore(qc);
};

// ✅ optimisticListUpdate: 미리보기 갱신 (ts/isBumpableType 유틸 사용)
const optimisticListUpdate = (qc: QueryClient, msg: UnnormalizedMessage, ts: (m: UnnormalizedMessage) => number, isBumpableType: (t: string) => boolean) => {
  const convId = String(msg?.conversationId ?? '');
  if (!convId) return;

  upsertConversation(qc, { 
    id: convId, 
    lastMessageAt: new Date(ts(msg))  // ✅ serverCreatedAtMs 우선 (일관성)
  });

  const list = qc.getQueryData(conversationListKey) as ConversationListData | undefined;
  const item = list?.conversations?.find((c: FullConversationType) => String(c.id) === convId);

  // ✅ 안전한 비교: 시간 → ID 순
  const serverMs = item ? (lastMessageMs(item) || 0) : 0;
  const msgMs = ts(msg); // ✅ 유틸 사용
  
  if (item && msgMs <= serverMs) {
    // 같은 시간이면 ID로 tie-breaker
    if (msgMs === serverMs && msg.id && item.lastMessageId) {
      if (String(msg.id) <= String(item.lastMessageId)) return;
    } else if (msgMs < serverMs) {
      return;
    }
  }

  // ✅ 유틸 사용
  const t = (msg?.type || '').toLowerCase();
  if (!isBumpableType(t)) return; // 시스템 제외, text/image만
  
  bumpConversationOnNewMessage(qc, convId, {
    id: msg.id,
    clientMessageId: msg.clientMessageId,
    createdAt: msg.createdAt || new Date(),
    type: normalizePreviewType(msg.type),
    body: msg.type === 'image' ? null : (msg.body ?? null),
    image: msg.image,
    sender: msg.sender,
    senderId: getMessageSenderId(msg) || undefined,
    isAIResponse: !!msg.isAIResponse,
  });
};

const ensureSet = (store: Map<string, Set<string>>, key: string): Set<string> => {
  let set = store.get(key);
  if (!set) {
    set = new Set<string>();
    store.set(key, set);
  }
  return set;
};

// ===================================================================
const SocketState = () => {
  const router = useRouter();
  const pathname = usePathname();
  const socket = useSocket();
  const { conversationId } = useConversation();
  const { set } = useConversationUserList();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const conversationIdRef = useRef(conversationId);
  // ✅ queryClient를 ref로 저장하여 핸들러 내부에서 안정적으로 참조
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);
    
  // ✅ ConversationList 캐시 설정 (gcTime: Infinity 제거 - 메모리 누수 방지)
  useEffect(() => {
    queryClient.setQueryDefaults(conversationListKey, { 
      gcTime: 10 * 60 * 1000, // 10분 후 GC (메모리 누수 방지)
      staleTime: 60_000 
    });
  }, [queryClient]);

  useEffect(() => {
      conversationIdRef.current = conversationId;
  }, [conversationId]);

  // ✅ 모든 페이지에서 conversationList 로드 보장 (프로덕션 모드 대응)
  // 세션이 authenticated되면 소켓 연결 여부와 관계없이 conversationList 로드
  // 단, /conversations 페이지에서는 ConversationList 컴포넌트가 이미 호출하므로 중복 방지
  useEffect(() => {
    if (status !== "authenticated") return;
    
    // ✅ /conversations 페이지에서는 ConversationList가 이미 호출하므로 스킵
    const isConversationsPage = pathname?.startsWith('/conversations');
    if (isConversationsPage) return;
    
    const existingList = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
    const hasListNow = !!(existingList?.conversations?.length);
    
    // 캐시에 없으면 로드 (다른 페이지에서만 작동)
    if (!hasListNow) {
      queryClient.ensureQueryData({
        queryKey: conversationListKey,
        queryFn: getConversations,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      }).catch(err => {
        console.error('[SocketState] conversationList 로드 실패:', err);
      });
    }
  }, [status, queryClient, pathname]);

  // 상태 refs
  const userIdRef = useRef<string | null>(null);
  const emailRef  = useRef<string | null>(null);
  const lastSocketRef = useRef<ReturnType<typeof useSocket> | null>(null);
  const myHandlersRef = useRef<Map<string, (...args: unknown[]) => void>>(
    new Map(),
  );
  
  // ✅ 이벤트 리비전 저장용 맵 분리 (myHandlersRef와 분리)
  const roomRevRef = useRef<Map<string, {rev: number; ts: number}>>(new Map());
  const exitedByMeRef = useRef<Set<string>>(new Set());
  // 기타
  const pendingNewConvsRef = useRef<Map<string, PartialConversationType & { id: string }>>(new Map());
  const pendingExitRef = useRef<Map<string, string[]>>(new Map());
  // 대화방 리스트 API 응답이 처리되었는지 여부
  // ⚠️ 중요: 초기값을 false로 설정하여 새로고침 시에도 버퍼 저장이 시작되도록 함
  const listReadyRef = useRef(false);
  // React Query 구독 콜백의 재진입 방지 가드
  const listSyncGuardRef = useRef(false);
  // API 응답 전에 도착한 실시간 메시지 임시 저장소
  const bufferedRef = useRef(new Map<string, BufferedMsg[]>()); // convId -> buffered msgs
  const bufferedIdSetRef = useRef(new Map<string, Set<string>>()); // ✅ 1) O(1) 중복 체크용
  // 각 대화방의 하이워터마크(HWM) 저장
  const snapshotRef = useRef(new Map<string, ConvSnap>());
  // ✅ 5) 구독 재실행 억제: 동일 버전 스킵
  const lastListVersionRef = useRef<number>(0);

  // ✅ 4) 타임스탬프 유틸: 중복 분기 제거
  const ts = useCallback((m: UnnormalizedMessage): number => 
    Number.isFinite(m?.serverCreatedAtMs)
      ? m.serverCreatedAtMs!
      : new Date(m?.createdAt || 0).getTime()
  , []);

  // ✅ 3) 타입 판별 유틸: 소문자 변환 최소화
  const isBumpableType = useCallback((t: string) => t === 'text' || t === 'image', []);

  const remapIfViewing = useCallback((oldId?: string, nextId?: string) => {
    if (!nextId) return;
    const activeConvId = String(conversationIdRef.current ?? "");
    if (oldId && activeConvId === String(oldId) && oldId !== nextId) {
      router.replace(`/conversations/${nextId}`);
    }
  }, [router]);

  const reconcileAfterList = useCallback(() => {
    try {
      // 0) 리스트가 실제로 준비되어 있지 않으면 아무 것도 하지 않음
      const listNow = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
      if (!listNow?.conversations?.length) return;

      // 1) 시딩 중 NEW 적용
      const myUserId = userIdRef.current ?? "";
      for (const [cid, conv] of pendingNewConvsRef.current) {
        if (exitedByMeRef.current.has(String(cid))) continue;
        // 이 방에서 나가기로 예약된 유저가 나(내 id)라면 스킵
        const exits = new Set((pendingExitRef.current.get(cid) ?? []).map(String));
        if (exits.has(myUserId)) continue;
  
        if (conv?.isAIChat) {
          const { merged, oldId, newId } = mergeOrUpsertAIConversation(queryClient, conv);
          if (merged && oldId && newId && oldId !== newId) {
            remapIfViewing(oldId, newId);
          }
        } else {
          upsertConversation(queryClient, { ...conv, id: String(conv.id ?? cid) } as Partial<FullConversationType> & { id: string });
        }
      }
      
      // 2) 시딩 중 EXIT 적용
      for (const [cid, remainingIds] of pendingExitRef.current) {
        const id = String(cid);
              
        set({ conversationId: id, userIds: remainingIds ?? [] });

        // 상세 캐시
        safePatchConversation(queryClient, id, remainingIds);

        // 리스트 캐시 갱신
        queryClient.setQueryData(conversationListKey, (prev: ConversationListData | undefined) => {
          if (!prev?.conversations?.length) return prev;
          const next = { ...prev, conversations: [...prev.conversations] };
          const idx = next.conversations.findIndex(c => String(c.id) === id);
          if (idx < 0) return prev;

          next.conversations[idx] = patchConvWithRemaining(next.conversations[idx], remainingIds);

          const amIExiting = !!myUserId && !remainingIds.includes(myUserId);
          if (amIExiting) {
              next.conversations.splice(idx, 1);
          }
          return next;
        });
      }

      // 3) 내가 나간 방은 리스트에서 제거 (최종 스윕)
      if (exitedByMeRef.current.size > 0) {
        queryClient.setQueryData(conversationListKey, (prev: ConversationListData | undefined) => {
          if (!prev?.conversations?.length) return prev;
          const filtered = prev.conversations.filter((c) => !exitedByMeRef.current.has(String(c.id)));
          return filtered.length === prev.conversations.length ? prev : { ...prev, conversations: filtered };
        });
      }

      // 4) 총 미읽음 갱신
      const after = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
      if (after?.conversations?.length) {
        updateTotalUnreadStore(queryClient);
      }
    } catch {
      // 에러 무시
    } finally {
      pendingNewConvsRef.current.clear();
      pendingExitRef.current.clear();
    }
  }, [set, remapIfViewing, queryClient]);

  // ✅ 활성 대화방 로컬 읽음 처리 (소켓 이벤트는 각 컴포넌트에서 처리)
  const syncActiveConversationRead = useCallback(() => {
    const activeId = String(conversationIdRef.current ?? "");
    if (!activeId) return;
    
    applyLocalRead(queryClient, activeId);
  }, [queryClient]);
  
  // ✅ 초기화 함수를 먼저 정의
  const initializeSocketState = useCallback(() => {
    try {
      // ✅ pending NEW/EXIT 먼저 적용
      reconcileAfterList();
    
      // ✅ 서버 큐잉으로 메시지 복구 - 워터마크 불필요
      const listNow = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;

      // ✅ LIVE 모드 진입 시 읽음 처리
      syncActiveConversationRead();
      
      // ✅ 총합 갱신
    if (listNow?.conversations?.length) {
        updateTotalUnreadStore(queryClient);
      }
    } catch (error) {
      console.error('[SocketState 초기화 에러]', error);
    }
  }, [reconcileAfterList, syncActiveConversationRead, queryClient]);

  // ✅ 소켓 핸들러들 (useEffect 밖에서 정의)
  const handleSocketConnect = useCallback(async () => {
    // ✅ 로그인되어 있을 때만 실행
    if (status !== "authenticated") return;
    
    // snapshotRef만 클리어하여 새로운 API 데이터 기준으로 재계산
    snapshotRef.current.clear();
    
    // ✅ conversationList 데이터 확인 및 로드
    const existingList = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
    const hasListNow = !!(existingList?.conversations?.length);
    
    // ✅ 리스트가 없으면 기본 fetch만 실행 (서버 큐잉과 별개)
    if (!hasListNow) {
      // ensureQueryData: 캐시에 없으면 fetch, 있으면 재사용
      queryClient.ensureQueryData({
        queryKey: conversationListKey,
        queryFn: getConversations,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      }).catch(err => {
        console.error('[SocketState] conversationList 로드 실패:', err);
      });
    }
    
    // ✅ 활성 대화방 읽음 상태만 동기화
    syncActiveConversationRead();
    
    // ✅ 소켓 상태 초기화
    initializeSocketState();
    
  }, [status, initializeSocketState, queryClient, syncActiveConversationRead]);

  const handleDisconnect = useCallback(() => {
    // ✅ 연결 끊김 시 이벤트 리비전 클리어
    roomRevRef.current.clear();
  }, []);

  // ✅ 소켓 이벤트 핸들러들 - useCallback으로 메모이제이션
  // 이미 처리(카운트)한 메시지 ID 집합 (대화방별)
  const countedIdSetRef = useRef(new Map<string, Set<string>>());

  const handleReceiveConversation = useCallback((_raw: FullMessageType) => {
    try {
      const msg = normalizeMessage(_raw);
      const convId = String(msg?.conversationId ?? "");
      
      if (!convId) return;

      const canonicalMs = Number.isFinite(msg.serverCreatedAtMs)
        ? msg.serverCreatedAtMs!
        : new Date(msg.createdAt || 0).getTime();
      const canonical = {
        ...toCanonicalMsg(msg),
        serverCreatedAtMs: canonicalMs,
      };
      const messageId = String(canonical.id ?? msg.id ?? '');

      // ✅ 리스트에서 대화방 찾기 (upsertConversation으로 추가된 것도 포함)
      const list = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
      const conv = list?.conversations?.find((c: FullConversationType) => String(c.id) === convId);

      const countedSet = ensureSet(countedIdSetRef.current, convId);
      const messageIdStr = String(canonical.id ?? msg.id ?? '');

      // ✅ 단순화: listReadyRef가 false이면 무조건 버퍼에 저장 (API 호출 중이거나 processList 실행 중)
      // ⚠️ 중요: listReadyRef는 processList 완료 후에만 true가 됨
      if (!listReadyRef.current || listSyncGuardRef.current) {
        // ✅ 이미 처리된 메시지는 버퍼에 저장하지 않음 (중복 방지)
        if (messageIdStr && countedSet.has(messageIdStr)) {
          return; // 이미 처리된 메시지는 스킵
        }
        
        // ✅ 버퍼에 저장
        const idSet = ensureSet(bufferedIdSetRef.current, convId);
        if (messageIdStr && !idSet.has(messageIdStr)) {
          const arr = bufferedRef.current.get(convId) ?? [];
          arr.push({ id: messageId, ms: canonicalMs, msg: canonical as FullMessageType });
          bufferedRef.current.set(convId, arr);
          idSet.add(messageIdStr);
        }
        return; // 버퍼에만 저장하고 종료
      }

      // ✅ 실시간 메시지 처리 (processList 완료 후)
      // ⚠️ 중요: countedSet에 먼저 추가하여 동시성 문제 방지
      const curId = String(canonical.id ?? '');
      if (!curId) return;
      
      // ✅ 중복 체크: 이미 처리된 메시지는 스킵
      if (countedSet.has(curId)) return;
      
      // ✅ countedSet에 추가 (동시성 방지)
      countedSet.add(curId);
      
      // ✅ 메시지 캐시에 추가
      upsertMessageSortedInCache(queryClient, convId, canonical);

      // ✅ 활성 방 처리
      const myEmail = emailRef.current ?? "";
      const activeId = String(conversationIdRef.current ?? "");
      const isActive = activeId === convId;
      const isMyMessage = String(msg?.sender?.email ?? "").toLowerCase() === myEmail.toLowerCase();
      
      if (isActive) {
        applyLocalRead(queryClient, convId);
        requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("chat:new-content")));
      }

      // ✅ 리스트에 없으면 스킵 (handleConversationNew가 아직 호출되지 않음)
      if (!conv) return;
      
      // ✅ 최적화: 미리보기와 안읽음 카운트 처리
      // ⚠️ 중요: countedSet에 이미 처리된 메시지 ID가 있으므로, 여기서는 새로운 메시지만 처리
      // 하지만 processList 완료 직후 도착하는 실시간 메시지는 서버 응답에 이미 포함되었을 수 있음
      // snapshotRef를 확인하여 서버 응답 기준으로 중복 체크
      const snap = snapshotRef.current.get(convId);
      const lastMessageAtMs = conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0;
      const msgMs = canonical.serverCreatedAtMs!;
      const lastIdFromList = conv.lastMessageId ? String(conv.lastMessageId) : '';
      
      // ✅ 중복 체크: 리스트의 마지막 메시지와 비교
      // - 동일 ID면 중복
      // - 시간이 이전이면 중복
      let isDuplicate = (lastIdFromList && curId === lastIdFromList) || msgMs < lastMessageAtMs;
      
      // ⚠️ 중요: snapshotRef를 확인하여 서버 응답 기준으로 중복 체크
      // processList 완료 직후 도착하는 실시간 메시지는 서버 응답에 이미 포함되었을 수 있음
      // snapshotRef는 서버 응답의 마지막 메시지 정보를 정확히 가지고 있음
      if (snap) {
        // 서버 응답의 마지막 메시지 시간보다 이전이면 중복
        if (msgMs < snap.lastMessageAtMs) {
          isDuplicate = true;
        }
        // 서버 응답의 마지막 메시지와 동일 시간이지만 다른 ID인 경우
        if (msgMs === snap.lastMessageAtMs) {
          // 동일 시간이면:
          // - snapshotRef의 lastId와 동일하면 중복 (서버 응답에 이미 포함됨)
          // - snapshotRef의 lastId와 다르면 새로운 메시지일 수 있음 (계속 진행)
          if (snap.lastId && curId === snap.lastId) {
            isDuplicate = true;
          }
        }
      }
      
      // ✅ 미리보기 업데이트 (중복이 아니고 시스템 메시지가 아닐 때)
      if (!isDuplicate && msg.type !== "system" && (listReadyRef.current || isMyMessage)) {
        optimisticListUpdate(queryClient, msg, ts, isBumpableType);
      }
      
      // ✅ 안읽음 카운트 (중복이 아니고, 내 메시지가 아니고, 시스템 메시지가 아니고, 활성 대화방이 아닐 때)
      if (!isDuplicate && !isMyMessage && msg.type !== 'system' && !isActive && !conv.isAIChat) {
        const msgType = (msg?.type || '').toLowerCase();
        if (isBumpableType(msgType)) {
          incUnreadForConv(queryClient, convId, 1);
        }
      } else {
        // ✅ 활성 대화방이거나 본인 메시지인 경우에도 총합 업데이트 (실시간 동기화 보장)
        // 프로덕션 모드에서 안 읽은 메시지 카운트가 실시간으로 업데이트되지 않는 문제 해결
        updateTotalUnreadStore(queryClient);
      }
    } catch {}
  }, [queryClient, ts, isBumpableType]);

  // ✅ room.event 핸들러 - 델타 이벤트 처리
  const handleRoomEvent = useCallback(async (event: RoomEventPayload) => {
    try {
      const { type, conversationId, userId, ts, rev } = event;
      
      // ✅ 리비전 가드 (중복 이벤트 방지) - roomRevRef 사용
      const roomKey = `room:${conversationId}`;
      const last = roomRevRef.current.get(roomKey);
      if (last && rev <= last.rev) return;
      roomRevRef.current.set(roomKey, { rev, ts });
      
      switch (type) {
        case "member.left": {
          if (!userId) return; // 잘못된 델타 방어
          const id = conversationId;
          const leftUserId = userId;
          const myUserId = session?.user?.id ?? "";

          if (leftUserId === myUserId) {
            // 멱등 가드
            if (exitedByMeRef.current.has(id)) return;
            exitedByMeRef.current.add(id);

            // 로컬 상태 정리

            // 진행 중 상세 쿼리만 취소
            try { await queryClient.cancelQueries({ queryKey: conversationKey(id), exact: true }); } catch {}

            return; // ⬅️ 전역 캐시/배지 업데이트 없이 함수 종료
          }

          // ✅ conversationKey 업데이트 (대화방 상세 데이터)
          queryClient.setQueryData(conversationKey(id), (prev: { conversation?: FullConversationType } | undefined) => {
            if (!prev?.conversation?.userIds) return prev;
            
            const beforeUserIds = prev.conversation.userIds;
            const updatedUserIds = beforeUserIds.filter((userId: string) => userId !== leftUserId);
            
            // 변경사항이 없으면 기존 데이터 반환
            if (beforeUserIds.length === updatedUserIds.length) return prev;
            
            const beforeUsers = prev.conversation.users || [];
            const updatedUsers = beforeUsers.filter((user) => user.id !== leftUserId);
            
            return {
              ...prev,
              conversation: {
                ...prev.conversation,
                userIds: updatedUserIds,
                users: updatedUsers,
              },
            };
          });

          // ✅ conversationListKey의 해당 아이템만 새 객체로 바꾸고, 나머지 아이템은 같은 참조 유지
          queryClient.setQueryData(conversationListKey, (prev: ConversationListData | undefined) => {
            if (!prev?.conversations?.length) return prev;
            
            const idx = prev.conversations.findIndex((c: FullConversationType) => String(c.id) === id);
            if (idx < 0) return prev;
                  
            const currentConv = prev.conversations[idx];
            const beforeUserIds = currentConv.userIds || [];
            const updatedUserIds = beforeUserIds.filter((userId: string) => userId !== leftUserId);
            
            // 변경사항이 없으면 기존 데이터 반환 (리렌더링 방지)
            if (beforeUserIds.length === updatedUserIds.length) return prev;
            
            // ✅ users 배열에서도 나간 유저 제거
            const updatedUsers = (currentConv.users || []).filter((user) => 
              user.id !== leftUserId
            );
            
            // ✅ 변경된 대화방만 새 객체로 생성
            const updatedConversation = {
              ...currentConv,
              userIds: [...updatedUserIds],
              users: [...updatedUsers]
            };
            
            // ✅ 변경된 대화방만 교체, 나머지는 같은 참조 유지
            const newConversations = [...prev.conversations];
            newConversations[idx] = updatedConversation;
            
            const result = {
              ...prev,
              conversations: newConversations
            };

            return result;
          });

          // ✅ messagesKey에서 나간 사용자 정보 제거
          queryClient.setQueryData(messagesKey(id), (prev: MessagesInfinite) => {
            if (!prev?.pages) return prev;
          
            let hasChanges = false;
            const newPages = prev.pages.map((page: MessagesPage) => {
              if (!Array.isArray(page?.messages)) return page;
            
              let pageHasChanges = false;
              const newMessages = page.messages.map((m: FullMessageType) => {
                // 메시지의 conversation.userIds에서 나간 사용자 제거
                if (m?.conversation?.userIds) {
                  const hasLeftUser = m.conversation.userIds.includes(leftUserId);
                  if (hasLeftUser) {
                    pageHasChanges = true;
                    hasChanges = true;
                    
                    return {
                      ...m,
                      conversation: {
                        ...m.conversation,
                        userIds: m.conversation.userIds.filter((userId: string) => userId !== leftUserId)
                      }
                    };
                  }
                }
                return m;
              });

              // seenUsersForLastMessage에서 나간 사용자 제거 (첫 번째 페이지만)
              let updatedSeenUsers = page.seenUsersForLastMessage;
              if (page.seenUsersForLastMessage) {
                const hasLeftUserInSeen = page.seenUsersForLastMessage.some((user: { id: string }) => user.id === leftUserId);
                if (hasLeftUserInSeen) {
                  pageHasChanges = true;
                  hasChanges = true;
                  updatedSeenUsers = page.seenUsersForLastMessage.filter((user: { id: string }) => 
                    user.id !== leftUserId
                  );
                }
              }

              return pageHasChanges ? { 
                ...page, 
                messages: newMessages,
                seenUsersForLastMessage: updatedSeenUsers
              } : page;
            });
            
            // 변경사항이 없으면 기존 데이터 반환
            if (!hasChanges) return prev;
                  
            return {
              ...prev,
                pages: newPages
            };
          });
          break;
        }
        case "room.deleted": {
          const id = String(conversationId);
          
          // 1) 목록에서 제거
          removeConversationById(queryClient, id);

          // 2) 해당 방의 상세/메시지 캐시 제거
          queryClient.removeQueries({ queryKey: messagesKey(id), exact: false });
          queryClient.removeQueries({ queryKey: conversationKey(id), exact: true });

          // ✅ 2) 잔여 상태 정리 (메모리 누수 방지)
          bufferedRef.current.delete(id);
          bufferedIdSetRef.current.delete(id);
          snapshotRef.current.delete(id);
          roomRevRef.current.delete(`room:${id}`);
          break;
        }
      }
      
      // 총 배지 업데이트
      updateTotalUnreadStore(queryClient);
    } catch {
      // 에러 무시
    }
  }, [queryClient, session?.user?.id]);

  const handleConversationNew = useCallback((conversation: PartialConversationType & { id: string }) => {
      try {                
        if (!conversation?.id) return;
        const id = String(conversation.id);
        const conv = { ...conversation, id };

        // ✅ 이미 내가 나간 방이면 무시
        if (exitedByMeRef.current.has(id)) return; 
                
        // 2) 라이브 경로: AI 방이면 머지 시도
        if (conv?.isAIChat) {
          const { merged, oldId, newId } = mergeOrUpsertAIConversation(queryClient, conv);
          const visId = String(newId ?? id);

          // mergeOrUpsertAIConversation이 이미 upsert/머지했으므로 리스트에 있어야 함
          const list = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
          const item = list?.conversations?.find((c: FullConversationType) => String(c.id) === visId);
          
          if (item && !lastMessageMs(item)) {
            updateConversationById(queryClient, visId, {
              lastMessageAt: new Date(),
              lastMessageAtMs: Date.now(),
            });
          }

          zeroAndClampUnread(queryClient, visId, conversationIdRef.current);

          // ✅ ⚠️ 중요: 새로운 대화방을 snapshotRef에 추가하여 실시간 메시지 중복 체크 가능하도록 함
          // API 호출 중에 생성된 새로운 대화방도 processList 완료 후 실시간 메시지를 받을 수 있도록 함
          const lastMsgMs = lastMessageMs(item || conv) || 0;
          const lastMsgId = item?.lastMessageId || (item || conv as FullConversationType).lastMessageId || undefined;
          snapshotRef.current.set(visId, {
            baseUnread: 0,
            isAI: !!conv.isAIChat,
            lastMessageAtMs: lastMsgMs,
            lastId: lastMsgId ? String(lastMsgId) : undefined,
          });

          if (merged && oldId && newId && oldId !== newId) {
            remapIfViewing(oldId, newId);
          }
          return;
        }
            
        upsertConversation(queryClient, conv as Partial<FullConversationType> & { id: string });
        if (!lastMessageMs(conv)) {
          const lastAt = normalizeDate(conv.lastMessageAt ?? (conv as { createdAt?: Date | string }).createdAt ?? new Date());
          updateConversationById(queryClient, id, { lastMessageAt: lastAt });
        }
        zeroAndClampUnread(queryClient, id, conversationIdRef.current);
      
        // ✅ ⚠️ 중요: 새로운 대화방을 snapshotRef에 추가하여 실시간 메시지 중복 체크 가능하도록 함
        // API 호출 중에 생성된 새로운 대화방도 processList 완료 후 실시간 메시지를 받을 수 있도록 함
        const list = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
        const item = list?.conversations?.find((c: FullConversationType) => String(c.id) === id);
        const lastMsgMs = lastMessageMs(item || conv) || 0;
        const lastMsgId = item?.lastMessageId || (item || conv as FullConversationType).lastMessageId || undefined;
        snapshotRef.current.set(id, {
          baseUnread: 0,
          isAI: !!conv.isAIChat,
          lastMessageAtMs: lastMsgMs,
          lastId: lastMsgId ? String(lastMsgId) : undefined,
        });
      
      } catch {
        // 에러 무시
      }
  }, [queryClient, remapIfViewing]);


  const handleBlogCommentNew = useCallback((payload: BlogCommentNewPayload) => {
    try {
      if (!payload?.blogId || !payload?.comment) return;
      incrementBlogDetailCommentsCount(
        queryClient,
        String(payload.blogId),
        1,
      );
      prependBlogCommentFirstPage(
        queryClient,
        String(payload.blogId),
        payload.comment,
      );
    } catch (error) {
      console.error("Error handling blog comment new:", error);
    }
  }, [queryClient]);

  const handleBlogCommentUpdated = useCallback((payload: BlogCommentUpdatedPayload) => {
    try {
      if (!payload?.blogId || !payload?.comment?.id) return;
      replaceCommentById(
        queryClient,
        String(payload.blogId),
        payload.comment.id,
        payload.comment,
      );
    } catch (error) {
      console.error("Error handling blog comment updated:", error);
    }
  }, [queryClient]);

  const handleBlogCommentDeleted = useCallback((payload: BlogCommentDeletedPayload) => {
    try {
      if (!payload?.blogId || !payload?.commentId) return;
      removeCommentById(
        queryClient,
        String(payload.blogId),
        payload.commentId,
      );
      incrementBlogDetailCommentsCount(
        queryClient,
        String(payload.blogId),
        -1,
      );
    } catch (error) {
      console.error("Error handling blog comment deleted:", error);
    }
  }, [queryClient]);

  const handleBlogNew = useCallback((payload: BlogNewPayload) => {
    try {
      const blog = payload?.blog;
      if (!blog?.id) return;
      const createdAt = normalizeDate(blog.createdAt);
      prependBlogCard(queryClient, { ...blog, createdAt });
    } catch (error) {
      console.error("Error handling blog new:", error);
    }
  }, [queryClient]);

  const handleBlogUpdated = useCallback((payload: BlogUpdatedPayload) => {
    try {
      const blog = payload?.blog as BlogData;
      if (!blog?.id) return;
      const patch: { id: string } & Partial<Pick<BlogData, 'title' | 'image' | 'author' | 'viewCount'>> & { createdAt?: Date; _count?: { comments: number } } = { id: String(blog.id) };
      if (blog.title !== undefined) patch.title = blog.title;
      if (blog.image !== undefined) patch.image = blog.image;
      if (blog.createdAt !== undefined) {
        patch.createdAt = blog.createdAt instanceof Date ? blog.createdAt : new Date(blog.createdAt);
      }
      if (blog.author !== undefined) patch.author = blog.author;
      if (blog._count?.comments !== undefined) patch._count = { comments: blog._count.comments };
      if (blog.viewCount !== undefined) patch.viewCount = blog.viewCount;
      upsertBlogCardById(queryClient, patch as unknown as Parameters<typeof upsertBlogCardById>[1]);
              
      const partial: Partial<Pick<BlogData, 'title' | 'content' | 'image'>> = {};
      if (blog.title !== undefined) partial.title = blog.title;
      if (blog.content !== undefined) partial.content = blog.content;
      if (blog.image !== undefined) partial.image = blog.image;
      if (Object.keys(partial).length > 0) {
          upsertBlogDetailPartial(queryClient, String(blog.id), partial);
      }
    } catch (error) {
      console.error("Error handling blog updated:", error);
    }
  }, [queryClient]);

  const handleBlogDeleted = useCallback((payload: BlogDeletedPayload) => {
    try {
      if (!payload?.blogId) return;
      const id = String(payload.blogId);
      removeBlogCardById(queryClient, id);
      queryClient.setQueryData(blogDetailKey(id), (old: BlogDetailQueryData) => {
        if (!old) return old;
        return { ...old, blog: undefined } as BlogDetailQueryData & { blog: undefined };
      });
      queryClient.removeQueries({ queryKey: blogsCommentsKey(id), exact: true });
    } catch (error) {
      console.error("Error handling blog deleted:", error);
    }
  }, [queryClient]);

  const handleDrinkReviewNew = useCallback((payload: DrinkReviewPayload) => {
    try {
      if (!payload?.drinkSlug || !payload?.review?.id) return;
      prependReview(queryClient, payload.drinkSlug, payload.review);
    } catch (error) {
      console.error("Error handling drink review new:", error);
    }
  }, [queryClient]);

  const handleDrinkReviewUpdated = useCallback((payload: DrinkReviewPayload) => {
    try {
      if (!payload?.drinkSlug || !payload?.review?.id) return;
      replaceReviewById(
        queryClient,
        payload.drinkSlug,
        payload.review.id,
        payload.review,
      );
    } catch (error) {
      console.error("Error handling drink review updated:", error);
    }
  }, [queryClient]);

  const handleDrinkReviewDeleted = useCallback((payload: DrinkReviewDeletedPayload) => {
    try {
      if (!payload?.drinkSlug || !payload?.reviewId) return;
      removeReviewById(queryClient, payload.drinkSlug, payload.reviewId);
    } catch (error) {
      console.error("Error handling drink review deleted:", error);
    }
  }, [queryClient]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && session.user.email) {
      userIdRef.current = String(session.user.id);
      emailRef.current  = String(session.user.email);
    } else if (status === "unauthenticated") {
      userIdRef.current = null;
      emailRef.current  = null;
    }
  }, [status, session?.user?.id, session?.user?.email]);

  // 방 전환 시
  useEffect(() => {
    syncActiveConversationRead();
  }, [conversationId, syncActiveConversationRead]);

  // ✅ 핸들러들을 ref에 저장하여 안정적인 참조 유지
  const handlersRef = useRef({
    handleSocketConnect,
    handleDisconnect,
    handleReceiveConversation,
    handleConversationNew,
    handleRoomEvent,
    handleBlogCommentNew,
    handleBlogCommentUpdated,
    handleBlogCommentDeleted,
    handleBlogNew,
    handleBlogUpdated,
    handleBlogDeleted,
    handleDrinkReviewNew,
    handleDrinkReviewUpdated,
    handleDrinkReviewDeleted,
  });

  // ✅ 핸들러 ref를 최신으로 유지
  useEffect(() => {
    handlersRef.current = {
      handleSocketConnect,
      handleDisconnect,
      handleReceiveConversation,
      handleConversationNew,
      handleRoomEvent,
      handleBlogCommentNew,
      handleBlogCommentUpdated,
      handleBlogCommentDeleted,
      handleBlogNew,
      handleBlogUpdated,
      handleBlogDeleted,
      handleDrinkReviewNew,
      handleDrinkReviewUpdated,
      handleDrinkReviewDeleted,
    };
  }, [
    handleSocketConnect,
    handleDisconnect,
    handleReceiveConversation,
    handleConversationNew,
    handleRoomEvent,
    handleBlogCommentNew,
    handleBlogCommentUpdated,
    handleBlogCommentDeleted,
    handleBlogNew,
    handleBlogUpdated,
    handleBlogDeleted,
    handleDrinkReviewNew,
    handleDrinkReviewUpdated,
    handleDrinkReviewDeleted,
  ]);

  // 소켓 이벤트 처리
  useEffect(() => {
    const old = lastSocketRef.current;
    if (old) {
      for (const [ev, fn] of myHandlersRef.current) {
        try { old.off(ev, fn) } catch {}
      }
    }
    myHandlersRef.current.clear();

    if (!socket) {
      lastSocketRef.current = null;
      return;
    }
    
    const handlers = handlersRef.current;
    
    if (socket.connected) {
      handlers.handleSocketConnect();
    }

    // 이벤트 등록 (cleanup에서도 사용할 목록)
    const entries: Array<[string, (payload: unknown) => void]> = [
      ["disconnect", handlers.handleDisconnect],
      ["connect", handlers.handleSocketConnect],
      [SOCKET_EVENTS.RECEIVE_CONVERSATION, handlers.handleReceiveConversation as (payload: unknown) => void],
      [SOCKET_EVENTS.CONVERSATION_NEW, handlers.handleConversationNew as (payload: unknown) => void],
      [SOCKET_EVENTS.ROOM_EVENT, handlers.handleRoomEvent as (payload: unknown) => void],
      [SOCKET_EVENTS.BLOG_COMMENT_NEW, handlers.handleBlogCommentNew as (payload: unknown) => void],
      [SOCKET_EVENTS.BLOG_COMMENT_UPDATED, handlers.handleBlogCommentUpdated as (payload: unknown) => void],
      [SOCKET_EVENTS.BLOG_COMMENT_DELETED, handlers.handleBlogCommentDeleted as (payload: unknown) => void],
      [SOCKET_EVENTS.BLOG_NEW, handlers.handleBlogNew as (payload: unknown) => void],
      [SOCKET_EVENTS.BLOG_UPDATED, handlers.handleBlogUpdated as (payload: unknown) => void],
      [SOCKET_EVENTS.BLOG_DELETED, handlers.handleBlogDeleted as (payload: unknown) => void],
      [SOCKET_EVENTS.DRINK_REVIEW_NEW, handlers.handleDrinkReviewNew as (payload: unknown) => void],
      [SOCKET_EVENTS.DRINK_REVIEW_UPDATED, handlers.handleDrinkReviewUpdated as (payload: unknown) => void],
      [SOCKET_EVENTS.DRINK_REVIEW_DELETED, handlers.handleDrinkReviewDeleted as (payload: unknown) => void],
    ];

    // ✅ cleanup에서 사용할 handlers 참조 저장
    const handlersMap = myHandlersRef.current;
    
    for (const [ev, fn] of entries) {
      socket.on(ev, fn);
      handlersMap.set(ev, fn);
    }

    lastSocketRef.current = socket;

    return () => {
      // ✅ 진행 중인 쿼리 취소만 유지
      try {
        queryClientRef.current.cancelQueries({ queryKey: conversationListKey, exact: true });
        const activeId = String(conversationIdRef.current ?? "");
        if (activeId) {
          queryClientRef.current.cancelQueries({ queryKey: messagesKey(activeId), exact: true });
        }
      } catch {
        // 에러 무시
      }
            
      // ✅ cleanup: effect 실행 시점의 entries 사용
      if (socket) {
        for (const [ev, fn] of entries) {
          try {
            socket.off(ev, fn);
          } catch {}
        }
      }
      // ✅ cleanup: effect body에서 저장한 handlers 사용
      handlersMap.clear();
    };
    // ✅ socket만 의존성으로 유지 (핸들러들은 안정적이므로 제거)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // ✅ 1) 구독 본문을 함수로 추출
  const processList = useCallback((serverData?: ConversationListData) => {
    // 내가 쓰고 다시 들어온 콜백이면 바로 탈출
    if (listSyncGuardRef.current) return;

    // ✅ 서버 응답 데이터를 우선 사용 (API 응답의 가장 fresh한 데이터)
    // React Query 구독 이벤트는 캐시 업데이트 후에 발생하므로,
    // serverData 파라미터로 받은 데이터가 서버 응답의 원본 데이터입니다
    // optimisticListUpdate 등으로 캐시가 변경되었을 수 있으므로,
    // 서버 응답 원본 데이터를 사용해야 버퍼 메시지와 정확히 비교할 수 있습니다
    const latestData = serverData || (queryClient.getQueryData(conversationListKey) as ConversationListData | undefined);

    // ✅ 2) 빈 배열도 '준비 완료'로 인정
    if (!latestData || !Array.isArray(latestData.conversations)) {
      snapshotRef.current = new Map();
      // ⚠️ 중요: 빈 데이터일 때도 finally 블록에서 listReadyRef를 true로 설정하도록 함
      // listSyncGuardRef는 이미 true로 설정되어 있음
      updateTotalUnreadStore(queryClient);
      // finally 블록에서 listSyncGuardRef와 listReadyRef 설정
      listSyncGuardRef.current = false;
      listReadyRef.current = true;
      return;
    }
    
    // ✅ 서버 응답은 이미 React Query 캐시에 반영된 상태 (subscribe 이벤트가 캐시 업데이트 후 발생)
    // 따라서 여기서는 버퍼 처리만 수행
    // 리스트 스냅샷 만들기
    const next = new Map<string, ConvSnap>();
    
    // ✅ ⚠️ 중요: 먼저 snapshotRef를 next Map으로 초기화하여 실시간 메시지 중복 체크가 가능하도록 함
    // 버퍼 처리 과정에서 버퍼 메시지가 있는 대화방은 다시 업데이트됨
    for (const c of latestData.conversations) {
      const convId = String(c.id);
      // ✅ 서버 응답에서 직접 lastMessageAtMs와 lastMessageId 읽기
      // 서버 API는 lastMessageAtMs를 숫자 또는 null로 반환하고, lastMessageId도 반환함
      const rawLastMessageAtMs = (c as { lastMessageAtMs?: number | null }).lastMessageAtMs;
      const rawLastMessageId = (c as { lastMessageId?: string | null }).lastMessageId;
      
      // ✅ 서버 응답의 messages[0]에서도 마지막 메시지 ID와 시간 확인 (fallback용)
      const messagesArray = (c as { messages?: Array<{ id?: string; createdAt?: Date | string; serverCreatedAtMs?: number }> }).messages;
      const lastMsgFromArray = messagesArray && Array.isArray(messagesArray) && messagesArray.length > 0 
        ? messagesArray[0] 
        : null;
      const lastMsgIdFromArray = lastMsgFromArray?.id ? String(lastMsgFromArray.id) : undefined;
      
      // lastMessageAtMs 처리: 서버에서 숫자로 반환하거나 null일 수 있음
      // 우선순위: lastMessageAtMs > lastMessageAt > messages[0].createdAt
      let serverLastMessageAtMs: number;
      if (typeof rawLastMessageAtMs === 'number' && Number.isFinite(rawLastMessageAtMs) && rawLastMessageAtMs > 0) {
        serverLastMessageAtMs = rawLastMessageAtMs;
      } else if (c.lastMessageAt) {
        const fromLastMessageAt = new Date(c.lastMessageAt).getTime();
        serverLastMessageAtMs = Number.isFinite(fromLastMessageAt) ? fromLastMessageAt : 0;
      } else if (lastMsgFromArray) {
        // ✅ messages[0].createdAt을 fallback으로 사용
        const lastMsgCreatedAtMs = lastMsgFromArray.serverCreatedAtMs 
          ? (typeof lastMsgFromArray.serverCreatedAtMs === 'number' && Number.isFinite(lastMsgFromArray.serverCreatedAtMs) 
            ? lastMsgFromArray.serverCreatedAtMs 
            : 0)
          : (lastMsgFromArray.createdAt 
            ? new Date(lastMsgFromArray.createdAt).getTime() 
            : 0);
        serverLastMessageAtMs = Number.isFinite(lastMsgCreatedAtMs) && lastMsgCreatedAtMs > 0 ? lastMsgCreatedAtMs : 0;
      } else {
        serverLastMessageAtMs = 0; // 메시지가 없는 경우
      }
      
      // ✅ lastMessageId 처리: lastMessageId 우선 (API 응답에 항상 있음), 없으면 messages[0].id 사용
      const serverLastMessageId = rawLastMessageId 
        ? String(rawLastMessageId) 
        : (lastMsgIdFromArray 
          ? lastMsgIdFromArray 
          : ((c as { lastMessageId?: string }).lastMessageId ? String((c as { lastMessageId: string }).lastMessageId) : undefined));
      
      const snap: ConvSnap = {
        baseUnread: Number(c.unReadCount ?? 0),
        isAI: !!c.isAIChat,
        lastMessageAtMs: serverLastMessageAtMs,
        lastId: serverLastMessageId,
      };
      next.set(convId, snap);
    }
    
    // ✅ ⚠️ 중요: snapshotRef를 먼저 next Map으로 초기화
    // 이렇게 하면 processList 완료 전에 실시간 메시지가 도착해도 중복 체크가 가능
    // 버퍼 처리 과정에서 버퍼 메시지가 있는 대화방은 다시 업데이트됨
    snapshotRef.current = new Map(next);

    // ✅ 버퍼 소진: 서버 응답 기준으로 버퍼 메시지 처리
    // API 호출 중 저장된 실시간 메시지를 서버 응답의 마지막 메시지와 비교하여 처리
    // 서버 응답에는 lastMessageAtMs와 lastMessageId가 있으므로, 이를 기준으로 비교
    
    // ✅ ⚠️ 중요: listSyncGuardRef를 먼저 true로 설정하여 버퍼 처리 중 실시간 메시지가 버퍼에만 저장되도록 함
    // 이렇게 하면 processList 실행 중에 도착하는 실시간 메시지는 버퍼에 저장되고,
    // processList 완료 후 listReadyRef가 true가 되면 다음 메시지부터 실시간 처리됨
    listSyncGuardRef.current = true;
    
    const updates: Array<{ convId: string; finalUnread: number; latestBuffered?: UnnormalizedMessage }> = [];
    
    // ✅ 모든 대화방 처리 (서버 응답에 있는 대화방 + 버퍼에만 있는 대화방)
    const allConvIds = new Set<string>();
    for (const [convId] of next) {
      allConvIds.add(convId);
    }
    for (const [convId] of bufferedRef.current) {
      allConvIds.add(convId);
    }
    
    for (const convId of allConvIds) {
      const snap = next.get(convId);
      // ✅ 서버 응답에 없는 대화방은 스킵 (새 대화방은 handleConversationNew에서 처리)
      if (!snap) continue;
      
      // ✅ processList 실행 중에 실시간 메시지가 버퍼에 추가될 수 있으므로,
      // 처리 직전에 최신 버퍼를 가져옴
      const buffered = bufferedRef.current.get(convId) ?? [];
      
      // ✅ 서버 응답 기준: lastMessageAtMs와 lastMessageId로 비교
      const serverMs = snap.lastMessageAtMs;
      const serverId = snap.lastId ?? '';
      
      // ✅ 서버 응답 데이터 검증: serverMs가 0이거나 유효하지 않으면 검열하지 않고 모든 버퍼 메시지 제외
      // 이는 메시지가 없는 대화방이거나, 서버 응답이 제대로 오지 않은 경우를 방지
      if (!serverMs || serverMs <= 0) {
        // 서버에 마지막 메시지가 없으면 버퍼 메시지도 모두 제외 (안전하게 처리)
        // 서버 응답이 제대로 오지 않았을 수 있으므로, 모든 버퍼 메시지를 무시
        bufferedRef.current.set(convId, []);
        bufferedIdSetRef.current.set(convId, new Set());
        continue; // 다음 대화방 처리
      }
      
      // ✅ 버퍼 내 중복 메시지 제거 (같은 ID가 여러 번 들어있을 수 있음)
      const seenBufferIds = new Set<string>();
      const uniqueBuffered = buffered.filter(b => {
        const msgId = String(b.msg?.id ?? '');
        if (!msgId) return true; // ID가 없으면 포함
        if (seenBufferIds.has(msgId)) return false; // 이미 본 메시지는 제외
        seenBufferIds.add(msgId);
        return true;
      });
      
      // ✅ 최적화된 필터링: 서버 응답 이후의 메시지만 카운트
      // 요구사항:
      // 1) API 마지막 메시지 시간보다 늦은 메시지 추가
      // 2) 동일 시간이지만 ID가 다른 메시지 추가 (동기화)
      const newer = uniqueBuffered.filter(b => {
        const msg = b.msg;
        const msgId = String(msg?.id ?? '');
        
        // ✅ 서버에 저장된 실제 시간 사용 (정확성 보장)
        // 우선순위: serverCreatedAtMs > createdAt
        let msgMs: number;
        if (msg?.serverCreatedAtMs && typeof msg.serverCreatedAtMs === 'number' && Number.isFinite(msg.serverCreatedAtMs) && msg.serverCreatedAtMs > 0) {
          msgMs = msg.serverCreatedAtMs;
        } else if (msg?.createdAt) {
          const fromCreatedAt = new Date(msg.createdAt).getTime();
          msgMs = Number.isFinite(fromCreatedAt) ? fromCreatedAt : 0;
        } else {
          msgMs = 0;
        }
        
        // ✅ 유효성 검사
        if (!msgMs || msgMs <= 0 || !msgId) return false;
        
        // ✅ 1단계: ID 비교 (가장 빠른 체크)
        // 서버 응답의 마지막 메시지와 동일한 ID면 제외 (이미 서버 응답에 포함됨)
        if (serverId && msgId === serverId) return false;
        
        // ✅ 2단계: 시간 비교
        if (msgMs > serverMs) return true; // 서버보다 늦음 → 포함
        if (msgMs < serverMs) return false; // 서버보다 이전 → 제외
        
        // ✅ 3단계: 동일 시간일 때 ID 비교
        // 동일 시간이지만 ID가 다르면 → 포함 (동기화)
        if (msgMs === serverMs && serverId && msgId !== serverId) return true;
        
        // 동일 시간이고 ID도 같거나 비교 불가 → 제외
        return false;
      });
      
      // ✅ 최적화: newer 메시지 ID를 countedSet에 먼저 추가 (중복 방지)
      const countedSet = ensureSet(countedIdSetRef.current, convId);
      const processedIds = new Set<string>();
      
      for (const b of newer) {
        const msgId = String(b.msg?.id ?? '');
        if (!msgId || countedSet.has(msgId)) continue; // 이미 처리된 메시지 스킵
        countedSet.add(msgId);
        processedIds.add(msgId);
      }
      
      // ✅ 처리할 메시지가 없으면 스킵
      if (processedIds.size === 0) {
        bufferedRef.current.set(convId, []);
        bufferedIdSetRef.current.set(convId, new Set());
        continue;
      }
      
      // ✅ 처리할 메시지만 필터링 (processedIds에 포함된 메시지만)
      const filteredNewer = newer.filter(b => {
        const msgId = String(b.msg?.id ?? '');
        return msgId && processedIds.has(msgId);
      });
      
      // 최종 unread 계산
      const activeId = String(conversationIdRef.current ?? "");
      const isActive = activeId === convId;
      
      // ✅ 실제로 안읽음으로 카운트될 메시지만 필터링
      // 내 메시지가 아니고, 시스템 메시지가 아니고, isBumpableType이 true인 메시지만 카운트
      const myEmail = emailRef.current ?? "";
      const myUserId = userIdRef.current ?? "";
      const countables = filteredNewer.filter(b => {
        const m = b.msg;
        
        // ✅ 내 메시지 체크: email 또는 userId로 비교
        // sender.id를 우선 확인하고, 없으면 getMessageSenderId 사용
        const senderId = String(m?.sender?.id ?? getMessageSenderId(m) ?? "");
        const senderEmail = String(m?.sender?.email ?? "");
        
        // ✅ email이 있으면 email로, 없으면 userId로 비교
        const isMyMsgByEmail = myEmail && senderEmail && 
                               String(senderEmail).toLowerCase() === String(myEmail).toLowerCase();
        const isMyMsgById = myUserId && senderId && 
                           String(senderId).toLowerCase() === String(myUserId).toLowerCase();
        const isMyMsg = isMyMsgByEmail || isMyMsgById;
        
        if (isMyMsg) return false; // 내 메시지는 안읽음 카운트에서 제외
        
        if (m.type === 'system') return false;
        const msgType = (m?.type || '').toLowerCase();
        return isBumpableType(msgType);
      });
      
      const extra = countables.length;
      const finalUnread = (isActive || snap.isAI) ? 0 : (snap.baseUnread + extra);

      // ✅ 2) 미리보기: 정렬 대신 단일 스캔으로 최신 메시지 찾기 (O(k log k) → O(k))
      let latestBuffered: UnnormalizedMessage | undefined;
      let maxMs = -1;
      let maxId = '';
      for (const n of filteredNewer) {
        const m = n.msg;
        const t = ts(m); // ✅ 4) 유틸 사용
        const id = String(m.id ?? '');
        const msgType = (m?.type || '').toLowerCase();
        if (!isBumpableType(msgType)) continue; // ✅ 3) 유틸 사용

        if (t > maxMs || (t === maxMs && id > maxId)) {
          maxMs = t;
          maxId = id;
          latestBuffered = m;
        }
      }

      // ✅ 버퍼 메시지를 메시지 캐시에 추가 (최적화: 배치 처리)
      for (const b of filteredNewer) {
        upsertMessageSortedInCache(queryClient, convId, b.msg);
      }

      updates.push({ convId, finalUnread, latestBuffered });

      // ✅ 스냅샷 전진: 더 정확한 업데이트 (버퍼 처리 후)
      // ⚠️ 중요: processList 완료 전에 snapshotRef를 업데이트하여
      // 실시간 메시지가 도착했을 때 중복 체크가 정확히 이루어지도록 함
      if (latestBuffered) {
        const ms = ts(latestBuffered); // ✅ 4) 유틸 사용
        const msgId = String(latestBuffered.id ?? '');
        
        snapshotRef.current.set(convId, {
          ...snap,
          lastMessageAtMs: Math.max(snap.lastMessageAtMs, ms),
          lastId: msgId || snap.lastId || '',
        });
      } else {
        // 버퍼 메시지가 없어도 snapshotRef는 유지 (서버 응답 기준)
        snapshotRef.current.set(convId, snap);
      }
      
      // ✅ 버퍼 초기화: 처리된 메시지와 과거 메시지는 버퍼에서 제거
      // filteredNewer에 포함된 메시지는 이미 처리되었으므로 제거
      // processList 실행 중에 실시간 메시지가 버퍼에 추가될 수 있지만,
      // 이미 countedSet에 추가되어 있으므로 다음 handleReceiveConversation에서 스킵됨
      const processedIdsSet = new Set(filteredNewer.map(b => String(b.msg?.id ?? '')));
      // 현재 시점의 버퍼를 다시 확인 (processList 실행 중에 추가된 메시지 포함)
      const currentBufferedList = bufferedRef.current.get(convId) ?? [];
      const remaining = currentBufferedList.filter(b => {
        const msgId = String(b.msg?.id ?? '');
        // 처리된 메시지이거나 이미 countedSet에 있으면 제거
        return msgId && !processedIdsSet.has(msgId) && !countedSet.has(msgId);
      });
      
      if (remaining.length > 0) {
        bufferedRef.current.set(convId, remaining);
        const idSet = ensureSet(bufferedIdSetRef.current, convId);
        idSet.clear();
        for (const b of remaining) {
          const msgId = String(b.msg?.id ?? '');
          if (msgId) idSet.add(msgId);
        }
      } else {
        bufferedRef.current.set(convId, []);
        bufferedIdSetRef.current.set(convId, new Set());
      }
    }

    // ----- 배치 쓰기: 한 번만 -----
    // listSyncGuardRef는 이미 위에서 true로 설정됨
    try {
      
      // ✅ 3) updates를 Map으로 변환하여 O(n²) → O(n) 최적화
      const updatesMap = new Map<string, { finalUnread: number; latestBuffered?: UnnormalizedMessage }>();
      for (const u of updates) updatesMap.set(u.convId, u);

      withConversationList(queryClient, (prev: ConversationListData | undefined) => {
        if (!prev?.conversations?.length) return prev;
        
        let hasChanges = false;
        const newConversations = prev.conversations.map(conv => {
          const convId = String(conv.id);
          const update = updatesMap.get(convId); // ✅ O(1) 조회
          if (!update || conv.unReadCount === update.finalUnread) return conv;
          
          hasChanges = true;
          return { ...conv, unReadCount: update.finalUnread };
        });

        // 변경이 실제로 있을 때만 새 객체 반환
        return hasChanges ? { ...prev, conversations: newConversations } : prev;
      });

        // 미리보기 bump는 listSyncGuardRef가 false가 되기 전에 실행
        // countedIdSetRef에 이미 메시지 ID가 추가되어 있으므로 실시간 메시지가 도착해도 스킵됨
        for (const update of updates) {
          if (update.latestBuffered) {
            optimisticListUpdate(queryClient, update.latestBuffered, ts, isBumpableType);
          }
        }

        updateTotalUnreadStore(queryClient);
      
    } finally {
      // ✅ listSyncGuardRef를 false로 설정한 후에 listReadyRef를 true로 설정
      // 이렇게 하면 processList 실행 중에 실시간 메시지가 오면 버퍼에만 저장되고,
      // listSyncGuardRef가 false가 된 후에야 실시간 처리가 시작됨
      listSyncGuardRef.current = false;
      listReadyRef.current = true;
    }
  }, [queryClient, ts, isBumpableType]);

  // ✅ 단순화된 버퍼 로직 (초기 로드와 새로고침 모두 동일하게 처리)
  // 1. listReadyRef는 false로 시작
  // 2. API 호출 중이면 (isFetching > 0) listReadyRef = false → handleReceiveConversation에서 버퍼 저장
  // 3. API 응답 완료 후 processList 실행 → 버퍼 처리
  // 4. processList 완료 후 listReadyRef = true → 이후 실시간 메시지는 즉시 처리
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    // ✅ API 호출 상태 감지 (폴링) - 타이밍 보장
    // ⚠️ 중요: API 호출 중에는 반드시 listReadyRef를 false로 설정하여 모든 실시간 메시지를 버퍼에 저장
    // ⚠️ 중요: isFetching이 false가 되어도 listReadyRef는 processList 완료 후에만 true가 됨
    const checkFetching = () => {
      const isFetching = queryClient.isFetching({ queryKey: conversationListKey }) > 0;
      if (isFetching) {
        // ✅ API 호출 중이면 listReadyRef를 false로 설정하여 버퍼 저장 시작
        // ⚠️ 중요: processList가 실행되기 전까지는 계속 false 유지되어야 함
        // processList 내부에서 listSyncGuardRef를 true로 설정하여 추가 보호
        listReadyRef.current = false;
      }
      // ⚠️ 중요: isFetching이 false여도 listReadyRef는 변경하지 않음
      // processList 완료 후 finally 블록에서만 listReadyRef = true 설정
    };
    
    // ✅ 초기 체크
    checkFetching();
    
    // ✅ 주기적으로 체크 (API 호출 시작 감지용)
    const interval = setInterval(checkFetching, 100);
    
    // ✅ React Query 구독: API 응답 완료 후 processList 실행 (초기 로드든 새로고침이든 동일)
    // ⚠️ 중요: API 응답 완료 시점에 listReadyRef는 여전히 false이어야 함 (버퍼에 저장된 메시지 처리 전까지)
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type !== "updated") return;
      const q = event.query;
      if (!Array.isArray(q?.queryKey) || q.queryKey[0] !== conversationListKey[0]) return;

      // ✅ API 응답 완료 후에만 processList 실행
      // ⚠️ 중요: fetchStatus가 'idle'이고 status가 'success'인 경우에만 API 응답으로 간주
      // 이 시점에는 listReadyRef가 false이므로 모든 실시간 메시지는 버퍼에 저장됨
      const isApiResponse = q.state?.fetchStatus === 'idle' && q.state?.status === 'success';
      if (!isApiResponse) return;

      // ✅ 동일 버전 스킵 (불필요한 processList 호출 방지)
      const version = (q.state?.dataUpdatedAt as number) || 0;
      if (version === lastListVersionRef.current) return;
      lastListVersionRef.current = version;

      // ✅ ⚠️ 중요: processList 실행 전에 listReadyRef는 여전히 false이어야 함
      // 이렇게 하면 processList 실행 중에 도착하는 실시간 메시지도 버퍼에 저장됨
      const data = q.state?.data as ConversationListData | undefined;
      processList(data); // API 응답 후 버퍼 처리 (내부에서 listSyncGuardRef = true 설정)
    });

    return () => {
      clearInterval(interval);
      try { unsub(); } catch {}
    };
  }, [queryClient, processList, status]);
  return null;
}

export default SocketState;
