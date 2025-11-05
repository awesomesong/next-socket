"use client";
import { useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FullConversationType } from "@/src/app/types/conversation";
import useOtherUser from "@/src/app/hooks/useOtherUser";
import Avatar from "./Avatar";
import AvatarGroup from "./AvatarGroup";
import { formatDate } from "@/src/app/utils/formatDate";
import { IUserList } from "@/src/app/types/common";

interface ConversationBoxProps {
  data: FullConversationType;
  selected?: boolean;
  currentUser: IUserList | undefined;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({
  data,
  selected,
  currentUser,
}) => {
  const { otherUser } = useOtherUser(data, currentUser);
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(`/conversations/${data.id}`);
  }, [router, data.id]);

  const unReadMessageLength = data.unReadCount ?? 0;
  const lastMessage = data.messages?.[0] ?? null;

  const showGroup = data.isGroup && (data.userIds?.length ?? 0) > 2;

  const lastMessageText = useMemo(() => {
    if (data.isAIChat) {
      const msg = lastMessage?.body;
      if (msg) return msg.length > 30 ? `${msg.slice(0, 30)}...` : msg;
      return "하이트진로 AI 어시스턴트와 대화해보세요. 술에 대한 질문이나 추천을 받을 수 있습니다.";
    }
    if (lastMessage?.type === "system") return undefined;
    if (lastMessage?.type === "image") return "사진을 보냈습니다.";
    if (lastMessage?.body) return lastMessage.body;
    return "대화방이 생성되었습니다.";
  }, [data.isAIChat, lastMessage?.type, lastMessage?.body]);

  // formatDate 비용이 크다면 메모
  const createdAtLabel = useMemo(() => {
    const t = lastMessage?.createdAt;
    if (!t) return "";
    const ms = t instanceof Date ? t.getTime() : +new Date(t);
    return formatDate(new Date(ms));
  }, [lastMessage?.createdAt]);

  return (
    <div
      onClick={handleClick}
      className={clsx(`
        relative
        flex
        items-center
        space-x-3
        p-3
        hover:bg-neutral-100
        hover:dark:bg-neutral-800
        transition
        cursor-pointer
      `,
        !data.isAIChat && data.userIds?.length < 2 && "opacity-40",
        selected
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "bg-white dark:bg-neutral-900",
      )}
    >
      {showGroup ? (
        <AvatarGroup users={data.users} />
      ) : (
        <div className="m-1">
          <Avatar user={otherUser} isAIChat={!!data.isAIChat} />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <div className="focus:outline-none">
          <div className="
              flex
              justify-between
              items-center
              gap-2
          ">
            <p className="
                truncate
                text-md
                font-medium
            ">
              {data.isAIChat
                ? "하이트진로 AI 어시스턴트"
                : data.name || otherUser.name}
              {data.isGroup && (
                <span className="ml-2 text-neutral-500">
                  {data.userIds?.length}
                </span>
              )}
            </p>
            {createdAtLabel && (
              <p
                className="
                shrink-0
                text-xs
                font-light
              ">
                {createdAtLabel}
              </p>
            )}
          </div>
          <div
            className="
              flex
              justify-between
              items-center
              gap-2
            ">
            <p
              className={clsx(`
                truncate
                text-neutral-600 
                dark:text-neutral-400
              `,
                !selected && unReadMessageLength > 0
                  ? "font-bold"
                  : "font-normal",
              )}
            >
              {lastMessageText}
            </p>
            {!selected && unReadMessageLength > 0 && (
              <p className="
                  inline-flex
                  justify-center
                  items-center
                  shrink-0
                  px-2
                  py-1
                  bg-red-500
                  text-neutral-50
                  rounded-full
                  leading-none
              ">
                {unReadMessageLength}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ConversationBox, (prevProps, nextProps) => {
  const prevUserIds = prevProps.data.userIds || [];
  const nextUserIds = nextProps.data.userIds || [];
  
  // userIds 비교 O(n^2) → O(n)
  const nextSet = new Set(nextUserIds);
  const userIdsEqual =
    prevUserIds.length === nextUserIds.length &&
    prevUserIds.every(id => nextSet.has(id));

  const prevUsers = prevProps.data.users || [];
  const nextUsers = nextProps.data.users || [];
  
  // users 비교에 표시 필드 포함(선택)
  const usersEqual =
    prevUsers.length === nextUsers.length &&
    prevUsers.every(p =>
      nextUsers.some(n => n.id === p.id && n.name === p.name && n.image === p.image)
    );

  const prevLast = prevProps.data.messages?.[0];
  const nextLast = nextProps.data.messages?.[0];

  // 마지막 메시지 비교는 id 하나로
  const lastIdEqual = prevLast?.id === nextLast?.id;

  return (
    prevProps.data.id === nextProps.data.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.data.unReadCount === nextProps.data.unReadCount &&
    prevProps.data.isAIChat === nextProps.data.isAIChat &&
    prevProps.data.isGroup === nextProps.data.isGroup &&
    prevProps.data.name === nextProps.data.name &&
    userIdsEqual &&
    usersEqual &&
    lastIdEqual
  );
});