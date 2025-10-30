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
import {
  FullMessageType,
} from "@/src/app/types/conversation";
import type { 
  BlogCommentNewPayload,
  BlogNewPayload,
  BlogUpdatedPayload,
  BlogDeletedPayload,
  CommentType,
  BlogData,
} from "@/src/app/types/blog";
import type { DrinkReviewType } from "@/src/app/types/drink";
import { lastMessageMs, serverLooksEmpty } from "../utils/chat";

interface ConvSnap {
  baseUnread: number;
  isAI: boolean;
  lastMessageAtMs: number;
  lastId?: string;
}

type BufferedMsg = { 
  id: string; 
  ms: number; 
  msg: any 
};

// === AI 빈방 머지 헬퍼 === //
const mergeOrUpsertAIConversation = (
  qc: any,
  conv: any,
): { merged: boolean; oldId?: string; newId?: string } => {
  const newId = String(conv.id);
  // ✅ 메시지가 없는 AI 방만 머지 허용
  const isEmptyAI = !!conv?.isAIChat && serverLooksEmpty(conv);
  // 빈 AI 방이면 후보를 찾아 머지
  const idx = isEmptyAI ? findAICandidateIndex(qc, newId) : -1;
  
  // 머지 불가능하면 업서트 (빈 AI 방이 아니거나 후보 없음)
  if (idx < 0) {
    upsertConversation(qc, { ...conv, id: newId });
    return { merged: false, newId };
  }
  
  // 머지 가능: 기존 빈 AI 방에 새 데이터 덮어쓰기
  let oldId: string | undefined;
  qc.setQueryData(conversationListKey, (prev: ConversationListData | undefined) => {
    if (!prev?.conversations?.length) return prev;
    const next = { ...prev, conversations: [...prev.conversations] };
    oldId = String(next.conversations[idx]?.id ?? "");
    next.conversations[idx] = { ...(next.conversations[idx] || {}), ...conv, id: newId };
    return next;
  });
  
  if (oldId && oldId !== newId) {
    qc.removeQueries({ queryKey: messagesKey(oldId), exact: false });
    qc.removeQueries({ queryKey: conversationKey(oldId), exact: true });
  }

  return { merged: true, oldId, newId };
};

// ✅ 래퍼 함수들 - 자주 쓰는 업데이트 패턴
const zeroActiveUnread = (qc: any, convId: string) =>
  updateConversationInList(qc, convId, (conv) =>
    conv.unReadCount !== 0 ? { ...conv, unReadCount: 0 } : null
  );

// ✅ 증가+클램프 한 번에 처리 (setQueryData 1회화)
const addAndClampUnread = (qc: any, convId: string, delta: number) =>
  updateConversationInList(qc, convId, (conv) => {
    const curr = clampUnread(conv.unReadCount);
    const next = clampUnread(curr + delta);
    if (next === curr) return null;
    return { ...conv, unReadCount: next };
  });

// ✅ 복합 래퍼 - 두 규칙을 한 번에 적용 (미세 최적화)
const zeroAndClampUnread = (qc: any, convId: string, activeId?: string) =>
  updateConversationInList(qc, convId, (conv) => {
    const isActive = activeId && String(conv.id) === String(activeId);
    const nextUnread = isActive ? 0 : clampUnread(conv.unReadCount);
    if (nextUnread === conv.unReadCount) return null;
    return { ...conv, unReadCount: nextUnread };
  });

// ✅ 스토어 배지 업데이트 (chatCache.ts의 setTotalUnreadFromList 사용)
const updateTotalUnreadStore = (qc: any) => {
  const next = setTotalUnreadFromList(qc);
  if (next !== undefined) {
    useUnreadStore.setState((s) => (s.unReadCount === next ? s : { unReadCount: next }));
  }
};

// ✅ 단일 증가 유틸: 리스트 아이템 + 총배지 동기화까지 한 번에
const incUnreadForConv = (qc: any, convId: string, delta: number) => {
  if (!delta) return;
  addAndClampUnread(qc, convId, delta);
  updateTotalUnreadStore(qc);
};

// ✅ 절대값 설정 유틸: unread를 특정 값으로 강제 설정 (회귀/폭증 방지)
const setUnreadForConv = (qc: any, convId: string, value: number) => {
  const next = clampUnread(value);
  updateConversationInList(qc, convId, (conv) => {
    if (conv.unReadCount === next) return null;
    return { ...conv, unReadCount: next };
  });
  updateTotalUnreadStore(qc);
};

// ✅ 읽음 처리 통일 - 실수 예방을 위한 헬퍼
const applyLocalRead = (qc: any, convId: string) => {
  try { markConversationRead(qc, convId); } catch {}
  zeroActiveUnread(qc, convId);
  updateTotalUnreadStore(qc);
};

// ✅ optimisticListUpdate: 미리보기 갱신 (ts/isBumpableType 유틸 사용)
const optimisticListUpdate = (qc: any, msg: any, ts: (m: any) => number, isBumpableType: (t: string) => boolean) => {
  const convId = String(msg?.conversationId ?? '');
  if (!convId) return;

  upsertConversation(qc, { 
    id: convId, 
    lastMessageAt: new Date(ts(msg))  // ✅ serverCreatedAtMs 우선 (일관성)
  } as any);

  const list = qc.getQueryData(conversationListKey) as ConversationListData | undefined;
  const item = list?.conversations?.find((c: any) => String(c.id) === convId);

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
    createdAt: msg.createdAt,
    type: msg.type,
    body: msg.type === 'image' ? null : (msg.body ?? null),
    image: msg.image,
    sender: msg.sender,
    senderId: msg.senderId,
    isAIResponse: !!msg.isAIResponse,
  });
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
    
  // ConversationList 캐시 GC 방지
  useEffect(() => {
    queryClient.setQueryDefaults(conversationListKey, { gcTime: Infinity, staleTime: 60_000 });
  }, [queryClient]); // queryClient는 안정적이므로 dependency에서 제거

  useEffect(() => {
      conversationIdRef.current = conversationId;
  }, [conversationId]);

  // 상태 refs
  const userIdRef = useRef<string | null>(null);
  const emailRef  = useRef<string | null>(null);
  const lastSocketRef = useRef<any>(null);
  const myHandlersRef = useRef<Map<string, (...args: any[]) => void>>(
    new Map(),
  );
  
  // ✅ 이벤트 리비전 저장용 맵 분리 (myHandlersRef와 분리)
  const roomRevRef = useRef<Map<string, {rev: number; ts: number}>>(new Map());
  const exitedByMeRef = useRef<Set<string>>(new Set());
  // 기타
  const pendingNewConvsRef = useRef<Map<string, any>>(new Map());
  const pendingExitRef = useRef<Map<string, string[]>>(new Map());
  // 대화방 리스트 API 응답이 처리되었는지 여부
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
  const ts = useCallback((m: any): number => 
    Number.isFinite(m?.serverCreatedAtMs)
      ? m.serverCreatedAtMs
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
          upsertConversation(queryClient, { ...conv, id: String(conv.id ?? cid) });
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

          next.conversations[idx] = patchConvWithRemaining(next.conversations[idx] as any, remainingIds);

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
    } catch (e) {

    } finally {
      pendingNewConvsRef.current.clear();
      pendingExitRef.current.clear();
    }
  }, [set, remapIfViewing]); // queryClient는 안정적이므로 dependency에서 제거

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
  }, [reconcileAfterList, syncActiveConversationRead]);

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
        queryFn: async () => {
          const response = await fetch('/api/conversations');
          if (!response.ok) throw new Error('Failed to fetch conversations');
          return response.json();
        },
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
  // 페치 중 보류된 unread/미리보기 반영 대기열
  const pendingUnreadRef = useRef(new Map<string, { items: Array<{ ms: number; id: string; msg: any }>; idSet: Set<string>; lastMsg: any }>());
  const prevListFetchingRef = useRef(0);
  // 이미 처리(카운트)한 메시지 ID 집합 (대화방별)
  const countedIdSetRef = useRef(new Map<string, Set<string>>());

  const flushPendingUnread = useCallback(() => {
    const pending = pendingUnreadRef.current;
    if (pending.size === 0) return;
    pending.forEach((entry, convId) => {
      try {
        const list = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
        const currItem = list?.conversations?.find((c: any) => String(c.id) === String(convId));
        const serverBase = currItem?.unReadCount || 0;
        const baseMs = currItem?.lastMessageAt ? new Date(currItem.lastMessageAt).getTime() : 0;
        const baseId = currItem?.lastMessageId ? String(currItem.lastMessageId) : '';
        const countedSet = countedIdSetRef.current.get(convId) ?? new Set<string>();
        let newerCount = 0;

        // 보류 큐 내 최댓값(HWM) 계산
        let maxMs = baseMs;
        let maxId = baseId;
        for (const it of (entry.items || [])) {
          if (countedSet.has(it.id)) continue;
          const isNewer = it.ms > baseMs || (it.ms === baseMs && !!baseId && it.id > baseId);
          if (isNewer) {
            newerCount += 1;
            countedSet.add(it.id);
          }
          // HWM 업데이트 후보
          if (it.ms > maxMs || (it.ms === maxMs && it.id > maxId)) {
            maxMs = it.ms;
            maxId = it.id;
          }
        }
        if (!countedIdSetRef.current.has(convId)) countedIdSetRef.current.set(convId, countedSet);
        if (newerCount > 0) setUnreadForConv(queryClient, convId, serverBase + newerCount);
        if (entry.lastMsg) {
          optimisticListUpdate(queryClient, entry.lastMsg, ts, isBumpableType);
        }

        // 스냅샷 HWM도 보류 큐 최댓값으로 올려서 전환 프레임 중복 방지
        const snap = snapshotRef.current.get(convId) || { baseUnread: 0, isAI: false, lastMessageAtMs: 0, lastId: '' };
        if (maxMs > snap.lastMessageAtMs || (maxMs === snap.lastMessageAtMs && maxId > (snap.lastId || ''))) {
          snapshotRef.current.set(convId, {
            ...snap,
            lastMessageAtMs: Math.max(snap.lastMessageAtMs, maxMs),
            lastId: maxId || snap.lastId || '',
          });
        }
      } catch (e) { try { console.log('[flush:error]', e); } catch {} }
    });
    pending.clear();
  }, [queryClient, ts, isBumpableType]);

  const handleReceiveConversation = useCallback((_raw: FullMessageType) => {
    try {
      const msg = normalizeMessage(_raw);
      const convId = String(msg?.conversationId ?? "");
      
      if (!convId) return;

      // ✅ 항상 본문 캐시에 추가 (idempotent - upsertMessageSortedInCache가 중복 방지)
      const canonical = {
        ...toCanonicalMsg(msg),
        serverCreatedAtMs: Number.isFinite((msg as any).serverCreatedAtMs)
          ? (msg as any).serverCreatedAtMs
          : new Date(msg.createdAt).getTime(),
      };
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

      // ✅ 3) 미리보기 bump는 항상 수행 (경합 시에도 미리보기 누락 방지)
      const isListFetching = queryClient.isFetching({ queryKey: conversationListKey }) > 0;
      // ✅ 리스트 fetch가 아닌 순간에는 항상 먼저 보류분을 플러시해 경계 프레임 +1 방지 (idempotent)
      if (!isListFetching) {
        flushPendingUnread();
      }
      prevListFetchingRef.current = isListFetching ? 1 : 0;
      const msgType = (msg?.type || '').toLowerCase();
      const qualifiesForUnread = !isMyMessage && msgType !== "system";
      if (msg.type !== "system" && (!isListFetching && listReadyRef.current || isMyMessage)) {
        // 미리보기는 즉시 갱신 (신규 대화방도 upsertConversation로 리스트에 생성됨)
        optimisticListUpdate(queryClient, msg, ts, isBumpableType);
      }

      // ✅ 개선된 배지 로직: 리스트 준비 여부와 관계없이 즉시 처리
      const canonicalMs = Number(canonical.serverCreatedAtMs);
      const messageId = String(canonical.id ?? msg.id ?? '');

      // ✅ 리스트가 준비되지 않았으면 버퍼에 추가
      if (!listReadyRef.current) {
        // ✅ 1) O(1) 중복 체크
        const idSet = bufferedIdSetRef.current.get(convId) ?? new Set<string>();
        if (!idSet.has(messageId)) {
          const arr = bufferedRef.current.get(convId) ?? [];
          arr.push({ id: messageId, ms: canonicalMs, msg });
          bufferedRef.current.set(convId, arr);
          idSet.add(messageId);
          bufferedIdSetRef.current.set(convId, idSet);
        }
        return;
      }

      // ✅ 4) 스냅샷이 없으면 conversationList 기준 최소 중복 체크 후 단일 경로 처리
      let snap = snapshotRef.current.get(convId);
      if (!snap) {
        const list = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
        const conv = list?.conversations?.find((c: any) => String(c.id) === convId);
        const lastMessageAtMs = conv?.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0;
        const msgMs = canonical.serverCreatedAtMs!;
        const lastIdFromList = conv?.lastMessageId ? String(conv.lastMessageId) : '';
        const curId = String(canonical.id ?? '');
        const sameAsListId = !!lastIdFromList && curId === lastIdFromList;
        const isOlderThanList = msgMs < lastMessageAtMs;
        const isSameTimeAndId = msgMs === lastMessageAtMs && sameAsListId;
        const isDuplicate = sameAsListId || isOlderThanList || isSameTimeAndId;

        const countedSet = countedIdSetRef.current.get(convId) ?? new Set<string>();
        if (sameAsListId && !countedSet.has(curId)) {
          countedSet.add(curId);
          if (!countedIdSetRef.current.has(convId)) countedIdSetRef.current.set(convId, countedSet);
        }

        if (!isListFetching && !isDuplicate && !isMyMessage && msg.type !== 'system' && !countedSet.has(curId)) {
          const msgType = (msg?.type || '').toLowerCase();
          if (isBumpableType(msgType)) {
            incUnreadForConv(queryClient, convId, 1);
            countedSet.add(curId);
            if (!countedIdSetRef.current.has(convId)) countedIdSetRef.current.set(convId, countedSet);
          }
        } else if (isListFetching && !isDuplicate && !isMyMessage && msg.type !== 'system') {
          const msgType = (msg?.type || '').toLowerCase();
          if (isBumpableType(msgType)) {
            const cur = pendingUnreadRef.current.get(convId) ?? { items: [], idSet: new Set<string>(), lastMsg: null };
            if (!cur.idSet.has(curId) && !countedSet.has(curId)) {
              cur.idSet.add(curId);
              cur.items.push({ ms: msgMs, id: curId, msg });
            }
            if (!cur.lastMsg || msgMs >= (cur.items[cur.items.length - 1]?.ms || 0)) {
              cur.lastMsg = msg;
            }
            pendingUnreadRef.current.set(convId, cur);
          }
        }

        // ✅ 리스트 fetch 중에는 스냅샷을 변경하지 않는다 (flush 시 일괄 반영)
        if (isListFetching) return;

        // 리스트가 준비된 상태라면 안전하게 스냅샷 갱신
        const resolvedSnapMs = isDuplicate
          ? (sameAsListId ? Math.max(lastMessageAtMs, msgMs) : lastMessageAtMs)
          : msgMs;
        const resolvedSnapId = isDuplicate
          ? (sameAsListId ? curId : (conv?.lastMessageId || ''))
          : curId;

        snap = {
          baseUnread: conv?.unReadCount || 0,
          isAI: !!conv?.isAIChat,
          lastMessageAtMs: resolvedSnapMs,
          lastId: resolvedSnapId,
        };
        snapshotRef.current.set(convId, snap);
        return;
      }

      const msgMs = canonical.serverCreatedAtMs!;
      const msgId = String(canonical.id ?? '');
      const sameAsSnapId = !!snap.lastId && snap.lastId === msgId;
      if (sameAsSnapId) {
        if (msgMs > snap.lastMessageAtMs) {
          snapshotRef.current.set(convId, { ...snap, lastMessageAtMs: msgMs });
        }
        const countedSet = countedIdSetRef.current.get(convId) ?? new Set<string>();
        if (!countedSet.has(msgId)) {
          countedSet.add(msgId);
          if (!countedIdSetRef.current.has(convId)) countedIdSetRef.current.set(convId, countedSet);
        }
        return;
      }

      if (isActive || isMyMessage || snap.isAI) return;

      // (ms, id) 튜플 비교: 동일 ms에서는 snapId가 있을 때만 id 비교로 신규 인정
      const snapMs = Number(snap.lastMessageAtMs || 0);
      const snapId = snap.lastId ? String(snap.lastId) : '';
      const isNewer = msgMs > snapMs || (msgMs === snapMs && !!snapId && msgId > snapId);

      if (isNewer) {
        const msgType = (msg?.type || '').toLowerCase();
        const countedSet = countedIdSetRef.current.get(convId) ?? new Set<string>();
        if (!isListFetching && isBumpableType(msgType) && !countedSet.has(msgId)) {
          incUnreadForConv(queryClient, convId, 1);
          countedSet.add(msgId);
          if (!countedIdSetRef.current.has(convId)) countedIdSetRef.current.set(convId, countedSet);
        } else if (isListFetching && isBumpableType(msgType) && !isMyMessage && !countedSet.has(msgId)) {
          const cur = pendingUnreadRef.current.get(convId) ?? { items: [], idSet: new Set<string>(), lastMsg: null };
          if (!cur.idSet.has(msgId) && !countedSet.has(msgId)) {
            cur.idSet.add(msgId);
            cur.items.push({ ms: msgMs, id: msgId, msg });
          }
          if (!cur.lastMsg || msgMs >= (cur.items[cur.items.length - 1]?.ms || 0)) {
            cur.lastMsg = msg;
          }
          pendingUnreadRef.current.set(convId, cur);
        }

        const nextSnap = {
          ...snap,
          lastMessageAtMs: Math.max(snap.lastMessageAtMs, msgMs),
          lastId: msgId || snap.lastId || '',
        };
        snapshotRef.current.set(convId, nextSnap);
      }
    } catch {}
  }, [queryClient, ts, isBumpableType]);

  // ✅ room.event 핸들러 - 델타 이벤트 처리
  const handleRoomEvent = useCallback(async (event: {
    type: "member.left" | "member.joined" | "member.removed" | "room.deleted";
    conversationId: string;
    userId?: string;
    ts: number;
    rev: number;
  }) => {
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
          queryClient.setQueryData(conversationKey(id), (prev: any) => {
            if (!prev?.conversation?.userIds) return prev;
            
            const beforeUserIds = prev.conversation.userIds;
            const updatedUserIds = beforeUserIds.filter((userId: string) => userId !== leftUserId);
            
            // 변경사항이 없으면 기존 데이터 반환
            if (beforeUserIds.length === updatedUserIds.length) return prev;
            
            const beforeUsers = prev.conversation.users || [];
            const updatedUsers = beforeUsers.filter((user: any) => user.id !== leftUserId);
            
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
          queryClient.setQueryData(conversationListKey, (prev: any) => {
            if (!prev?.conversations?.length) return prev;
            
            const idx = prev.conversations.findIndex((c: any) => String(c.id) === id);
            if (idx < 0) return prev;
                  
            const currentConv = prev.conversations[idx];
            const beforeUserIds = currentConv.userIds || [];
            const updatedUserIds = beforeUserIds.filter((userId: string) => userId !== leftUserId);
            
            // 변경사항이 없으면 기존 데이터 반환 (리렌더링 방지)
            if (beforeUserIds.length === updatedUserIds.length) return prev;
            
            // ✅ users 배열에서도 나간 유저 제거
            const updatedUsers = (currentConv.users || []).filter((user: any) => 
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
          queryClient.setQueryData(messagesKey(id), (prev: any) => {
            if (!prev?.pages) return prev;
          
            let hasChanges = false;
            const newPages = prev.pages.map((page: any) => {
              if (!Array.isArray(page?.messages)) return page;
            
              let pageHasChanges = false;
              const newMessages = page.messages.map((m: any) => {
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
                const hasLeftUserInSeen = page.seenUsersForLastMessage.some((user: any) => user.id === leftUserId);
                if (hasLeftUserInSeen) {
                  pageHasChanges = true;
                  hasChanges = true;
                  updatedSeenUsers = page.seenUsersForLastMessage.filter((user: any) => 
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
    } catch (error) {}
  }, [queryClient, session?.user?.id]);

  const handleConversationNew = useCallback((conversation: any) => {
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
          const item = list?.conversations?.find((c: any) => String(c.id) === visId) as any;
          
          if (item && !lastMessageMs(item)) {
            updateConversationById(queryClient, visId, {
              lastMessageAt: new Date(),
              lastMessageAtMs: Date.now(),
            } as any);
          }

          zeroAndClampUnread(queryClient, visId, conversationIdRef.current);


          if (merged && oldId && newId && oldId !== newId) {
            remapIfViewing(oldId, newId);
          }
          return;
        }
            
        upsertConversation(queryClient, conv);
        if (!lastMessageMs(conv)) {
          const lastAt = normalizeDate((conv as any)?.lastMessageAt ?? (conv as any)?.createdAt ?? new Date());
          updateConversationById(queryClient, id, { lastMessageAt: lastAt } as any);
        }
        zeroAndClampUnread(queryClient, id, conversationIdRef.current);
      
      
      } catch (error) { }
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

  const handleBlogCommentUpdated = useCallback((payload: {
    blogId: string;
    comment: CommentType;
  }) => {
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

  const handleBlogCommentDeleted = useCallback((payload: {
    blogId: string;
    commentId: string;
  }) => {
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
      const patch: any = { id: String(blog.id) };
      if (blog.title !== undefined) patch.title = blog.title;
      if (blog.image !== undefined) patch.image = blog.image;
      if (blog.createdAt !== undefined) patch.createdAt = blog.createdAt;
      if (blog.author !== undefined) patch.author = blog.author;
      if (blog._count !== undefined) patch._count = blog._count;
      if (blog.viewCount !== undefined) patch.viewCount = blog.viewCount;
      upsertBlogCardById(queryClient, patch);
              
      const partial: Record<string, any> = {};
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
      queryClient.setQueryData(blogDetailKey(id), (old: any) => {
        if (!old) return old;
        return { ...old, blog: undefined };
      });
      queryClient.removeQueries({ queryKey: blogsCommentsKey(id), exact: true });
    } catch (error) {
      console.error("Error handling blog deleted:", error);
    }
  }, [queryClient, router, pathname]);

  const handleDrinkReviewNew = useCallback((payload: {
    drinkSlug: string;
    review: DrinkReviewType;
  }) => {
    try {
      if (!payload?.drinkSlug || !payload?.review?.id) return;
      prependReview(queryClient, payload.drinkSlug, payload.review);
    } catch (error) {
      console.error("Error handling drink review new:", error);
    }
  }, [queryClient]);

  const handleDrinkReviewUpdated = useCallback((payload: {
    drinkSlug: string;
    review: DrinkReviewType;
  }) => {
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

  const handleDrinkReviewDeleted = useCallback((payload: {
    drinkSlug: string;
    reviewId: string;
  }) => {
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
    
    try { socket.off("disconnect", handleDisconnect); } catch {}
    socket.on("disconnect", handleDisconnect);
    myHandlersRef.current.set("disconnect", handleDisconnect);

    try { socket.off("connect", handleSocketConnect); } catch {}
    socket.on("connect", handleSocketConnect);
    myHandlersRef.current.set("connect", handleSocketConnect);
    
    if (socket.connected) {
      handleSocketConnect();
    }

    // 이벤트 등록
    const entries: Array<[string, (...a: any[]) => void]> = [
      [SOCKET_EVENTS.RECEIVE_CONVERSATION, handleReceiveConversation],
      [SOCKET_EVENTS.CONVERSATION_NEW, handleConversationNew],
      [SOCKET_EVENTS.ROOM_EVENT, handleRoomEvent],
      [SOCKET_EVENTS.BLOG_COMMENT_NEW, handleBlogCommentNew],
      [SOCKET_EVENTS.BLOG_COMMENT_UPDATED, handleBlogCommentUpdated],
      [SOCKET_EVENTS.BLOG_COMMENT_DELETED, handleBlogCommentDeleted],
      [SOCKET_EVENTS.BLOG_NEW, handleBlogNew],
      [SOCKET_EVENTS.BLOG_UPDATED, handleBlogUpdated],
      [SOCKET_EVENTS.BLOG_DELETED, handleBlogDeleted],
      [SOCKET_EVENTS.DRINK_REVIEW_NEW, handleDrinkReviewNew],
      [SOCKET_EVENTS.DRINK_REVIEW_UPDATED, handleDrinkReviewUpdated],
      [SOCKET_EVENTS.DRINK_REVIEW_DELETED, handleDrinkReviewDeleted],
    ];

    for (const [ev, fn] of entries) {
      socket.on(ev, fn);
      myHandlersRef.current.set(ev, fn);
    }

    lastSocketRef.current = socket;

    return () => {
      // ✅ 진행 중인 쿼리 취소만 유지
      try {
        queryClient.cancelQueries({ queryKey: conversationListKey, exact: true });
        const activeId = String(conversationIdRef.current ?? "");
        if (activeId) {
          queryClient.cancelQueries({ queryKey: messagesKey(activeId), exact: true });
        }
      } catch (e) { }
            
      if (lastSocketRef.current) {
        for (const [ev, fn] of myHandlersRef.current) {
          try {
            lastSocketRef.current.off(ev, fn);
          } catch {}
        }
        myHandlersRef.current.clear();
      }
    };
  }, [
    socket,
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

  // ✅ 1) 구독 본문을 함수로 추출
  const processList = useCallback((serverData?: ConversationListData) => {
    // 내가 쓰고 다시 들어온 콜백이면 바로 탈출
    if (listSyncGuardRef.current) return;

    // ✅ 2) 빈 배열도 '준비 완료'로 인정
    if (!serverData || !Array.isArray(serverData.conversations)) {
      snapshotRef.current = new Map();
      listReadyRef.current = true;
      updateTotalUnreadStore(queryClient);
      return;
    }
    
    // 리스트 스냅샷 만들기
    const next = new Map<string, ConvSnap>();
    for (const c of serverData.conversations) {
      const convId = String(c.id);
      const snap: ConvSnap = {
        baseUnread: Number(c.unReadCount ?? 0),
        isAI: !!c.isAIChat,
        lastMessageAtMs: Number((c as any).lastMessageAtMs ?? (c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0)),
        lastId: (c as any).lastMessageId ? String((c as any).lastMessageId) : undefined,
      };
      next.set(convId, snap);
    }

    // 버퍼 소진 + 정합화 반영 계산
    const updates: Array<{ convId: string; finalUnread: number; latestBuffered?: any }> = [];
    for (const [convId, snap] of next) {
      const buffered = bufferedRef.current.get(convId) ?? [];
      
      // ✅ 하이워터마크(HWM) 방식: 스냅샷과 비교하여 이미 즉시 처리된 메시지 제외
      const currentSnap = snapshotRef.current.get(convId);
      const hwmMs = currentSnap?.lastMessageAtMs ?? snap.lastMessageAtMs;
      const hwmId = currentSnap?.lastId ?? snap.lastId;
      
      // ✅ 개선된 비교 로직: 현재 HWM과 비교하여 더 새로운 메시지만 필터링
      const newer = buffered.filter(b => {
        const msg = b.msg;
        const msgMs = b.ms;
        const msgId = String(msg?.id ?? '');
        
        // 1. ID가 같으면 서버와 동일한 메시지이므로 제외
        if (msgId && hwmId && msgId === hwmId) return false;
        // 2. 시간 비교 (HWM보다 새로운 메시지만)
        if (msgMs > hwmMs) return true;
        if (msgMs < hwmMs) return false;
        
        // 3. 동일 시간이면 ID로 tie-breaker (HWM보다 큰 ID만)
        if (msgMs === hwmMs && msgId && hwmId) {
          return String(msgId) > String(hwmId);
        }
        if (msgMs === hwmMs && msgId && !hwmId) {
          return true;
        }
        
        return false;
      });

      // 최종 unread 계산
      const activeId = String(conversationIdRef.current ?? "");
      const isActive = activeId === convId;
      const extra = newer.length;
      const finalUnread = (isActive || snap.isAI) ? 0 : (snap.baseUnread + extra);

      // ✅ 2) 미리보기: 정렬 대신 단일 스캔으로 최신 메시지 찾기 (O(k log k) → O(k))
      let latestBuffered: any | undefined;
      let maxMs = -1;
      let maxId = '';
      for (const n of newer) {
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

      updates.push({ convId, finalUnread, latestBuffered });

      // ✅ 스냅샷 전진: 더 정확한 업데이트
      if (latestBuffered) {
        const ms = ts(latestBuffered); // ✅ 4) 유틸 사용
        const msgId = String(latestBuffered.id ?? '');
        
        snapshotRef.current.set(convId, {
          ...snap,
          lastMessageAtMs: Math.max(snap.lastMessageAtMs, ms),
          lastId: msgId || snap.lastId || '',
        });
      }
      
      // ✅ 간단한 버퍼 관리: 처리된 메시지와 함께 초기화
      if (newer.length > 0) {
        // 처리된 메시지가 있으면 해당 대화방 버퍼 초기화
        bufferedRef.current.set(convId, []);
        bufferedIdSetRef.current.set(convId, new Set()); // ✅ 1) Set도 초기화
      } else if (buffered.length > 0) {
        const remaining = buffered.filter((entry) => {
          if (!entry?.id) return true;
          if (hwmId && entry.id === hwmId) return false;
          if (currentSnap?.lastId && entry.id === currentSnap.lastId) return false;
          return true;
        });
        if (remaining.length !== buffered.length) {
          bufferedRef.current.set(convId, remaining);
          bufferedIdSetRef.current.set(convId, new Set(remaining.map((entry) => entry.id)));
        }
      }
    }

    // ----- 배치 쓰기: 한 번만 -----
    listSyncGuardRef.current = true;
    try {
      // ✅ 3) updates를 Map으로 변환하여 O(n²) → O(n) 최적화
      const updatesMap = new Map<string, { finalUnread: number; latestBuffered?: any }>();
      for (const u of updates) updatesMap.set(u.convId, u);

      // withConversationList 헬퍼 사용으로 무한루프 방지
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

      // 미리보기 bump는 가드가 켜진 상태에서 안전하게 실행
      for (const update of updates) {
        if (update.latestBuffered) {
          optimisticListUpdate(queryClient, update.latestBuffered, ts, isBumpableType);
        }
      }

      snapshotRef.current = next;
      listReadyRef.current = true;
      updateTotalUnreadStore(queryClient);
      
    } finally {
      listSyncGuardRef.current = false;
    }
  }, [queryClient, ts, isBumpableType]);

// React Query 캐시의 "변경 감지 후크"
useEffect(() => {
  // ✅ 1) 구독 직후 1회 시드 (이미 데이터가 있으면 즉시 ready로 전환 + 버퍼 플러시)
  const existing = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
  processList(existing);

  // ✅ 2) 이후 변경 구독
  const unsub = queryClient.getQueryCache().subscribe((event) => {
    if (event?.type !== "updated") return;
    const q = event.query;
    if (!Array.isArray(q?.queryKey) || q.queryKey[0] !== conversationListKey[0]) return;

    // ✅ 5) 동일 버전 스킵 (불필요한 processList 호출 방지)
    const version = (q.state?.dataUpdatedAt as number) || 0;
    if (version === lastListVersionRef.current) return;
    lastListVersionRef.current = version;

    const data = q.state?.data as ConversationListData | undefined;
    processList(data); // 동일 처리
  });

  return () => { try { unsub(); } catch {} }; // ✅ 구독 해제로 메모리 누수 방지
}, [queryClient, processList]);
  return null;
}

export default SocketState;
