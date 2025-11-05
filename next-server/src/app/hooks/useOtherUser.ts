import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { User } from "@prisma/client";
import type { FullConversationType, RoomEventPayload } from "../types/conversation";
import type { IUserList } from "../types/common";
import { useSocket } from "../context/socketContext";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKey } from "@/src/app/lib/react-query/chatCache";

// ---- helpers ----
/**
 * 값을 문자열 키로 변환하는 유틸리티 함수
 * @param x - 변환할 값 (string, number, null, undefined 등)
 * @returns 문자열 키 또는 빈 문자열
 */
export const toKey = (x: unknown): string => {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  const s = (x as { toString?: () => string })?.toString?.();
  return typeof s === "string" ? s : "";
};

/**
 * 값이 유효한 경우에만 업데이트되는 sticky state hook
 * resetKey가 변경되면 무조건 초기화하고, allowInvalid가 true면 invalid 값도 허용합니다.
 */
function useSticky<T>(
  value: T,
  opts: { isValid: (v: T) => boolean; resetKey?: unknown; allowInvalid?: boolean }
) {
  const { isValid, resetKey, allowInvalid = false } = opts;
  const [sticky, setSticky] = useState<T>(value);
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    // resetKey가 정의되고 실제 변경된 경우에만 초기화
    if (resetKey !== undefined && resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      setSticky(value);
      return;
    }
    // 권위 신호가 있으면 invalid라도 갱신 허용
    if (allowInvalid || isValid(value)) setSticky(value);
  }, [value, resetKey, allowInvalid, isValid]);

  return sticky as T;
}

/**
 * 값이 비어있지 않은 문자열인지 확인하는 타입 가드
 */
const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

/**
 * 대화방의 최소 필수 필드만 포함하는 타입
 */
type MinimalConv = Pick<FullConversationType, "id" | "name" | "users">;

/**
 * 대화 상대가 없을 때 사용하는 fallback 사용자 객체
 */
export type FallbackUser = {
  email: "None";
  name: "(대화상대 없음)";
  id: null;
  createdAt: null;
  updatedAt: null;
  image: "None";
  role: null;
};

const FALLBACK_USER: FallbackUser = {
  email: "None",
  name: "(대화상대 없음)",
  id: null,
  createdAt: null,
  updatedAt: null,
  image: "None",
  role: null,
};

// ---- hook ----
const useOtherUser = (
  conversation: FullConversationType | { users: User[] } | null | undefined,
  currentUser?: IUserList | null
) => {
  const { data: session, status } = useSession();
  const socket = useSocket();
  const queryClient = useQueryClient();

  // 1) 내 이메일 (sticky)
  const emailCandidate = currentUser?.email ?? session?.user?.email ?? null;
  const stickyEmail = useSticky<string | null>(emailCandidate, {
    isValid: isNonEmptyString,
    resetKey: session?.user?.email ?? currentUser?.email, // undefined면 리셋 없음
  });

  // 리스너 재등록 방지: 최신 이메일은 ref로 참조
  const emailRef = useRef<string | null>(stickyEmail);
  useEffect(() => {
    emailRef.current = stickyEmail;
  }, [stickyEmail]);

  // 2) 대화방 (sticky)
  const convCandidate: MinimalConv | null = useMemo(() => {
    if (!conversation) return null;
    
    // 타입 가드를 통해 안전하게 필드 접근
    const hasId = "id" in conversation && conversation.id != null;
    const hasName = "name" in conversation;
    const id = hasId ? String(conversation.id) : null;
    const name = hasName && conversation.name != null ? String(conversation.name) : null;
    const users = Array.isArray(conversation.users) ? conversation.users : [];
    
    return {
      id,
      name,
      users,
    } as MinimalConv | null;
  }, [conversation]);

  const stickyConv = useSticky<MinimalConv | null>(convCandidate, {
    isValid: (v) => v !== null,
    resetKey: convCandidate?.id, // id 없으면 리셋 안 함
  });

  // 3) tombstones (일방향)
  const [tombstones, setTombstones] = useState<Set<string>>(new Set());
  const markTomb = (id: unknown) => {
    const k = toKey(id);
    if (!k) return;
    setTombstones((prev) => (prev.has(k) ? prev : new Set(prev).add(k)));
  };

  // 4) 소켓 이벤트 (통합 핸들러)
  useEffect(() => {
    if (!socket) return;

    const onRoomEvent = (p: RoomEventPayload) => {
      const key = toKey(p?.conversationId ?? p?.roomId ?? p?.id);
      if (!key) return;

      if (p?.type === "room.deleted") {
        markTomb(key);
        return;
      }
      if (p?.type === "member.left" || p?.type === "member.removed") {
        const email = p?.userEmail;
        // 이메일이 없거나(보수적) / "나 이외"가 나간 경우만 tombstone
        if (!email || email !== emailRef.current) markTomb(key);
      }
    };

    socket.on("room.event", onRoomEvent);
    return () => {
      socket.off("room.event", onRoomEvent);
    };
  }, [socket]); // stickyEmail 의존 제거(Ref로 처리)

  // 5) React Query 신호로 권위적 비움 승격
  const convKey = toKey(stickyConv?.id ?? "");
  useEffect(() => {
    if (!convKey) return;
    const state = queryClient.getQueryState(conversationKey(convKey));
    if (state?.status === "success") {
      // conversationKey는 FullConversationType 또는 { conversation: FullConversationType } 형태를 반환할 수 있음
      const data = queryClient.getQueryData<FullConversationType | { conversation?: FullConversationType }>(
        conversationKey(convKey)
      );
      
      // data가 객체 형태일 수 있으므로 안전하게 users 추출
      const conversation = data && "conversation" in data ? data.conversation : data;
      const users = (conversation && "users" in conversation && Array.isArray(conversation.users))
        ? conversation.users
        : (stickyConv?.users ?? []);
      
      if (users.length <= 1) {
        markTomb(convKey);
      }
    }
  }, [queryClient, convKey, stickyConv?.users]);

  // 6) 상대 유저 계산
  const allowInvalid = tombstones.has(convKey);
  const computedOtherUser = useMemo((): IUserList | FallbackUser => {
    if (allowInvalid || !stickyConv) return FALLBACK_USER;
    const users = stickyConv.users ?? [];
    if (users.length <= 1) return FALLBACK_USER;
    if (stickyEmail) {
      // users는 IUserList[] 타입이므로 email 필드가 있을 수 있음
      const other = users.find((u: IUserList) => u?.email !== stickyEmail);
      // IUserList 타입으로 반환 (실제 사용처에서도 IUserList로 사용됨)
      if (other && other.id) {
        return other as IUserList;
      }
    }
    return FALLBACK_USER;
  }, [allowInvalid, stickyConv, stickyEmail]);

  // 7) otherUser도 sticky (권위 신호 시 fallback 허용)
  const otherUser = useSticky(computedOtherUser, {
    isValid: (v) => Boolean(v?.email && v.email !== "None"),
    resetKey: stickyConv?.id, // 방 바뀌면만 초기화
    allowInvalid, // tombstone 시 fallback 반영
  });

  return { otherUser, otherUserStatus: status };
};

export default useOtherUser;