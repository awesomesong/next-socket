import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { DefaultSession } from "next-auth";
import type { User } from "@prisma/client";
import type { FullConversationType } from "../types/conversation";
import { useSocket } from "../context/socketContext";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKey } from "@/src/app/lib/react-query/chatCache";

// ---- helpers ----
const toKey = (x: any): string => {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  const s = x?.toString?.();
  return typeof s === "string" ? s : "";
};

function useSticky<T>(
  value: T,
  opts: { isValid: (v: T) => boolean; resetKey?: any; allowInvalid?: boolean }
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

const isNonEmptyString = (v: any): v is string =>
  typeof v === "string" && v.length > 0;

type MinimalConv = Pick<FullConversationType, "id" | "name" | "users">;

const FALLBACK_USER = {
  email: "None",
  name: "(대화상대 없음)",
  id: null as string | null,
  createdAt: null,
  updatedAt: null,
  image: "None",
  role: null as any,
};

// ---- hook ----
const useOtherUser = (
  conversation: FullConversationType | { users: User[] } | null | undefined,
  currentUser?: DefaultSession["user"]
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
    return {
      id: (conversation as any).id ?? null,
      name: (conversation as any).name ?? null,
      users: Array.isArray(conversation.users) ? conversation.users : [],
    } as MinimalConv | null;
  }, [conversation]);

  const stickyConv = useSticky<MinimalConv | null>(convCandidate, {
    isValid: (v) => v !== null,
    resetKey: convCandidate?.id, // id 없으면 리셋 안 함
  });

  // 3) tombstones (일방향)
  const [tombstones, setTombstones] = useState<Set<string>>(new Set());
  const markTomb = (id: any) => {
    const k = toKey(id);
    if (!k) return;
    setTombstones((prev) => (prev.has(k) ? prev : new Set(prev).add(k)));
  };

  // 4) 소켓 이벤트 (통합 핸들러)
  useEffect(() => {
    if (!socket) return;

    const onRoomEvent = (p: any) => {
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
      const data: any = queryClient.getQueryData(conversationKey(convKey));
      const users = Array.isArray(data?.users) ? data.users : stickyConv?.users ?? [];
      if (users.length <= 1) {
        markTomb(convKey);
      }
    }
  }, [queryClient, convKey, stickyConv?.users]);

  // 6) 상대 유저 계산
  const allowInvalid = tombstones.has(convKey);
  const computedOtherUser = useMemo(() => {
    if (allowInvalid || !stickyConv) return FALLBACK_USER;
    const users = stickyConv.users ?? [];
    if (users.length <= 1) return FALLBACK_USER;
    if (stickyEmail) {
      const other = users.find((u: any) => u?.email !== stickyEmail);
      if (other) return other as User;
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