"use client";
import { useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FullConversationType } from "@/src/app/types/conversation";
import useOtherUser from "@/src/app/hooks/useOtherUser";
import Avatar from "./Avatar";
import AvatarGroup from "./AvatarGroup";
import { formatDate } from "@/src/app/utils/formatDate";
import { formatMessageCount } from "@/src/app/utils/formatMessageCount";
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
      return "향수 AI 어시스턴트와 대화해보세요. 술에 대한 질문이나 추천을 받을 수 있습니다.";
    }
    if (lastMessage?.type === "system") return undefined;
    if (lastMessage?.type === "image") return "사진을 보냈습니다.";
    if (lastMessage?.body) return lastMessage.body;
    return undefined;
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
        transition
        cursor-pointer
      `,
        !data.isAIChat && data.userIds?.length < 2 && "opacity-40",
        "sidebar-item--state",
      )}
      data-selected={selected}
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
            <p className="chat-item__title flex items-center min-w-0">
              <span className="truncate">
                {data.isAIChat
                  ? "향수 AI 어시스턴트"
                  : data.name || otherUser.name}
              </span>
              {data.isGroup && (
                <span className="ml-1.5 shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold rounded-md leading-none text-[#4a4238] dark:text-[#e6e2da] bg-[#f0ede8] dark:bg-[#3d3835] border border-[#ddd6cc] dark:border-[#5c5650]">
                  {data.userIds?.length}
                </span>
              )}
            </p>
            {createdAtLabel && (
              <p className="chat-item__date shrink-0">
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
              className={clsx(
                "chat-item__status truncate",
                !selected && unReadMessageLength > 0
                  ? "font-bold text-neutral-900 dark:text-slate-100"
                  : "font-medium",
              )}
            >
              {lastMessageText}
            </p>
            {!selected && unReadMessageLength > 0 && (
              <p className="unread-badge">
                {formatMessageCount(unReadMessageLength)}
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