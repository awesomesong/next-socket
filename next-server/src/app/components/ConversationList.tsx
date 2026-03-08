"use client";
import { useSession } from "next-auth/react";
import { FullConversationType, PartialConversationType, ConversationListResponse } from "@/src/app/types/conversation";
import { useMemo, memo } from "react";
import ConversationBox from "./ConversationBox";
import getConversations from "@/src/app/lib/getConversations";
import { useQuery } from "@tanstack/react-query";
import ChatListSkeleton from "./skeleton/ChatListSkeleton";
import StatusMessage from "./StatusMessage";
import clsx from "clsx";
import useConversation from "@/src/app/hooks/useConversation";
import ChatSidebarMenu from "./ChatSidebarMenu";
import { conversationListKey } from "@/src/app/lib/react-query/chatCache";
import { lastMessageMs } from "../utils/chat";

const ConversationList = memo(function ConversationList() {
  const { data: session, status: sessionStatus } = useSession();
  const { isOpen, conversationId } = useConversation();

  // ✅ 안정적인 정렬: 최근 메시지 시간 내림차순, 동시간대는 마지막 메시지 id → 대화방 id로 보조 정렬
  const compareConversationsDesc = (a: PartialConversationType, b: PartialConversationType) => {
    const aMs = lastMessageMs(a);
    const bMs = lastMessageMs(b);
    if (aMs !== bMs) return bMs - aMs;

    // 타이브레이크(선택)
    const aMsgId = String(a?.messages?.[0]?.id ?? "");
    const bMsgId = String(b?.messages?.[0]?.id ?? "");
    if (aMsgId && bMsgId && aMsgId !== bMsgId) return bMsgId.localeCompare(aMsgId);
    return String(b.id ?? "").localeCompare(String(a.id ?? ""));
  };

  const {
    data: listData,
    isLoading,
    status,
  } = useQuery({
    queryKey: conversationListKey,
    queryFn: getConversations,
    select: (d: ConversationListResponse | undefined) => ({
      conversations: Array.isArray(d?.conversations)
        ? [...d.conversations].sort((a, b) => compareConversationsDesc(a as PartialConversationType, b as PartialConversationType))
        : [],
    }),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 1,
    retryOnMount: true,
    placeholderData: (prev) => prev,
    enabled: sessionStatus === "authenticated",
  });

  const memoizedConversations = useMemo(() => {
    const base = Array.isArray(listData?.conversations)
      ? listData.conversations
      : [];
    return base.map((conversation: FullConversationType) => (
      <ConversationBox
        key={conversation.id}
        data={conversation}
        selected={conversationId === conversation.id}
        currentUser={session?.user}
      />
    ));
  }, [
    listData?.conversations, // conversations 배열만 의존
    conversationId,
    session?.user, // session?.user 전체를 의존성에 포함
  ]);

  return (
    <>
      <aside
        className={clsx(
          "chat-sidebar",
          isOpen && "hidden lg:block",
        )}>
        <div className="chat-sidebar__header">
          <div className="
            text-gradient-scent
            chat-sidebar__title
          ">
            대화방
          </div>
          <ChatSidebarMenu
            isLoading={isLoading}
          />
        </div>
        <div className="chat-sidebar__body">
          {status !== "success" ? (
            <ChatListSkeleton
              variant="conversation"
              widths={{ primary: "w-[130px] xs:w-40", secondary: "w-40 xs:w-60" }}
            />
          ) : !Array.isArray(listData?.conversations) ||
            listData.conversations.length === 0 ? (
            <StatusMessage
              fallbackMessage="대화방이 없습니다."
              minHeight="min-h-0"
              className="py-4"
            />
          ) : (
            memoizedConversations
          )}
        </div>
      </aside>
    </>
  );
});

export default ConversationList;
