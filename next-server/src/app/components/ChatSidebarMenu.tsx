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
import { useState } from "react";
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
  const queryClient = useQueryClient();
  const { setTheme, resolvedTheme } = useTheme();

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

  if (isLoading) {
    return (
      <DropdownIconButton isDisabled aria-hidden>
        <ShapesSkeleton width="100%" height="100%" radius="none" />
      </DropdownIconButton>
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
