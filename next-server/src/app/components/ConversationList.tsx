"use client";
import { useSession } from "next-auth/react";
import { FullConversationType } from "@/src/app/types/conversation";
import { useState, useMemo, memo } from "react";
import ConversationBox from "./ConversationBox";
import getConversations from "@/src/app/lib/getConversations";
import { useQuery } from "@tanstack/react-query";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import ChatConversationSkeleton from "./skeleton/ChatConversationSkeleton";
import clsx from "clsx";
import useConversation from "@/src/app/hooks/useConversation";
import GroupChatModal from "./chat/GroupChatModal";
import { IoBeerOutline } from "react-icons/io5";
import { useCallback } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useTheme } from "next-themes";
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { useLaunchAiConversation } from "@/src/app/lib/createAIConversation";
import { conversationListKey } from "@/src/app/lib/react-query/chatCache";
import { lastMessageMs } from "../utils/chat";

const ConversationList = memo(function ConversationList() {
  const { data: session, status: sessionStatus } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isOpen, conversationId } = useConversation();
  const { launch } = useLaunchAiConversation();
  const { theme, setTheme } = useTheme();

  // ✅ 안정적인 정렬: 최근 메시지 시간 내림차순, 동시간대는 마지막 메시지 id → 대화방 id로 보조 정렬
  const compareConversationsDesc = (a: any, b: any) => {
    const aMs = lastMessageMs(a);
    const bMs = lastMessageMs(b);
    if (aMs !== bMs) return bMs - aMs;
  
    // 타이브레이크(선택)
    const aMsgId = String(a?.messages?.[0]?.id ?? "");
    const bMsgId = String(b?.messages?.[0]?.id ?? "");
    if (aMsgId && bMsgId && aMsgId !== bMsgId) return bMsgId.localeCompare(aMsgId);
    return String(b.id).localeCompare(String(a.id));
  };  

  // 다크모드 토글 함수
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const {
    data: listData,
    isLoading,
    status,
  } = useQuery({
    queryKey: conversationListKey,
    queryFn: getConversations,
    select: (d: any) => ({
      conversations: Array.isArray(d?.conversations)
        ? [...d.conversations].sort(compareConversationsDesc)
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
    session?.user?.id, // user.id만 의존 (전체 user 객체 대신)
    session?.user?.email, // user.email도 의존
  ]);

  return (
    <>
      <GroupChatModal
        isOpen={isModalOpen}
        onCloseModal={() => setIsModalOpen(false)}
      />
      <aside
        className={clsx(`
          shrink-0
          overflow-y-auto
          h-full
          border-r-default
          max-lg:flex-1
          w-0
          lg:w-80
        `,
          isOpen && "hidden lg:block",
      )}>
        <div className="
            flex 
            justify-between
            items-center
            h-16
            px-3
        ">
          <div className="
              inline-flex 
              items-end 
              gap-2
              leading-none
              text-2xl
              font-bold
          ">
            <IoBeerOutline size={26} />
            대화방
          </div>
          {!isLoading ? (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  type="button"
                  variant="shadow"
                  radius="sm"
                  className="
                    min-w-6 
                    h-6 
                    p-0 
                    bg-gray-100 
                    dark:bg-neutral-800 
                    dark:border-neutral-600
                ">
                  <PiDotsThreeVerticalBold size={21} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="group-chat"
                  onPress={() => setIsModalOpen(true)}
                >
                  단체 채팅
                </DropdownItem>
                <DropdownItem
                  key="ai-chat"
                  onPress={() => launch({ aiAgentType: "assistant" })}
                >
                  AI 채팅
                </DropdownItem>
                <DropdownItem key="theme-toggle" onPress={toggleTheme}>
                  {theme === "dark" ? "라이트 모드" : "다크 모드"}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div
              className="
                overflow-hidden
                inline-block
                relative
                rounded-full
                w-[40px]
                h-[40px]
            ">
              <ShapesSkeleton width="100%" height="100%" radius="lg" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          {status !== "success" ? (
            <ChatConversationSkeleton />
          ) : !Array.isArray((listData as any)?.conversations) ||
            (listData as any).conversations.length === 0 ? (
            <div
              className="
                flex
                justify-center
                h-full
                text-neutral-500
                dark:text-neutral-400
                text-sm
            ">
              대화방이 없습니다.
            </div>
          ) : (
            memoizedConversations
          )}
        </div>
      </aside>
    </>
  );
});

export default ConversationList;
