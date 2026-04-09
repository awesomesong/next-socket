"use client";

import { useTheme } from "next-themes";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { PiDotsThreeVerticalBold, PiUsersThreeBold, PiSparkleBold } from "react-icons/pi";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DropdownIconButton from "./DropdownIconButton";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import { useLaunchAiConversation } from "@/src/app/lib/createAIConversation";
import GroupChatModal from "./chat/GroupChatModal";
import { upsertConversation } from "@/src/app/lib/react-query/chatCache";
import type { FullConversationType } from "@/src/app/types/conversation";

export type ChatSidebarMenuProps = {
  isLoading?: boolean;
};

export default function ChatSidebarMenu({
  isLoading = false,
}: ChatSidebarMenuProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  const { setTheme, resolvedTheme } = useTheme();

  // next-themes + HeroUI(React Aria useId) 조합에서 발생하는 SSR id hydration mismatch를
  // 피하기 위해, 클라이언트 마운트 이후에만 HeroUI 컴포넌트를 렌더링한다.
  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshConversationList = (conversation: FullConversationType) => {
    upsertConversation(queryClient, conversation);
  };

  const { launch } = useLaunchAiConversation({
    onSuccess: refreshConversationList,
  });

  const handleThemeToggle = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  if (!mounted || isLoading) {
    // 마운트 전에는 HeroUI Button(React Aria useId) 대신 동일 사이즈의 일반 div를 렌더링하여
    // SSR/hydration 단계에서 id가 어긋나지 않도록 한다.
    return (
      <div
        aria-hidden
        className="min-w-8 w-8 h-8 rounded-full overflow-hidden bg-[var(--color-lavender-pale)]/50 backdrop-blur-sm border-1 border-[var(--color-lavender-border)] shadow-sm"
      >
        <ShapesSkeleton width="100%" height="100%" radius="none" />
      </div>
    );
  }

  return (
    <>
    <GroupChatModal isOpen={isModalOpen} onCloseModal={() => setIsModalOpen(false)} onSuccess={refreshConversationList} />
    <Dropdown
      classNames={{
        content:
          "bg-[var(--color-card-bg)]/80 backdrop-blur-md border-1 border-[var(--color-lavender-border)] shadow-xl rounded-xl p-1",
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
          onPress={handleThemeToggle}
          startContent={
            resolvedTheme === "dark" ? (
              <HiOutlineSun size={18} />
            ) : (
              <HiOutlineMoon size={18} />
            )
          }
        >
          {resolvedTheme === "dark" ? "라이트 모드" : "다크 모드"}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
    </>
  );
}
