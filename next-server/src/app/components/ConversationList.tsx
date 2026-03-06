"use client";
import { useSession } from "next-auth/react";
import { FullConversationType, PartialConversationType, ConversationListResponse } from "@/src/app/types/conversation";
import { useState, useMemo, memo } from "react";
import ConversationBox from "./ConversationBox";
import getConversations from "@/src/app/lib/getConversations";
import { useQuery } from "@tanstack/react-query";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import ChatListSkeleton from "./skeleton/ChatListSkeleton";
import StatusMessage from "./StatusMessage";
import clsx from "clsx";
import useConversation from "@/src/app/hooks/useConversation";
import GroupChatModal from "./chat/GroupChatModal";
import DropdownIconButton from "./DropdownIconButton";
import { useCallback } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useTheme } from "next-themes";
import { PiDotsThreeVerticalBold, PiUsersThreeBold, PiSparkleBold } from "react-icons/pi";
import { useLaunchAiConversation } from "@/src/app/lib/createAIConversation";
import { conversationListKey } from "@/src/app/lib/react-query/chatCache";
import { lastMessageMs } from "../utils/chat";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi";

const ConversationList = memo(function ConversationList() {
  const { data: session, status: sessionStatus } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isOpen, conversationId } = useConversation();
  const { launch } = useLaunchAiConversation();
  const { setTheme, resolvedTheme } = useTheme();

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

  // 다크모드 토글 함수
  const toggleTheme = useCallback(() => {
    // ✅ resolvedTheme을 사용하여 실제 적용된 테마 기준으로 토글
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }, [resolvedTheme, setTheme]);

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
      <GroupChatModal
        isOpen={isModalOpen}
        onCloseModal={() => setIsModalOpen(false)}
      />
      <aside
        className={clsx(
          "chat-sidebar",
          isOpen && "hidden lg:block",
        )}>
        <div className="chat-sidebar__header justify-between px-4">
          <div className="
            text-gradient-scent
            chat-sidebar__title
          ">
            대화방
          </div>
          {!isLoading ? (
            <Dropdown
              classNames={{
                content: "bg-[var(--color-card-bg)]/80 backdrop-blur-md border-1 border-[var(--color-lavender-border)] shadow-xl rounded-xl p-1",
              }}
            >
              <DropdownTrigger>
                <DropdownIconButton>
                  <PiDotsThreeVerticalBold size={18} />
                </DropdownIconButton>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Conversation Actions"
                itemClasses={{
                  base: [
                    "rounded-lg",
                    "text-[var(--color-text-secondary)]",
                    "transition-all",
                    "gap-3",
                    "px-3",
                    "py-2",
                    "data-[hover=true]:text-[var(--color-text-primary)]",
                    "data-[hover=true]:bg-[var(--color-lavender-pale)]",
                  ],
                }}
              >
                <DropdownItem
                  key="group-chat"
                  onPress={() => setIsModalOpen(true)}
                  startContent={<PiUsersThreeBold size={18} />}
                >
                  단체 채팅
                </DropdownItem>
                <DropdownItem
                  key="ai-chat"
                  onPress={() => launch({ aiAgentType: "assistant" })}
                  startContent={<PiSparkleBold size={18} />}
                >
                  AI 채팅
                </DropdownItem>
                <DropdownItem
                  key="theme-toggle"
                  onPress={toggleTheme}
                  startContent={resolvedTheme === "dark" ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
                >
                  {resolvedTheme === "dark" ? "라이트 모드" : "다크 모드"}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <DropdownIconButton isDisabled aria-hidden>
              <ShapesSkeleton width="100%" height="100%" radius="none" />
            </DropdownIconButton>
          )}
        </div>
        <div className="flex flex-col">
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
