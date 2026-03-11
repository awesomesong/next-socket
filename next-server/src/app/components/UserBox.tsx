"use client";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "./Avatar";
import { IUserList } from "@/src/app/types/common";
import { conversationListKey } from "@/src/app/lib/react-query/chatCache";

interface UserBoxProps {
  userInfo: IUserList;
}

const UserBox: React.FC<UserBoxProps> = ({ userInfo }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userInfo.id) return;

    const userId = userInfo.id;
    // 캐시에 기존 1:1 대화방이 있으면 바로 이동 (드래프트 페이지 건너뜀)
    const list = queryClient.getQueryData<{ conversations: Array<{ id: string; isGroup: boolean; isAIChat?: boolean; userIds: string[] }> }>(conversationListKey);
    const existing = list?.conversations?.find(
      (c) => !c.isGroup && !c.isAIChat && c.userIds.includes(userId)
    );
    if (existing?.id) {
      router.push(`/conversations/${existing.id}`);
      return;
    }

    router.push(`/conversations/new?userId=${userId}`);
  }, [router, userInfo.id, queryClient]);

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className="flex items-center space-x-3 w-full relative p-3 transition cursor-pointer sidebar-item--state"
    >
      <Avatar user={userInfo} />
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{userInfo.name}</p>
      </div>
    </div>
  );
};

export default memo(UserBox, (a, b) =>
  a.userInfo.id === b.userInfo.id &&
  a.userInfo.name === b.userInfo.name &&
  a.userInfo.image === b.userInfo.image
);