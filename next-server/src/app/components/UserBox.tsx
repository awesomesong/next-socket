"use client";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import Avatar from "./Avatar";
import { IUserList } from "@/src/app/types/common";
import { useSocket } from "../context/socketContext";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createChatConversation } from "@/src/app/lib/createChatConversation";
import { SOCKET_EVENTS } from "../lib/react-query/utils";
import clsx from "clsx";

interface UserBoxProps {
  userInfo: IUserList;
}

const UserBox: React.FC<UserBoxProps> = ({ userInfo }) => {
  const socket = useSocket();
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ userId }: { userId: string }) => createChatConversation({ userId }),
    onSuccess: (data) => {
      router.push(`/conversations/${data.id}`);
      if (socket && !data.existingConversation) {
        socket.emit(SOCKET_EVENTS.CONVERSATION_NEW, data);
      }
    },
    onError: () => {
      toast.error("대화방을 생성하는 중 오류가 발생했습니다.");
      setIsClicked(false);
    },
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isClicked || isPending) {
      return;
    }
    if (!userInfo.id) {
      toast.error("유저 ID가 없습니다.");
      return;
    }

    setIsClicked(true);
    mutate({ userId: userInfo.id });
  }, [isClicked, isPending, mutate, userInfo.id]);

  return (
    <div
      onClick={handleClick}
      role="button"
      aria-disabled={isClicked || isPending}
      aria-busy={isClicked || isPending}
      tabIndex={(isClicked || isPending) ? -1 : 0}
      className={clsx(
        "flex items-center space-x-3 w-full relative p-3 transition cursor-pointer hover:bg-neutral-100 hover:dark:bg-neutral-800",
        (isClicked || isPending) && "pointer-events-none opacity-60"
      )}
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