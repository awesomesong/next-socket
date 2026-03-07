"use client";
import Avatar from "@/src/app/components/Avatar";
import useOtherUser from "@/src/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/src/app/components/AvatarGroup";
import useActiveList from "@/src/app/hooks/useActiveList";
import useConversationUserList from "@/src/app/hooks/useConversationUserList";
import { IUserList, IUserListOptions } from "../../types/common";

interface HeaderProps {
  conversation: Conversation & {
    users: User[];
  };
  currentUser: IUserList | null | undefined;
}

const Header: React.FC<HeaderProps> = ({ conversation, currentUser }) => {
  const { otherUser } = useOtherUser(conversation, currentUser);
  const [isDrawerOepn, setIsDrawerOpen] = useState(false);
  const { add } = useConversationUserList();

  const isActive = useActiveList((s) => {
    if (!otherUser?.id) {
      return "None";
    }
    return s.isActive(otherUser.id);
  });

  const statusText = useMemo(() => {
    if (conversation?.isGroup) return `${conversation.users.length} 명`;

    return isActive === "None" ? "" : isActive ? "활성화" : "비활성화";
  }, [conversation, isActive]);

  useEffect(() => {
    if (conversation?.userIds.length > 1) {
      add({ conversationId: conversation?.id, userIds: conversation?.userIds });
    }
  }, [conversation, add]);

  return (
    <>
      <ProfileDrawer
        data={conversation}
        otherUser={otherUser as IUserList & IUserListOptions}
        isOpen={isDrawerOepn}
        onClose={() => setIsDrawerOpen(false)}
      />
      <div
        className="
          flex
          justify-between
          items-center
          gap-2
          w-full
          h-16
          px-2
          sm:px-4
          bg-default
          header-border-b
      ">
        <div className="flex gap-3 items-center">
          <Link
            href="/conversations"
            className="
              lg:hidden
              block
              transition
              cursor-pointer
              hover:opacity-70
          ">
            <HiChevronLeft size={32} fill="url(#scent-nav-gradient)" />
          </Link>
          <div className="shrink">
            {conversation?.isGroup && conversation?.userIds?.length > 2 ? (
              <AvatarGroup users={conversation.users} />
            ) : (
              <Avatar user={otherUser} isAIChat={!!conversation?.isAIChat} />
            )}
          </div>
          <div className="flex flex-col">
            <div className="line-clamp-1 tracking-tight font-medium text-[var(--color-text-primary)]">
              {conversation?.isAIChat
                ? "향수 AI 어시스턴트"
                : conversation?.name || otherUser.name}
            </div>
            <div className="chat-item__status">
              {statusText}
            </div>
          </div>
        </div>
        <HiEllipsisHorizontal
          size={32}
          onClick={() => setIsDrawerOpen(true)}
          fill="url(#scent-nav-gradient)"
          className="
            shrink-0
            w-8
            h-8
            cursor-pointer
            hover:opacity-70
            transition
        "/>
      </div>
    </>
  );
};

export default memo(Header);
